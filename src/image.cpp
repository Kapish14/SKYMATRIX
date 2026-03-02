#include "skymatrix/image.hpp"
#include <fstream>
#include <stdexcept>
#include <sstream>

namespace skymatrix {

static void skip_comments(std::ifstream& f) {
    char c;
    while (f.peek() == '#' || f.peek() == '\n' || f.peek() == '\r' || f.peek() == ' ') {
        if (f.peek() == '#') {
            std::string line;
            std::getline(f, line);
        } else {
            f.get(c);
        }
    }
}

Image load_pgm(const std::string& filepath) {
    std::ifstream f(filepath, std::ios::binary);
    if (!f.is_open()) {
        throw std::runtime_error("Cannot open file: " + filepath);
    }

    std::string magic;
    f >> magic;

    if (magic != "P2" && magic != "P5") {
        throw std::runtime_error("Not a PGM file (expected P2 or P5): " + magic);
    }

    skip_comments(f);

    int width, height, maxval;
    f >> width >> height;
    skip_comments(f);
    f >> maxval;

    if (width <= 0 || height <= 0 || maxval <= 0) {
        throw std::runtime_error("Invalid PGM dimensions or maxval");
    }

    Image img;
    img.width = width;
    img.height = height;
    img.data.resize(height, std::vector<uint8_t>(width));

    if (magic == "P5") {
        // Binary format
        f.get(); // consume the single whitespace after maxval
        for (int r = 0; r < height; ++r) {
            f.read(reinterpret_cast<char*>(img.data[r].data()), width);
        }
    } else {
        // ASCII format (P2)
        for (int r = 0; r < height; ++r) {
            for (int c = 0; c < width; ++c) {
                int val;
                f >> val;
                img.data[r][c] = static_cast<uint8_t>(val);
            }
        }
    }

    return img;
}

void save_pgm(const std::string& filepath, const Image& img) {
    std::ofstream f(filepath, std::ios::binary);
    if (!f.is_open()) {
        throw std::runtime_error("Cannot write to file: " + filepath);
    }

    f << "P5\n";
    f << img.width << " " << img.height << "\n";
    f << "255\n";

    for (int r = 0; r < img.height; ++r) {
        f.write(reinterpret_cast<const char*>(img.data[r].data()), img.width);
    }
}

Image create_image(int width, int height, uint8_t fill) {
    Image img;
    img.width = width;
    img.height = height;
    img.data.resize(height, std::vector<uint8_t>(width, fill));
    return img;
}

} // namespace skymatrix
