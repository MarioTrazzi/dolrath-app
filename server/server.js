const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Configuração de CORS
const CORS_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : "*";
console.log(`CORS configured for origins: ${CORS_ORIGINS}`);

const app = express();
app.use(
	cors({
		origin: CORS_ORIGINS,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		credentials: true,
	}),
);
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: CORS_ORIGINS,
		methods: ["GET", "POST"],
		credentials: true,
	},
	allowEIO3: true,
	transports: ["websocket", "polling"],
	pingTimeout: 60000,
	pingInterval: 25000,
});

// Adicionar logs de inicialização
console.log(`Server starting...`);
console.log(`__dirname: ${__dirname}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

// Path to rooms data file
const roomsFilePath = path.join(__dirname, "rooms.json");
console.log(`Rooms file path: ${roomsFilePath}`);

// Function to ensure directories exist
function ensureDirectoryExists(filePath) {
	const dirname = path.dirname(filePath);
	if (fs.existsSync(dirname)) {
		return true;
	}
	fs.mkdirSync(dirname, { recursive: true });
	return true;
}

// Function to load rooms data
function loadRooms() {
	try {
		ensureDirectoryExists(roomsFilePath);

		// Verificar se o arquivo existe
		if (!fs.existsSync(roomsFilePath)) {
			// Se não existir, criar um arquivo vazio com estrutura inicial
			fs.writeFileSync(roomsFilePath, JSON.stringify({ rooms: [] }, null, 2), "utf8");
			console.log(`Created new empty rooms file at ${roomsFilePath}`);
			return { rooms: [] };
		}

		const data = fs.readFileSync(roomsFilePath, "utf8");
		return JSON.parse(data);
	} catch (error) {
		console.error("Error reading rooms file:", error);
		// Retornar um objeto vazio em caso de erro
		return { rooms: [] };
	}
}

// Function to save rooms data
function saveRooms(roomsData) {
	try {
		ensureDirectoryExists(roomsFilePath);
		fs.writeFileSync(roomsFilePath, JSON.stringify(roomsData, null, 2), "utf8");
	} catch (error) {
		console.error("Error writing rooms file:", error);
	}
}

// In-memory store for active rooms
const activeRooms = {};

// Initialize rooms from file
const roomsData = loadRooms();
roomsData.rooms.forEach((room) => {
	activeRooms[room.id] = {
		...room,
		players: [],
		gameState: "waiting",
		started: false,
	};
});

// API endpoint to check if a room exists
app.get("/api/rooms/:roomId", (req, res) => {
	const roomId = req.params.roomId.toUpperCase();
	console.log(`Verificando existência da sala: ${roomId}`);

	if (activeRooms[roomId]) {
		console.log(`Sala ${roomId} encontrada com ${activeRooms[roomId].players.length} jogadores`);
		res.json({ exists: true, players: activeRooms[roomId].players.length });
	} else {
		console.log(`Sala ${roomId} NÃO encontrada`);
		res.json({ exists: false });
	}
});

// API endpoint to create a new room
app.post("/api/rooms", (req, res) => {
	const characterId = req.body?.characterId;
	let customRoomId = req.body?.customRoomId;

	// Normalizar o ID da sala para maiúsculas
	if (customRoomId) {
		customRoomId = customRoomId.toUpperCase();
	}

	console.log(`Tentativa de criar sala. ID personalizado: ${customRoomId || "não fornecido"}`);

	// Check if custom room ID is provided and already exists
	if (customRoomId && activeRooms[customRoomId]) {
		console.log(`Sala ${customRoomId} já existe. Rejeitando criação.`);
		return res.status(400).json({
			error: "Sala com este ID já existe. Escolha outro ID ou entre na sala existente.",
		});
	}

	const roomId = customRoomId || generateRoomCode();
	const timestamp = new Date().toISOString();

	// Criar nova sala
	activeRooms[roomId] = {
		id: roomId,
		created: timestamp,
		creatorCharacterId: characterId,
		players: [],
		gameState: "waiting",
		started: false,
		battleHistory: [],
	};

	// Add to persistent storage
	const roomsData = loadRooms();
	roomsData.rooms.push({
		id: roomId,
		created: timestamp,
		creatorCharacterId: characterId,
	});
	saveRooms(roomsData);

	console.log(`Sala ${roomId} criada com sucesso`);
	res.json({ roomId, created: timestamp });
});

// API endpoint to record battle events to history
app.post("/api/battles/record", (req, res) => {
	const { roomId, characterId, eventType, eventData, timestamp } = req.body;

	if (!roomId || !characterId || !eventType) {
		return res.status(400).json({ error: "Missing required fields" });
	}

	// Add to room's battle history
	if (activeRooms[roomId]) {
		const eventRecord = {
			id: Date.now().toString(),
			characterId,
			eventType,
			eventData,
			timestamp,
		};

		activeRooms[roomId].battleHistory.push(eventRecord);

		// Also save to character's battle history file
		saveCharacterBattleHistory(characterId, roomId, eventRecord);

		return res.json({ success: true, eventId: eventRecord.id });
	} else {
		return res.status(404).json({ error: "Room not found" });
	}
});

// Function to save character battle history
function saveCharacterBattleHistory(characterId, roomId, eventRecord) {
	try {
		const battleHistoryDir = path.join(__dirname, "battle-history");
		ensureDirectoryExists(battleHistoryDir);

		const characterHistoryPath = path.join(battleHistoryDir, `${characterId}.json`);
		let historyData = { battles: {} };

		// Load existing data if file exists
		if (fs.existsSync(characterHistoryPath)) {
			const fileData = fs.readFileSync(characterHistoryPath, "utf8");
			historyData = JSON.parse(fileData);
		}

		// Initialize battle record if it doesn't exist
		if (!historyData.battles[roomId]) {
			historyData.battles[roomId] = {
				roomId,
				startTime: eventRecord.timestamp,
				events: [],
			};
		}

		// Add event to battle history
		historyData.battles[roomId].events.push(eventRecord);

		// Save updated history
		fs.writeFileSync(characterHistoryPath, JSON.stringify(historyData, null, 2), "utf8");
	} catch (error) {
		console.error(`Error saving battle history for character ${characterId}:`, error);
	}
}

// Health check endpoint
app.get("/api/health", (req, res) => {
	res.json({
		status: "ok",
		uptime: process.uptime(),
		timestamp: Date.now(),
		connections: Object.keys(io.sockets.sockets).length,
	});
});

io.on("connection", (socket) => {
	const transport = socket.conn.transport.name; // websocket ou polling
	console.log(`Novo cliente conectado [${socket.id}] usando ${transport}`);

	socket.conn.on("upgrade", (newTransport) => {
		console.log(`Cliente ${socket.id} alterou transporte de ${transport} para ${newTransport}`);
	});

	console.log("User connected:", socket.id);

	socket.on("createRoom", ({ playerName }) => {
		const roomCode = generateRoomCode().toUpperCase();
		socket.join(roomCode);

		activeRooms[roomCode] = {
			id: roomCode,
			host: socket.id,
			created: new Date().toISOString(),
			players: [
				{
					id: socket.id,
					name: playerName,
					isHost: true,
				},
			],
			gameState: "waiting",
			started: false,
		};

		socket.emit("roomCreated", {
			roomCode,
			isHost: true,
			players: activeRooms[roomCode].players,
		});

		// Add to persistent storage
		const roomsData = loadRooms();
		roomsData.rooms.push({
			id: roomCode,
			created: new Date().toISOString(),
		});
		saveRooms(roomsData);

		console.log(`Room created: ${roomCode} by ${playerName}`);
	});

	socket.on("joinRoom", ({ roomId, playerName, isHost, characterId, characterClass }) => {
		// Normalizar o ID da sala para maiúsculas
		const normalizedRoomId = roomId.toUpperCase();
		console.log(
			`Tentativa de entrar na sala: ${normalizedRoomId}. Jogador: ${playerName}, CharacterId: ${characterId || "não fornecido"}`,
		);

		if (!activeRooms[normalizedRoomId]) {
			console.log(`Sala ${normalizedRoomId} não encontrada`);
			socket.emit("error", { message: "Room not found" });
			return;
		}

		if (activeRooms[normalizedRoomId].started && !isHost) {
			console.log(`Sala ${normalizedRoomId} já iniciou. Acesso negado para jogador não host.`);
			socket.emit("error", { message: "Game already started" });
			return;
		}

		// Verificação mais robusta para identificar jogadores
		// Considerar tanto characterId quanto nome do jogador
		const existingPlayerByCharacter = characterId
			? activeRooms[normalizedRoomId].players.findIndex((p) => p.characterId === characterId)
			: -1;

		const existingPlayerByName = activeRooms[normalizedRoomId].players.findIndex((p) => p.name === playerName);

		const existingPlayerIndex = existingPlayerByCharacter !== -1 ? existingPlayerByCharacter : existingPlayerByName;

		console.log(
			`Checking if player exists: name=${playerName}, characterId=${characterId}, existingIndex=${existingPlayerIndex}`,
		);

		if (existingPlayerIndex !== -1) {
			// Se o personagem já existe mas com socket diferente, atualizar o socket
			if (activeRooms[normalizedRoomId].players[existingPlayerIndex].id !== socket.id) {
				console.log(`Player ${playerName} (${characterId}) reconnected with new socket id`);
				activeRooms[normalizedRoomId].players[existingPlayerIndex].id = socket.id;
			}

			// Juntar o jogador ao socket.io room
			socket.join(normalizedRoomId);

			// Emitir evento de sucesso para o jogador reconectado
			socket.emit("roomJoined", {
				roomId: normalizedRoomId,
				isHost: activeRooms[normalizedRoomId].players[existingPlayerIndex].isHost,
				players: activeRooms[normalizedRoomId].players,
			});

			console.log(`${playerName} (${characterId}) reconnected to room: ${normalizedRoomId}`);
			return;
		}

		// Se chegou aqui, o personagem é novo
		socket.join(normalizedRoomId);

		const playerInfo = {
			id: socket.id,
			name: playerName,
			characterId: characterId || null,
			characterClass: characterClass || null,
			isHost: isHost === true,
		};

		// If isHost is true and there's no host yet, set this player as host
		if (isHost && !activeRooms[normalizedRoomId].host) {
			activeRooms[normalizedRoomId].host = socket.id;
		}

		activeRooms[normalizedRoomId].players.push(playerInfo);

		console.log(`Adding new player to room ${normalizedRoomId}:`, playerInfo);

		// Notificar outros jogadores que um novo jogador entrou
		io.to(normalizedRoomId).emit("playerJoined", {
			playerName,
			playerInfo,
		});

		// Notificar o jogador que entrou com sucesso
		socket.emit("roomJoined", {
			roomId: normalizedRoomId,
			isHost: playerInfo.isHost,
			players: activeRooms[normalizedRoomId].players,
		});

		console.log(`${playerName} (${characterId}) joined room: ${normalizedRoomId}`);
	});

	socket.on("startGame", ({ roomId, initialGameState }) => {
		if (!activeRooms[roomId]) return;

		activeRooms[roomId].started = true;
		activeRooms[roomId].gameState = initialGameState || "rolling_initiative";

		io.to(roomId).emit("gameStarted", activeRooms[roomId].gameState);
		console.log(`Game started in room: ${roomId}`);
	});

	socket.on("updateGameState", ({ roomId, gameState, playerInitiative, currentTurn }) => {
		if (!activeRooms[roomId]) return;

		// Atualizar o estado do jogo na sala
		activeRooms[roomId].gameState = gameState;

		// Se temos uma atualização de iniciativa, atualizar jogador
		if (playerInitiative) {
			const playerIndex = activeRooms[roomId].players.findIndex((p) => p.name === playerInitiative.name);

			if (playerIndex !== -1) {
				// Adicionar iniciativa ao jogador
				activeRooms[roomId].players[playerIndex].initiative = playerInitiative.initiative;
			}
		}

		// Se estamos atualizando o turno atual
		if (currentTurn) {
			activeRooms[roomId].currentTurn = currentTurn;
		}

		// Emitir atualização para todos os clientes na sala (modificado para io.to)
		io.to(roomId).emit("gameStateUpdated", {
			gameState,
			playerInitiative,
			currentTurn,
		});
	});

	socket.on("chatMessage", ({ roomId, message }) => {
		if (!activeRooms[roomId]) return;

		// Emitir mensagem para todos os clientes na sala
		io.to(roomId).emit("messageReceived", {
			sender: message.sender,
			text: message.text,
			time: new Date().toLocaleTimeString(),
		});
	});

	socket.on("narrationMessage", ({ roomId, message }) => {
		if (!activeRooms[roomId]) return;

		io.to(roomId).emit("narrationReceived", message);
	});

	socket.on("rollDice", ({ roomId, playerName, faces, result, gameState, isDefender }) => {
		if (!activeRooms[roomId]) return;

		io.to(roomId).emit("diceRolled", {
			playerName,
			faces,
			result,
			gameState,
			isDefender,
		});
	});

	socket.on(
		"performAction",
		({
			roomId,
			playerName,
			actionType,
			currentTurn,
			gameState,
			attackRoll,
			itemName,
			hpRestored,
			message,
			player1,
			player2,
		}) => {
			if (!activeRooms[roomId]) return;

			// Criar um objeto com os dados da ação para enviar a todos os clientes
			const actionData = {
				playerName,
				actionType,
				currentTurn,
				gameState,
				message,
				timestamp: new Date().toISOString(),
			};

			// Adicionar dados específicos dependendo do tipo de ação
			if (actionType === "attack") {
				actionData.attackRoll = attackRoll;

				// Encontrar o oponente (para implementação futura)
				// actionData.targetPlayer = findOpponent(roomId, playerName);
			} else if (actionType === "use_item") {
				actionData.itemName = itemName;
				actionData.hpRestored = hpRestored;
			}

			// Atualizar o estado da sala
			if (gameState) {
				activeRooms[roomId].gameState = gameState;
			}

			// Emitir ação para todos os outros clientes na sala
			socket.to(roomId).emit("actionPerformed", actionData);

			// Registrar ação no histórico de batalha da sala
			if (activeRooms[roomId].battleHistory) {
				activeRooms[roomId].battleHistory.push({
					id: Date.now().toString(),
					type: "action",
					data: actionData,
				});
			}
		},
	);

	socket.on("chooseDefense", ({ roomId, defenderName, defenseType, gameState, message }) => {
		if (!activeRooms[roomId]) return;

		socket.to(roomId).emit("defenseChosen", {
			defenderName,
			defenseType,
			gameState,
			message,
		});

		// Update game state
		activeRooms[roomId].gameState = gameState;
	});

	socket.on("combatResult", ({ roomId, attackRoll, defenseRoll, player1, player2, gameState, currentTurn }) => {
		if (!activeRooms[roomId]) return;

		socket.to(roomId).emit("combatResolved", {
			attackRoll,
			defenseRoll,
			player1,
			player2,
			gameState,
			currentTurn,
		});

		// Update game state
		activeRooms[roomId].gameState = gameState;
	});

	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);

		// Remove player from all rooms they were in
		for (const roomId in activeRooms) {
			const room = activeRooms[roomId];
			const playerIndex = room.players.findIndex((p) => p.id === socket.id);

			if (playerIndex !== -1) {
				const player = room.players[playerIndex];
				room.players.splice(playerIndex, 1);

				if (room.players.length === 0) {
					// Delete room if empty
					delete activeRooms[roomId];
					console.log(`Room ${roomId} deleted (empty)`);
				} else if (player.isHost) {
					// Assign new host if the host left
					room.players[0].isHost = true;
					room.host = room.players[0].id;

					io.to(roomId).emit("hostChanged", {
						newHost: room.players[0],
						players: room.players,
					});
				}

				io.to(roomId).emit("playerLeft", {
					playerName: player.name,
					players: room.players.map((p) => p.name),
				});
			}
		}
	});
});

function generateRoomCode() {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let code = "";
	for (let i = 0; i < 6; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	console.log(`Código de sala gerado: ${code}`);
	return code;
}

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => {
	console.log(`Server is running on http://${HOST}:${PORT}`);
	console.log(`Health check available at http://${HOST}:${PORT}/api/health`);
});
