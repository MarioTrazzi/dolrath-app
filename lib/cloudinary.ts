import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageFromUrl(imageUrl: string): Promise<string> {
	try {
		const result = await cloudinary.uploader.upload(imageUrl, {
			folder: "player-avatars",
		});
		return result.secure_url;
	} catch (error) {
		console.error("Erro ao fazer upload para Cloudinary:", error);
		throw error;
	}
}
