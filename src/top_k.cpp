#include "skymatrix/top_k.hpp"
#include <queue>
#include <algorithm>

namespace skymatrix {

std::vector<AnomalyResult> select_top_k(
    const std::vector<AnomalyResult>& anomalies,
    int k
) {
    if (k <= 0) return {};
    if (static_cast<int>(anomalies.size()) <= k) {
        auto result = anomalies;
        std::sort(result.begin(), result.end(),
                  [](const AnomalyResult& a, const AnomalyResult& b) {
                      return a.z_score > b.z_score;
                  });
        return result;
    }

    // Min-heap: keeps the K largest elements
    // Top of heap = smallest among the K largest
    auto cmp = [](const AnomalyResult& a, const AnomalyResult& b) {
        return a.z_score > b.z_score; // min-heap by z_score
    };
    std::priority_queue<AnomalyResult, std::vector<AnomalyResult>, decltype(cmp)> min_heap(cmp);

    for (const auto& a : anomalies) {
        if (static_cast<int>(min_heap.size()) < k) {
            min_heap.push(a);
        } else if (a.z_score > min_heap.top().z_score) {
            min_heap.pop();
            min_heap.push(a);
        }
    }

    std::vector<AnomalyResult> result;
    result.reserve(min_heap.size());
    while (!min_heap.empty()) {
        result.push_back(min_heap.top());
        min_heap.pop();
    }

    // Sort descending by z_score
    std::sort(result.begin(), result.end(),
              [](const AnomalyResult& a, const AnomalyResult& b) {
                  return a.z_score > b.z_score;
              });

    return result;
}

} // namespace skymatrix
