const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");
const cors = require("cors");

// Basic Configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGINS = process.env.CORS_ORIGINS
	? process.env.CORS_ORIGINS.split(",")
	: ["https://dolrath-app.vercel.app", "http://localhost:3000"]; // Added localhost for dev

console.log(`Server starting... PORT: ${PORT}, HOST: ${HOST}`);
console.log(`Allowed CORS Origins: ${CORS_ORIGINS}`);

const app = express();

// CORS Middleware
const corsOptions = {
	origin: (origin, callback) => {
		// Allow requests with no origin (like mobile apps or curl requests)
		if (!origin) return callback(null, true);
		if (CORS_ORIGINS.includes(origin)) {
			callback(null, true);
		} else {
			console.error(`CORS Error: Origin ${origin} not allowed.`);
			callback(new Error("Not allowed by CORS"));
		}
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

app.use(express.json());

// Basic Health Check Endpoint
app.get("/api/health", (req, res) => {
	try {
		res.json({
			status: "ok",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			message: "Server is healthy",
			connections: io ? io.engine.clientsCount : 0, // Check if io exists
		});
	} catch (error) {
		console.error("Health check failed:", error);
		res.status(500).json({ status: "error", message: "Health check endpoint failed" });
	}
});

// Generic Error Handler (Should be last middleware)
app.use((err, req, res, next) => {
	console.error("Unhandled Error:", err.stack || err);
	// Ensure CORS headers are set even on errors, if possible
	const origin = req.headers.origin;
	if (origin && CORS_ORIGINS.includes(origin)) {
		res.header("Access-Control-Allow-Origin", origin);
		res.header("Access-Control-Allow-Credentials", "true");
	}
	res.status(err.status || 500).json({
		error: "Internal Server Error",
		message: err.message || "An unexpected error occurred",
	});
});

const server = http.createServer(app);

// Initialize Socket.IO Server
let io;
try {
	io = new Server(server, {
		cors: corsOptions, // Reuse the same CORS options
		transports: ["websocket"], // Prefer WebSocket
		pingTimeout: 60000,
		pingInterval: 25000,
	});

	console.log("Socket.IO server initialized successfully.");

	io.on("connection", (socket) => {
		console.log(`Socket connected: ${socket.id} via ${socket.conn.transport.name}`);
		console.log(`Origin: ${socket.handshake.headers.origin}`);

		socket.on("disconnect", (reason) => {
			console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
		});

		socket.on("error", (error) => {
			console.error(`Socket error on ${socket.id}:`, error);
		});

		socket.on("connect_error", (error) => {
			console.error(`Socket connection error for ${socket.id}: ${error.message}`);
		});

		// Basic ping/pong for testing
		socket.on("ping", (data) => {
			console.log(`Ping received from ${socket.id}`);
			socket.emit("pong", { timestamp: data?.timestamp || Date.now() });
		});

		// === Basic Chat Logic ===
		socket.on("sendMessage", (messageData) => {
			// Basic validation
			if (!messageData || typeof messageData.text !== "string" || messageData.text.trim() === "") {
				console.log(`Invalid message data received from ${socket.id}:`, messageData);
				// Optionally send an error back to the sender
				// socket.emit('messageError', { message: 'Invalid message format.' });
				return;
			}

			const senderName = messageData.sender || `User_${socket.id.substring(0, 4)}`;
			const messageText = messageData.text.trim();
			const timestamp = new Date().toISOString();

			console.log(`Message from ${senderName} (${socket.id}): ${messageText}`);

			// Broadcast the message to all connected clients (including sender)
			io.emit("newMessage", {
				id: `${socket.id}-${Date.now()}`, // Simple unique ID
				sender: senderName,
				text: messageText,
				timestamp: timestamp,
			});
		});
		// === End Basic Chat Logic ===
	});
} catch (error) {
	console.error("Failed to initialize Socket.IO server:", error);
	// Handle the error appropriately, maybe exit or try to recover
}

// Start the HTTP server
server.listen(PORT, HOST, () => {
	console.log(`HTTP Server listening on http://${HOST}:${PORT}`);
	if (io) {
		console.log("Socket.IO is attached and listening for WebSocket connections.");
	} else {
		console.warn("Socket.IO failed to initialize. WebSocket connections will not work.");
	}
});

// Handle server errors
server.on("error", (error) => {
	console.error("Server error:", error);
	// Example: Handle specific listen errors with friendly messages
	if (error.syscall !== "listen") {
		throw error;
	}
	switch (error.code) {
		case "EACCES":
			console.error(`Port ${PORT} requires elevated privileges`);
			process.exit(1);
			break;
		case "EADDRINUSE":
			console.error(`Port ${PORT} is already in use`);
			process.exit(1);
			break;
		default:
			throw error;
	}
});
