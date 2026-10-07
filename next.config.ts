import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for auth: bcryptjs uses Node.js crypto, not available in the Edge runtime.
  // Next.js uses "serverExternalPackages"
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;
