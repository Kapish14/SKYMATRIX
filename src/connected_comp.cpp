#include "skymatrix/connected_comp.hpp"
#include "skymatrix/union_find.hpp"
#include <algorithm>
#include <climits>
#include <unordered_map>

namespace skymatrix {

namespace {

bool boxes_touch_or_overlap(int ax, int ay, int aw, int ah,
                            int bx, int by, int bw, int bh) {
    const int a_right = ax + aw;
    const int a_bottom = ay + ah;
    const int b_right = bx + bw;
    const int b_bottom = by + bh;

    const bool h_overlap = ax <= b_right && bx <= a_right;
    const bool v_overlap = ay <= b_bottom && by <= a_bottom;
    return h_overlap && v_overlap;
}

bool regions_adjacent(const AnomalyResult& a, const AnomalyResult& b) {
    return boxes_touch_or_overlap(
        a.x, a.y, a.effective_width(), a.effective_height(),
        b.x, b.y, b.effective_width(), b.effective_height());
}

Component make_component(const std::vector<AnomalyResult>& regions, int id) {
    Component comp;
    comp.id = id;
    comp.bounding_x = INT_MAX;
    comp.bounding_y = INT_MAX;

    int max_right = 0;
    int max_bottom = 0;
    double weighted_mean_sum = 0.0;
    int weighted_area = 0;

    for (const auto& region : regions) {
        comp.regions.push_back(region);
        comp.max_score = std::max(comp.max_score, region.z_score);
        comp.bounding_x = std::min(comp.bounding_x, region.x);
        comp.bounding_y = std::min(comp.bounding_y, region.y);
        max_right = std::max(max_right, region.right());
        max_bottom = std::max(max_bottom, region.bottom());

        const int area = std::max(1, region.area());
        weighted_mean_sum += region.region_mean * area;
        weighted_area += area;
    }

    if (comp.bounding_x == INT_MAX) {
        comp.bounding_x = 0;
        comp.bounding_y = 0;
    }

    comp.bounding_w = std::max(0, max_right - comp.bounding_x);
    comp.bounding_h = std::max(0, max_bottom - comp.bounding_y);
    comp.mean_intensity = weighted_area > 0 ? weighted_mean_sum / weighted_area : 0.0;
    return comp;
}

Component merge_two_components(const Component& a, const Component& b) {
    std::vector<AnomalyResult> merged_regions;
    merged_regions.reserve(a.regions.size() + b.regions.size());
    merged_regions.insert(merged_regions.end(), a.regions.begin(), a.regions.end());
    merged_regions.insert(merged_regions.end(), b.regions.begin(), b.regions.end());
    return make_component(merged_regions, 0);
}

void sort_components(std::vector<Component>& components) {
    std::sort(components.begin(), components.end(),
              [](const Component& a, const Component& b) {
                  if (a.max_score != b.max_score) {
                      return a.max_score > b.max_score;
                  }
                  const int a_area = a.bounding_w * a.bounding_h;
                  const int b_area = b.bounding_w * b.bounding_h;
                  return a_area > b_area;
              });

    for (size_t i = 0; i < components.size(); ++i) {
        components[i].id = static_cast<int>(i);
    }
}

} // namespace

std::vector<Component> find_connected_components(
    const std::vector<AnomalyResult>& anomalies
) {
    const int n = static_cast<int>(anomalies.size());
    if (n == 0) return {};

    UnionFind uf(n);

    for (int i = 0; i < n; ++i) {
        for (int j = i + 1; j < n; ++j) {
            if (regions_adjacent(anomalies[i], anomalies[j])) {
                uf.unite(i, j);
            }
        }
    }

    std::unordered_map<int, std::vector<int>> groups;
    for (int i = 0; i < n; ++i) {
        groups[uf.find(i)].push_back(i);
    }

    std::vector<Component> components;
    components.reserve(groups.size());
    for (auto& [root, indices] : groups) {
        std::vector<AnomalyResult> group_regions;
        group_regions.reserve(indices.size());
        for (int idx : indices) {
            group_regions.push_back(anomalies[idx]);
        }
        components.push_back(make_component(group_regions, 0));
    }

    sort_components(components);
    return components;
}

std::vector<Component> merge_overlapping_components(
    const std::vector<Component>& components
) {
    const int n = static_cast<int>(components.size());
    if (n == 0) return {};

    UnionFind uf(n);
    for (int i = 0; i < n; ++i) {
        for (int j = i + 1; j < n; ++j) {
            if (boxes_touch_or_overlap(
                    components[i].bounding_x, components[i].bounding_y,
                    components[i].bounding_w, components[i].bounding_h,
                    components[j].bounding_x, components[j].bounding_y,
                    components[j].bounding_w, components[j].bounding_h)) {
                uf.unite(i, j);
            }
        }
    }

    std::unordered_map<int, std::vector<int>> groups;
    for (int i = 0; i < n; ++i) {
        groups[uf.find(i)].push_back(i);
    }

    std::vector<Component> merged;
    merged.reserve(groups.size());
    for (auto& [root, indices] : groups) {
        std::vector<AnomalyResult> group_regions;
        for (int idx : indices) {
            group_regions.insert(group_regions.end(),
                                 components[idx].regions.begin(),
                                 components[idx].regions.end());
        }
        merged.push_back(make_component(group_regions, 0));
    }

    sort_components(merged);
    return merged;
}

std::vector<AnomalyResult> select_top_k_regions(
    const std::vector<Component>& components,
    int k
) {
    std::vector<AnomalyResult> selected;
    if (k <= 0) return selected;

    const int limit = std::min(k, static_cast<int>(components.size()));
    selected.reserve(limit);
    for (int i = 0; i < limit; ++i) {
        const auto& comp = components[i];
        AnomalyResult region;
        region.x = comp.bounding_x;
        region.y = comp.bounding_y;
        region.width = comp.bounding_w;
        region.height = comp.bounding_h;
        region.size = std::max(comp.bounding_w, comp.bounding_h);
        region.component_id = comp.id;
        region.z_score = comp.max_score;
        region.region_mean = comp.mean_intensity;
        selected.push_back(region);
    }

    return selected;
}

std::vector<Component> select_top_k_components(
    const std::vector<Component>& components,
    int k
) {
    std::vector<Component> selected;
    if (k <= 0) return selected;

    for (const auto& component : components) {
        Component candidate = component;
        bool merged = true;

        while (merged) {
            merged = false;
            for (size_t i = 0; i < selected.size(); ++i) {
                if (boxes_touch_or_overlap(
                        candidate.bounding_x, candidate.bounding_y,
                        candidate.bounding_w, candidate.bounding_h,
                        selected[i].bounding_x, selected[i].bounding_y,
                        selected[i].bounding_w, selected[i].bounding_h)) {
                    candidate = merge_two_components(candidate, selected[i]);
                    selected.erase(selected.begin() + static_cast<long>(i));
                    merged = true;
                    break;
                }
            }
        }

        selected.push_back(std::move(candidate));
        sort_components(selected);
    }

    sort_components(selected);
    if (static_cast<int>(selected.size()) > k) {
        selected.resize(k);
        sort_components(selected);
    }

    return selected;
}

} // namespace skymatrix
