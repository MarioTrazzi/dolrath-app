import { NextResponse } from "next/server";

interface DebugInfo {
	environment: string;
	socketUrl: string;
	apiUrl: string;
	nodeVersion: string;
	timestamp: string;
	nextVersion: string;
	allEnvVars?: Record<string, string | undefined>;
}

export async function GET() {
	// Informações sobre o ambiente para debug
	const info: DebugInfo = {
		environment: process.env.NODE_ENV || "não definido",
		socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "não definido",
		apiUrl: process.env.NEXT_PUBLIC_API_URL || "não definido",
		nodeVersion: process.version,
		timestamp: new Date().toISOString(),
		nextVersion: process.env.NEXT_PUBLIC_VERSION || "desconhecido",
	};

	// Só expomos estas informações em desenvolvimento
	if (process.env.NODE_ENV !== "production") {
		const publicEnvVars: Record<string, string | undefined> = {};

		const filteredEntries = Object.entries(process.env).filter(([key]) => key.startsWith("NEXT_PUBLIC_"));

		for (const [key, value] of filteredEntries) {
			publicEnvVars[key] = value;
		}

		info.allEnvVars = publicEnvVars;
	}

	return NextResponse.json(info, {
		headers: {
			"Cache-Control": "no-store, max-age=0",
		},
	});
}
