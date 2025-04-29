"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

interface ChatMessage {
	id: string;
	sender: string;
	text: string;
	timestamp: string;
}

interface ConnectedPlayer {
	id: string;
	username: string;
}

export function ChatInterface() {
	const { socket, isConnected } = useSocket();
	const { data: session, status: sessionStatus } = useSession(); // Get session status
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [connectedPlayers, setConnectedPlayers] = useState<ConnectedPlayer[]>([]);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const hasIdentified = useRef(false); // Track if identifyUser has been sent

	// Function to scroll to the bottom of the chat messages
	const scrollToBottom = useCallback(() => {
		if (scrollAreaRef.current) {
			const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
			if (scrollElement) {
				scrollElement.scrollTop = scrollElement.scrollHeight;
			}
		}
	}, []);

	// Effect to identify user once connected and session is loaded
	useEffect(() => {
		if (isConnected && socket && sessionStatus === "authenticated" && session?.user?.name && !hasIdentified.current) {
			console.log("Identifying user to server:", session.user.name);
			socket.emit("identifyUser", { username: session.user.name });
			hasIdentified.current = true; // Mark as identified
		}
	}, [isConnected, socket, sessionStatus, session, hasIdentified]);

	// Effect to reset identified flag on disconnect
	useEffect(() => {
		if (!isConnected) {
			hasIdentified.current = false;
		}
	}, [isConnected]);

	// Effect to handle incoming messages and player list updates
	useEffect(() => {
		if (!socket) return;

		const handleNewMessage = (message: ChatMessage) => {
			setMessages((prevMessages) => [...prevMessages, message]);
		};

		const handlePlayerListUpdate = (playerList: ConnectedPlayer[]) => {
			console.log("Received player list update:", playerList);
			setConnectedPlayers(playerList);
		};

		console.log("ChatInterface: Setting up listeners");
		socket.on("newMessage", handleNewMessage);
		socket.on("updatePlayerList", handlePlayerListUpdate);

		// Clean up listeners
		return () => {
			console.log("ChatInterface: Removing listeners");
			socket.off("newMessage", handleNewMessage);
			socket.off("updatePlayerList", handlePlayerListUpdate);
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
		// Ensure user is identified before sending (check session status)
		if (inputValue.trim() !== "" && socket && isConnected && sessionStatus === "authenticated") {
			const messageData = {
				// Sender is now implicitly known by the server via identifyUser
				text: inputValue.trim(),
			};
			console.log("Sending message:", messageData);
			socket.emit("sendMessage", messageData);
			setInputValue("");
		} else if (!isConnected) {
			console.error("Cannot send message: Socket not connected.");
		} else if (sessionStatus !== "authenticated") {
			console.error("Cannot send message: User not authenticated or identified.");
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
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

	// Loading state while session is loading
	if (sessionStatus === "loading") {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-100px)]">
				<Skeleton className="h-12 w-1/2" />
			</div>
		);
	}

	// Message if user is not authenticated
	if (sessionStatus !== "authenticated") {
		return (
			<div className="flex flex-col justify-center items-center h-[calc(100vh-100px)] text-center">
				<h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
				<p className="text-muted-foreground">Please log in to access the chat.</p>
				{/* Optionally add a login button here */}
			</div>
		);
	}

	// Main chat interface rendering
	return (
		<div className="flex h-[calc(100vh-100px)] w-full max-w-4xl mx-auto border rounded-lg shadow-md overflow-hidden">
			{/* Player List Sidebar */}
			<div className="w-1/4 border-r bg-muted/40 flex flex-col">
				<div className="p-3 border-b font-medium text-sm flex items-center">
					<Users className="h-4 w-4 mr-2" /> Connected Players ({connectedPlayers.length})
				</div>
				<ScrollArea className="flex-1 p-2">
					{connectedPlayers.length === 0 && (
						<p className="text-xs text-muted-foreground p-2">No one else is here yet.</p>
					)}
					<ul className="space-y-1">
						{connectedPlayers.map((player) => (
							<li key={player.id} className="text-sm p-1 rounded hover:bg-accent truncate">
								{player.username}
								{player.id === socket?.id && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
							</li>
						))}
					</ul>
				</ScrollArea>
			</div>

			{/* Main Chat Area */}
			<div className="flex flex-col flex-1">
				{/* Header */}
				<div className="p-3 border-b bg-muted/40 text-sm font-medium text-center">
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
							<p className="text-center text-muted-foreground text-sm">Welcome! Send a message to start.</p>
						)}
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex flex-col text-sm ${msg.sender === session?.user?.name ? "items-end" : "items-start"}`}
							>
								<div>
									<span className="font-semibold">{msg.sender === session?.user?.name ? "You" : msg.sender}</span>
									<span className="text-xs text-muted-foreground ml-2">{formatTimestamp(msg.timestamp)}</span>
								</div>
								<p
									className={`rounded-lg px-3 py-1 mt-1 max-w-xs break-words ${msg.sender === session?.user?.name ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
								>
									{msg.text}
								</p>
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
							disabled={!isConnected || sessionStatus !== "authenticated"}
							className="flex-1"
						/>
						<Button
							type="button"
							onClick={handleSendMessage}
							disabled={!isConnected || inputValue.trim() === "" || sessionStatus !== "authenticated"}
							size="icon"
						>
							<Send className="h-4 w-4" />
							<span className="sr-only">Send</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
