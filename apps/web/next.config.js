/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@openbots/ui",
    "@openbots/api-client",
    "@openbots/api-contract",
  ],
  output: "standalone",
};

export default nextConfig;
