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
				const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
				console.log("Tentando conectar ao servidor socket:", socketUrl);

				const io = (await import("socket.io-client")).default;

				// Ajustar protocolo automaticamente baseado em HTTPS
				let socketUrlWithProtocol = socketUrl;
				if (typeof window !== "undefined") {
					// Se estamos no navegador e a página está em HTTPS, garante que o socket usa SSL
					if (window.location.protocol === "https:" && socketUrlWithProtocol.startsWith("http:")) {
						socketUrlWithProtocol = socketUrlWithProtocol.replace("http:", "https:");
						console.log("Protocolo ajustado para HTTPS:", socketUrlWithProtocol);
					}
				}

				const newSocket = io(socketUrlWithProtocol, {
					transports: ["websocket", "polling"],
					reconnection: true,
					reconnectionAttempts: 5,
					reconnectionDelay: 1000,
					timeout: 20000,
					forceNew: true, // Forçar uma nova conexão
				});

				newSocket.on("connect", () => {
					console.log("Socket conectado com sucesso usando:", newSocket.io.engine.transport.name);
					console.log("Socket ID:", newSocket.id);
					setIsConnected(true);
				});

				newSocket.on("connect_error", (err) => {
					console.error("Erro na conexão socket:", err.message);
					console.error("Detalhes completos:", err);
					setIsConnected(false);
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
