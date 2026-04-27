#pragma once
#include "anomaly.hpp"
#include <vector>

namespace skymatrix {

struct Component {
    int id = -1;
    std::vector<AnomalyResult> regions;
    int bounding_x = 0;
    int bounding_y = 0;
    int bounding_w = 0;
    int bounding_h = 0;
    double max_score = 0.0;
    double mean_intensity = 0.0;
};

std::vector<Component> find_connected_components(
    const std::vector<AnomalyResult>& anomalies
);

std::vector<Component> merge_overlapping_components(
    const std::vector<Component>& components
);

std::vector<Component> select_top_k_components(
    const std::vector<Component>& components,
    int k
);

std::vector<AnomalyResult> select_top_k_regions(
    const std::vector<Component>& components,
    int k
);

} // namespace skymatrix
