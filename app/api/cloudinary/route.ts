import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { uploadImageFromUrl } from "@/lib/cloudinary";
import { z } from "zod";

// Schema para validação
const uploadSchema = z.object({
	imageUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const validatedData = uploadSchema.parse(body);

		// Upload para o Cloudinary
		const permanentImageUrl = await uploadImageFromUrl(validatedData.imageUrl);

		return NextResponse.json({
			success: true,
			imageUrl: permanentImageUrl,
		});
	} catch (error) {
		console.error("Erro no upload para Cloudinary:", error);
		return NextResponse.json({ error: "Falha ao processar imagem" }, { status: 500 });
	}
}
