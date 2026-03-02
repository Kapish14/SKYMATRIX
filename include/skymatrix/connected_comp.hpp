#pragma once
#include "anomaly.hpp"
#include <vector>

namespace skymatrix {

struct Component {
    int id;
    std::vector<AnomalyResult> regions;
    int bounding_x, bounding_y, bounding_w, bounding_h;
    double max_score;
};

std::vector<Component> find_connected_components(
    const std::vector<AnomalyResult>& top_k_regions
);

} // namespace skymatrix
