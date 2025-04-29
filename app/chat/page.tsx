"use client";

import React from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { SocketProvider } from "@/app/components/SocketProvider"; // Corrected path

export default function ChatPage() {
	return (
		<SocketProvider>
			{" "}
			{/* Wrap with SocketProvider if not already done at a higher level */}
			<div className="container mx-auto py-8">
				<h1 className="text-2xl font-bold mb-6 text-center">Global Chat Room</h1>
				<ChatInterface />
			</div>
		</SocketProvider>
	);
}
