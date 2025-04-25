/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: ["res.cloudinary.com", "avatars.githubusercontent.com", "lh3.googleusercontent.com"],
	},
	transpilePackages: ["socket.io-client"],
	webpack: (config, { isServer }) => {
		// Fix for socket.io-client
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				net: false,
				tls: false,
				fs: false,
				dns: false,
				"utf-8-validate": false,
				bufferutil: false,
			};
		}

		return config;
	},
};

export default nextConfig;
