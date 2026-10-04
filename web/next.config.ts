import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Browser talks to /api on the same origin, so the Python backend needs no CORS.
  rewrites: async () => [{ source: "/api/:path*", destination: `${API_URL}/:path*` }],
};

export default nextConfig;
