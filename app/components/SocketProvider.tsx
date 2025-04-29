"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Socket } from "socket.io-client";
import dynamic from "next/dynamic";

const socket: Socket | null = null;

interface SocketContextType {
	socket: Socket | null;
	isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
	socket: null,
	isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState<boolean>(false);

	useEffect(() => {
		const initSocket = async () => {
			try {
				// Use environment variable for socket URL
				const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://dolrath-socket.onrender.com"; // Default to correct URL
				console.log("Attempting to connect to socket server:", socketUrl);

				const io = (await import("socket.io-client")).default;

				// Criar a instância do socket com configuração explícita
				const newSocket = io(socketUrl, {
					transports: ["websocket", "polling"],
					reconnection: true,
					reconnectionAttempts: 10,
					reconnectionDelay: 3000,
					reconnectionDelayMax: 10000,
					timeout: 30000,
					autoConnect: true,
					forceNew: true,
					path: "/socket.io/",
					withCredentials: true,
				});

				// Verificar status do servidor antes de tentar conexão
				console.log("Verificando se o servidor está ativo...");
				fetch(`${socketUrl}/api/health`)
					.then((response) => {
						if (response.ok) {
							console.log("Servidor está ativo e respondendo!");
						} else {
							console.error("Servidor retornou status:", response.status);
						}
					})
					.catch((error) => {
						console.error("Não foi possível verificar status do servidor:", error.message);
					});

				// Log para debugar a URL que está sendo usada
				console.log("Detalhes da conexão:", {
					url: socketUrl,
					path: "/socket.io/",
					engine: newSocket.io?.engine?.transport?.name,
				});

				newSocket.on("connect", () => {
					console.log("Socket conectado com sucesso usando:", newSocket.io.engine.transport.name);
					console.log("Socket ID:", newSocket.id);
					console.log("URL usada:", socketUrl);
					setIsConnected(true);
				});

				newSocket.on("connect_error", (err) => {
					console.error("Erro na conexão socket:", err.message);
					console.error("Detalhes completos:", err);
					setIsConnected(false);

					// Verificar se o erro é de timeout
					if (err.message === "timeout") {
						console.log("Timeout detectado, tentando abordagem alternativa: polling");

						// Se falhar com websocket, forçar uso de polling
						if (newSocket.io.engine?.transport?.name === "websocket") {
							newSocket.io.engine.transport.close();
						}
					}
				});

				newSocket.on("disconnect", (reason) => {
					console.log("Socket desconectado. Razão:", reason);
					setIsConnected(false);
				});

				newSocket.io.on("reconnect_attempt", (attempt) => {
					console.log(`Tentativa de reconexão #${attempt}`);
				});

				newSocket.io.on("reconnect", (attempt) => {
					console.log(`Reconectado após ${attempt} tentativas`);
				});

				newSocket.on("error", (error) => {
					console.error("Erro no socket:", error);
				});

				setSocket(newSocket);

				return () => {
					console.log("Limpando conexão socket...");
					newSocket.disconnect();
				};
			} catch (error) {
				console.error("Falha ao conectar socket:", error);
			}
		};

		const cleanup = initSocket();
		return () => {
			cleanup.then((cleanupFn) => cleanupFn?.());
		};
	}, []);

	return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};

export default dynamic(() => Promise.resolve(SocketProvider), {
	ssr: false,
});
