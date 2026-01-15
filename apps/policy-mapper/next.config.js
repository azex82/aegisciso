/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@aegisciso/ui', '@aegisciso/shared', '@aegisciso/db'],
};

module.exports = nextConfig;
