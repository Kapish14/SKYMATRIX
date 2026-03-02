#pragma once
#include <vector>

namespace skymatrix {

class UnionFind {
public:
    explicit UnionFind(int n);

    int find(int x);
    void unite(int x, int y);
    bool connected(int x, int y);
    int component_count() const { return components; }

private:
    std::vector<int> parent;
    std::vector<int> rnk;
    int components;
};

} // namespace skymatrix
