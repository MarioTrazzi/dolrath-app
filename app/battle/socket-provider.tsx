"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSocketInstance } from "@/lib/socket";

// Criar um contexto para o socket
const SocketContext = createContext<any>(null);

// Provider que encapsula a lógica do socket para ser usado nos componentes
export function SocketProvider({ children }: { children: React.ReactNode }) {
	const [socket, setSocket] = useState<any>(null);

	useEffect(() => {
		// Inicializar o socket apenas no lado do cliente
		const socketInstance = getSocketInstance();
		setSocket(socketInstance);

		// Limpeza ao desmontar
		return () => {
			if (socketInstance && socketInstance.connected) {
				socketInstance.disconnect();
			}
		};
	}, []);

	return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

// Hook para acessar o socket
export function useSocket() {
	const socket = useContext(SocketContext);
	return socket;
}
