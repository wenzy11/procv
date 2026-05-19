/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
    // Keep native Node packages out of the bundle (required on Vercel serverless).
    serverComponentsExternalPackages: [
      "firebase-admin",
      "@react-pdf/renderer",
    ],
  },
};

export default nextConfig;
