const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");
const cors = require("cors");

// Basic Configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGINS = process.env.CORS_ORIGINS
	? process.env.CORS_ORIGINS.split(",")
	: ["https://dolrath-app.vercel.app"]; // Added localhost for dev

console.log(`Server starting... PORT: ${PORT}, HOST: ${HOST}`);
console.log("Allowed CORS Origins:", CORS_ORIGINS);

const app = express();

// CORS configuration
const corsOptions = {
	origin: (origin, callback) => {
		// Allow requests with no origin (like mobile apps, curl requests, or WebSocket upgrade)
		if (!origin) {
			console.log("Request with no origin allowed");
			return callback(null, true);
		}
		if (CORS_ORIGINS.indexOf(origin) !== -1) {
			console.log(`CORS: Origin ${origin} allowed`);
			callback(null, true);
		} else {
			console.error(`CORS Error: Origin ${origin} not allowed`);
			callback(null, false);
		}
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests
app.options("*", cors(corsOptions));

// Middleware to manually set CORS headers (as a backup)
app.use((req, res, next) => {
	const origin = req.headers.origin;
	if (origin && CORS_ORIGINS.includes(origin)) {
		res.header("Access-Control-Allow-Origin", origin);
		res.header("Access-Control-Allow-Credentials", "true");
	}
	next();
});

app.use(express.json());

// Health check endpoints
app.get("/health", (req, res) => {
	console.log("Health check requested from:", req.headers.origin || "unknown");
	res.json({ status: "ok" });
});

app.get("/api/health", (req, res) => {
	console.log("API health check requested from:", req.headers.origin || "unknown");
	res.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		message: "Server is healthy",
	});
});

// Error handler
app.use((err, req, res, next) => {
	console.error("Server error:", err);
	const origin = req.headers.origin;
	if (origin && CORS_ORIGINS.includes(origin)) {
		res.header("Access-Control-Allow-Origin", origin);
		res.header("Access-Control-Allow-Credentials", "true");
	}
	res.status(500).json({ error: err.message || "Server error" });
});

// Create HTTP server
const server = http.createServer(app);

// In-memory store for connected players
const connectedPlayers = {};

// Function to broadcast player list updates
function broadcastPlayerList(ioInstance) {
	const playerList = Object.values(connectedPlayers).map((player) => ({
		id: player.id,
		username: player.characterName,
		characterId: player.characterId,
	}));
	ioInstance.emit("updatePlayerList", playerList);
	console.log("Broadcasting player list:", playerList.length, "players");
}

// Initialize Socket.IO
let io;
try {
	io = new Server(server, {
		cors: {
			origin: CORS_ORIGINS,
			methods: ["GET", "POST"],
			credentials: true,
		},
		transports: ["polling", "websocket"], // Allow both transports
		pingTimeout: 60000,
		pingInterval: 25000,
	});

	console.log("Socket.IO server initialized successfully");

	// Socket.IO connection handler
	io.on("connection", (socket) => {
		console.log(`Socket connected: ${socket.id} via ${socket.conn.transport.name}`);
		console.log(`Origin: ${socket.handshake.headers.origin || "unknown"}`);

		// Handler for user identification (expects character info)
		socket.on("identifyUser", (userData) => {
			// Validate incoming data
			if (userData?.characterId && userData?.characterName) {
				console.log(
					`User identified: ${socket.id} as Character ${userData.characterName} (ID: ${userData.characterId})`,
				);
				connectedPlayers[socket.id] = {
					id: socket.id,
					characterId: userData.characterId,
					characterName: userData.characterName,
				};
				// Send updated list to everyone
				broadcastPlayerList(io);
			} else {
				console.log(`Invalid character identification data from ${socket.id}:`, userData);
				// socket.disconnect(true);
			}
		});

		socket.on("disconnect", (reason) => {
			console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
			// Remove player from list if they were identified
			if (connectedPlayers[socket.id]) {
				console.log(`Character ${connectedPlayers[socket.id].characterName} disconnected.`);
				delete connectedPlayers[socket.id];
				// Send updated list to everyone
				broadcastPlayerList(io);
			}
		});

		socket.on("error", (error) => {
			console.error(`Socket error on ${socket.id}:`, error);
		});

		// Basic ping/pong for testing
		socket.on("ping", (data) => {
			console.log(`Ping received from ${socket.id}`);
			socket.emit("pong", { timestamp: data?.timestamp || Date.now() });
		});

		// Chat message handling
		socket.on("sendMessage", (messageData) => {
			// Ensure sender is identified
			const senderInfo = connectedPlayers[socket.id];
			if (!senderInfo) {
				console.log(`Message rejected from unidentified socket ${socket.id}`);
				return;
			}

			// Validate message text
			if (!messageData || typeof messageData.text !== "string" || messageData.text.trim() === "") {
				console.log(`Invalid message data received from ${socket.id}:`, messageData);
				return;
			}

			// Use identified character name
			const senderName = senderInfo.characterName;
			const messageText = messageData.text.trim();
			const timestamp = new Date().toISOString();

			console.log(`Message from ${senderName} (${socket.id}): ${messageText}`);

			// Broadcast the message to all connected clients
			io.emit("newMessage", {
				id: `${socket.id}-${Date.now()}`,
				sender: senderName,
				text: messageText,
				timestamp: timestamp,
			});
		});
	});
} catch (error) {
	console.error("Failed to initialize Socket.IO:", error);
}

// Start the server
server.listen(PORT, HOST, () => {
	console.log(`Server listening on http://${HOST}:${PORT}`);
	console.log(`CORS enabled for origins: ${CORS_ORIGINS.join(", ")}`);
	if (io) {
		console.log("Socket.IO ready for connections");
	}
});

// Handle server errors
server.on("error", (error) => {
	console.error("Server error:", error);
});
