#include "skymatrix/prefix_sum.hpp"
#include <cmath>

namespace skymatrix {

void PrefixSum2D::build(const Image& img) {
    h = img.height;
    w = img.width;

    // Allocate with 1-based indexing (row 0 and col 0 are zero padding)
    sum.assign(h + 1, std::vector<int64_t>(w + 1, 0));
    sq_sum.assign(h + 1, std::vector<int64_t>(w + 1, 0));

    for (int r = 1; r <= h; ++r) {
        for (int c = 1; c <= w; ++c) {
            int64_t val = img.data[r - 1][c - 1];
            sum[r][c] = val + sum[r - 1][c] + sum[r][c - 1] - sum[r - 1][c - 1];
            sq_sum[r][c] = val * val + sq_sum[r - 1][c] + sq_sum[r][c - 1] - sq_sum[r - 1][c - 1];
        }
    }
}

int64_t PrefixSum2D::region_sum(int r1, int c1, int r2, int c2) const {
    // Convert to 1-based inclusive: region [r1, c1] to [r2, c2] in 0-based
    int R1 = r1, C1 = c1, R2 = r2 + 1, C2 = c2 + 1;
    return sum[R2][C2] - sum[R1][C2] - sum[R2][C1] + sum[R1][C1];
}

int64_t PrefixSum2D::region_sq_sum(int r1, int c1, int r2, int c2) const {
    int R1 = r1, C1 = c1, R2 = r2 + 1, C2 = c2 + 1;
    return sq_sum[R2][C2] - sq_sum[R1][C2] - sq_sum[R2][C1] + sq_sum[R1][C1];
}

double PrefixSum2D::region_mean(int r1, int c1, int r2, int c2) const {
    int64_t area = static_cast<int64_t>(r2 - r1 + 1) * (c2 - c1 + 1);
    return static_cast<double>(region_sum(r1, c1, r2, c2)) / area;
}

double PrefixSum2D::region_variance(int r1, int c1, int r2, int c2) const {
    int64_t area = static_cast<int64_t>(r2 - r1 + 1) * (c2 - c1 + 1);
    double mean = static_cast<double>(region_sum(r1, c1, r2, c2)) / area;
    double mean_sq = static_cast<double>(region_sq_sum(r1, c1, r2, c2)) / area;
    return mean_sq - mean * mean;
}

double PrefixSum2D::global_mean() const {
    int64_t total = sum[h][w];
    int64_t area = static_cast<int64_t>(h) * w;
    return static_cast<double>(total) / area;
}

double PrefixSum2D::global_stddev() const {
    int64_t area = static_cast<int64_t>(h) * w;
    double mean = static_cast<double>(sum[h][w]) / area;
    double mean_sq = static_cast<double>(sq_sum[h][w]) / area;
    double var = mean_sq - mean * mean;
    return std::sqrt(var > 0 ? var : 0);
}

} // namespace skymatrix
