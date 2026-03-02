#include "skymatrix/union_find.hpp"

namespace skymatrix {

UnionFind::UnionFind(int n) : parent(n), rnk(n, 0), components(n) {
    for (int i = 0; i < n; ++i) {
        parent[i] = i;
    }
}

int UnionFind::find(int x) {
    if (parent[x] != x) {
        parent[x] = find(parent[x]); // path compression
    }
    return parent[x];
}

void UnionFind::unite(int x, int y) {
    int rx = find(x), ry = find(y);
    if (rx == ry) return;

    // Union by rank
    if (rnk[rx] < rnk[ry]) {
        parent[rx] = ry;
    } else if (rnk[rx] > rnk[ry]) {
        parent[ry] = rx;
    } else {
        parent[ry] = rx;
        rnk[rx]++;
    }
    components--;
}

bool UnionFind::connected(int x, int y) {
    return find(x) == find(y);
}

} // namespace skymatrix
