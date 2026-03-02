#pragma once
#include "image.hpp"
#include "anomaly.hpp"
#include "connected_comp.hpp"
#include <string>
#include <vector>

namespace skymatrix {

struct PipelineConfig {
    std::string input_path;
    std::string output_path;
    std::string json_path;
    int min_block_size = 16;
    double variance_threshold = 100.0;
    double z_threshold = 2.0;
    int top_k = 10;
    bool use_branch_and_bound = true;
};

struct PipelineResult {
    std::vector<AnomalyResult> all_anomalies;
    std::vector<AnomalyResult> top_k_regions;
    std::vector<Component> components;
    double global_mean = 0.0;
    double global_stddev = 0.0;
    int image_width = 0;
    int image_height = 0;
    int quadtree_nodes = 0;
    int quadtree_leaves = 0;
    double time_load_ms = 0.0;
    double time_prefix_sum_ms = 0.0;
    double time_quadtree_ms = 0.0;
    double time_anomaly_ms = 0.0;
    double time_topk_ms = 0.0;
    double time_components_ms = 0.0;
    double time_total_ms = 0.0;
};

PipelineResult run_pipeline(const PipelineConfig& config);
void print_report(const PipelineResult& result);
void write_json_report(const PipelineResult& result, const std::string& path);
void save_highlighted_image(const Image& img, const PipelineResult& result,
                            const std::string& path);

} // namespace skymatrix
