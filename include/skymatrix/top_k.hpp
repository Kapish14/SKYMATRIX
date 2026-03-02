#pragma once
#include "anomaly.hpp"
#include <vector>

namespace skymatrix {

std::vector<AnomalyResult> select_top_k(
    const std::vector<AnomalyResult>& anomalies,
    int k
);

} // namespace skymatrix
