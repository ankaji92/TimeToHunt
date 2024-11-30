import type { NextConfig } from "next";
const path = require("path");

const nextConfig: NextConfig = {
  webpack: config => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    config.resolve.alias["~"] = path.join(__dirname, "src");
    return config;
  },
  /* config options here */
};

export default nextConfig;
