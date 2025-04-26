import { NextResponse } from "next/server";

// Verifique a conexão com o servidor de sockets
export async function GET() {
	// Definir um valor padrão para socketUrl caso não esteja configurado
	const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://dolrath-app.onrender.com";

	// Para diagnóstico, devolva a URL que está tentando acessar
	const diagnosticInfo = {
		socketUrl,
		browserInfo:
			typeof window !== "undefined"
				? {
						protocol: window.location.protocol,
						host: window.location.host,
					}
				: "Servidor",
		timestamp: new Date().toISOString(),
		env: process.env.NODE_ENV,
	};

	try {
		console.log(`Verificando saúde do servidor em: ${socketUrl}/api/health`);

		const response = await fetch(`${socketUrl}/api/health`, {
			cache: "no-store",
			next: { revalidate: 5 },
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			console.error(`Erro ao verificar servidor: ${response.status} ${response.statusText}`);
			throw new Error(`Falha ao verificar o status do servidor: ${response.status}`);
		}

		const data = await response.json();

		return NextResponse.json({
			...data,
			diagnosticInfo,
		});
	} catch (error) {
		console.error("Erro ao verificar o status do servidor:", error);

		// Tente acessar por HTTP, mesmo que a URL seja HTTPS
		let alternateError = null;

		if (socketUrl?.startsWith("https://")) {
			try {
				const httpUrl = socketUrl.replace("https://", "http://");
				console.log(`Tentativa alternativa via HTTP: ${httpUrl}/api/health`);

				const alternateResponse = await fetch(`${httpUrl}/api/health`, {
					cache: "no-store",
				});

				if (alternateResponse.ok) {
					const alternateData = await alternateResponse.json();
					return NextResponse.json({
						status: "warning",
						message: "Conectado via HTTP em vez de HTTPS",
						alternateData,
						diagnosticInfo,
					});
				}
			} catch (altError) {
				alternateError = altError;
			}
		}

		return NextResponse.json(
			{
				status: "offline",
				error: error instanceof Error ? error.message : "Erro desconhecido",
				alternateError: alternateError ? String(alternateError) : null,
				diagnosticInfo,
			},
			{ status: 500 },
		);
	}
}
