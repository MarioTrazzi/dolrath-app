"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type React from "react"; // Use type import for React
import { useSocket } from "@/app/components/SocketProvider"; // Corrected path
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"; // Corrected path (assuming standard location)
import { Send } from "lucide-react";

interface ChatMessage {
	id: string;
	sender: string;
	text: string;
	timestamp: string;
}

export function ChatInterface() {
	const { socket, isConnected } = useSocket();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [username, setUsername] = useState("Guest"); // Simple username state for now
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	// Function to scroll to the bottom of the chat messages
	const scrollToBottom = useCallback(() => {
		if (scrollAreaRef.current) {
			const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
			if (scrollElement) {
				scrollElement.scrollTop = scrollElement.scrollHeight;
			}
		}
	}, []);

	useEffect(() => {
		// Initialize username (e.g., from local storage or prompt)
		const storedUsername = localStorage.getItem("chatUsername");
		if (storedUsername) {
			setUsername(storedUsername);
		} else {
			// Simple prompt for demo, replace with better UI later
			const name = prompt("Enter your chat name:", "Guest");
			const finalName = name || "Guest";
			setUsername(finalName);
			localStorage.setItem("chatUsername", finalName);
		}
	}, []);

	useEffect(() => {
		if (!socket) return;

		const handleNewMessage = (message: ChatMessage) => {
			setMessages((prevMessages) => [...prevMessages, message]);
		};

		console.log("ChatInterface: Setting up newMessage listener");
		socket.on("newMessage", handleNewMessage);

		// Clean up the listener when the component unmounts or socket changes
		return () => {
			console.log("ChatInterface: Removing newMessage listener");
			socket.off("newMessage", handleNewMessage);
		};
	}, [socket]);

	// Scroll to bottom when messages change
	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(event.target.value);
	};

	const handleSendMessage = () => {
		if (inputValue.trim() !== "" && socket && isConnected) {
			const messageData = {
				sender: username,
				text: inputValue.trim(),
			};
			console.log("Sending message:", messageData);
			socket.emit("sendMessage", messageData);
			setInputValue(""); // Clear input after sending
		} else if (!isConnected) {
			console.error("Cannot send message: Socket not connected.");
			// Optionally show a user-facing error
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault(); // Prevent newline in input
			handleSendMessage();
		}
	};

	const formatTimestamp = (timestamp: string) => {
		try {
			return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
		} catch (e) {
			return "Invalid Date";
		}
	};

	return (
		<div className="flex flex-col h-[calc(100vh-100px)] w-full max-w-3xl mx-auto border rounded-lg shadow-md">
			{/* Header with connection status */}
			<div className="p-3 border-b bg-muted/40 text-sm font-medium">
				Global Chat - Status:{" "}
				{isConnected ? (
					<span className="text-green-600">Connected</span>
				) : (
					<span className="text-red-600">Disconnected</span>
				)}
			</div>

			{/* Message Area */}
			<ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
				<div className="space-y-3">
					{messages.length === 0 && (
						<p className="text-center text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
					)}
					{messages.map((msg) => (
						<div key={msg.id} className="flex flex-col items-start text-sm">
							<div>
								<span className="font-semibold">{msg.sender}</span>
								<span className="text-xs text-muted-foreground ml-2">{formatTimestamp(msg.timestamp)}</span>
							</div>
							<p className="bg-secondary rounded-lg px-3 py-1 mt-1 max-w-xs break-words">{msg.text}</p>
						</div>
					))}
				</div>
			</ScrollArea>

			{/* Input Area */}
			<div className="p-4 border-t bg-background">
				<div className="flex items-center space-x-2">
					<Input
						type="text"
						placeholder={isConnected ? "Type your message..." : "Connecting..."}
						value={inputValue}
						onChange={handleInputChange}
						onKeyPress={handleKeyPress}
						disabled={!isConnected}
						className="flex-1"
					/>
					<Button
						type="button"
						onClick={handleSendMessage}
						disabled={!isConnected || inputValue.trim() === ""}
						size="icon"
					>
						<Send className="h-4 w-4" />
						<span className="sr-only">Send</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
