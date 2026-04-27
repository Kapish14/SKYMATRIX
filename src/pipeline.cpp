#include "skymatrix/pipeline.hpp"
#include "skymatrix/prefix_sum.hpp"
#include "skymatrix/quadtree.hpp"
#include "skymatrix/anomaly.hpp"
#include "skymatrix/connected_comp.hpp"
#include <chrono>
#include <iostream>
#include <fstream>
#include <iomanip>
#include <algorithm>
#include <cmath>

namespace skymatrix {

static double elapsed_ms(std::chrono::steady_clock::time_point start,
                         std::chrono::steady_clock::time_point end) {
    return std::chrono::duration<double, std::milli>(end - start).count();
}

PipelineResult run_pipeline(const PipelineConfig& config) {
    PipelineResult result;
    auto total_start = std::chrono::steady_clock::now();

    // Step 1: Load image
    auto t0 = std::chrono::steady_clock::now();
    Image img = load_image(config.input_path);
    auto t1 = std::chrono::steady_clock::now();
    result.time_load_ms = elapsed_ms(t0, t1);
    result.image_width = img.width;
    result.image_height = img.height;

    // Step 2: Build 2D prefix sum (Dynamic Programming)
    t0 = std::chrono::steady_clock::now();
    PrefixSum2D ps;
    ps.build(img);
    t1 = std::chrono::steady_clock::now();
    result.time_prefix_sum_ms = elapsed_ms(t0, t1);
    result.global_mean = ps.global_mean();
    result.global_stddev = ps.global_stddev();

    // Step 3: QuadTree decomposition (Divide & Conquer)
    t0 = std::chrono::steady_clock::now();
    QuadTree qt;
    qt.build(ps, img.width, img.height,
             config.min_block_size, config.variance_threshold);
    t1 = std::chrono::steady_clock::now();
    result.time_quadtree_ms = elapsed_ms(t0, t1);
    result.quadtree_nodes = qt.node_count();
    result.quadtree_leaves = qt.leaf_count();

    // Step 4: Z-Score anomaly detection
    t0 = std::chrono::steady_clock::now();
    result.all_anomalies = detect_anomalies(
        qt, result.global_mean, result.global_stddev, config.z_threshold,
        img.width, img.height);
    t1 = std::chrono::steady_clock::now();
    result.time_anomaly_ms = elapsed_ms(t0, t1);

    // Step 5: Connected component detection on all anomalies.
    t0 = std::chrono::steady_clock::now();
    auto raw_components = find_connected_components(result.all_anomalies);
    result.components = merge_overlapping_components(raw_components);
    t1 = std::chrono::steady_clock::now();
    result.time_components_ms = elapsed_ms(t0, t1);

    // Step 6: Select final non-overlapping component-level areas.
    t0 = std::chrono::steady_clock::now();
    const int requested_top_k = std::max(1, config.top_k);
    result.components = select_top_k_components(result.components, requested_top_k);
    result.top_k_regions = select_top_k_regions(result.components, requested_top_k);
    t1 = std::chrono::steady_clock::now();
    result.time_topk_ms = elapsed_ms(t0, t1);

    auto total_end = std::chrono::steady_clock::now();
    result.time_total_ms = elapsed_ms(total_start, total_end);

    // Save outputs if paths specified
    if (!config.output_path.empty()) {
        save_highlighted_image(img, result, config.output_path);
    }
    if (!config.json_path.empty()) {
        write_json_report(result, config.json_path);
    }

    return result;
}

void print_report(const PipelineResult& result) {
    std::cout << "\n========================================\n";
    std::cout << "  SkyMatrix Analysis Report\n";
    std::cout << "========================================\n\n";

    std::cout << "Image: " << result.image_width << " x " << result.image_height << "\n";
    std::cout << "Global Mean: " << std::fixed << std::setprecision(2)
              << result.global_mean << "\n";
    std::cout << "Global StdDev: " << result.global_stddev << "\n\n";

    std::cout << "QuadTree: " << result.quadtree_nodes << " nodes, "
              << result.quadtree_leaves << " leaves\n";
    std::cout << "Anomalies detected: " << result.all_anomalies.size() << "\n";
    std::cout << "Top-K selected: " << result.top_k_regions.size() << "\n";
    std::cout << "Connected components: " << result.components.size() << "\n\n";

    std::cout << "--- Top-K Regions ---\n";
    for (size_t i = 0; i < result.top_k_regions.size(); ++i) {
        const auto& r = result.top_k_regions[i];
        std::cout << "  #" << (i + 1) << ": pos=(" << r.x << "," << r.y
                  << ") size=" << r.effective_width() << "x" << r.effective_height()
                  << " z_score=" << std::setprecision(4)
                  << r.z_score << " mean=" << std::setprecision(2)
                  << r.region_mean << "\n";
    }

    std::cout << "\n--- Connected Components ---\n";
    for (const auto& comp : result.components) {
        std::cout << "  Component #" << comp.id << ": "
                  << comp.regions.size() << " region(s), max_score="
                  << std::setprecision(4) << comp.max_score
                  << " bbox=(" << comp.bounding_x << "," << comp.bounding_y
                  << "," << comp.bounding_w << "x" << comp.bounding_h << ")\n";
    }

    std::cout << "\n--- Timing ---\n";
    std::cout << "  Image Load:    " << std::setprecision(2)
              << result.time_load_ms << " ms\n";
    std::cout << "  Prefix Sum:    " << result.time_prefix_sum_ms << " ms\n";
    std::cout << "  QuadTree:      " << result.time_quadtree_ms << " ms\n";
    std::cout << "  Anomaly Det:   " << result.time_anomaly_ms << " ms\n";
    std::cout << "  Top-K Select:  " << result.time_topk_ms << " ms\n";
    std::cout << "  Components:    " << result.time_components_ms << " ms\n";
    std::cout << "  TOTAL:         " << result.time_total_ms << " ms\n";
    std::cout << "========================================\n";
}

void write_json_report(const PipelineResult& result, const std::string& path) {
    std::ofstream f(path);
    if (!f.is_open()) {
        std::cerr << "Warning: Cannot write JSON to " << path << "\n";
        return;
    }

    f << "{\n";
    f << "  \"image_width\": " << result.image_width << ",\n";
    f << "  \"image_height\": " << result.image_height << ",\n";
    f << "  \"global_mean\": " << std::fixed << std::setprecision(4)
      << result.global_mean << ",\n";
    f << "  \"global_stddev\": " << result.global_stddev << ",\n";
    f << "  \"quadtree_nodes\": " << result.quadtree_nodes << ",\n";
    f << "  \"quadtree_leaves\": " << result.quadtree_leaves << ",\n";
    f << "  \"total_anomalies\": " << result.all_anomalies.size() << ",\n";

    // Timing
    f << "  \"timing\": {\n";
    f << "    \"load_ms\": " << std::setprecision(2) << result.time_load_ms << ",\n";
    f << "    \"prefix_sum_ms\": " << result.time_prefix_sum_ms << ",\n";
    f << "    \"quadtree_ms\": " << result.time_quadtree_ms << ",\n";
    f << "    \"anomaly_ms\": " << result.time_anomaly_ms << ",\n";
    f << "    \"topk_ms\": " << result.time_topk_ms << ",\n";
    f << "    \"components_ms\": " << result.time_components_ms << ",\n";
    f << "    \"total_ms\": " << result.time_total_ms << "\n";
    f << "  },\n";

    // Top-K regions
    f << "  \"top_k_regions\": [\n";
    for (size_t i = 0; i < result.top_k_regions.size(); ++i) {
        const auto& r = result.top_k_regions[i];
        f << "    {\"x\": " << r.x << ", \"y\": " << r.y
          << ", \"size\": " << r.size
          << ", \"width\": " << r.effective_width()
          << ", \"height\": " << r.effective_height()
          << ", \"component_id\": " << r.component_id
          << ", \"z_score\": " << std::setprecision(6) << r.z_score
          << ", \"region_mean\": " << std::setprecision(4) << r.region_mean << "}";
        if (i + 1 < result.top_k_regions.size()) f << ",";
        f << "\n";
    }
    f << "  ],\n";

    // Components
    f << "  \"components\": [\n";
    for (size_t i = 0; i < result.components.size(); ++i) {
        const auto& comp = result.components[i];
        f << "    {\"id\": " << comp.id
          << ", \"region_count\": " << comp.regions.size()
          << ", \"max_score\": " << std::setprecision(6) << comp.max_score
          << ", \"bounding_box\": {\"x\": " << comp.bounding_x
          << ", \"y\": " << comp.bounding_y
          << ", \"w\": " << comp.bounding_w
          << ", \"h\": " << comp.bounding_h << "}"
          << ", \"regions\": [";
        for (size_t j = 0; j < comp.regions.size(); ++j) {
            const auto& r = comp.regions[j];
            f << "{\"x\": " << r.x << ", \"y\": " << r.y
              << ", \"size\": " << r.size
              << ", \"width\": " << r.effective_width()
              << ", \"height\": " << r.effective_height()
              << ", \"z_score\": " << std::setprecision(6) << r.z_score << "}";
            if (j + 1 < comp.regions.size()) f << ", ";
        }
        f << "]}";
        if (i + 1 < result.components.size()) f << ",";
        f << "\n";
    }
    f << "  ]\n";
    f << "}\n";
}

void save_highlighted_image(const Image& img, const PipelineResult& result,
                            const std::string& path) {
    Image output = img; // copy

    // Brighten all anomalous region pixels to make them stand out
    for (const auto& r : result.top_k_regions) {
        int x2 = std::min(r.right(), img.width);
        int y2 = std::min(r.bottom(), img.height);
        for (int row = r.y; row < y2 && row < img.height; ++row) {
            for (int c = r.x; c < x2 && c < img.width; ++c) {
                // Lighten anomalous pixels
                output.at(row, c) = static_cast<uint8_t>(
                    std::min(255, static_cast<int>(output.at(row, c)) + 60));
            }
        }
    }

    // Draw thick bright borders for component bounding boxes
    for (const auto& comp : result.components) {
        int x1 = comp.bounding_x, y1 = comp.bounding_y;
        int x2 = std::min(x1 + comp.bounding_w - 1, img.width - 1);
        int y2 = std::min(y1 + comp.bounding_h - 1, img.height - 1);

        for (int thickness = 0; thickness < 3; ++thickness) {
            int bx1 = std::max(0, x1 - thickness);
            int by1 = std::max(0, y1 - thickness);
            int bx2 = std::min(img.width - 1, x2 + thickness);
            int by2 = std::min(img.height - 1, y2 + thickness);

            for (int c = bx1; c <= bx2; ++c) {
                if (by1 < img.height) output.at(by1, c) = 255;
                if (by2 < img.height) output.at(by2, c) = 255;
            }
            for (int row = by1; row <= by2; ++row) {
                if (bx1 < img.width) output.at(row, bx1) = 255;
                if (bx2 < img.width) output.at(row, bx2) = 255;
            }
        }
    }

    save_image(path, output);
}

} // namespace skymatrix
