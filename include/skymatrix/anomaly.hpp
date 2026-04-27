#pragma once
#include "quadtree.hpp"
#include <vector>

namespace skymatrix {

struct AnomalyResult {
    int x = 0;
    int y = 0;
    int size = 0;
    int width = 0;
    int height = 0;
    int component_id = -1;
    double z_score = 0.0;
    double region_mean = 0.0;

    int effective_width() const { return width > 0 ? width : size; }
    int effective_height() const { return height > 0 ? height : size; }
    int right() const { return x + effective_width(); }
    int bottom() const { return y + effective_height(); }
    int area() const { return effective_width() * effective_height(); }
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
