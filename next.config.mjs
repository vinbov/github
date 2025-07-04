// filepath: next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Escludi puppeteer-extra e le sue dipendenze dal bundle del client
    if (!isServer) {
      config.externals.push('puppeteer-extra', 'puppeteer');
    }
    return config;
  },
};

export default nextConfig;