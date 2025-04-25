import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function generateOTP(numberOfDigits: number) {
	const digits = "0123456789";
	let OTP = "";
	const len = digits.length;
	for (let i = 0; i < numberOfDigits; i++) {
		OTP += digits[Math.floor(Math.random() * len)];
	}

	return OTP;
}

/**
 * Format time consistently for both server and client rendering
 */
export function formatTime(date = new Date()): string {
	return date.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
}

// Socket.io instance cache
let socketInstance: Socket | null = null;

// Get a singleton Socket.io instance
export function getSocketInstance(): Socket {
	if (!socketInstance) {
		socketInstance = io(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}`, {
			reconnectionAttempts: 5, // Maximum number of reconnection attempts
			reconnectionDelay: 1000, // How long to wait before reconnect (ms)
			timeout: 20000, // Connection timeout before connect_error
			transports: ["websocket", "polling"], // Use WebSocket first, fall back to polling
			forceNew: false, // Reuse existing connection
			autoConnect: true, // Connect on initialization
		});

		// Add connection event handlers
		socketInstance.on("connect", () => {
			console.log("Socket connected successfully");
		});

		socketInstance.on("connect_error", (error) => {
			console.error("Socket connection error:", error);
		});
	}
	return socketInstance;
}
