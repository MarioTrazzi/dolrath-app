let socket;

export const getSocketInstance = () => {
	// Verificar se estamos no ambiente do navegador
	if (typeof window === "undefined") {
		return null;
	}

	if (!socket) {
		// Importação dinâmica do socket.io-client
		const io = require("socket.io-client");

		// URL fixa para o servidor de socket
		const socketUrl = "https://dolrath-app.onrender.com";
		console.log("Inicializando conexão battle socket para:", socketUrl);

		// Inicializar o socket
		socket = io(socketUrl, {
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			path: "/socket.io/",
			forceNew: false, // Importante: não crie uma nova conexão se já existir uma
		});

		// Adicionar event listeners para debug
		socket.on("connect", () => {
			console.log("Battle socket connected successfully");
			console.log("Battle Socket ID:", socket.id);
		});

		socket.on("connect_error", (error) => {
			console.error("Battle socket connection error:", error);
		});
	}

	return socket;
};
