#include "skymatrix/cli_parser.hpp"
#include "skymatrix/pipeline.hpp"
#include <iostream>

int main(int argc, char* argv[]) {
    try {
        auto config = skymatrix::parse_args(argc, argv);
        auto result = skymatrix::run_pipeline(config);
        skymatrix::print_report(result);
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << "\n";
        return 1;
    }
}
