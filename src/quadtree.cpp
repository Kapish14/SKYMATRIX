#include "skymatrix/quadtree.hpp"
#include <algorithm>

namespace skymatrix {

void QuadTree::build(const PrefixSum2D& ps, int img_width, int img_height,
                     int min_block_size, double variance_threshold) {
    min_block = min_block_size;
    var_thresh = variance_threshold;
    num_leaves = 0;
    num_nodes = 0;

    // Use the larger dimension, rounded up to next power of 2
    int size = std::max(img_width, img_height);
    int pow2 = 1;
    while (pow2 < size) pow2 <<= 1;

    root = build_recursive(ps, 0, 0, pow2);
}

std::unique_ptr<QuadNode> QuadTree::build_recursive(const PrefixSum2D& ps,
                                                     int x, int y, int size) {
    auto node = std::make_unique<QuadNode>();
    node->x = x;
    node->y = y;
    node->size = size;
    num_nodes++;

    // Clamp to image bounds
    int r2 = std::min(y + size - 1, ps.height() - 1);
    int c2 = std::min(x + size - 1, ps.width() - 1);

    // If entirely outside image, mark as leaf with zero stats
    if (y >= ps.height() || x >= ps.width()) {
        node->is_leaf = true;
        node->mean = 0;
        node->variance = 0;
        num_leaves++;
        return node;
    }

    node->mean = ps.region_mean(y, x, r2, c2);
    node->variance = ps.region_variance(y, x, r2, c2);

    // Make leaf if: too small to subdivide OR variance is below threshold (uniform)
    if (size <= min_block || node->variance <= var_thresh) {
        node->is_leaf = true;
        num_leaves++;
        return node;
    }

    // Subdivide into 4 quadrants
    int half = size / 2;
    node->children[0] = build_recursive(ps, x,        y,        half); // NW
    node->children[1] = build_recursive(ps, x + half,  y,        half); // NE
    node->children[2] = build_recursive(ps, x,        y + half,  half); // SW
    node->children[3] = build_recursive(ps, x + half,  y + half,  half); // SE

    node->is_leaf = false;
    return node;
}

void QuadTree::traverse_leaves(std::function<void(const QuadNode&)> fn) const {
    if (root) {
        traverse_leaves_impl(root.get(), fn);
    }
}

void QuadTree::traverse_leaves_impl(const QuadNode* node,
                                    std::function<void(const QuadNode&)>& fn) const {
    if (!node) return;
    if (node->is_leaf) {
        fn(*node);
        return;
    }
    for (int i = 0; i < 4; ++i) {
        traverse_leaves_impl(node->children[i].get(), fn);
    }
}

} // namespace skymatrix
