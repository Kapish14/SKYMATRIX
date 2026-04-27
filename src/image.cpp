#include "skymatrix/image.hpp"
#include <algorithm>
#include <chrono>
#include <cctype>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <stdexcept>

namespace skymatrix {

namespace {

void skip_comments(std::istream& f) {
    char c;
    while (f.peek() == '#' || f.peek() == '\n' || f.peek() == '\r' ||
           f.peek() == ' ' || f.peek() == '\t') {
        if (f.peek() == '#') {
            std::string line;
            std::getline(f, line);
        } else {
            f.get(c);
        }
    }
}

uint8_t scale_to_u8(int value, int maxval) {
    if (maxval <= 0) {
        throw std::runtime_error("Invalid pixel max value");
    }
    if (maxval == 255) {
        return static_cast<uint8_t>(std::clamp(value, 0, 255));
    }
    const double scaled = (static_cast<double>(value) * 255.0) / maxval;
    return static_cast<uint8_t>(std::clamp<int>(static_cast<int>(scaled + 0.5), 0, 255));
}

Image load_pgm_stream(std::istream& f, const std::string& source_name) {
    std::string magic;
    f >> magic;

    if (magic != "P2" && magic != "P5") {
        throw std::runtime_error("Not a PGM file (expected P2 or P5): " + source_name);
    }

    skip_comments(f);

    int width = 0;
    int height = 0;
    int maxval = 0;
    f >> width >> height;
    skip_comments(f);
    f >> maxval;

    if (!f.good() || width <= 0 || height <= 0 || maxval <= 0 || maxval > 65535) {
        throw std::runtime_error("Invalid PGM header in: " + source_name);
    }

    Image img;
    img.width = width;
    img.height = height;
    img.data.resize(height, std::vector<uint8_t>(width));

    if (magic == "P5") {
        f.get(); // consume the single whitespace after maxval
        if (maxval < 256) {
            for (int r = 0; r < height; ++r) {
                f.read(reinterpret_cast<char*>(img.data[r].data()), width);
                if (f.gcount() != width) {
                    throw std::runtime_error("Unexpected EOF while reading PGM: " + source_name);
                }
            }
        } else {
            for (int r = 0; r < height; ++r) {
                for (int c = 0; c < width; ++c) {
                    unsigned char bytes[2] = {0, 0};
                    f.read(reinterpret_cast<char*>(bytes), 2);
                    if (f.gcount() != 2) {
                        throw std::runtime_error("Unexpected EOF while reading 16-bit PGM: " + source_name);
                    }
                    const int value = (static_cast<int>(bytes[0]) << 8) | bytes[1];
                    img.data[r][c] = scale_to_u8(value, maxval);
                }
            }
        }
    } else {
        for (int r = 0; r < height; ++r) {
            for (int c = 0; c < width; ++c) {
                int value = 0;
                f >> value;
                if (!f.good()) {
                    throw std::runtime_error("Unexpected EOF while reading ASCII PGM: " + source_name);
                }
                img.data[r][c] = scale_to_u8(value, maxval);
            }
        }
    }

    return img;
}

std::string lowercase(std::string value) {
    std::transform(value.begin(), value.end(), value.begin(),
                   [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
    return value;
}

std::string shell_escape(const std::string& value) {
    std::string escaped = "'";
    for (char ch : value) {
        if (ch == '\'') {
            escaped += "'\\''";
        } else {
            escaped += ch;
        }
    }
    escaped += "'";
    return escaped;
}

std::filesystem::path make_temp_path(const std::string& extension) {
    const auto now = std::chrono::steady_clock::now().time_since_epoch().count();
    return std::filesystem::temp_directory_path() /
           ("skymatrix_" + std::to_string(now) + extension);
}

Image load_via_ffmpeg(const std::string& filepath) {
    const auto temp_path = make_temp_path(".pgm");
    const std::string cmd =
        "ffmpeg -v error -y -i " + shell_escape(filepath) +
        " -frames:v 1 -update 1 -pix_fmt gray " + shell_escape(temp_path.string()) +
        " >/dev/null 2>&1";

    const int rc = std::system(cmd.c_str());
    if (rc != 0 || !std::filesystem::exists(temp_path)) {
        throw std::runtime_error(
            "Cannot decode image: " + filepath +
            ". Supported PGM files are read natively; other formats require ffmpeg.");
    }

    try {
        Image img = load_pgm(temp_path.string());
        std::filesystem::remove(temp_path);
        return img;
    } catch (...) {
        std::filesystem::remove(temp_path);
        throw;
    }
}

void save_via_ffmpeg(const std::string& filepath, const Image& img) {
    const auto temp_path = make_temp_path(".pgm");
    save_pgm(temp_path.string(), img);

    const std::string cmd =
        "ffmpeg -v error -y -i " + shell_escape(temp_path.string()) +
        " -frames:v 1 -update 1 " +
        shell_escape(filepath) + " >/dev/null 2>&1";

    const int rc = std::system(cmd.c_str());
    std::filesystem::remove(temp_path);

    if (rc != 0) {
        throw std::runtime_error(
            "Cannot write image: " + filepath +
            ". Use .pgm output or install ffmpeg for other formats.");
    }
}

bool has_pgm_magic(const std::string& filepath) {
    std::ifstream f(filepath, std::ios::binary);
    if (!f.is_open()) {
        throw std::runtime_error("Cannot open file: " + filepath);
    }

    std::string magic;
    f >> magic;
    return magic == "P2" || magic == "P5";
}

} // namespace

Image load_pgm(const std::string& filepath) {
    std::ifstream f(filepath, std::ios::binary);
    if (!f.is_open()) {
        throw std::runtime_error("Cannot open file: " + filepath);
    }
    return load_pgm_stream(f, filepath);
}

Image load_image(const std::string& filepath) {
    if (has_pgm_magic(filepath)) {
        return load_pgm(filepath);
    }
    return load_via_ffmpeg(filepath);
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

void save_image(const std::string& filepath, const Image& img) {
    const std::string ext = lowercase(std::filesystem::path(filepath).extension().string());
    if (ext.empty() || ext == ".pgm") {
        save_pgm(filepath, img);
        return;
    }
    save_via_ffmpeg(filepath, img);
}

Image create_image(int width, int height, uint8_t fill) {
    Image img;
    img.width = width;
    img.height = height;
    img.data.resize(height, std::vector<uint8_t>(width, fill));
    return img;
}

} // namespace skymatrix
