import { PrismaClient } from "@prisma/client";
import { uploadImageFromUrl } from "../lib/cloudinary";
import { config } from "dotenv";

// Load environment variables
config();

const prisma = new PrismaClient();

async function migrateImages() {
	console.log("Starting image migration...");

	// Get all players with images
	const players = await prisma.player.findMany({
		where: {
			image: {
				not: null,
			},
		},
	});

	console.log(`Found ${players.length} players with images`);

	let successCount = 0;
	let errorCount = 0;

	// Process each player
	for (const player of players) {
		try {
			if (!player.image) continue;

			// Check if image is already on Cloudinary
			if (player.image.includes("cloudinary.com")) {
				console.log(`Player ${player.name} (${player.id}) already has Cloudinary image: ${player.image}`);
				successCount++;
				continue;
			}

			console.log(`Migrating image for player ${player.name} (${player.id})...`);

			try {
				// Upload the image to Cloudinary
				const cloudinaryUrl = await uploadImageFromUrl(player.image);

				// Update the player record
				await prisma.player.update({
					where: { id: player.id },
					data: { image: cloudinaryUrl },
				});

				console.log(`✅ Successfully migrated image for ${player.name} to: ${cloudinaryUrl}`);
				successCount++;
			} catch (uploadError) {
				console.error(`❌ Failed to migrate image for ${player.name}:`, uploadError);
				errorCount++;

				// If the image cannot be uploaded, set to null to prevent future errors
				await prisma.player.update({
					where: { id: player.id },
					data: { image: null },
				});
			}
		} catch (error) {
			console.error(`❌ Error processing player ${player.id}:`, error);
			errorCount++;
		}
	}

	console.log("\nMigration complete!");
	console.log(`✅ Successfully migrated: ${successCount} images`);
	console.log(`❌ Failed migrations: ${errorCount} images`);
}

// Run the migration
migrateImages()
	.catch((e) => {
		console.error("Migration failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
