import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without it, Turbopack walks up and
  // can latch onto a stray lockfile in a parent/home directory.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
