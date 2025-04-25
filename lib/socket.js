let socket;

export const getSocketInstance = () => {
	// Verificar se estamos no ambiente do navegador
	if (typeof window === "undefined") {
		return null;
	}

	if (!socket) {
		// Importação dinâmica do socket.io-client
		const io = require("socket.io-client");

		// Inicializar o socket
		socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		// Adicionar event listeners para debug
		socket.on("connect", () => {
			console.log("Socket connected successfully");
		});

		socket.on("connect_error", (error) => {
			console.error("Socket connection error:", error);
		});
	}

	return socket;
};
