import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // alamat lama tulisan (/cerita) diarahkan ke alamat barunya (/tulisan)
  async redirects() {
    return [
      { source: "/cerita", destination: "/tulisan", permanent: true },
      { source: "/cerita/:slug", destination: "/tulisan/:slug", permanent: true },
      // alamat pendek yang dipakai kode QR kartu bagikan (lihat `qrBase` di lib/site.ts dan folder qr/)
      { source: "/r/:slug", destination: "/tulisan/:slug", permanent: false },
    ];
  },
};

export default nextConfig;
