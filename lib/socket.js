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

		// Inicializar o socket com timeout mais longo e mais tentativas de reconexão
		socket = io(socketUrl, {
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 3000,
			reconnectionDelayMax: 10000,
			timeout: 30000, // Aumentar para 30 segundos
			path: "/socket.io/",
			forceNew: false,
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

		// Adicionar event listeners para debug
		socket.on("connect", () => {
			console.log("Battle socket connected successfully");
			console.log("Battle Socket ID:", socket.id);
		});

		socket.on("connect_error", (error) => {
			console.error("Battle socket connection error:", error);
			console.log("Tentando abordagem alternativa: polling");

			// Se falhar com websocket, forçar uso de polling
			if (socket.io.engine?.transport?.name === "websocket") {
				socket.io.engine.transport.close();
			}
		});

		socket.on("disconnect", (reason) => {
			console.log("Socket desconectado. Razão:", reason);
		});
	}

	return socket;
};
