import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "102400mb", // Ograniczenie rozmiaru pliku dla Server Actions
    },
  },
};

export default nextConfig;
