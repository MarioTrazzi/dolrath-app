"use client";

import { useSocket } from "./SocketProvider";
import { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";

// Definir a interface para as informações de diagnóstico
interface DiagnosticInfo {
	socketUrl?: string;
	env?: string;
	timestamp?: number;
	browser?: string;
}

export default function ConnectionStatus() {
	const { socket, isConnected } = useSocket();
	const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
	const [showDetails, setShowDetails] = useState(false);
	const [transport, setTransport] = useState<string>("");
	const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);

	// Verificar o status do servidor
	const checkServerStatus = useCallback(async () => {
		try {
			console.log("Verificando status do servidor...");
			const response = await fetch("/api/server-health", {
				cache: "no-store",
				headers: { pragma: "no-cache" },
			});

			if (response.ok) {
				const data = await response.json();
				console.log("Resposta do health check:", data);
				setDiagnosticInfo(data.diagnosticInfo || null);
				setServerStatus("online");
			} else {
				console.error("Erro na resposta do health check:", response.status);
				setServerStatus("offline");
			}
		} catch (error) {
			console.error("Erro ao verificar status do servidor:", error);
			setServerStatus("offline");
		}
	}, []);

	// Tentar reconectar manualmente
	const handleReconnect = useCallback(() => {
		console.log("Tentando reconectar manualmente...");

		// Atualize o status para "checking" para mostrar o indicador de carregamento
		setServerStatus("checking");

		// Força reconexão do socket se estiver disponível
		if (socket) {
			socket.disconnect();
			socket.connect();
		}

		// Também verificar o servidor novamente
		checkServerStatus();
	}, [socket, checkServerStatus]);

	useEffect(() => {
		checkServerStatus();
		const interval = setInterval(checkServerStatus, 30000); // Verificar a cada 30 segundos

		return () => clearInterval(interval);
	}, [checkServerStatus]);

	useEffect(() => {
		if (socket && isConnected) {
			// @ts-ignore - acessando propriedades internas do socket
			setTransport(socket.io?.engine?.transport?.name || "desconhecido");
		}
	}, [socket, isConnected]);

	if (serverStatus === "checking") {
		return (
			<div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 p-2 rounded-md shadow-md">
				<AlertCircle className="inline-block mr-1" size={16} />
				<span className="text-sm">Verificando conexão...</span>
			</div>
		);
	}

	if (!isConnected || serverStatus === "offline") {
		return (
			<div className="fixed bottom-4 right-4 bg-red-100 text-red-800 p-3 rounded-md shadow-md max-w-xs">
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						<WifiOff className="inline-block mr-2" size={18} />
						<span className="text-sm font-medium">Sem conexão</span>
					</div>
					<button
						onClick={handleReconnect}
						type="button"
						className="bg-red-200 hover:bg-red-300 text-red-800 text-xs px-2 py-1 rounded-md ml-2"
					>
						Reconectar
					</button>
				</div>

				<div className="mt-2 text-xs space-y-1">
					<p>O servidor de jogo parece estar offline ou inacessível.</p>
					<button onClick={() => setShowDetails(!showDetails)} type="button" className="text-red-700 underline text-xs">
						{showDetails ? "Ocultar detalhes" : "Mostrar detalhes"}
					</button>

					{showDetails && (
						<div className="mt-2 space-y-1 text-xs bg-red-50 p-2 rounded border border-red-200">
							<p>URL do servidor: {diagnosticInfo?.socketUrl || "Não disponível"}</p>
							<p>Ambiente: {diagnosticInfo?.env || "Desconhecido"}</p>
							<p>
								Última verificação:{" "}
								{diagnosticInfo?.timestamp ? new Date(diagnosticInfo.timestamp).toLocaleTimeString() : "Desconhecido"}
							</p>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="fixed bottom-4 right-4 bg-green-100 text-green-800 p-3 rounded-md shadow-md">
			<div className="flex items-center justify-between">
				<div className="flex items-center">
					<Wifi className="inline-block mr-2" size={18} />
					<span className="text-sm font-medium">Conectado</span>
				</div>
				<button
					onClick={() => setShowDetails(!showDetails)}
					type="button"
					className="bg-green-200 hover:bg-green-300 text-green-800 text-xs px-2 py-1 rounded-md ml-2"
				>
					{showDetails ? "Ocultar" : "Detalhes"}
				</button>
			</div>

			{showDetails && (
				<div className="mt-2 text-xs space-y-1 bg-green-50 p-2 rounded border border-green-200">
					<p>Método de conexão: {transport}</p>
					<p>Socket ID: {socket?.id || "Não disponível"}</p>
					<p>URL: {diagnosticInfo?.socketUrl || "Não disponível"}</p>
				</div>
			)}
		</div>
	);
}
