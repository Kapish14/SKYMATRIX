#include "skymatrix/image.hpp"
#include <iostream>
#include <random>
#include <cmath>
#include <string>

using namespace skymatrix;

int main(int argc, char* argv[]) {
    int size = 512;
    std::string output = "test_images/test_512.pgm";

    if (argc >= 2) size = std::stoi(argv[1]);
    if (argc >= 3) output = argv[2];

    std::cout << "Generating " << size << "x" << size << " test image...\n";

    Image img = create_image(size, size, 0);
    std::mt19937 rng(42); // fixed seed for reproducibility
    std::normal_distribution<double> noise(0.0, 10.0);

    // Background: gentle gradient + noise (simulates terrain)
    for (int r = 0; r < size; ++r) {
        for (int c = 0; c < size; ++c) {
            double base = 100.0 + 30.0 * std::sin(2.0 * M_PI * r / size)
                                + 20.0 * std::cos(2.0 * M_PI * c / size);
            double val = base + noise(rng);
            val = std::max(0.0, std::min(255.0, val));
            img.at(r, c) = static_cast<uint8_t>(val);
        }
    }

    // Anomaly 1: Bright rectangular region (simulates urban expansion)
    std::cout << "  Anomaly 1 (bright): (50, 50) to (110, 110)\n";
    for (int r = 50; r < 110; ++r) {
        for (int c = 50; c < 110; ++c) {
            img.at(r, c) = static_cast<uint8_t>(std::min(255.0, 220.0 + noise(rng)));
        }
    }

    // Anomaly 2: Dark rectangular region (simulates deforestation)
    std::cout << "  Anomaly 2 (dark): (200, 300) to (260, 380)\n";
    for (int r = 200; r < 260; ++r) {
        for (int c = 300; c < 380; ++c) {
            img.at(r, c) = static_cast<uint8_t>(std::max(0.0, 25.0 + noise(rng)));
        }
    }

    // Anomaly 3: Small bright spot (simulates fire/hotspot)
    std::cout << "  Anomaly 3 (bright spot): (400, 150) to (430, 180)\n";
    for (int r = 400; r < 430; ++r) {
        for (int c = 150; c < 180; ++c) {
            img.at(r, c) = 250;
        }
    }

    // Anomaly 4: Adjacent bright patches (should group into one component)
    std::cout << "  Anomaly 4a (adjacent): (350, 400) to (382, 432)\n";
    std::cout << "  Anomaly 4b (adjacent): (382, 400) to (414, 432)\n";
    for (int r = 350; r < 382; ++r) {
        for (int c = 400; c < 432; ++c) {
            img.at(r, c) = static_cast<uint8_t>(std::min(255.0, 210.0 + noise(rng)));
        }
    }
    for (int r = 382; r < 414; ++r) {
        for (int c = 400; c < 432; ++c) {
            img.at(r, c) = static_cast<uint8_t>(std::min(255.0, 200.0 + noise(rng)));
        }
    }

    // Anomaly 5: Dark band (simulates flooding)
    std::cout << "  Anomaly 5 (dark band): rows 460-490, cols 50-250\n";
    for (int r = 460; r < 490; ++r) {
        for (int c = 50; c < 250; ++c) {
            img.at(r, c) = static_cast<uint8_t>(std::max(0.0, 15.0 + noise(rng) * 0.5));
        }
    }

    save_pgm(output, img);
    std::cout << "Saved to " << output << "\n";
    std::cout << "\nGround truth anomaly locations (for validation):\n";
    std::cout << "  1. Bright block:  (50,50)   size ~60x60   mean ~220\n";
    std::cout << "  2. Dark block:    (300,200)  size ~80x60   mean ~25\n";
    std::cout << "  3. Bright spot:   (150,400)  size ~30x30   mean ~250\n";
    std::cout << "  4. Adjacent pair: (400,350)  size ~32x64   mean ~205\n";
    std::cout << "  5. Dark band:     (50,460)   size ~200x30  mean ~15\n";

    return 0;
}
