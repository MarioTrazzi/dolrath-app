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
	async headers() {
		return [
			{
				// Aplicar a todas as rotas
				source: "/:path*",
				headers: [
					{ key: "Access-Control-Allow-Credentials", value: "true" },
					{ key: "Access-Control-Allow-Origin", value: "*" }, // Em produção, você deve limitar isso
					{ key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
					{
						key: "Access-Control-Allow-Headers",
						value:
							"X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
					},
				],
			},
		];
	},
};

export default nextConfig;
