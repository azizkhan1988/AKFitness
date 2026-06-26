// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
  },
  images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "res.cloudinary.com", // Cloudinary
    },
    {
      protocol: "https",
      hostname: "ak-fitness-omega.vercel.app", // your Vercel domain
    },
    {
      protocol: "http",
      hostname: "localhost", // local dev
    }
  ],
  unoptimized: true, 
},

};

module.exports = nextConfig;
