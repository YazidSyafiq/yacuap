import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // alamat lama tulisan (/cerita) diarahkan ke alamat barunya (/tulisan)
  async redirects() {
    return [
      { source: "/cerita", destination: "/tulisan", permanent: true },
      { source: "/cerita/:slug", destination: "/tulisan/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
