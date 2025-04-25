import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Gamepad2 } from "lucide-react";

async function getPlayers(userId: string) {
	return await prisma.player.findMany({
		where: {
			userId: userId,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export default async function PlayersPage() {
	const session = await auth();

	if (!session || !session.user) {
		redirect("/auth/login?callbackUrl=/players");
	}

	const userId = session.user.id;
	if (!userId) {
		redirect("/auth/login?callbackUrl=/players");
	}

	const players = await getPlayers(userId);

	return (
		<div className="container py-10">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Meus Personagens</h1>
				<Link href="/players/create">
					<Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
						<Plus className="mr-2 h-4 w-4" />
						Criar Personagem
					</Button>
				</Link>
			</div>

			{players.length === 0 ? (
				<div className="text-center py-20">
					<div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
						<Gamepad2 className="h-10 w-10 text-muted-foreground" />
					</div>
					<h2 className="text-2xl font-medium mb-2">Nenhum personagem encontrado</h2>
					<p className="text-muted-foreground mb-6">Crie seu primeiro personagem para iniciar sua jornada!</p>
					<Link href="/players/create">
						<Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
							<Plus className="mr-2 h-4 w-4" />
							Criar meu primeiro personagem
						</Button>
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{players.map((player) => (
						<div
							key={player.id}
							className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
						>
							<div className="aspect-square relative">
								{player.image ? (
									<Image src={player.image} alt={player.name} fill className="object-cover" />
								) : (
									<div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
										<span className="text-4xl font-bold text-primary/60">{player.name[0]}</span>
									</div>
								)}
							</div>
							<div className="p-4">
								<h3 className="text-xl font-semibold mb-1">{player.name}</h3>
								<p className="text-muted-foreground text-sm mb-3">
									{capitalizeFirstLetter(player.race)} • {capitalizeFirstLetter(player.subclass)}
								</p>
								<div className="grid grid-cols-2 gap-2 text-sm mb-4">
									<div className="bg-primary/10 rounded px-2 py-1 text-center">
										<span className="font-medium">HP</span> {player.hp}
									</div>
									<div className="bg-blue-500/10 rounded px-2 py-1 text-center">
										<span className="font-medium">MP</span> {player.mp}
									</div>
								</div>
								<Link href={`/players/${player.id}`}>
									<Button variant="outline" className="w-full">
										Ver Detalhes
									</Button>
								</Link>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function capitalizeFirstLetter(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
