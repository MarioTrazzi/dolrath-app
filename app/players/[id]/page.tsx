import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Zap, Dumbbell, Gauge, Target, Brain, Heart, HeartPulse, Trash2 } from "lucide-react";
import DeletePlayerButton from "@/components/delete-player-button";

interface PlayerPageProps {
	params: {
		id: string;
	};
}

async function getPlayer(id: string, userId: string) {
	return await prisma.player.findFirst({
		where: {
			id: id,
			userId: userId,
		},
	});
}

export default async function PlayerPage({ params }: PlayerPageProps) {
	const session = await auth();

	if (!session || !session.user) {
		redirect("/auth/login?callbackUrl=/players");
	}

	const userId = session.user.id;
	if (!userId) {
		redirect("/auth/login?callbackUrl=/players");
	}

	const player = await getPlayer(params.id, userId);

	if (!player) {
		redirect("/players");
	}

	// Mapping de raças e classes para português
	const races: Record<string, string> = {
		human: "Humano",
		elf: "Elfo",
		dwarf: "Anão",
		orc: "Orc",
		halfling: "Halfling",
	};

	const subclasses: Record<string, string> = {
		warrior: "Guerreiro",
		paladin: "Paladino",
		rogue: "Ladino",
		mage: "Mago",
		ranger: "Arqueiro",
		druid: "Druida",
		cleric: "Clérigo",
		engineer: "Engenheiro",
		berserker: "Berserker",
		shaman: "Xamã",
		hunter: "Caçador",
		bard: "Bardo",
		cook: "Cozinheiro",
	};

	const raceName = races[player.race as keyof typeof races] || player.race;
	const className = subclasses[player.subclass as keyof typeof subclasses] || player.subclass;

	return (
		<div className="container py-10">
			<Link href="/players">
				<Button variant="ghost" className="mb-6">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar para meus personagens
				</Button>
			</Link>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{/* Coluna da esquerda - Imagem e detalhes básicos */}
				<div className="flex flex-col">
					<div className="bg-card rounded-lg border shadow-sm overflow-hidden mb-4">
						<div className="aspect-square relative w-full">
							{player.image ? (
								<Image src={player.image} alt={player.name} fill className="object-cover" />
							) : (
								<div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
									<span className="text-6xl font-bold text-primary/60">{player.name[0]}</span>
								</div>
							)}
						</div>
						<div className="p-4">
							<h1 className="text-2xl font-bold mb-1">{player.name}</h1>
							<p className="text-muted-foreground mb-3">
								{raceName} • {className}
							</p>
							<div className="grid grid-cols-2 gap-2">
								<div className="bg-primary/10 rounded px-3 py-2 text-center">
									<HeartPulse className="inline-block mr-1 h-4 w-4" />
									<span className="font-medium">HP:</span> {player.hp}
								</div>
								<div className="bg-blue-500/10 rounded px-3 py-2 text-center">
									<Zap className="inline-block mr-1 h-4 w-4" />
									<span className="font-medium">MP:</span> {player.mp}
								</div>
							</div>
						</div>
					</div>

					<div className="bg-card rounded-lg border shadow-sm p-4 mb-4">
						<h2 className="text-lg font-medium mb-3">Informações</h2>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Raça:</span>
								<span>{raceName}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Classe:</span>
								<span>{className}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Experiência:</span>
								<span>{player.experience}</span>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-2 mt-auto">
						<Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
							Jogar como {player.name}
						</Button>

						<DeletePlayerButton playerId={player.id} playerName={player.name} />
					</div>
				</div>

				{/* Coluna da direita - Atributos e detalhes adicionais */}
				<div className="md:col-span-2">
					<div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
						<h2 className="text-xl font-semibold mb-4">Atributos</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<AttributeCard
								icon={<Dumbbell className="h-5 w-5 text-red-500" />}
								name="Força"
								value={player.strength}
								color="bg-red-500"
							/>
							<AttributeCard
								icon={<Shield className="h-5 w-5 text-green-500" />}
								name="Defesa"
								value={player.defense}
								color="bg-green-500"
							/>
							<AttributeCard
								icon={<Gauge className="h-5 w-5 text-amber-500" />}
								name="Velocidade"
								value={player.speed}
								color="bg-amber-500"
							/>
							<AttributeCard
								icon={<Target className="h-5 w-5 text-blue-500" />}
								name="Destreza"
								value={player.dexterity}
								color="bg-blue-500"
							/>
							<AttributeCard
								icon={<Brain className="h-5 w-5 text-purple-500" />}
								name="Inteligência"
								value={player.intelligence}
								color="bg-purple-500"
							/>
							<AttributeCard
								icon={<Heart className="h-5 w-5 text-pink-500" />}
								name="Carisma"
								value={player.charisma}
								color="bg-pink-500"
							/>
							<AttributeCard
								icon={<Zap className="h-5 w-5 text-cyan-500" />}
								name="Sabedoria"
								value={player.wisdom}
								color="bg-cyan-500"
							/>
						</div>
					</div>

					<div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
						<h2 className="text-xl font-semibold mb-4">Status NFT</h2>
						<div className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/30 text-center">
							<p className="text-lg mb-3">Este personagem ainda não foi transformado em NFT</p>
							<p className="text-sm text-muted-foreground mb-4">
								Em breve você poderá transformar seus personagens em NFTs únicos para usar em múltiplas plataformas.
							</p>
							<Button variant="outline" disabled>
								Transformar em NFT (Em breve)
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function AttributeCard({
	icon,
	name,
	value,
	color,
}: { icon: React.ReactNode; name: string; value: number; color: string }) {
	return (
		<div className="bg-muted/50 rounded-lg p-4 flex items-center space-x-4">
			<div className="flex-shrink-0">{icon}</div>
			<div className="flex-grow">
				<div className="flex justify-between items-center mb-1">
					<span className="font-medium">{name}</span>
					<span>{value}</span>
				</div>
				<div className="w-full bg-muted h-2 rounded-full">
					<div className={`${color} h-2 rounded-full`} style={{ width: `${(value / 10) * 100}%` }}></div>
				</div>
			</div>
		</div>
	);
}
