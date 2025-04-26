"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
	UserIcon,
	UsersIcon,
	ArrowRightIcon,
	KeyRound,
	Loader2,
	LockIcon,
	Globe,
	ShieldIcon,
	RefreshCw,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

// Carregamento dinâmico do componente ConnectionStatus apenas no cliente
const ConnectionStatus = dynamic(() => import("@/app/components/ConnectionStatus"), { ssr: false });

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

// Interface para tipagem das salas
interface Room {
	id: string;
	created: string;
	players: number;
	maxPlayers: number;
	hasPassword: boolean;
	isPublic: boolean;
	host?: string;
	gameState: string;
}

export default function CreateRoomPage() {
	const router = useRouter();
	const [playerName, setPlayerName] = useState("");
	const [characterId, setCharacterId] = useState("");
	const [customRoomId, setCustomRoomId] = useState("");
	const [useCustomRoomId, setUseCustomRoomId] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [loadingPlayers, setLoadingPlayers] = useState(true);
	const [loadingRooms, setLoadingRooms] = useState(true);
	const [rooms, setRooms] = useState<Room[]>([]);
	const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
	const [roomPassword, setRoomPassword] = useState("");
	const [createPassword, setCreatePassword] = useState("");
	const [isPublicRoom, setIsPublicRoom] = useState(true);
	const [joinDialogOpen, setJoinDialogOpen] = useState(false);
	const [passwordAttempt, setPasswordAttempt] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [refreshing, setRefreshing] = useState(false);

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

	// Carregar lista de salas disponíveis
	const fetchRooms = useCallback(async () => {
		try {
			setRefreshing(true);
			setLoadingRooms(true);
			const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
			const response = await fetch(`${socketUrl}/api/rooms`);

			if (!response.ok) {
				throw new Error("Erro ao carregar salas");
			}

			const data = await response.json();
			setRooms(data.rooms || []);
		} catch (error) {
			console.error("Erro ao carregar salas:", error);
			setError("Não foi possível carregar as salas disponíveis. Tente novamente mais tarde.");
		} finally {
			setLoadingRooms(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		fetchRooms();

		// Configurar atualização periódica das salas a cada 20 segundos
		const interval = setInterval(() => {
			fetchRooms();
		}, 20000);

		return () => clearInterval(interval);
	}, [fetchRooms]);

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

			// Usar a mesma variável de ambiente que o socket usa
			const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

			console.log("Tentando criar sala em:", `${socketUrl}/api/rooms`);

			const response = await fetch(`${socketUrl}/api/rooms`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					customRoomId: roomId,
					characterId: characterId || undefined,
					isPublic: isPublicRoom,
					password: createPassword || null,
					maxPlayers: 8, // Limite fixo de 8 jogadores
				}),
			});

			console.log("Status da resposta:", response.status);
			const data = await response.json();
			console.log("Dados recebidos:", data);

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

	// Função para verificar a senha e entrar na sala
	const checkPasswordAndJoin = async (roomId: string) => {
		try {
			setPasswordError("");
			setIsLoading(true);

			// Obter o personagem selecionado
			const selectedPlayer = players.find((player) => player.id === characterId);
			if (!selectedPlayer) {
				setPasswordError("Personagem selecionado não encontrado");
				setIsLoading(false);
				return;
			}

			// Usar nome do personagem se playerName estiver vazio
			const displayName = playerName.trim() || selectedPlayer.name;

			const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

			const response = await fetch(`${socketUrl}/api/rooms/${roomId}/verify-password`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					password: passwordAttempt,
				}),
			});

			const data = await response.json();

			if (data.success) {
				setJoinDialogOpen(false);

				const queryParams = new URLSearchParams({
					room: roomId,
					name: displayName,
					isHost: "false",
				});

				if (characterId) {
					queryParams.append("characterId", characterId);
					queryParams.append("characterClass", selectedPlayer.subclass);
					queryParams.append("characterRace", selectedPlayer.race);
					queryParams.append("characterHp", selectedPlayer.hp.toString());
					queryParams.append("characterMp", selectedPlayer.mp.toString());
					queryParams.append("characterImage", selectedPlayer.image || "");
				}

				router.push(`/battle?${queryParams.toString()}`);
			} else {
				setPasswordError("Senha incorreta. Tente novamente.");
			}
		} catch (err) {
			console.error("Failed to verify password:", err);
			setPasswordError("Erro de conexão. Verifique se o servidor está rodando.");
		} finally {
			setIsLoading(false);
		}
	};

	// Função para entrar em uma sala existente
	const joinRoom = async (roomId: string, hasPassword: boolean) => {
		if (!characterId) {
			setError("Por favor, selecione um personagem");
			return;
		}

		try {
			setError("");

			// Se a sala tem senha, abrir o diálogo para inserir a senha
			if (hasPassword) {
				setSelectedRoom(roomId);
				setPasswordAttempt("");
				setPasswordError("");
				setJoinDialogOpen(true);
				return;
			}

			setIsLoading(true);

			// Garantir que o código da sala esteja em maiúsculas
			const normalizedRoomCode = roomId.toUpperCase();
			console.log(`Tentando entrar na sala: ${normalizedRoomCode}`);

			// Obter o personagem selecionado
			const selectedPlayer = players.find((player) => player.id === characterId);
			if (!selectedPlayer) {
				setError("Personagem selecionado não encontrado");
				setIsLoading(false);
				return;
			}

			// Usar nome do personagem se playerName estiver vazio
			const displayName = playerName.trim() || selectedPlayer.name;

			// Usar a mesma variável de ambiente que o socket usa
			const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

			console.log(
				`Verificando existência da sala ${normalizedRoomCode} em: ${socketUrl}/api/rooms/${normalizedRoomCode}`,
			);

			const response = await fetch(`${socketUrl}/api/rooms/${normalizedRoomCode}`);
			console.log(`Status da resposta: ${response.status}`);

			const data = await response.json();
			console.log(`Dados recebidos:`, data);

			if (data.exists) {
				console.log(`Sala ${normalizedRoomCode} existe. Redirecionando...`);

				const queryParams = new URLSearchParams({
					room: normalizedRoomCode,
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
				console.log(`Sala ${normalizedRoomCode} não encontrada.`);
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
		<div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-background/10 to-background/30 p-4">
			<Card className="w-full max-w-4xl">
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
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
									{players.map((player) => (
										<button
											key={player.id}
											className={`border rounded-lg p-2 cursor-pointer transition-all w-full text-left ${
												characterId === player.id ? "ring-2 ring-primary" : "hover:bg-accent"
											}`}
											onClick={() => {
												setCharacterId(player.id);
												setPlayerName(player.name);
											}}
											aria-pressed={characterId === player.id}
											type="button"
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
										</button>
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

					<Tabs defaultValue="join" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="join">Entrar em Sala</TabsTrigger>
							<TabsTrigger value="create">Criar Nova Sala</TabsTrigger>
						</TabsList>

						<TabsContent value="join" className="space-y-4">
							<div className="flex items-center justify-between mb-2">
								<h3 className="text-lg font-semibold">Salas Disponíveis</h3>
								<Button variant="ghost" size="sm" onClick={fetchRooms} disabled={refreshing}>
									{refreshing ? (
										<RefreshCw className="h-4 w-4 mr-1 animate-spin" />
									) : (
										<RefreshCw className="h-4 w-4 mr-1" />
									)}
									Atualizar
								</Button>
							</div>

							{loadingRooms ? (
								<div className="flex justify-center p-8">
									<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
								</div>
							) : rooms.length === 0 ? (
								<div className="text-center p-8 border rounded-lg">
									<p className="text-muted-foreground">Nenhuma sala disponível no momento</p>
									<p className="text-xs text-muted-foreground mt-1">Crie uma nova sala para começar</p>
								</div>
							) : (
								<div className="border rounded-lg overflow-hidden">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Sala</TableHead>
												<TableHead>Tipo</TableHead>
												<TableHead>Jogadores</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Ação</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{rooms.map((room) => (
												<TableRow key={room.id}>
													<TableCell className="font-medium">{room.id}</TableCell>
													<TableCell>
														{room.isPublic ? (
															<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
																<Globe className="h-3 w-3 mr-1" />
																Pública
															</Badge>
														) : (
															<Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
																<ShieldIcon className="h-3 w-3 mr-1" />
																Privada
															</Badge>
														)}
													</TableCell>
													<TableCell>
														<span className={room.players >= room.maxPlayers ? "text-red-500" : ""}>
															{room.players}/{room.maxPlayers}
														</span>
													</TableCell>
													<TableCell>
														{room.gameState === "waiting" ? (
															<Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
																Aguardando
															</Badge>
														) : room.gameState === "rolling_initiative" ? (
															<Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
																Iniciativa
															</Badge>
														) : (
															<Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
																Em combate
															</Badge>
														)}
													</TableCell>
													<TableCell>
														<Button
															variant="outline"
															size="sm"
															onClick={() => joinRoom(room.id, room.hasPassword)}
															disabled={room.players >= room.maxPlayers || !characterId}
															className="whitespace-nowrap"
														>
															{room.hasPassword ? (
																<>
																	<LockIcon className="h-3 w-3 mr-1" />
																	Senha
																</>
															) : (
																<>
																	<ArrowRightIcon className="h-3 w-3 mr-1" />
																	Entrar
																</>
															)}
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}

							<div className="space-y-2 mt-4">
								<label htmlFor="roomCode" className="text-sm font-medium">
									Ou entre usando um código
								</label>
								<div className="flex gap-2">
									<Input
										id="roomCode"
										placeholder="Digite o código para entrar"
										value={roomPassword}
										onChange={(e) => setRoomPassword(e.target.value.toUpperCase())}
									/>
									<Button
										onClick={() => joinRoom(roomPassword, false)}
										disabled={!roomPassword || !characterId || isLoading || loadingPlayers}
									>
										{isLoading ? (
											<Loader2 className="h-4 w-4 animate-spin mr-2" />
										) : (
											<ArrowRightIcon className="mr-2 h-4 w-4" />
										)}
										Entrar
									</Button>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="create" className="space-y-4">
							<div className="space-y-4">
								<div className="flex items-center space-x-2">
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
									<div className="flex items-center space-x-2">
										<Switch id="public-room" checked={isPublicRoom} onCheckedChange={setIsPublicRoom} />
										<Label htmlFor="public-room">Sala pública (visível na lista)</Label>
									</div>

									<div className="space-y-2">
										<label htmlFor="roomPassword" className="text-sm font-medium">
											Senha da Sala (opcional)
										</label>
										<Input
											id="roomPassword"
											type="password"
											placeholder="Deixe em branco para sala sem senha"
											value={createPassword}
											onChange={(e) => setCreatePassword(e.target.value)}
										/>
										<p className="text-xs text-muted-foreground">
											Adicione uma senha para proteger sua sala de jogadores indesejados.
										</p>
									</div>
								</div>

								<div className="mt-4">
									<Button
										className="w-full"
										onClick={createRoom}
										disabled={!characterId || isLoading || loadingPlayers}
									>
										{isLoading ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Criando...
											</>
										) : (
											<>
												{createPassword ? <LockIcon className="mr-2 h-4 w-4" /> : <UserIcon className="mr-2 h-4 w-4" />}
												Criar Nova Sala
											</>
										)}
									</Button>
								</div>
							</div>
						</TabsContent>
					</Tabs>

					{error && <p className="text-sm text-red-500 mt-2">{error}</p>}
				</CardContent>
			</Card>

			{/* Diálogo para inserir senha da sala */}
			<Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Sala Protegida</DialogTitle>
						<DialogDescription>Esta sala está protegida por senha. Digite a senha para entrar.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="password">Senha</Label>
							<Input
								id="password"
								type="password"
								placeholder="Digite a senha da sala"
								value={passwordAttempt}
								onChange={(e) => setPasswordAttempt(e.target.value)}
							/>
							{passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
							Cancelar
						</Button>
						<Button
							onClick={() => selectedRoom && checkPasswordAndJoin(selectedRoom)}
							disabled={!passwordAttempt || isLoading}
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : (
								<ArrowRightIcon className="h-4 w-4 mr-2" />
							)}
							Entrar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Adicionar o indicador de status de conexão apenas nesta página */}
			<ConnectionStatus />
		</div>
	);
}
