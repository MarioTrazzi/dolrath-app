"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon, UsersIcon, ArrowRightIcon, KeyRound, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";

// Interface para tipagem de Player do Prisma
interface Player {
	id: string;
	name: string;
	race: string;
	subclass: string;
	hp: number;
	mp: number;
	image?: string | null;
}

export default function CreateRoomPage() {
	const router = useRouter();
	const [roomCode, setRoomCode] = useState("");
	const [playerName, setPlayerName] = useState("");
	const [characterId, setCharacterId] = useState("");
	const [customRoomId, setCustomRoomId] = useState("");
	const [useCustomRoomId, setUseCustomRoomId] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [loadingPlayers, setLoadingPlayers] = useState(true);

	// Estado para gerenciar personagens do usuário
	const [players, setPlayers] = useState<Player[]>([]);

	// Carregar personagens do usuário do banco de dados
	useEffect(() => {
		async function fetchPlayers() {
			try {
				setLoadingPlayers(true);
				const response = await fetch("/api/players");

				if (!response.ok) {
					throw new Error("Erro ao carregar personagens");
				}

				const data = await response.json();
				setPlayers(data);
			} catch (error) {
				console.error("Erro ao carregar personagens:", error);
				setError("Não foi possível carregar seus personagens. Tente novamente mais tarde.");
			} finally {
				setLoadingPlayers(false);
			}
		}

		fetchPlayers();
	}, []);

	// Função para criar uma nova sala
	const createRoom = async () => {
		if (!characterId) {
			setError("Por favor, selecione um personagem");
			return;
		}

		try {
			setError("");
			setIsLoading(true);
			const roomId = useCustomRoomId && customRoomId ? customRoomId : null;

			// Obter o personagem selecionado
			const selectedPlayer = players.find((player) => player.id === characterId);
			if (!selectedPlayer) {
				setError("Personagem selecionado não encontrado");
				setIsLoading(false);
				return;
			}

			// Usar nome do personagem se playerName estiver vazio
			const displayName = playerName.trim() || selectedPlayer.name;

			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/rooms`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					customRoomId: roomId,
					characterId: characterId || undefined,
				}),
			});

			const data = await response.json();

			if (data.roomId) {
				const queryParams = new URLSearchParams({
					room: data.roomId,
					name: displayName,
					isHost: "true",
				});

				if (characterId) {
					queryParams.append("characterId", characterId);
					// Adicionar informações adicionais do personagem
					queryParams.append("characterClass", selectedPlayer.subclass);
					queryParams.append("characterRace", selectedPlayer.race);
					queryParams.append("characterHp", selectedPlayer.hp.toString());
					queryParams.append("characterMp", selectedPlayer.mp.toString());
					queryParams.append("characterImage", selectedPlayer.image || "");
				}

				// Redirecionar para a sala de batalha com parâmetros de query
				router.push(`/battle?${queryParams.toString()}`);
			} else {
				setError(data.error || "Erro ao criar sala. Tente novamente.");
			}
		} catch (err) {
			console.error("Failed to create room:", err);
			setError("Erro de conexão. Verifique se o servidor está rodando.");
		} finally {
			setIsLoading(false);
		}
	};

	// Função para entrar em uma sala existente
	const joinRoom = async () => {
		if (!characterId) {
			setError("Por favor, selecione um personagem");
			return;
		}

		if (!roomCode) {
			setError("Por favor, digite o código da sala");
			return;
		}

		try {
			setError("");
			setIsLoading(true);

			// Obter o personagem selecionado
			const selectedPlayer = players.find((player) => player.id === characterId);
			if (!selectedPlayer) {
				setError("Personagem selecionado não encontrado");
				setIsLoading(false);
				return;
			}

			// Usar nome do personagem se playerName estiver vazio
			const displayName = playerName.trim() || selectedPlayer.name;

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/rooms/${roomCode}`,
			);
			const data = await response.json();

			if (data.exists) {
				const queryParams = new URLSearchParams({
					room: roomCode,
					name: displayName,
					isHost: "false",
				});

				if (characterId) {
					queryParams.append("characterId", characterId);
					// Adicionar informações adicionais do personagem
					queryParams.append("characterClass", selectedPlayer.subclass);
					queryParams.append("characterRace", selectedPlayer.race);
					queryParams.append("characterHp", selectedPlayer.hp.toString());
					queryParams.append("characterMp", selectedPlayer.mp.toString());
					queryParams.append("characterImage", selectedPlayer.image || "");
				}

				// Redirecionar para a sala de batalha com parâmetros de query
				router.push(`/battle?${queryParams.toString()}`);
			} else {
				setError("Sala não encontrada. Verifique o código e tente novamente.");
			}
		} catch (err) {
			console.error("Failed to join room:", err);
			setError("Erro de conexão. Verifique se o servidor está rodando.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background/10 to-background/30 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Dolrath RPG Battle</CardTitle>
					<CardDescription>Entre em uma sala de batalha ou crie uma nova</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<label htmlFor="character" className="text-sm font-medium">
								Seus Personagens
							</label>
							<Link href="/players/create">
								<Button variant="ghost" size="sm">
									<UserIcon className="mr-1 h-3 w-3" />
									Novo Personagem
								</Button>
							</Link>
						</div>

						{loadingPlayers ? (
							<div className="flex justify-center p-4">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : players.length === 0 ? (
							<div className="text-center p-4 border rounded-lg">
								<p className="text-muted-foreground mb-2">Você não tem personagens</p>
								<Link href="/players/create">
									<Button variant="outline" size="sm">
										Criar Personagem
									</Button>
								</Link>
							</div>
						) : (
							<>
								<div className="grid grid-cols-2 gap-2 mb-4">
									{players.map((player) => (
										<div
											key={player.id}
											className={`border rounded-lg p-2 cursor-pointer transition-all ${
												characterId === player.id ? "ring-2 ring-primary" : "hover:bg-accent"
											}`}
											onClick={() => {
												setCharacterId(player.id);
												setPlayerName(player.name);
											}}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													setCharacterId(player.id);
													setPlayerName(player.name);
												}
											}}
											tabIndex={0}
											role="button"
											aria-pressed={characterId === player.id}
										>
											<div className="flex items-center space-x-2">
												<div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
													{player.image ? (
														<Image
															src={player.image}
															alt={player.name}
															fill
															className="object-cover"
															onError={(e) => {
																// If image fails to load, replace with avatar showing first letter
																e.currentTarget.style.display = "none";
																const parent = e.currentTarget.parentElement;
																if (parent) {
																	const fallback = document.createElement("div");
																	fallback.className = "w-full h-full flex items-center justify-center bg-primary/10";
																	fallback.textContent = player.name[0].toUpperCase();
																	parent.appendChild(fallback);
																}
															}}
														/>
													) : (
														<div className="w-full h-full flex items-center justify-center bg-primary/10">
															{player.name[0].toUpperCase()}
														</div>
													)}
												</div>
												<div>
													<p className="font-medium text-sm">{player.name}</p>
													<p className="text-xs text-muted-foreground">
														{player.race} • {player.subclass}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>

								{characterId && (
									<div className="space-y-2">
										<label htmlFor="name" className="text-sm font-medium">
											Nome na Sala (opcional)
										</label>
										<Input
											id="name"
											placeholder="Deixe em branco para usar o nome do personagem"
											value={playerName}
											onChange={(e) => setPlayerName(e.target.value)}
										/>
										<p className="text-xs text-muted-foreground">
											Por padrão, usamos o nome do personagem. Você pode alterá-lo para esta sessão.
										</p>
									</div>
								)}
							</>
						)}
					</div>

					<div className="flex items-center space-x-2 pt-2">
						<Switch id="custom-room" checked={useCustomRoomId} onCheckedChange={setUseCustomRoomId} />
						<Label htmlFor="custom-room">Usar ID de sala personalizado</Label>
					</div>

					{useCustomRoomId && (
						<div className="space-y-2">
							<label htmlFor="customRoomId" className="text-sm font-medium">
								ID de Sala Personalizado
							</label>
							<div className="flex gap-2">
								<Input
									id="customRoomId"
									placeholder="Digite um ID personalizado"
									value={customRoomId}
									onChange={(e) => setCustomRoomId(e.target.value.toUpperCase())}
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Use um ID personalizado para salas recorrentes ou específicas.
							</p>
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="roomCode" className="text-sm font-medium">
							Código da Sala Existente
						</label>
						<div className="flex gap-2">
							<Input
								id="roomCode"
								placeholder="Digite o código para entrar"
								value={roomCode}
								onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
							/>
							<Button onClick={joinRoom} disabled={!roomCode || !characterId || isLoading || loadingPlayers}>
								{isLoading ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : (
									<ArrowRightIcon className="mr-2 h-4 w-4" />
								)}
								Entrar
							</Button>
						</div>
					</div>
					{error && <p className="text-sm text-red-500">{error}</p>}
				</CardContent>
				<CardFooter>
					<Button
						className="w-full"
						onClick={createRoom}
						disabled={!characterId || isLoading || loadingPlayers}
						variant="secondary"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Criando...
							</>
						) : (
							<>
								{useCustomRoomId ? <KeyRound className="mr-2 h-4 w-4" /> : <UserIcon className="mr-2 h-4 w-4" />}
								Criar Nova Sala
							</>
						)}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
