import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Emit .next/standalone: a self-contained server plus only the node_modules
  // the build actually traces. The Docker runner ships that instead of a full
  // `npm ci --omit=dev` tree (892 MB, a quarter of it @next/swc build-time
  // compilers that never run in production).
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    "delicious-folk-recount.ngrok-free.dev",
    "*.ngrok-free.dev",
  ],
  images: {
    // Local backend images are allowed in development only. Production should
    // use public HTTPS image hosts to keep Next.js SSRF protections enabled.
    dangerouslyAllowLocalIP: isDevelopment,
    remotePatterns: [
      ...(isDevelopment
        ? [
            {
              protocol: "http" as const,
              hostname: "localhost",
              port: "8000",
              pathname: "/**",
            },
            {
              protocol: "http" as const,
              hostname: "127.0.0.1",
              port: "8000",
              pathname: "/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "khmersignlanguage.share.zrok.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
