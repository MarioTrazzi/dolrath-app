"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSocketInstance, formatTime } from "@/lib/utils";
import React from "react";

export default function BattlePage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		// If there are room parameters, keep them and allow access to the battle
		const hasRoomParams = searchParams?.has("room") && searchParams?.has("name");

		// Otherwise redirect to room creation
		if (!hasRoomParams) {
			router.replace("/create-room");
		}
	}, [router, searchParams]);

	return <BattleContent />;
}

function BattleContent() {
	const searchParams = useSearchParams();
	const roomCode = searchParams?.get("room") || "unknown";
	const playerName = searchParams?.get("name") || "Guest";
	const isHost = searchParams?.get("isHost") === "true";
	const characterId = searchParams?.get("characterId") || null;
	const characterClass = searchParams?.get("characterClass") || "Desconhecido";

	const [chatMessage, setChatMessage] = useState("");
	const [messages, setMessages] = useState<
		{
			id: string;
			sender: string;
			text: string;
			time: string;
		}[]
	>([
		{
			id: "welcome",
			sender: "System",
			text: `Bem-vindo à sala de batalha ${roomCode}!${characterId ? " Batalha será salva no histórico do personagem." : ""}`,
			time: "00:00:00",
		},
	]);

	// Estado do jogo
	const [gameState, setGameState] = useState("waiting"); // waiting, rolling_initiative, combat, ended
	const [currentTurn, setCurrentTurn] = useState("");
	const [battleStarted, setBattleStarted] = useState(false);
	const [players, setPlayers] = useState<
		{
			id: string;
			name: string;
			isHost: boolean;
			hp: number;
			maxHp: number;
			mp: number;
			maxMp: number;
			initiative: number;
			characterId: string;
			characterClass: string;
		}[]
	>([]);
	const [playerStats, setPlayerStats] = useState({
		hp: 100,
		maxHp: 100,
		mp: 80,
		maxMp: 80,
		initiative: 0,
		characterId: characterId || "",
		characterClass: characterClass || "",
	});

	const socket = getSocketInstance();

	// Join the socket.io room when the component mounts
	const hasJoinedRef = React.useRef(false);

	// Adicionar uma referência para o contêiner de mensagens
	const messagesEndRef = React.useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!socket || !roomCode || !playerName || hasJoinedRef.current) return;

		// Join the room
		const joinRoom = () => {
			console.log(`Joining room ${roomCode} as ${playerName} with character ${characterId}`);
			socket.emit("joinRoom", {
				roomId: roomCode,
				playerName,
				isHost,
				characterId,
				characterClass,
			});
			hasJoinedRef.current = true;
		};

		// Connect to socket if not connected yet
		if (!socket.connected) {
			socket.on("connect", () => {
				joinRoom();
			});
		} else {
			joinRoom();
		}

		// Listen for successful room join
		socket.on("roomJoined", (data) => {
			console.log("Joined room successfully:", data);
			if (data.players) {
				// Converter jogadores recebidos para o formato com stats
				const playersWithStats = data.players.map(
					(player: {
						id: string;
						name: string;
						isHost: boolean;
						characterId?: string;
						characterClass?: string;
					}) => ({
						...player,
						hp: 100,
						maxHp: 100,
						mp: 80,
						maxMp: 80,
						initiative: 0,
						characterId: player.characterId || "",
						characterClass: player.characterClass || "",
					}),
				);
				setPlayers(playersWithStats);
			}
		});

		// Listen for new players joining
		socket.on("playerJoined", (data) => {
			console.log("Player joined:", data);
			// Adicionar novo jogador com stats padrão
			if (data.playerInfo) {
				// Atualização mais clara e direta para depuração
				console.log("Adicionando jogador à lista:", data.playerInfo);

				setPlayers((prev) => {
					// Verificar se o jogador já existe na lista para evitar duplicações
					const exists = prev.some((p) => p.name === data.playerInfo.name);
					if (exists) {
						console.log("Jogador já existe na lista, ignorando");
						return prev;
					}

					console.log("Adicionando novo jogador à lista");
					return [
						...prev,
						{
							...(data.playerInfo as {
								id: string;
								name: string;
								isHost: boolean;
								characterId: string;
								characterClass: string;
							}),
							hp: 100,
							maxHp: 100,
							mp: 80,
							maxMp: 80,
							initiative: 0,
						},
					];
				});
			}

			// Adicionar mensagem ao chat
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					sender: "System",
					text: `${data.playerName} entrou na sala.`,
					time: formatTime(),
				},
			]);
		});

		// Listen for players leaving
		socket.on("playerLeft", (data) => {
			console.log("Player left:", data);
			if (data.playerName) {
				// Remover jogador que saiu
				setPlayers((prev) => prev.filter((p) => p.name !== data.playerName));

				// Adicionar mensagem ao chat
				setMessages((prev) => [
					...prev,
					{
						id: Date.now().toString(),
						sender: "System",
						text: `${data.playerName} saiu da sala.`,
						time: formatTime(),
					},
				]);
			}
		});

		// Listen for errors
		socket.on("error", (error) => {
			console.error("Socket error:", error);
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					sender: "System",
					text: `Error: ${error.message}`,
					time: formatTime(),
				},
			]);
		});

		return () => {
			socket.off("roomJoined");
			socket.off("playerJoined");
			socket.off("playerLeft");
			socket.off("error");
			socket.off("connect");
		};
	}, [socket, roomCode, playerName, isHost, characterId, characterClass]);

	// Record battle event to history
	const recordBattleEvent = async (eventType: string, data: Record<string, unknown>) => {
		if (!characterId) return; // Only record if a character is selected

		try {
			await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/battles/record`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					roomId: roomCode,
					characterId,
					eventType,
					eventData: data,
					timestamp: new Date().toISOString(),
				}),
			});
		} catch (err) {
			console.error("Failed to record battle event:", err);
		}
	};

	// Send chat message locally (no server connection for now)
	const sendMessage = async (e?: React.FormEvent) => {
		// Prevent default form submission which causes page refresh
		if (e) e.preventDefault();

		if (!chatMessage.trim()) return;

		const msgObj = {
			id: Date.now().toString(),
			sender: playerName,
			text: chatMessage,
			time: formatTime(),
		};

		// Add to local message history
		setMessages((prev) => [...prev, msgObj]);
		setChatMessage("");

		// Send to server
		socket.emit("chatMessage", {
			roomId: roomCode,
			message: {
				sender: playerName,
				text: chatMessage,
			},
		});

		// Record message in battle history
		if (characterId) {
			// Create local function to record events
			const recordEvent = async (eventType: string, data: Record<string, unknown>) => {
				try {
					await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/battles/record`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							roomId: roomCode,
							characterId,
							eventType,
							eventData: data,
							timestamp: new Date().toISOString(),
						}),
					});
				} catch (err) {
					console.error("Failed to record battle event:", err);
				}
			};

			recordEvent("message_sent", {
				sender: playerName,
				message: chatMessage,
				timestamp: new Date().toISOString(),
			});
		}
	};

	// Funções de batalha
	const startBattle = () => {
		if (!isHost) return;

		// Iniciar a batalha
		setBattleStarted(true);
		setGameState("rolling_initiative");

		// Informar ao servidor
		socket.emit("startGame", {
			roomId: roomCode,
			initialGameState: "rolling_initiative",
		});

		// Adicionar mensagem de sistema
		setMessages((prev) => [
			...prev,
			{
				id: Date.now().toString(),
				sender: "System",
				text: "A batalha começou! Todos os jogadores devem rolar iniciativa.",
				time: formatTime(),
			},
		]);

		// Registrar evento
		recordBattleEvent("battle_started", { initiator: playerName });
	};

	// Função para rolar iniciativa
	const rollInitiative = () => {
		const result = Math.floor(Math.random() * 20) + 1;
		console.log(`${playerName} rolou iniciativa: ${result}`);

		// Atualizar iniciativa do jogador
		setPlayerStats((prev) => ({
			...prev,
			initiative: result,
		}));

		// Atualizar na lista de jogadores local
		setPlayers((prev) => prev.map((p) => (p.name === playerName ? { ...p, initiative: result } : p)));

		// Enviar resultado para o servidor
		socket.emit("rollDice", {
			roomId: roomCode,
			playerName,
			faces: 20,
			result,
			gameState: "rolling_initiative",
		});

		// Adicionar mensagem local
		setMessages((prev) => [
			...prev,
			{
				id: Date.now().toString(),
				sender: "System",
				text: `${playerName} rolou iniciativa: ${result}`,
				time: formatTime(),
			},
		]);

		// Informar o servidor sobre a iniciativa
		socket.emit("updateGameState", {
			roomId: roomCode,
			gameState: "rolling_initiative",
			playerInitiative: {
				name: playerName,
				initiative: result,
			},
		});

		// Registrar evento
		recordBattleEvent("initiative_rolled", { player: playerName, result });
	};

	const performAttack = () => {
		// Somente permitir ataques durante o turno do jogador
		if (currentTurn !== playerName) {
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					sender: "System",
					text: "Não é o seu turno para atacar!",
					time: formatTime(),
				},
			]);
			return;
		}

		const attackRoll = Math.floor(Math.random() * 20) + 1;

		// Enviar ação para o servidor
		socket.emit("performAction", {
			roomId: roomCode,
			playerName,
			actionType: "attack",
			currentTurn,
			gameState: "combat",
			attackRoll,
			message: `${playerName} realiza um ataque! (${attackRoll})`,
		});

		// Adicionar mensagem local
		setMessages((prev) => [
			...prev,
			{
				id: Date.now().toString(),
				sender: "System",
				text: `Você realiza um ataque! Rolagem: ${attackRoll}`,
				time: formatTime(),
			},
		]);

		// Registrar evento
		recordBattleEvent("attack_performed", {
			player: playerName,
			roll: attackRoll,
		});
	};

	const useItem = (itemName: string) => {
		// Somente permitir uso de item durante o turno do jogador
		if (currentTurn !== playerName) {
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					sender: "System",
					text: "Não é o seu turno para usar itens!",
					time: formatTime(),
				},
			]);
			return;
		}

		// Lógica para usar item (por exemplo, restaurar HP)
		if (itemName === "Poção") {
			const hpRestored = 20;

			// Atualizar HP do jogador
			setPlayerStats((prev) => ({
				...prev,
				hp: Math.min(prev.hp + hpRestored, prev.maxHp),
			}));

			// Enviar ação para o servidor
			socket.emit("performAction", {
				roomId: roomCode,
				playerName,
				actionType: "use_item",
				currentTurn,
				gameState: "combat",
				itemName,
				hpRestored,
				message: `${playerName} usou uma Poção e recuperou ${hpRestored} de HP!`,
			});

			// Adicionar mensagem local
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					sender: "System",
					text: `Você usou uma Poção e recuperou ${hpRestored} de HP!`,
					time: formatTime(),
				},
			]);

			// Registrar evento
			recordBattleEvent("item_used", {
				player: playerName,
				item: itemName,
				effect: `Restaurou ${hpRestored} HP`,
			});
		}
	};

	const endTurn = () => {
		// Somente permitir finalizar o próprio turno
		if (currentTurn !== playerName) {
			return;
		}

		// Encontrar o próximo jogador na ordem de iniciativa
		const sortedPlayers = [...players].sort((a, b) => b.initiative - a.initiative);
		const currentIndex = sortedPlayers.findIndex((p) => p.name === playerName);
		const nextIndex = (currentIndex + 1) % sortedPlayers.length;
		const nextPlayer = sortedPlayers[nextIndex];

		// Atualizar o turno atual
		setCurrentTurn(nextPlayer.name);

		// Enviar atualização para o servidor
		socket.emit("updateGameState", {
			roomId: roomCode,
			gameState: "combat",
			currentTurn: nextPlayer.name,
		});

		// Adicionar mensagem local
		setMessages((prev) => [
			...prev,
			{
				id: Date.now().toString(),
				sender: "System",
				text: `Turno finalizado. Agora é a vez de ${nextPlayer.name}!`,
				time: formatTime(),
			},
		]);

		// Registrar evento
		recordBattleEvent("turn_ended", {
			player: playerName,
			nextPlayer: nextPlayer.name,
		});
	};

	// Adicionar esta nova função para iniciar o combate após as rolagens de iniciativa
	const startCombat = () => {
		if (!isHost) return;

		// Ordenar jogadores por iniciativa
		const sortedPlayers = [...players].sort((a, b) => b.initiative - a.initiative);

		// Verificar se pelo menos um jogador rolou iniciativa
		const anyPlayerRolled = sortedPlayers.some((p) => p.initiative > 0);

		if (!anyPlayerRolled) {
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					sender: "System",
					text: "Pelo menos um jogador precisa rolar iniciativa para iniciar o combate!",
					time: formatTime(),
				},
			]);
			return;
		}

		// Definir o primeiro jogador (o que tem a maior iniciativa)
		const firstPlayer = sortedPlayers[0];
		setCurrentTurn(firstPlayer.name);

		// Atualizar estado do jogo
		socket.emit("updateGameState", {
			roomId: roomCode,
			gameState: "combat",
			currentTurn: firstPlayer.name,
		});

		// Adicionar mensagem
		setMessages((prev) => [
			...prev,
			{
				id: Date.now().toString(),
				sender: "System",
				text: `O combate começa! ${firstPlayer.name} tem o primeiro turno com iniciativa ${firstPlayer.initiative}!`,
				time: formatTime(),
			},
		]);
	};

	// Adicionar event listeners para eventos de batalha
	useEffect(() => {
		if (!socket) return;

		// Ouvir início de jogo
		socket.on("gameStarted", (initialGameState) => {
			setBattleStarted(true);
			setGameState(initialGameState);

			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					sender: "System",
					text: "A batalha começou! Todos os jogadores devem rolar iniciativa.",
					time: formatTime(),
				},
			]);
		});

		// Ouvir mensagens de chat de outros jogadores
		socket.on("messageReceived", (data) => {
			console.log("Mensagem recebida:", data);

			// Ignorar mensagens enviadas pelo próprio usuário para evitar duplicação
			if (data.sender !== playerName) {
				setMessages((prev) => [
					...prev,
					{
						id: Date.now().toString(),
						sender: data.sender,
						text: data.text,
						time: data.time || formatTime(),
					},
				]);
			}
		});

		// Ouvir atualizações de estado do jogo
		socket.on("gameStateUpdated", (data) => {
			console.log("Game state updated:", data);
			setGameState(data.gameState);

			// Se recebemos uma atualização de iniciativa, atualizamos o jogador
			if (data.playerInitiative) {
				console.log("Recebido iniciativa de jogador:", data.playerInitiative);

				// Versão para produção: apenas atualizar se for de outro jogador
				// para evitar duplicação quando o mesmo jogador envia e recebe eventos
				if (data.playerInitiative.name !== playerName) {
					// Atualizar a lista de jogadores com a nova iniciativa
					setPlayers((prev) =>
						prev.map((p) =>
							p.name === data.playerInitiative.name ? { ...p, initiative: data.playerInitiative.initiative } : p,
						),
					);

					// Adicionar mensagem no chat sobre a rolagem
					setMessages((prev) => [
						...prev,
						{
							id: Date.now().toString(),
							sender: "System",
							text: `${data.playerInitiative.name} rolou iniciativa: ${data.playerInitiative.initiative}`,
							time: formatTime(),
						},
					]);
				}
			}

			// Se recebemos uma atualização de turno, atualizamos o turno atual
			if (data.currentTurn) {
				setCurrentTurn(data.currentTurn);
			}
		});

		// Ouvir ações de outros jogadores
		socket.on("actionPerformed", (data) => {
			// Adicionar mensagem sobre a ação
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					sender: "System",
					text: data.message,
					time: formatTime(),
				},
			]);

			// Atualizar o estado do jogo
			if (data.gameState) {
				setGameState(data.gameState);
			}

			// Atualizar o turno atual
			if (data.currentTurn) {
				setCurrentTurn(data.currentTurn);
			}

			// Se for uma ação de ataque contra este jogador, tratar o ataque
			if (data.actionType === "attack" && data.targetPlayer === playerName) {
				// Lógica para receber dano
				// Será implementada depois
			}
		});

		return () => {
			socket.off("gameStarted");
			socket.off("messageReceived");
			socket.off("gameStateUpdated");
			socket.off("actionPerformed");
		};
	}, [socket, playerName]);

	// Corrigir o useEffect para rolagem do chat
	useEffect(() => {
		if (messages.length > 0) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages.length]);

	return (
		<div className="flex flex-col h-screen p-4">
			<header className="flex justify-between items-center mb-4 p-4 bg-card rounded-lg">
				<div>
					<h1 className="text-2xl font-bold">Sala de Batalha</h1>
					<p className="text-muted-foreground">Código: {roomCode}</p>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm bg-primary/10 px-2 py-1 rounded">{isHost ? "Anfitrião" : "Jogador"}</span>
					<span className="font-medium">{playerName}</span>
					<span className="text-xs bg-secondary/30 px-2 py-1 rounded">{characterClass}</span>
				</div>
			</header>

			<div className="grid md:grid-cols-3 gap-4 flex-1 overflow-hidden">
				{/* Player info column */}
				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Seu Personagem</CardTitle>
							{characterClass && <CardDescription>{characterClass}</CardDescription>}
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span>HP:</span>
									<div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
										<div
											className="h-full bg-green-500"
											style={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
										/>
									</div>
									<span>
										{playerStats.hp}/{playerStats.maxHp}
									</span>
								</div>
								<div className="flex justify-between">
									<span>MP:</span>
									<div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
										<div
											className="h-full bg-blue-500"
											style={{ width: `${(playerStats.mp / playerStats.maxMp) * 100}%` }}
										/>
									</div>
									<span>
										{playerStats.mp}/{playerStats.maxMp}
									</span>
								</div>
								{gameState !== "waiting" && (
									<div className="flex justify-between mt-2">
										<span>Iniciativa:</span>
										<span>{playerStats.initiative}</span>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Painel de Batalha */}
					<Card>
						<CardHeader>
							<CardTitle>Status da Batalha</CardTitle>
						</CardHeader>
						<CardContent>
							{!battleStarted ? (
								isHost ? (
									<Button onClick={startBattle} className="w-full">
										Iniciar Batalha
									</Button>
								) : (
									<p className="text-center text-muted-foreground">Aguardando o anfitrião iniciar a batalha...</p>
								)
							) : (
								<div className="space-y-4">
									<div>
										<p className="text-sm font-medium mb-1">
											Estado:
											<span className="ml-2 text-primary">
												{gameState === "waiting" && "Aguardando"}
												{gameState === "rolling_initiative" && "Rolando Iniciativa"}
												{gameState === "combat" && "Combate"}
												{gameState === "ended" && "Finalizado"}
											</span>
										</p>

										{gameState === "combat" && (
											<p className="text-sm font-medium">
												Turno atual: <span className="text-primary">{currentTurn}</span>
												{currentTurn === playerName && (
													<span className="ml-2 text-green-500 font-bold">(Sua vez!)</span>
												)}
											</p>
										)}
									</div>

									{gameState === "rolling_initiative" && (
										<>
											{playerStats.initiative === 0 ? (
												<Button onClick={rollInitiative} variant="secondary" className="w-full">
													Rolar Iniciativa
												</Button>
											) : (
												<p className="text-center text-muted-foreground">
													Iniciativa rolada: {playerStats.initiative}
													<br />
													Aguardando outros jogadores...
												</p>
											)}

											{/* Exibir status dos jogadores que já rolaram */}
											<div className="mt-4 space-y-2">
												<p className="text-sm font-medium">Status de Iniciativa:</p>
												{players.map((player) => (
													<div key={player.id || player.characterId} className="text-sm flex justify-between">
														<span>{player.name}</span>
														{player.initiative > 0 ? (
															<span className="text-primary">Rolou: {player.initiative}</span>
														) : (
															<span className="text-muted-foreground">Aguardando...</span>
														)}
													</div>
												))}
											</div>

											{/* Botão para o host iniciar o combate */}
											{isHost && (
												<Button
													onClick={startCombat}
													className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500"
												>
													Iniciar Combate
												</Button>
											)}
										</>
									)}

									{gameState === "combat" && currentTurn === playerName && (
										<div className="space-y-2">
											<p className="text-sm font-medium">Ações disponíveis:</p>
											<div className="grid grid-cols-2 gap-2">
												<Button onClick={performAttack} variant="destructive" size="sm">
													Atacar
												</Button>
												<Button onClick={() => useItem("Poção")} variant="outline" size="sm">
													Usar Poção
												</Button>
												<Button onClick={endTurn} variant="secondary" size="sm" className="col-span-2">
													Finalizar Turno
												</Button>
											</div>
										</div>
									)}

									{gameState === "combat" && currentTurn !== playerName && (
										<p className="text-center text-muted-foreground">Aguardando o turno de {currentTurn}...</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Lista de Jogadores */}
					<Card>
						<CardHeader>
							<CardTitle>Jogadores ({players.length})</CardTitle>
						</CardHeader>
						<CardContent>
							{players.length === 0 ? (
								<p className="text-center text-muted-foreground">Nenhum jogador conectado.</p>
							) : (
								<div className="space-y-2">
									{players.map((player, index) => (
										<div
											key={player.id || player.characterId || index}
											className={`flex justify-between items-center p-2 rounded ${
												currentTurn === player.name ? "bg-primary/10" : ""
											}`}
										>
											<div className="flex items-center gap-2">
												<div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
													{player.name[0].toUpperCase()}
												</div>
												<div>
													<span className="font-medium">{player.name}</span>
													{player.characterClass && (
														<span className="ml-2 text-xs bg-secondary/20 px-1 rounded">{player.characterClass}</span>
													)}
													{player.isHost && <span className="ml-1 text-xs bg-amber-500/20 px-1 rounded">Host</span>}
												</div>
											</div>
											{gameState !== "waiting" && (
												<div className="text-sm">
													{player.initiative > 0 ? (
														<span className="text-primary">Ini: {player.initiative}</span>
													) : (
														<span className="text-muted-foreground">Aguardando...</span>
													)}
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Removido o card de Inventário original e colocado botão de compartilhar no final */}
					{battleStarted ? null : (
						<Card>
							<CardHeader>
								<CardTitle>Compartilhar</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm mb-2">Compartilhe o código da sala para que outros jogadores possam entrar:</p>
								<div className="flex gap-2">
									<Input value={roomCode} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
									<Button
										onClick={() => {
											navigator.clipboard.writeText(roomCode);
											alert("Código copiado!");
										}}
									>
										Copiar
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Chat column (resto do código mantido igual) */}
				<div className="md:col-span-2 flex flex-col">
					<Card className="flex-1 flex flex-col">
						<CardHeader>
							<CardTitle>Chat de Batalha</CardTitle>
						</CardHeader>
						<CardContent className="flex-1 overflow-y-auto max-h-[400px]">
							<div className="space-y-4">
								{messages.length === 0 ? (
									<p className="text-center text-muted-foreground">Nenhuma mensagem ainda. Comece a conversa!</p>
								) : (
									messages.map((msg) => (
										<div key={msg.id} className="flex space-x-2">
											<div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
												{msg.sender[0].toUpperCase()}
											</div>
											<div>
												<div className="flex items-center gap-2">
													<span className="font-medium">{msg.sender}</span>
													<span className="text-xs text-muted-foreground">{msg.time}</span>
												</div>
												<p>{msg.text}</p>
											</div>
										</div>
									))
								)}
								<div ref={messagesEndRef} />
							</div>
						</CardContent>
						<div className="p-4 border-t">
							<form onSubmit={(e) => sendMessage(e)} className="flex gap-2">
								<Input
									value={chatMessage}
									onChange={(e) => setChatMessage(e.target.value)}
									placeholder="Digite sua mensagem..."
									className="flex-1"
								/>
								<Button type="submit">Enviar</Button>
							</form>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
