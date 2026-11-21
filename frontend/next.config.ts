import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["10.114.193.168", "192.168.2.100", "127.0.0.1"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
