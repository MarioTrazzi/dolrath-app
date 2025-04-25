/** @type {import('next').NextConfig} */
import nextra from "nextra";

const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "via.placeholder.com",
			},
			{
				protocol: "https",
				hostname: "oaidalleapiprodscus.blob.core.windows.net",
			},
			{
				protocol: "https",
				hostname: "*.openai.com",
			},
			// Domínios adicionais da OpenAI
			{
				protocol: "https",
				hostname: "*.blob.core.windows.net",
			},
			{
				protocol: "https",
				hostname: "*.openai.azure.com",
			},
			// Para ter certeza, permitir qualquer URL de imagem (apenas para desenvolvimento)
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
};

const withNextra = nextra({
	theme: "nextra-theme-docs",
	// theme: './theme.tsx',
	themeConfig: "./theme.config.tsx",
});

export default withNextra({
	...nextConfig,
});

// export default nextConfig;
