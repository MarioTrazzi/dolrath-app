"use client";

import React, { useState, useEffect } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { SocketProvider } from "@/app/components/SocketProvider";
import { useSession } from "next-auth/react";
import { getPlayersByUserId } from "../../actions/player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image"; // For character images

// Define Player type (adjust based on your actual Player model)
interface Player {
	id: string;
	name: string;
	image?: string | null;
	// Add other relevant fields if needed
}

interface SelectedCharacter {
	id: string;
	name: string;
}

export default function ChatPageWrapper() {
	const { data: session, status: sessionStatus } = useSession();
	const [selectedCharacter, setSelectedCharacter] = useState<SelectedCharacter | null>(null);
	const [characters, setCharacters] = useState<Player[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchCharacters = async () => {
			if (sessionStatus === "authenticated" && session?.user?.id) {
				setIsLoading(true);
				setError(null);
				try {
					console.log("Fetching characters for user:", session.user.id);
					const userPlayers = await getPlayersByUserId(session.user.id);
					console.log("Fetched characters:", userPlayers);
					if (userPlayers) {
						// Ensure userPlayers is an array before setting
						setCharacters(Array.isArray(userPlayers) ? userPlayers : []);
					} else {
						setCharacters([]); // Set empty if null/undefined
					}
				} catch (err) {
					console.error("Failed to fetch characters:", err);
					setError("Failed to load your characters. Please try again.");
					setCharacters([]); // Clear characters on error
				} finally {
					setIsLoading(false);
				}
			} else if (sessionStatus === "unauthenticated") {
				setIsLoading(false); // Not loading if not authenticated
				setCharacters([]); // Clear characters if not authenticated
			}
		};

		fetchCharacters();
	}, [sessionStatus, session?.user?.id]);

	const handleCharacterSelect = (character: Player) => {
		console.log("Character selected:", character);
		setSelectedCharacter({ id: character.id, name: character.name });
		// Optionally store in session/local storage for persistence across refreshes
		sessionStorage.setItem("selectedCharacterForChat", JSON.stringify({ id: character.id, name: character.name }));
	};

	// Check session storage on initial load
	useEffect(() => {
		const storedChar = sessionStorage.getItem("selectedCharacterForChat");
		if (storedChar) {
			try {
				setSelectedCharacter(JSON.parse(storedChar));
			} catch (e) {
				console.error("Failed to parse stored character");
				sessionStorage.removeItem("selectedCharacterForChat");
			}
		}
	}, []);

	// Render states: Loading session, Unauthenticated, Loading Characters, No Characters, Select Character, Chat Interface

	if (sessionStatus === "loading") {
		return (
			<div className="container mx-auto py-8 flex justify-center items-center h-[calc(100vh-150px)]">
				<Skeleton className="h-24 w-1/2" />
			</div>
		);
	}

	if (sessionStatus === "unauthenticated") {
		return (
			<div className="container mx-auto py-8 text-center h-[calc(100vh-150px)] flex flex-col justify-center items-center">
				<h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
				<p className="text-muted-foreground">Please log in to select a character and join the chat.</p>
				{/* Maybe Login Button */}
			</div>
		);
	}

	// If authenticated but no character is selected yet
	if (!selectedCharacter) {
		return (
			<div className="container mx-auto py-8">
				<h1 className="text-2xl font-bold mb-6 text-center">Select Your Character for Chat</h1>
				{isLoading && (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{[...Array(4)].map((_, i) => (
							<Skeleton key={`loading-skeleton-${i}`} className="h-48 w-full" />
						))}
					</div>
				)}
				{error && <p className="text-red-500 text-center mb-4">{error}</p>}
				{!isLoading && !error && characters.length === 0 && (
					<p className="text-center text-muted-foreground">
						You don&apos;t have any characters yet. Go create one!
						{/* Maybe link to character creation */}
					</p>
				)}
				{!isLoading && !error && characters.length > 0 && (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{characters.map((char) => (
							<Card
								key={char.id}
								className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
								onClick={() => handleCharacterSelect(char)}
							>
								<CardHeader className="p-0 relative h-32">
									{" "}
									{/* Fixed height for image area */}
									{char.image ? (
										<Image
											src={char.image}
											alt={char.name}
											fill
											style={{ objectFit: "cover" }}
											sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
										/>
									) : (
										<div className="h-full w-full bg-secondary flex items-center justify-center text-muted-foreground">
											No Image
										</div>
									)}
								</CardHeader>
								<CardContent className="p-4">
									<CardTitle className="text-lg truncate">{char.name}</CardTitle>
									{/* Optional: Add class/race here */}
									<Button variant="outline" size="sm" className="w-full mt-3">
										Select
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		);
	}

	// Character is selected, render chat
	return (
		<SocketProvider>
			{" "}
			{/* SocketProvider wraps ChatInterface */}
			<div className="container mx-auto py-8">
				{/* Pass selectedCharacter to ChatInterface */}
				<ChatInterface character={selectedCharacter} />
			</div>
		</SocketProvider>
	);
}
