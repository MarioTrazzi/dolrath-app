"use client";

import { useSocket } from "./SocketProvider";
import { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";

export default function ConnectionStatus() {
	const { socket, isConnected } = useSocket();
	const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
	const [showDetails, setShowDetails] = useState(false);
	const [transport, setTransport] = useState<string>("");

	useEffect(() => {
		// Verificar o status do servidor
		const checkServerStatus = async () => {
			try {
				const response = await fetch("/api/server-health");
				if (response.ok) {
					setServerStatus("online");
				} else {
					setServerStatus("offline");
				}
			} catch (error) {
				setServerStatus("offline");
			}
		};

		checkServerStatus();
		const interval = setInterval(checkServerStatus, 30000); // Verificar a cada 30 segundos

		return () => clearInterval(interval);
	}, []);

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
			<div
				className="fixed bottom-4 right-4 bg-red-100 text-red-800 p-2 rounded-md shadow-md cursor-pointer"
				onClick={() => setShowDetails(!showDetails)}
				onKeyDown={(e) => e.key === "Enter" && setShowDetails(!showDetails)}
				role="button"
				tabIndex={0}
			>
				<WifiOff className="inline-block mr-1" size={16} />
				<span className="text-sm">Sem conexão com o servidor</span>

				{showDetails && (
					<div className="mt-2 text-xs">
						<p>Problemas de conexão podem impedir que você jogue adequadamente.</p>
						<p>Tente recarregar a página ou verificar sua conexão com a internet.</p>
					</div>
				)}
			</div>
		);
	}

	return (
		<div
			className="fixed bottom-4 right-4 bg-green-100 text-green-800 p-2 rounded-md shadow-md cursor-pointer"
			onClick={() => setShowDetails(!showDetails)}
			onKeyDown={(e) => e.key === "Enter" && setShowDetails(!showDetails)}
			role="button"
			tabIndex={0}
		>
			<Wifi className="inline-block mr-1" size={16} />
			<span className="text-sm">Conectado ao servidor</span>

			{showDetails && (
				<div className="mt-2 text-xs">
					<p>Método de conexão: {transport}</p>
				</div>
			)}
		</div>
	);
}
