/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: ["res.cloudinary.com", "avatars.githubusercontent.com", "lh3.googleusercontent.com"],
	},
	transpilePackages: ["socket.io-client"],
};

export default nextConfig;
