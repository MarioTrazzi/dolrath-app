"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";

interface DeletePlayerButtonProps {
	playerId: string;
	playerName: string;
}

export default function DeletePlayerButton({ playerId, playerName }: DeletePlayerButtonProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const router = useRouter();

	const handleDelete = async () => {
		try {
			setIsDeleting(true);

			const response = await fetch(`/api/players/${playerId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				// Redirect to players list
				router.push("/players");
				router.refresh();
			} else {
				// Handle error
				const data = await response.json();
				console.error("Error deleting player:", data.error);
				alert(`Erro ao excluir o personagem: ${data.error || "Erro desconhecido"}`);
			}
		} catch (error) {
			console.error("Failed to delete player:", error);
			alert("Falha ao excluir o personagem. Verifique o console para mais detalhes.");
		} finally {
			setIsDeleting(false);
			setIsDialogOpen(false);
		}
	};

	return (
		<AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="outline" className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600">
					<Trash2 className="mr-2 h-4 w-4" />
					Excluir personagem
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Excluir personagem</AlertDialogTitle>
					<AlertDialogDescription>
						Tem certeza que deseja excluir <span className="font-bold">{playerName}</span>? Esta ação não pode ser
						desfeita e o personagem será removido permanentemente.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
					<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
						{isDeleting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Excluindo...
							</>
						) : (
							"Excluir personagem"
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
