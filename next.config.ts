import type { NextConfig } from "next";
import path from "node:path";
const loaderPath = require.resolve('orchids-visual-edits/loader.js');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [loaderPath]
      }
    }
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "3000-078ba0e0-16dc-4569-ba5b-dbaebac1ba7c.orchids.cloud",
        "3000-078ba0e0-16dc-4569-ba5b-dbaebac1ba7c.proxy.daytona.works"
      ]
    }
  }
};

export default nextConfig;
// Orchids restart: 1769842914631