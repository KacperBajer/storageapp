import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "102400mb", // Ograniczenie rozmiaru pliku dla Server Actions
    },
  },
  api: {
    bodyParser: false,
  }
};

export default nextConfig;
