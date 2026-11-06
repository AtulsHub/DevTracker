import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for auth: bcryptjs uses Node.js crypto, not available in the Edge runtime.
  // Next.js uses "serverExternalPackages"
  serverExternalPackages: ["bcryptjs", "cloudinary"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
