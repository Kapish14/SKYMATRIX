cmake_minimum_required(VERSION 3.16)
project(SkyMatrix VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Core library
add_library(skymatrix_core STATIC
    src/image.cpp
    src/prefix_sum.cpp
    src/quadtree.cpp
    src/anomaly.cpp
    src/top_k.cpp
    src/union_find.cpp
    src/connected_comp.cpp
    src/pipeline.cpp
)
target_include_directories(skymatrix_core PUBLIC include)

# Main executable
add_executable(skymatrix src/main.cpp)
target_link_libraries(skymatrix PRIVATE skymatrix_core)

# Test image generator
add_executable(generate_test_image tools/generate_test_image.cpp)
target_link_libraries(generate_test_image PRIVATE skymatrix_core)
