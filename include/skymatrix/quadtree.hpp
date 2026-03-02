#pragma once
#include "prefix_sum.hpp"
#include <memory>
#include <vector>
#include <functional>

namespace skymatrix {

struct QuadNode {
    int x, y, size;
    bool is_leaf = false;
    double mean = 0.0;
    double variance = 0.0;
    double anomaly_score = 0.0;
    std::unique_ptr<QuadNode> children[4]; // NW, NE, SW, SE
};

class QuadTree {
public:
    void build(const PrefixSum2D& ps, int img_width, int img_height,
               int min_block_size, double variance_threshold);

    QuadNode* root_node() { return root.get(); }
    const QuadNode* root_node() const { return root.get(); }

    void traverse_leaves(std::function<void(const QuadNode&)> fn) const;

    int leaf_count() const { return num_leaves; }
    int node_count() const { return num_nodes; }

private:
    std::unique_ptr<QuadNode> root;
    int min_block;
    double var_thresh;
    int num_leaves = 0;
    int num_nodes = 0;

    std::unique_ptr<QuadNode> build_recursive(const PrefixSum2D& ps,
                                               int x, int y, int size);
    void traverse_leaves_impl(const QuadNode* node,
                              std::function<void(const QuadNode&)>& fn) const;
};

} // namespace skymatrix
