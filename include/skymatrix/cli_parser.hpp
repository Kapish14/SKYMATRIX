#pragma once
#include "pipeline.hpp"
#include <string>
#include <vector>
#include <iostream>

namespace skymatrix {

inline void print_usage(const char* prog) {
    std::cout << "SkyMatrix - Satellite Image Analytics Engine\n\n"
              << "Usage: " << prog << " --input <image-path> [options]\n\n"
              << "Options:\n"
              << "  --input <path>           Input image (PGM native; others via ffmpeg)\n"
              << "  --output <path>          Output image with highlighted ROIs\n"
              << "  --json <path>            Output JSON report\n"
              << "  --block-size <int>       Min QuadTree block size (default: 16)\n"
              << "  --z-threshold <float>    Z-Score threshold (default: 2.0)\n"
              << "  --top-k <int>            Top anomalous regions (default: 10)\n"
              << "  --variance-thresh <float> QuadTree prune threshold (default: 100.0)\n"
              << "  --no-branch-bound        Disable branch-and-bound\n"
              << "  --help                   Show this help\n";
}

inline PipelineConfig parse_args(int argc, char* argv[]) {
    PipelineConfig config;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--help" || arg == "-h") {
            print_usage(argv[0]);
            std::exit(0);
        } else if (arg == "--input" && i + 1 < argc) {
            config.input_path = argv[++i];
        } else if (arg == "--output" && i + 1 < argc) {
            config.output_path = argv[++i];
        } else if (arg == "--json" && i + 1 < argc) {
            config.json_path = argv[++i];
        } else if (arg == "--block-size" && i + 1 < argc) {
            config.min_block_size = std::stoi(argv[++i]);
        } else if (arg == "--z-threshold" && i + 1 < argc) {
            config.z_threshold = std::stod(argv[++i]);
        } else if (arg == "--top-k" && i + 1 < argc) {
            config.top_k = std::stoi(argv[++i]);
        } else if (arg == "--variance-thresh" && i + 1 < argc) {
            config.variance_threshold = std::stod(argv[++i]);
        } else if (arg == "--no-branch-bound") {
            config.use_branch_and_bound = false;
        } else {
            std::cerr << "Unknown argument: " << arg << "\n";
            print_usage(argv[0]);
            std::exit(1);
        }
    }

    if (config.input_path.empty()) {
        std::cerr << "Error: --input is required\n\n";
        print_usage(argv[0]);
        std::exit(1);
    }

    return config;
}

} // namespace skymatrix
