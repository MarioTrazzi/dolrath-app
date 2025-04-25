import { NextResponse } from "next/server";

export async function GET() {
	try {
		const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
		const response = await fetch(`${serverUrl}/api/health`, {
			cache: "no-store",
			next: { revalidate: 5 }, // Revalidar a cada 5 segundos
		});

		if (!response.ok) {
			throw new Error("Falha ao verificar o status do servidor");
		}

		const data = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		console.error("Erro ao verificar o status do servidor:", error);
		return NextResponse.json(
			{ status: "offline", error: "Não foi possível conectar ao servidor de jogo" },
			{ status: 500 },
		);
	}
}
