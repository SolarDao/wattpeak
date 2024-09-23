/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "https://ipfs.infura.io/ipfs/",
        port: "",
        pathname: "/ipfs/**",
      },
    ],
  },
};
