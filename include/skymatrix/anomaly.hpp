#pragma once
#include "quadtree.hpp"
#include <vector>

namespace skymatrix {

struct AnomalyResult {
    int x, y, size;
    double z_score;
    double region_mean;
};

std::vector<AnomalyResult> detect_anomalies(
    const QuadTree& tree,
    double global_mean,
    double global_stddev,
    double z_threshold,
    int image_width,
    int image_height
);

} // namespace skymatrix
