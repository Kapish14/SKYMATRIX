#include "skymatrix/connected_comp.hpp"
#include "skymatrix/union_find.hpp"
#include <unordered_map>
#include <algorithm>
#include <climits>

namespace skymatrix {

static bool regions_adjacent(const AnomalyResult& a, const AnomalyResult& b) {
    // Two regions are adjacent if their bounding boxes touch or overlap
    int a_left = a.x, a_right = a.x + a.size;
    int a_top = a.y, a_bottom = a.y + a.size;
    int b_left = b.x, b_right = b.x + b.size;
    int b_top = b.y, b_bottom = b.y + b.size;

    // Check if they share an edge (touching) or overlap
    bool h_overlap = a_left <= b_right && b_left <= a_right;
    bool v_overlap = a_top <= b_bottom && b_top <= a_bottom;

    return h_overlap && v_overlap;
}

std::vector<Component> find_connected_components(
    const std::vector<AnomalyResult>& top_k_regions
) {
    int n = static_cast<int>(top_k_regions.size());
    if (n == 0) return {};

    UnionFind uf(n);

    // Check all pairs for adjacency
    for (int i = 0; i < n; ++i) {
        for (int j = i + 1; j < n; ++j) {
            if (regions_adjacent(top_k_regions[i], top_k_regions[j])) {
                uf.unite(i, j);
            }
        }
    }

    // Group regions by component root
    std::unordered_map<int, std::vector<int>> groups;
    for (int i = 0; i < n; ++i) {
        groups[uf.find(i)].push_back(i);
    }

    std::vector<Component> components;
    int comp_id = 0;
    for (auto& [root, indices] : groups) {
        Component comp;
        comp.id = comp_id++;
        comp.max_score = 0;
        comp.bounding_x = INT_MAX;
        comp.bounding_y = INT_MAX;
        int max_right = 0, max_bottom = 0;

        for (int idx : indices) {
            const auto& r = top_k_regions[idx];
            comp.regions.push_back(r);
            comp.max_score = std::max(comp.max_score, r.z_score);
            comp.bounding_x = std::min(comp.bounding_x, r.x);
            comp.bounding_y = std::min(comp.bounding_y, r.y);
            max_right = std::max(max_right, r.x + r.size);
            max_bottom = std::max(max_bottom, r.y + r.size);
        }

        comp.bounding_w = max_right - comp.bounding_x;
        comp.bounding_h = max_bottom - comp.bounding_y;
        components.push_back(std::move(comp));
    }

    // Sort by max_score descending
    std::sort(components.begin(), components.end(),
              [](const Component& a, const Component& b) {
                  return a.max_score > b.max_score;
              });

    return components;
}

} // namespace skymatrix
