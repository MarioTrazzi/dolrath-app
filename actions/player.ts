"use server";

import { prisma } from "@/lib/db"; // Use correct export name 'prisma'
import type { Player } from "@prisma/client"; // Import Player type directly

// Define Player type based on Prisma model if not already globally defined
// type Player = Prisma.PlayerGetPayload<{ include?: Prisma.PlayerInclude }>; // Example if needed

/**
 * Fetches all players associated with a specific user ID.
 * @param userId The ID of the user whose players to fetch.
 * @returns A promise that resolves to an array of players or null if an error occurs.
 */
export async function getPlayersByUserId(userId: string): Promise<Player[] | null> {
	if (!userId) {
		console.error("getPlayersByUserId: No userId provided.");
		return null;
	}

	console.log(`Fetching players for userId: ${userId}`);

	try {
		const players = await prisma.player.findMany({
			where: {
				userId: userId,
			},
			// Optionally add orderBy or select clauses here
			// orderBy: {
			//     createdAt: 'asc',
			// },
		});

		console.log(`Found ${players.length} players for userId: ${userId}`);
		return players;
	} catch (error) {
		console.error(`Error fetching players for userId ${userId}:`, error);
		// Handle specific Prisma errors if necessary
		// if (error instanceof Prisma.PrismaClientKnownRequestError) { ... }
		return null; // Return null on error
	}
}
