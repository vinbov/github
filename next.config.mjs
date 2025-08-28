/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:9002", "fluffy-train-r4xgqp79rgpv3xv7g-9002.app.github.dev"],
    },
  },
};

export default nextConfig;
