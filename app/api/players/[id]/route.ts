import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	try {
		const session = await auth();

		// Check authentication
		if (!session || !session.user || !session.user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const playerId = params.id;

		// Verify the player exists and belongs to the user
		const player = await prisma.player.findFirst({
			where: {
				id: playerId,
				userId: userId,
			},
		});

		if (!player) {
			return NextResponse.json({ error: "Player not found" }, { status: 404 });
		}

		// Delete the player
		await prisma.player.delete({
			where: {
				id: playerId,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting player:", error);
		return NextResponse.json({ error: "Failed to delete player" }, { status: 500 });
	}
}
