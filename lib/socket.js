import { io } from "socket.io-client";

let socket;

export const getSocketInstance = () => {
	if (!socket) {
		socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});
	}
	return socket;
};
