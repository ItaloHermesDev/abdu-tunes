import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mysql2", "ffmpeg-static"],
  images: {
    qualities: [75, 90, 100],
  },
};

export default nextConfig;
