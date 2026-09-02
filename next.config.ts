import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mysql2", "ffmpeg-static", "youtubei.js"],
  images: {
    qualities: [75, 90, 100],
  },
};

export default nextConfig;
