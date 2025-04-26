"use client";

import { useState, useEffect } from "react";
import { useSocket } from "../components/SocketProvider";

export default function DebugPage() {
	const { socket, isConnected } = useSocket();
	const [info, setInfo] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [messages, setMessages] = useState<string[]>([]);
	const [socketId, setSocketId] = useState<string | null>(null);

	useEffect(() => {
		// Carregar informações de debug da API
		fetch("/api/debug")
			.then((res) => res.json())
			.then((data) => {
				setInfo(data);
			})
			.catch((err) => {
				setError(`Erro ao carregar informações de debug: ${err.message}`);
			});
	}, []);

	useEffect(() => {
		if (socket) {
			// Armazenar o ID do socket quando conectado
			if (socket.id) {
				setSocketId(socket.id);
				addMessage(`Socket conectado com ID: ${socket.id}`);
			}

			// Event listeners para eventos do socket
			const onConnect = () => {
				setSocketId(socket.id);
				addMessage(`Conectado ao servidor socket com ID: ${socket.id}`);
			};

			const onDisconnect = (reason: string) => {
				addMessage(`Desconectado do servidor. Motivo: ${reason}`);
			};

			const onConnectError = (err: Error) => {
				addMessage(`Erro de conexão: ${err.message}`);
			};

			const onReconnectAttempt = (attempt: number) => {
				addMessage(`Tentativa de reconexão #${attempt}`);
			};

			const onAny = (event: string, ...args: any[]) => {
				addMessage(`Evento recebido: ${event} - Dados: ${JSON.stringify(args)}`);
			};

			// Registrar handlers
			socket.on("connect", onConnect);
			socket.on("disconnect", onDisconnect);
			socket.on("connect_error", onConnectError);
			socket.io.on("reconnect_attempt", onReconnectAttempt);
			socket.onAny(onAny);

			// Limpar handlers
			return () => {
				socket.off("connect", onConnect);
				socket.off("disconnect", onDisconnect);
				socket.off("connect_error", onConnectError);
				socket.io.off("reconnect_attempt", onReconnectAttempt);
				socket.offAny(onAny);
			};
		}
	}, [socket]);

	const addMessage = (msg: string) => {
		setMessages((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
	};

	const testConnection = () => {
		if (!socket) {
			addMessage("Socket não disponível");
			return;
		}

		addMessage("Enviando ping para o servidor...");

		// Emit a ping event and listen for pong response
		socket.emit("ping", { timestamp: Date.now() });

		// Set a timeout to check if pong was received
		const timeout = setTimeout(() => {
			addMessage("Timeout: Não recebeu resposta do servidor após 5 segundos");
		}, 5000);

		// Listen for pong response
		socket.once("pong", (data: any) => {
			clearTimeout(timeout);
			const latency = Date.now() - (data.timestamp || Date.now());
			addMessage(`Pong recebido do servidor! Latência: ${latency}ms`);
		});
	};

	return (
		<div className="p-4 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Página de Diagnóstico de Socket.io</h1>

			<div className="mb-6 p-4 border rounded bg-gray-50">
				<h2 className="text-xl font-bold mb-2">Status da Conexão</h2>
				<p className="mb-2">
					<span className="font-semibold">Estado:</span>{" "}
					<span className={isConnected ? "text-green-600" : "text-red-600"}>
						{isConnected ? "Conectado" : "Desconectado"}
					</span>
				</p>
				{socketId && (
					<p className="mb-2">
						<span className="font-semibold">Socket ID:</span> {socketId}
					</p>
				)}
				<button onClick={testConnection} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
					Testar Conexão (Ping)
				</button>
			</div>

			{info && (
				<div className="mb-6 p-4 border rounded bg-gray-50">
					<h2 className="text-xl font-bold mb-2">Informações do Ambiente</h2>
					<pre className="bg-gray-100 p-2 rounded overflow-auto max-h-64">{JSON.stringify(info, null, 2)}</pre>
				</div>
			)}

			{error && (
				<div className="mb-6 p-4 border rounded bg-red-50 text-red-700">
					<h2 className="text-xl font-bold mb-2">Erro</h2>
					<p>{error}</p>
				</div>
			)}

			<div className="mb-6">
				<h2 className="text-xl font-bold mb-2">Log de Eventos ({messages.length})</h2>
				<div className="bg-black text-green-400 p-4 rounded overflow-auto max-h-96 font-mono text-sm">
					{messages.length === 0 ? (
						<p className="text-gray-500">Nenhum evento registrado ainda...</p>
					) : (
						messages.map((msg, i) => <div key={i}>{msg}</div>)
					)}
				</div>
			</div>
		</div>
	);
}
