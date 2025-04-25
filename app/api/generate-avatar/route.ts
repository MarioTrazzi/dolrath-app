import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import OpenAI from "openai";
import { uploadImageFromUrl } from "@/lib/cloudinary";

// Inicializa o cliente da OpenAI com a chave da API do ambiente
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// You would integrate with your preferred AI image generation service here
// This is a placeholder implementation
export async function POST(req: NextRequest) {
	const session = await auth();

	// TEMPORÁRIO: Comentando verificação de autenticação apenas para testes
	// Lembre-se de restaurar esta verificação antes de colocar em produção!
	/*
	// Check if user is authenticated
	if (!session || !session.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	*/

	try {
		const { prompt } = await req.json();

		if (!prompt) {
			return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
		}

		// Verifica se a chave da API está configurada
		if (!process.env.OPENAI_API_KEY) {
			console.error("OPENAI_API_KEY não está configurada no ambiente");
			return NextResponse.json(
				{ error: "API configuration error", errorMessage: "Chave da API não configurada" },
				{ status: 500 },
			);
		}

		try {
			// Formatar o prompt para gerar um bom resultado com DALL-E 2
			const enhancedPrompt = `High quality digital art of ${prompt.substring(0, 400)}. Detailed fantasy character portrait, professional artwork, vibrant colors.`;

			console.log("Enviando prompt para DALL-E:", enhancedPrompt);

			// Chamada para DALL-E 2
			const response = await openai.images.generate({
				model: "dall-e-2",
				prompt: enhancedPrompt,
				n: 1,
				size: "512x512",
			});

			// Extrai a URL da imagem da resposta
			const dalleImageUrl = response.data[0]?.url;

			console.log("Resposta da API (parcial):", response.data ? "Dados recebidos" : "Sem dados");
			console.log("Imagem gerada com sucesso:", dalleImageUrl ? "URL recebida" : "Sem URL");

			if (!dalleImageUrl) {
				throw new Error("Failed to generate image: No image URL returned");
			}

			// Fazer upload da imagem para o Cloudinary para armazenamento permanente
			console.log("Fazendo upload da imagem para Cloudinary...");
			const permanentImageUrl = await uploadImageFromUrl(dalleImageUrl);
			console.log("Upload para Cloudinary concluído com sucesso:", permanentImageUrl);

			// Retorna a URL permanente da imagem do Cloudinary
			return NextResponse.json({ imageUrl: permanentImageUrl });
		} catch (openaiError) {
			console.error("Erro detalhado da OpenAI:", JSON.stringify(openaiError, null, 2));

			let errorMessage = "Falha ao gerar imagem.";

			// Tentar extrair mensagem de erro mais específica
			if (openaiError && typeof openaiError === "object") {
				// Tipagem segura para o objeto de erro
				interface OpenAIError {
					message?: string;
					error?: {
						message?: string;
						type?: string;
					};
				}

				const error = openaiError as OpenAIError;
				if (error.error?.message) {
					errorMessage = `Erro da API: ${error.error.message}`;
				} else if (error.message) {
					errorMessage = `Erro: ${error.message}`;
				}
			}

			// Retornamos um erro para que o frontend possa tratar adequadamente
			return NextResponse.json(
				{
					error: "Error generating image with OpenAI",
					errorMessage,
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Error processing request:", error);
		return NextResponse.json(
			{ error: "Failed to process request", errorMessage: "Erro ao processar solicitação" },
			{ status: 500 },
		);
	}
}
