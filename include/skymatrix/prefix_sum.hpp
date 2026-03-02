#pragma once
#include "image.hpp"
#include <vector>
#include <cstdint>

namespace skymatrix {

class PrefixSum2D {
public:
    void build(const Image& img);

    int64_t region_sum(int r1, int c1, int r2, int c2) const;
    double region_mean(int r1, int c1, int r2, int c2) const;
    double region_variance(int r1, int c1, int r2, int c2) const;

    double global_mean() const;
    double global_stddev() const;

    int width() const { return w; }
    int height() const { return h; }

private:
    std::vector<std::vector<int64_t>> sum;
    std::vector<std::vector<int64_t>> sq_sum;
    int w = 0, h = 0;

    int64_t region_sq_sum(int r1, int c1, int r2, int c2) const;
};

} // namespace skymatrix
