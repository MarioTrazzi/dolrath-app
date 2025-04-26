"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/utils";
import { useSocket } from "../components/SocketProvider";
import React from "react";

// Define o tipo Player explicitamente
interface Player {
	id: string;
	name: string;
	characterName: string;
	characterClass: string;
	isHost: boolean;
	maxHP: number;
	currentHP: number;
	maxMP: number;
	currentMP: number;
	initiative: number;
	isReady: boolean;
	avatarUrl: string;
	socketId?: string;
}

// Definir interfaces para os diferentes tipos de dados de eventos
interface ChatMessageData {
	sender: string;
	content: string;
	timestamp: number;
	isSystem?: boolean;
	id?: string;
	isLocal?: boolean;
}

interface PlayerJoinedData {
	player: Player;
	message: string;
}

interface GameStateData {
	players: Player[];
	currentTurn: string;
	battleStarted: boolean;
	battleEnded: boolean;
	state: string;
	playerInitiative?: {
		name: string;
		initiative: number;
	};
}

interface RollResultData {
	player: string;
	roll: number;
	sides: number;
	modifier: number;
	total: number;
	description: string;
}

interface ActionResultData {
	attacker: string;
	defender: string;
	action: string;
	damage: number;
	description: string;
	gameState?: {
		state: string;
		currentTurn: string;
	};
}

interface PlayerStatsUpdateData {
	playerId: string;
	currentHP: number;
	maxHP: number;
	currentMP: number;
	maxMP: number;
}

// Adicionamos uma interface para o estado inicial do jogo
interface GameStartedData {
	gameState: {
		state: string;
		currentTurn?: string;
	};
}

// Interface para mensagens recebidas
interface MessageReceivedData {
	sender: string;
	content: string;
	isSystem: boolean;
	timestamp: number;
	messageId?: string;
}

// Interface para atualização do estado do jogo
interface GameStateUpdatedData {
	gameState: string;
	currentTurn: string;
	playerInitiative?: {
		name: string;
		initiative: number;
	};
}

// Interface para ações realizadas
interface ActionPerformedData {
	player: string;
	playerName: string;
	action: string;
	target?: string;
	result: string;
	message?: string;
	gameState?: {
		state: string;
		currentTurn?: string;
	};
	actionType?: string;
	targetPlayer?: string;
	currentTurn?: string;
	attackRoll?: number;
}

// Add missing interfaces for event handlers
interface DiceRolledData {
	playerName: string;
	result: number;
	faces: number;
	sides?: number;
	modifier?: number;
	total?: number;
	description?: string;
}

interface DefenseChosenData {
	defenderName: string;
	defenseType: string;
	gameState?: string;
	message?: string;
}

interface CombatResolvedData {
	player1: Player;
	player2: Player;
	gameState?: string;
	currentTurn?: string;
	attackRoll?: number;
	defenseRoll?: number;
}

interface HostChangedData {
	newHost: Player;
	players: Player[];
}

// Definir tipos para event handlers e parâmetros de eventos específicos
type ChatMessageHandler = (data: ChatMessageData) => void;
type PlayerJoinedHandler = (data: PlayerJoinedData) => void;
type GameStateHandler = (data: GameStateData) => void;
type PlayerLeftHandler = (data: { id: string }) => void;
type RollResultHandler = (data: RollResultData) => void;
type ActionResultHandler = (data: ActionResultData) => void;
type PlayerStatsUpdateHandler = (data: PlayerStatsUpdateData) => void;

