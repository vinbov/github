console.log("--- LETTURA DI NEXT.CONFIG.MJS ---");
console.log("Origine consentita da ENV:", process.env.ALLOWED_ORIGIN);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:9002", process.env.ALLOWED_ORIGIN].filter(Boolean),
    },
  },
};

export default nextConfig;
