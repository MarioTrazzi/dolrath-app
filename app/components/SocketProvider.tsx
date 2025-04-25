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
				const io = (await import("socket.io-client")).default;

				const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
					transports: ["websocket"],
				});

				newSocket.on("connect", () => {
					console.log("Socket connected");
					setIsConnected(true);
				});

				newSocket.on("disconnect", () => {
					console.log("Socket disconnected");
					setIsConnected(false);
				});

				setSocket(newSocket);

				return () => {
					newSocket.disconnect();
				};
			} catch (error) {
				console.error("Failed to connect socket:", error);
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
