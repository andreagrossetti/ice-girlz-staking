/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  reactStrictMode: false,
  // Wallet SDKs pulled in by wagmi connectors: keep them out of the server bundle
  // (@coinbase/cdp-sdk dynamically imports optional @x402/* packages that aren't installed).
  serverExternalPackages: ["@coinbase/cdp-sdk", "pino", "thread-stream"],
};

module.exports = nextConfig;
