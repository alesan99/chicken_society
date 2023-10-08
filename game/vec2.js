// 2d Vector operations

// Length
function vec2Len(x, y) {
    return Math.sqrt(x*x + y*y)
}

// Normalize
function vec2Norm(x, y) {
    const length = vec2Len(x, y)
    if (length == 0) { return 0, 0 };
    return x / length, y / length
}

