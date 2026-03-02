#include "skymatrix/anomaly.hpp"
#include <cmath>
#include <algorithm>

namespace skymatrix {

std::vector<AnomalyResult> detect_anomalies(
    const QuadTree& tree,
    double global_mean,
    double global_stddev,
    double z_threshold,
    int image_width,
    int image_height
) {
    std::vector<AnomalyResult> results;

    double effective_stddev = std::max(global_stddev, 1.0);

    tree.traverse_leaves([&](const QuadNode& node) {
        // Skip nodes entirely outside image bounds (QuadTree padding)
        if (node.x >= image_width || node.y >= image_height) return;

        // Skip partially-outside nodes — require 90%+ coverage to eliminate edge artifacts
        int clipped_w = std::min(node.x + node.size, image_width) - node.x;
        int clipped_h = std::min(node.y + node.size, image_height) - node.y;
        double coverage = (double)(clipped_w * clipped_h) / (node.size * node.size);
        if (coverage < 0.9) return;

        // Z-Score: how many standard deviations away from global mean
        double z = std::abs(node.mean - global_mean) / effective_stddev;

        // Boost score for regions with high local variance relative to global
        // This catches boundary regions (edge of deforestation, coastlines)
        double global_var = effective_stddev * effective_stddev;
        double var_ratio = node.variance / std::max(global_var, 1.0);
        double combined_z = z + std::max(0.0, (var_ratio - 1.5) * 0.3);

        if (combined_z >= z_threshold) {
            AnomalyResult r;
            r.x = node.x;
            r.y = node.y;
            r.size = std::min({node.size, clipped_w, clipped_h}); // clip to image
            r.z_score = combined_z;
            r.region_mean = node.mean;
            results.push_back(r);
        }
    });

    return results;
}

} // namespace skymatrix
