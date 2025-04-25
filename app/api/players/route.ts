import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const playerSchema = z.object({
	name: z.string().min(1),
	race: z.string().min(1),
	subclass: z.string().min(1),
	hp: z.number().min(1),
	mp: z.number().min(1),
	strength: z.number().min(1),
	defense: z.number().min(1),
	speed: z.number().min(1),
	dexterity: z.number().min(1),
	intelligence: z.number().min(1),
	charisma: z.number().min(1),
	wisdom: z.number().min(1),
	experience: z.number(),
	image: z.string().optional(),
	imagePrompt: z.string().optional(),
});

export async function GET() {
	try {
		const session = await auth();
		if (!session || !session.user || !session.user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;

		const players = await prisma.player.findMany({
			where: {
				userId: userId,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json(players);
	} catch (error) {
		console.error("Error fetching players:", error);
		return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	// TEMPORÁRIO: Usar ID de usuário hardcoded para teste
	// Remover isso e usar a autenticação adequada em produção!
	const mockUserId = "cm9t8rjjg000887q1jgpt5rb1"; // Substitua com um ID real do seu banco de dados
	const isTestMode = false; // Mudando para false, usará autenticação real

	// Verificação de autenticação normal (desabilitada em modo de teste)
	let userId = mockUserId;
	if (!isTestMode) {
		const session = await auth();
		if (!session || !session.user || !session.user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		userId = session.user.id;
	}

	try {
		const body = await req.json();
		console.log("Dados recebidos na API:", body);

		const validatedData = playerSchema.parse(body);
		console.log("Dados validados:", validatedData);

		// Remove o campo imagePrompt que não existe no modelo do Prisma
		const { imagePrompt, ...playerData } = validatedData;

		console.log("Criando player com dados:", playerData);
		const player = await prisma.player.create({
			data: {
				...playerData,
				userId: userId,
			},
		});

		return NextResponse.json(player);
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("Erro de validação Zod:", error.errors);
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}

		console.error("Erro ao criar player:", error);
		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
	}
}