export default function BattlePage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const { socket, isConnected } = useSocket();

	const [isHost, setIsHost] = useState(false);

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
	const roomCodeParam = searchParams?.get("room") || "unknown";
	// Garantir que o código da sala esteja em maiúsculas
	const roomCode = roomCodeParam.toUpperCase();
	const playerName = searchParams?.get("name") || "Guest";
	const isHost = searchParams?.get("isHost") === "true";
	const characterId = searchParams?.get("characterId") || null;
	const characterClass = searchParams?.get("characterClass") || "Desconhecido";

	// Adicionar log para verificar o código da sala
	console.log(`Conectando à sala: ${roomCode}, Nome: ${playerName}, Host: ${isHost}`);

	// Adicionando o hook useSocket para ter acesso ao socket
	const { socket, isConnected } = useSocket();

	// Game state management
	const [chatMessage, setChatMessage] = useState("");
	const [messages, setMessages] = useState<ChatMessageData[]>([]);
	const [gameState, setGameState] = useState("waiting");
	const [currentTurn, setCurrentTurn] = useState("");
	const [battleStarted, setBattleStarted] = useState(false);
	const [battleEnded, setBattleEnded] = useState(false);
	const [players, setPlayers] = useState<Player[]>([]);
	const [selectedAction, setSelectedAction] = useState("");
	const [selectedTarget, setSelectedTarget] = useState("");
	const [showInitiativeRoll, setShowInitiativeRoll] = useState(false);
	const [diceRollResult, setDiceRollResult] = useState<number | null>(null);
	const [playerStats, setPlayerStats] = useState({
		hp: 100,
		maxHp: 100,
		mp: 80,
		maxMp: 80,
		initiative: 0,
		characterId: characterId || "",
		characterClass: characterClass || "",
	});

	// Join the socket.io room when the component mounts
	const hasJoinedRef = React.useRef(false);

	// Adicionar uma referência para o contêiner de mensagens
	const messagesEndRef = React.useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!socket || !roomCode || !playerName || hasJoinedRef.current) return;

		hasJoinedRef.current = true;

		if (socket) {
			console.log("Tentando entrar na sala:", roomCode);

			// Adicionar o usuário atual à lista de jogadores
			// Isso garante que pelo menos o jogador local sempre apareça na lista
			const currentPlayer: Player = {
				id: socket.id || `local-${Date.now()}`,
				name: playerName,
				characterName: playerName,
				characterClass: characterClass || "Desconhecido",
				isHost: isHost,
				maxHP: 100,
				currentHP: 100,
				maxMP: 80,
				currentMP: 80,
				initiative: 0,
				isReady: false,
				avatarUrl: "",
				socketId: socket.id,
			};

			// Verificar se o jogador já existe na lista antes de adicionar
			setPlayers((prevPlayers) => {
				if (!prevPlayers.some((p) => p.name === playerName)) {
					return [...prevPlayers, currentPlayer];
				}
				return prevPlayers;
			});

			// Handlers de debug em ambiente de desenvolvimento
			if (process.env.NODE_ENV !== "production") {
				socket.onAny((event, ...args) => {
					console.log(`[DEBUG] Socket event: ${event}`, args);
				});
			}

			// Handler para evento connect
			socket.on("connect", () => {
				console.log("Conectado ao servidor socket.io com ID:", socket.id);

				setMessages((prev) => [
					...prev,
					{
						sender: "System",
						content: `Conectado ao servidor (ID: ${socket.id})`,
						isSystem: true,
						timestamp: Date.now(),
					},
				]);
			});

			// Adicionar handlers para monitorar problemas de conexão
			socket.on("connect_error", (error) => {
				console.error("Erro de conexão:", error.message);
				setMessages((prev) => [
					...prev,
					{
						sender: "System",
						content: `Erro de conexão: ${error.message}`,
						isSystem: true,
						timestamp: Date.now(),
					},
				]);
			});

			socket.on("disconnect", (reason) => {
				console.log("Desconectado do servidor. Motivo:", reason);
				setMessages((prev) => [
					...prev,
					{
						sender: "System",
						content: `Desconectado do servidor: ${reason}`,
						isSystem: true,
						timestamp: Date.now(),
					},
				]);
			});

			socket.io.on("reconnect_attempt", (attempt) => {
				console.log(`Tentativa de reconexão #${attempt}`);
			});

			socket.io.on("reconnect", (attempt) => {
				console.log(`Reconectado após ${attempt} tentativas`);
				setMessages((prev) => [
					...prev,
					{
						sender: "System",
						content: `Reconectado ao servidor após ${attempt} tentativas`,
						isSystem: true,
						timestamp: Date.now(),
					},
				]);
			});

			// Modificado: alterando de roomCode para roomId para compatibilidade com o servidor
			socket.emit("joinRoom", {
				roomId: roomCode, // Alterado de roomCode para roomId
				playerName,
				isHost,
				characterId,
				characterClass,
				playerStats,
			});

			// Adicionar listener para erros do servidor
			socket.on("error", (error) => {
				console.error("Erro no servidor:", error);
				setMessages((prevMessages) => [
					...prevMessages,
					{
						sender: "System",
						content: `Erro: ${error.message || "Falha ao conectar à sala"}`,
						isSystem: true,
						timestamp: Date.now(),
					},
				]);
			});

			// Handle player joined
			const handlePlayerJoined: PlayerJoinedHandler = (data) => {
				// Verificar se os dados são válidos
				if (!data || !data.player) {
					console.error("Dados inválidos recebidos em handlePlayerJoined:", data);
					return;
				}

				// Garantir que o jogador tenha um ID e nome
				const player = {
					...data.player,
					id: data.player.id || `temp-${Date.now()}-${Math.random()}`,
					name: data.player.name || "Jogador desconhecido",
				};

				setPlayers((prevPlayers) => {
					// Se o jogador já existe, não adicione novamente
					if (prevPlayers.some((p) => p.id === player.id)) {
						return prevPlayers;
					}
					return [...prevPlayers, player];
				});

				// Se o jogador atual for o host, atualize os jogadores existentes para o novo jogador
				if (isHost) {
					setTimeout(() => {
						socket.emit("updatePlayersToNewJoiner", {
							roomId: roomCode, // Corrigido: roomCode → roomId
							players,
							gameState,
							currentTurn,
						});
					}, 500);
				}

				// Adicione mensagem de chat
				setMessages((prevMessages) => [
					...prevMessages,
					{
						sender: "System",
						content: `${player.name} entrou na sala.`,
						isSystem: true,
						timestamp: Date.now(),
					},
				]);
			};

			// Função para enviar mensagem
			const sendMessage = () => {
				if (!chatMessage.trim()) return;

				// ID único para a mensagem local
				const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

				// Adicionar a mensagem localmente com flag isLocal para identificar depois
				const newMessage: ChatMessageData = {
					sender: playerName,
					content: chatMessage,
					timestamp: Date.now(),
					isSystem: false,
					isLocal: true,
					id: messageId,
				};

				setMessages((prev) => [...prev, newMessage]);
				setChatMessage("");

				// Enviar para o servidor
				if (socket) {
					socket.emit("chatMessage", {
						roomId: roomCode,
						sender: playerName,
						text: chatMessage,
						messageId: messageId,
					});
				}
			};

			// Manipulador para mensagens recebidas
			const handleChatMessage = (data: {
				sender?: string;
				text?: string;
				time?: number;
				messageId?: string;
			}) => {
				console.log("Mensagem recebida:", data);

				if (!data) {
					console.error("Dados de mensagem inválidos");
					return;
				}

				const sender = data.sender || "Desconhecido";
				const text = data.text || "";
				const time = data.time || Date.now();
				const messageId = data.messageId;

				// Verificar se a mensagem já existe (enviada localmente)
				const messageExists = messages.some(
					(msg) => msg.id === messageId || (msg.isLocal && msg.sender === sender && msg.content === text),
				);

				if (!messageExists) {
					setMessages((prev) => [
						...prev,
						{
							sender,
							content: text,
							timestamp: time,
							isSystem: false,
							id: messageId || `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
						} as ChatMessageData,
					]);
				} else {
					console.log("Mensagem ignorada (duplicada):", data);
				}
			};

			// Handle game state update
			const handleGameState: GameStateHandler = (data) => {
				setGameState(data.state);
				setCurrentTurn(data.currentTurn);

				if (data.state === "combat") {
					setBattleStarted(true);
				}
			};

			// Handle player updates from host
			socket.on("updateAllPlayers", (allPlayers: PlayerJoinedData[]) => {
				setPlayers(allPlayers.map((data) => data.player));
			});

			// Handle roll result
			const handleRollResult: RollResultHandler = (data) => {
				// Adicione mensagem de chat para o resultado da rolagem
				setMessages((prevMessages) => [
					...prevMessages,
					{
						sender: "System",
						content: `${data.player} rolou ${data.roll} para ${data.description}.`,
						isSystem: true,
						timestamp: Date.now(),
					},
				]);

				// Se for uma rolagem de iniciativa, atualize o jogador
				if (data.description === "iniciativa" && isHost) {
					setPlayers((prevPlayers) =>
						prevPlayers.map((player) => (player.name === data.player ? { ...player, initiative: data.roll } : player)),
					);
				}
			};

			// Handle the performed action
			const handleActionResult: ActionResultHandler = (data) => {
				let messageText = `${data.attacker} usou ${data.action} em ${data.defender}`;

				if (data.damage) {
					messageText += ` causando ${data.damage} de dano`;
				}

				setMessages((prevMessages) => [
					...prevMessages,
					{
						sender: "System",
						content: messageText,
						isSystem: true,
						timestamp: Date.now(),
					},
				]);

				// Atualizar o estado do jogo
				if (data.gameState) {
					setGameState(data.gameState.state);
					setCurrentTurn(data.gameState.currentTurn);
				}
			};

			// Handle player stats update
			const handlePlayerStatsUpdate: PlayerStatsUpdateHandler = (data) => {
				setPlayers((prevPlayers) =>
					prevPlayers.map((player) =>
						player.id === data.playerId ? { ...player, currentHP: data.currentHP, currentMP: data.currentMP } : player,
					),
				);

				// Se o ID do jogador for o do cliente atual, também atualize os stats locais
				if (data.playerId === socket.id) {
					setPlayerStats((prevStats) => ({
						...prevStats,
						hp: data.currentHP,
						mp: data.currentMP,
					}));
				}
			};

			// Handle player disconnected
			const handlePlayerLeft: PlayerLeftHandler = (data) => {
				const disconnectedPlayer = players.find((p) => p.id === data.id);

				if (disconnectedPlayer) {
					setMessages((prevMessages) => [
						...prevMessages,
						{
							sender: "System",
							content: `${disconnectedPlayer.name} saiu da sala.`,
							isSystem: true,
							timestamp: Date.now(),
						},
					]);

					setPlayers((prevPlayers) => prevPlayers.filter((p) => p.id !== data.id));
				}
			};

			// Adicionando os event listeners corretos que correspondem aos eventos do servidor
			socket.on("playerJoined", handlePlayerJoined);
			socket.on("messageReceived", handleChatMessage);
			socket.on("playerLeft", handlePlayerLeft);

			// No cleanup, adicionar a remoção de todos os eventos
			return () => {
				// Eventos corretos para remover
				socket.off("playerJoined");
				socket.off("messageReceived");
				socket.off("playerLeft");
				socket.off("error");
				socket.off("connect");
				socket.off("connect_error");
				socket.off("disconnect");

				// Se o socket.io existir, remover eventos dele também
				if (socket.io) {
					socket.io.off("reconnect_attempt");
					socket.io.off("reconnect");
				}
			};
		}
	}, [socket, roomCode, playerName, isHost, characterId, characterClass, playerStats, players, gameState, currentTurn]);

	// Record battle event to history
	const recordBattleEvent = async (event: {
		type: string;
		data: Record<string, unknown>;
	}) => {
		try {
			const response = await fetch("/api/battleHistory", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					roomCode,
					event,
				}),
			});

			if (!response.ok) {
				console.error("Failed to record battle event");
			}
		} catch (error) {
			console.error("Error recording battle event:", error);
		}
	};

	// Funções de batalha
	const startBattle = () => {
		if (!isHost) return;

		// Iniciar a batalha
		setBattleStarted(true);
		setGameState("rolling_initiative");

		// Informar ao servidor
		if (socket) {
			socket.emit("startGame", {
				roomId: roomCode, // Corrigido: roomCode → roomId
				initialGameState: "rolling_initiative",
			});
		}

		// Adicionar mensagem de sistema
		setMessages((prev) => [
			...prev,
			{
				sender: "System",
				content: "A batalha começou! Todos os jogadores devem rolar iniciativa.",
				isSystem: true,
				timestamp: Date.now(),
			},
		]);

		// Registrar evento
		recordBattleEvent({
			type: "battle_started",
			data: { initiator: playerName },
		});
	};

	// Função para rolar iniciativa
	const rollInitiative = () => {
		const result = Math.floor(Math.random() * 20) + 1;
		console.log(`${playerName} rolou iniciativa: ${result}`);

		// Atualizar iniciativa do jogador localmente
		setPlayerStats((prev) => ({
			...prev,
			initiative: result,
		}));

		// Atualizar na lista de jogadores local
		setPlayers((prev) => prev.map((p) => (p?.name === playerName ? { ...p, initiative: result } : p)));

		// Enviar resultado para o servidor através de múltiplos eventos para garantir que todos recebam
		if (socket) {
			// 1. Enviar rolagem de dados
			socket.emit("rollDice", {
				roomId: roomCode,
				playerName,
				faces: 20,
				result,
				description: "iniciativa",
				gameState: "rolling_initiative",
			});

			// 2. Enviar atualização de estado do jogo com a iniciativa
			socket.emit("updateGameState", {
				roomId: roomCode,
				gameState: "rolling_initiative",
				playerInitiative: {
					name: playerName,
					initiative: result,
				},
			});

			// Esperar um momento e reenviar para garantir que foi recebido
			setTimeout(() => {
				socket.emit("updateGameState", {
					roomId: roomCode,
					gameState: "rolling_initiative",
					playerInitiative: {
						name: playerName,
						initiative: result,
					},
				});
			}, 500);
		}

		// Adicionar mensagem local
		setMessages((prev) => [
			...prev,
			{
				sender: "System",
				content: `${playerName} rolou iniciativa: ${result}`,
				isSystem: true,
				timestamp: Date.now(),
			},
		]);

		// Registrar evento
		recordBattleEvent({
			type: "initiative_rolled",
			data: { player: playerName, result },
		});
	};

	const performAttack = () => {
		// Somente permitir ataques durante o turno do jogador
		if (currentTurn !== playerName) {
			setMessages((prev) => [
				...prev,
				{
					sender: "System",
					content: "Não é o seu turno para atacar!",
					isSystem: true,
					timestamp: Date.now(),
				},
			]);
			return;
		}

		const attackRoll = Math.floor(Math.random() * 20) + 1;

		// Enviar ação para o servidor
		if (socket) {
			socket.emit("performAction", {
				roomId: roomCode, // Corrigido: roomCode → roomId
				playerName,
				actionType: "attack",
				currentTurn,
				gameState: "combat",
				attackRoll,
				message: `${playerName} realiza um ataque! (${attackRoll})`,
			});
		}

		// Adicionar mensagem local
		setMessages((prev) => [
			...prev,
			{
				sender: "System",
				content: `Você realiza um ataque! Rolagem: ${attackRoll}`,
				isSystem: true,
				timestamp: Date.now(),
			},
		]);

		// Registrar evento
		recordBattleEvent({
			type: "attack_performed",
			data: {
				player: playerName,
				roll: attackRoll,
			},
		});
	};

	const useItem = (itemName: string) => {
		// Somente permitir uso de item durante o turno do jogador
		if (currentTurn !== playerName) {
			setMessages((prev) => [
				...prev,
				{
					sender: "System",
					content: "Não é o seu turno para usar itens!",
					isSystem: true,
					timestamp: Date.now(),
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
			if (socket) {
				socket.emit("performAction", {
					roomId: roomCode, // Corrigido: roomCode → roomId
					playerName,
					actionType: "use_item",
					currentTurn,
					gameState: "combat",
					itemName,
					hpRestored,
					message: `${playerName} usou uma Poção e recuperou ${hpRestored} de HP!`,
				});
			}

			// Adicionar mensagem local
			setMessages((prev) => [
				...prev,
				{
					sender: "System",
					content: `Você usou uma Poção e recuperou ${hpRestored} de HP!`,
					isSystem: true,
					timestamp: Date.now(),
				},
			]);

			// Registrar evento
			recordBattleEvent({
				type: "item_used",
				data: {
					player: playerName,
					item: itemName,
					effect: `Restaurou ${hpRestored} HP`,
				},
			});
		}
	};

	const endTurn = () => {
		// Somente permitir finalizar o próprio turno
		if (currentTurn !== playerName) {
			return;
		}

		// Encontrar o próximo jogador na ordem de iniciativa
		const sortedPlayers = [...players].sort((a, b) => (b?.initiative || 0) - (a?.initiative || 0));

		// Verificar se há jogadores suficientes
		if (!sortedPlayers.length) {
			console.error("Não há jogadores suficientes para passar o turno");
			return;
		}

		const currentIndex = sortedPlayers.findIndex((p) => p?.name === playerName);
		const nextIndex = (currentIndex + 1) % sortedPlayers.length;
		const nextPlayer = sortedPlayers[nextIndex];

		if (!nextPlayer) {
			console.error("Não foi possível determinar o próximo jogador");
			return;
		}

		const nextPlayerName = nextPlayer?.name || "Desconhecido";

		// Atualizar o turno atual
		setCurrentTurn(nextPlayerName);

		// Enviar atualização para o servidor
		if (socket) {
			socket.emit("updateGameState", {
				roomId: roomCode, // Corrigido: roomCode → roomId
				gameState: "combat",
				currentTurn: nextPlayerName,
			});
		}

		// Adicionar mensagem local
		setMessages((prev) => [
			...prev,
			{
				sender: "System",
				content: `Turno finalizado. Agora é a vez de ${nextPlayerName}!`,
				isSystem: true,
				timestamp: Date.now(),
			},
		]);

		// Registrar evento
		recordBattleEvent({
			type: "turn_ended",
			data: {
				player: playerName,
				nextPlayer: nextPlayerName,
			},
		});
	};

	// Adicionar esta nova função para iniciar o combate após as rolagens de iniciativa
	const startCombat = () => {
		if (!isHost) return;

		// Ordenar jogadores por iniciativa
		const sortedPlayers = [...players].sort((a, b) => (b?.initiative || 0) - (a?.initiative || 0));

		// Verificar se pelo menos um jogador rolou iniciativa
		const anyPlayerRolled = sortedPlayers.some((p) => (p?.initiative || 0) > 0);

		if (!anyPlayerRolled) {
			setMessages((prev) => [
				...prev,
				{
					sender: "System",
					content: "Pelo menos um jogador precisa rolar iniciativa para iniciar o combate!",
					isSystem: true,
					timestamp: Date.now(),
				},
			]);
			return;
		}

		// Definir o primeiro jogador (o que tem a maior iniciativa)
		const firstPlayer = sortedPlayers[0];
		if (!firstPlayer) {
			console.error("Não foi possível encontrar o jogador com maior iniciativa");
			return;
		}

		const firstPlayerName = firstPlayer?.name || "Desconhecido";
		setCurrentTurn(firstPlayerName);

		// Atualizar estado do jogo
		if (socket) {
			socket.emit("updateGameState", {
				roomId: roomCode, // Corrigido: roomCode → roomId
				gameState: "combat",
				currentTurn: firstPlayerName,
			});
		}

		// Adicionar mensagem
		setMessages((prev) => [
			...prev,
			{
				sender: "System",
				content: `O combate começa! ${firstPlayerName} tem o primeiro turno com iniciativa ${firstPlayer?.initiative || 0}!`,
				isSystem: true,
				timestamp: Date.now(),
			},
		]);
	};

	// Adicionar event listeners para eventos de batalha
	useEffect(() => {
		if (socket && roomCode && playerName) {
			// Ouvir início de jogo
			const handleGameStarted = (initialGameState: GameStartedData) => {
				setGameState(initialGameState.gameState.state);
				setBattleStarted(true);
				setBattleEnded(false);

				// Only set currentTurn if it exists
				if (initialGameState.gameState.currentTurn) {
					setCurrentTurn(initialGameState.gameState.currentTurn);
				}

				setMessages((prev) => [
					...prev,
					{
						sender: "System",
						content: "A batalha começou!",
						isSystem: true,
						timestamp: Date.now(),
					},
				]);
			};

			// Ouvir mensagens de chat de outros jogadores
			const handleMessageReceived = (data: MessageReceivedData) => {
				// First, check if message is from current user (already displayed locally)
				if (data.sender === playerName) {
					return; // Skip messages from current user as they're already shown locally
				}

				// Check if the message with this ID already exists
				if (data.messageId && messages.some((msg) => msg.id === data.messageId)) {
					return; // Skip if message with this ID already exists
				}

				setMessages((prev) => [
					...prev,
					{
						sender: data.sender,
						content: data.content,
						isSystem: data.isSystem,
						timestamp: data.timestamp,
						id: data.messageId || `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
					},
				]);
			};

			// Ouvir atualizações de estado do jogo
			const handleGameStateUpdated = (data: GameStateUpdatedData) => {
				console.log("Estado do jogo atualizado:", data);

				// Atualizar o estado do jogo
				setGameState(data.gameState);

				// Atualizar a iniciativa do jogador, se fornecida
				if (data.playerInitiative) {
					console.log("Atualizando iniciativa do jogador:", data.playerInitiative);

					// Atualizar o estado do jogador na lista de jogadores
					setPlayers((prevPlayers) => {
						const updatedPlayers = prevPlayers.map((player) => {
							if (player?.name === data.playerInitiative?.name) {
								console.log(`Atualizando iniciativa de ${player.name} para ${data.playerInitiative.initiative}`);
								return {
									...player,
									initiative: data.playerInitiative.initiative,
								};
							}
							return player;
						});

						console.log("Lista de jogadores atualizada:", updatedPlayers);
						return updatedPlayers;
					});

					// Se for o jogador atual que rolou, atualizar também os stats locais
					if (data.playerInitiative.name === playerName) {
						setPlayerStats((prev) => ({
							...prev,
							initiative: data.playerInitiative?.initiative || 0,
						}));
					}
				}

				// Atualizar o turno atual, se fornecido
				if (data.currentTurn) {
					setCurrentTurn(data.currentTurn);
				}
			};

			// Ouvir ações de outros jogadores
			const handleActionPerformed = (data: ActionPerformedData) => {
				// Update game state
				if (data.gameState) {
					setGameState(data.gameState.state);
					if (data.gameState.currentTurn) {
						setCurrentTurn(data.gameState.currentTurn);
					}
				}

				// Add message to chat
				if (data.message) {
					setMessages((prev) => [
						...prev,
						{
							sender: "System",
							content: data.message || "", // Provide empty string as fallback
							isSystem: true,
							timestamp: Date.now(),
						},
					]);
				}

				// Check if it's an attack and add specific message
				if (data.actionType === "attack" && data.targetPlayer) {
					const message = `${data.playerName} atacou ${data.targetPlayer} com ${data.attackRoll || 0}`;
					setMessages((prev) => [
						...prev,
						{
							sender: "System",
							content: message,
							isSystem: true,
							timestamp: Date.now(),
						},
					]);
				}
			};

			const handleDiceRolled = (data: DiceRolledData) => {
				// Add dice roll message
				setMessages((prev) => [
					...prev,
					{
						sender: "System",
						content: `${data.playerName} rolou ${data.result} no dado de ${data.faces} faces`,
						isSystem: true,
						timestamp: Date.now(),
					},
				]);
			};

			const handleDefenseChosen = (data: DefenseChosenData) => {
				// Add defense chosen message
				setMessages((prev) => [
					...prev,
					{
						sender: "System",
						content: `${data.defenderName} escolheu ${data.defenseType} como defesa`,
						isSystem: true,
						timestamp: Date.now(),
					},
				]);

				// Update game state if provided
				if (data.gameState) {
					setGameState(data.gameState);
				}
			};

			const handleCombatResolved = (data: CombatResolvedData) => {
				// Update players state with combat results
				if (data.player1 && data.player2) {
					setPlayers((prevPlayers) =>
						prevPlayers.map((player) => {
							if (player.name === data.player1.name) {
								return { ...player, currentHP: data.player1.currentHP, currentMP: data.player1.currentMP };
							}
							if (player.name === data.player2.name) {
								return { ...player, currentHP: data.player2.currentHP, currentMP: data.player2.currentMP };
							}
							return player;
						}),
					);
				}

				// Update game state
				if (data.gameState) {
					setGameState(data.gameState);
				}

				// Update current turn
				if (data.currentTurn) {
					setCurrentTurn(data.currentTurn);
				}
			};

			const handleHostChanged = (data: HostChangedData) => {
				// Verificar se os dados são válidos
				if (!data || !data.newHost) {
					console.error("Dados inválidos recebidos em handleHostChanged:", data);
					return;
				}

				// Update host status with safe check
				if (Array.isArray(data.players)) {
					setPlayers(data.players.filter((player) => player !== null && player !== undefined));
				}

				// Add message about host change with safe check
				const hostName = data.newHost?.name || "Desconhecido";
				setMessages((prev) => [
					...prev,
					{
						sender: "System",
						content: `${hostName} é o novo host da sala`,
						isSystem: true,
						timestamp: Date.now(),
					},
				]);
			};

			// Register event listeners
			socket.on("gameStarted", handleGameStarted);
			socket.on("messageReceived", handleMessageReceived);
			socket.on("gameStateUpdated", handleGameStateUpdated);
			socket.on("actionPerformed", handleActionPerformed);
			socket.on("diceRolled", handleDiceRolled);
			socket.on("defenseChosen", handleDefenseChosen);
			socket.on("combatResolved", handleCombatResolved);
			socket.on("hostChanged", handleHostChanged);

			// Cleanup function to remove event listeners
			return () => {
				socket.off("gameStarted");
				socket.off("messageReceived");
				socket.off("gameStateUpdated");
				socket.off("actionPerformed");
				socket.off("diceRolled");
				socket.off("defenseChosen");
				socket.off("combatResolved");
				socket.off("hostChanged");
				socket.off("error");
				socket.off("playerJoined");
				socket.off("playerLeft");
			};
		}
	}, [socket, roomCode, playerName]);

	// Corrigir o useEffect para rolagem do chat
	useEffect(() => {
		if (messages.length > 0) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages.length]);

	const formatChatPlayerList = () => {
		const formatPlayer = (player: Player) => {
			// Verificar se o jogador é válido para evitar erros
			if (!player) {
				return null;
			}

			// Garantir que o objeto player tenha uma propriedade name válida
			const playerName = player.name || "Jogador desconhecido";

			const isCurrentPlayer = playerName === searchParams?.get("name");
			const isCurrentTurnPlayer = playerName === currentTurn;

			let nameDisplay = playerName;
			if (player.isHost) nameDisplay += " (Mestre)";
			if (isCurrentPlayer) nameDisplay += " (Você)";
			if (isCurrentTurnPlayer) nameDisplay += " ⭐";

			return (
				<div
					key={player.id || `player-${playerName}`}
					className={`flex items-center justify-between p-2 ${
						isCurrentTurnPlayer ? "bg-amber-100 dark:bg-amber-950" : ""
					}`}
				>
					<div className="flex items-center">
						<div className="w-8 h-8 mr-2 bg-purple-200 rounded-full flex items-center justify-center">
							{playerName.charAt(0).toUpperCase()}
						</div>
						<span>{nameDisplay}</span>
					</div>
					{gameState === "combat" && (
						<div className="text-xs">
							<div className="text-red-500">
								HP: {player.currentHP || 0}/{player.maxHP || 100}
							</div>
							<div className="text-blue-500">
								MP: {player.currentMP || 0}/{player.maxMP || 100}
							</div>
						</div>
					)}
				</div>
			);
		};

		return (
			<div className="space-y-1">
				{players.filter((player) => player !== null && player !== undefined).map((player) => formatPlayer(player))}
			</div>
		);
	};

	// Return view
	return (
		<div className="flex flex-col h-screen p-2 md:p-4">
			<header className="flex justify-between items-center mb-4 p-2 md:p-4 bg-card rounded-lg">
				<div>
					<h1 className="text-xl md:text-2xl font-bold">Sala de Batalha</h1>
					<p className="text-muted-foreground">Código: {roomCode}</p>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-xs md:text-sm bg-primary/10 px-2 py-1 rounded">{isHost ? "Anfitrião" : "Jogador"}</span>
					<span className="font-medium text-sm md:text-base">{playerName}</span>
					<span className="text-xs bg-secondary/30 px-2 py-1 rounded">{characterClass}</span>
				</div>
			</header>

			{/* Mobile-friendly layout - The order of elements changes on small screens */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
				{/* Chat column - reordered to show up first on small screens */}
				<div className="order-1 md:order-2 md:col-span-2 flex flex-col">
					<Card className="flex-1 flex flex-col">
						<CardHeader className="py-2 md:py-4">
							<CardTitle>Chat de Batalha</CardTitle>
						</CardHeader>
						<CardContent className="flex-1 overflow-y-auto max-h-[300px] md:max-h-[400px]">
							<div className="space-y-4">
								{messages.length === 0 ? (
									<p className="text-center text-muted-foreground">Nenhuma mensagem ainda. Comece a conversa!</p>
								) : (
									messages.map((msg) => (
										<div key={msg.timestamp} className="flex space-x-2">
											<div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
												{msg.sender?.[0]?.toUpperCase() || "?"}
											</div>
											<div>
												<div className="flex items-center gap-2">
													<span className="font-medium">{msg.sender || "Sistema"}</span>
													<span className="text-xs text-muted-foreground">
														{formatTime(new Date(msg.timestamp || Date.now()))}
													</span>
												</div>
												<p className="break-words">{msg.content || ""}</p>
											</div>
										</div>
									))
								)}
								<div ref={messagesEndRef} />
							</div>
						</CardContent>
						<div className="p-2 md:p-4 border-t">
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

				{/* Player info column and game controls - reordered to show up second on small screens */}
				<div className="order-2 md:order-1 space-y-4">
					<Card>
						<CardHeader className="py-2 md:py-4">
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
						<CardHeader className="py-2 md:py-4">
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
													<div key={player.id || player.name} className="text-sm flex justify-between">
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
												<Button
													onClick={() => {
														// Change to not use the function name that starts with "use"
														// since it violates React Hook naming conventions
														const handleItemUse = (name: string) => {
															if (socket) {
																socket.emit("useItem", {
																	roomId: roomCode,
																	player: playerName,
																	itemName: name,
																});
															}
														};
														handleItemUse("Poção");
													}}
													variant="outline"
													size="sm"
												>
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
						<CardHeader className="py-2 md:py-4">
							<CardTitle>Jogadores ({players.length})</CardTitle>
						</CardHeader>
						<CardContent>
							{players.length === 0 ? (
								<p className="text-center text-muted-foreground">Nenhum jogador conectado.</p>
							) : (
								<div className="space-y-2">
									{players.map((player, index) => (
										<div
											key={player?.id || player?.name || index}
											className={`flex justify-between items-center p-2 rounded ${
												currentTurn === player?.name ? "bg-primary/10" : ""
											}`}
										>
											<div className="flex items-center gap-2">
												<div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
													{player?.name?.[0]?.toUpperCase() || "?"}
												</div>
												<div>
													<span className="font-medium">{player?.name || "Jogador desconhecido"}</span>
													{player?.characterClass && (
														<span className="ml-2 text-xs bg-secondary/20 px-1 rounded">{player?.characterClass}</span>
													)}
													{player?.isHost && <span className="ml-1 text-xs bg-amber-500/20 px-1 rounded">Host</span>}
												</div>
											</div>
											{gameState !== "waiting" && (
												<div className="text-sm">
													{player?.initiative > 0 ? (
														<span className="text-primary">Ini: {player?.initiative}</span>
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
							<CardHeader className="py-2 md:py-4">
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
			</div>
		</div>
	);
}
