"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface SuccessDialogProps {
	isOpen: boolean;
	onClose: () => void;
	playerName: string;
	playerRace: string;
	playerClass: string;
}

export function SuccessDialog({ isOpen, onClose, playerName, playerRace, playerClass }: SuccessDialogProps) {
	const router = useRouter();

	const handleViewCharacters = () => {
		router.push("/players");
	};

	const handleCreateAnother = () => {
		onClose();
		// Reload the page to reset the form
		window.location.reload();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="mx-auto bg-green-100 rounded-full p-3 mb-4">
						<Check className="h-8 w-8 text-green-600" />
					</div>
					<DialogTitle className="text-2xl text-center">Personagem Criado!</DialogTitle>
					<DialogDescription className="text-center">
						<p className="mt-2">
							<span className="font-semibold">{playerName}</span> foi adicionado ao seu grupo de aventureiros!
						</p>
						<div className="mt-4 p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30">
							<div className="flex items-center gap-2 text-lg font-medium text-blue-800 dark:text-blue-300">
								<Sparkles className="h-5 w-5" />
								<span>Detalhes do Personagem</span>
							</div>
							<div className="mt-2 grid grid-cols-2 gap-2 text-sm">
								<div>
									<span className="text-muted-foreground">Raça:</span> <span className="font-medium">{playerRace}</span>
								</div>
								<div>
									<span className="text-muted-foreground">Classe:</span>{" "}
									<span className="font-medium">{playerClass}</span>
								</div>
							</div>
							<div className="mt-4 text-sm">
								<p className="text-blue-600 dark:text-blue-300">
									Em breve, você poderá transformar seu personagem em um NFT para usar em outras plataformas!
								</p>
							</div>
						</div>
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="sm:justify-center gap-2 mt-4">
					<Button type="button" variant="outline" onClick={handleCreateAnother}>
						Criar Outro Personagem
					</Button>
					<Button
						type="button"
						onClick={handleViewCharacters}
						className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
					>
						Ver Meus Personagens
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
