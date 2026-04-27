#pragma once
#include <string>
#include <vector>
#include <cstdint>

namespace skymatrix {

struct Image {
    int width = 0;
    int height = 0;
    std::vector<std::vector<uint8_t>> data;

    uint8_t at(int r, int c) const { return data[r][c]; }
    uint8_t& at(int r, int c) { return data[r][c]; }
};

Image load_pgm(const std::string& filepath);
Image load_image(const std::string& filepath);
void save_pgm(const std::string& filepath, const Image& img);
void save_image(const std::string& filepath, const Image& img);
Image create_image(int width, int height, uint8_t fill = 0);

} // namespace skymatrix
