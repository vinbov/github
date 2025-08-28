console.log("--- LETTURA DI NEXT.CONFIG.MJS ---");
console.log("Origine consentita da ENV:", process.env.ALLOWED_ORIGIN);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:9002", process.env.ALLOWED_ORIGIN].filter(Boolean),
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Added configuration for Facebook CDN images
      {
        protocol: 'https',
        hostname: '*.fbcdn.net', // Covers scontent.fbcdn.net, external.fbcdn.net and their subdomains like scontent-mia3-2.xx.fbcdn.net
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scontent-*.xx.fbcdn.net', // Specific pattern for scontent-location.xx.fbcdn.net if needed, though *.fbcdn.net should cover it
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com', // For profile pictures or other assets from Graph API
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
