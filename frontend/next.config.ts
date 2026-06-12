import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "delicious-folk-recount.ngrok-free.dev",
    "*.ngrok-free.dev",
  ],
  images: {
    // Next.js 16 SSRF protection blocks localhost/127.0.0.1 unless enabled.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8010",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8010",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "khmersignlanguage.share.zrok.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
