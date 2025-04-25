"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { useState } from "react";
import Image from "next/image";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AvatarForm() {
	const { control, setValue, watch } = useFormContext();
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const imagePrompt = watch("imagePrompt") || "";
	const imageUrl = watch("image") || "";
	const race = watch("race") || "";
	const subclass = watch("subclass") || "";
	const name = watch("name") || "";

	// Get race and subclass name for display
	const raceNames: Record<string, string> = {
		human: "Humano",
		elf: "Elfo",
		dwarf: "Anão",
		orc: "Orc",
		halfling: "Halfling",
	};

	const subclassNames: Record<string, Record<string, string>> = {
		human: {
			warrior: "Guerreiro",
			paladin: "Paladino",
			rogue: "Ladino",
		},
		elf: {
			mage: "Mago",
			ranger: "Arqueiro",
			druid: "Druida",
		},
		dwarf: {
			warrior: "Guerreiro",
			cleric: "Clérigo",
			engineer: "Engenheiro",
		},
		orc: {
			berserker: "Berserker",
			shaman: "Xamã",
			hunter: "Caçador",
		},
		halfling: {
			rogue: "Ladino",
			bard: "Bardo",
			cook: "Cozinheiro",
		},
	};

	const generateImage = async () => {
		setIsGenerating(true);
		setError(null);

		try {
			// Create default prompt if user hasn't provided one
			const raceName = raceNames[race] || race;
			const subclassName = subclassNames[race]?.[subclass] || subclass;

			let defaultPrompt = `Um personagem ${raceName} ${subclassName}`;
			if (name) {
				defaultPrompt += ` chamado ${name}`;
			}
			defaultPrompt += ", visão frontal, estilo fantasia, alta qualidade, iluminação dramática";

			const promptToUse = imagePrompt || defaultPrompt;

			// Call your API endpoint that connects to an AI image generator
			const response = await fetch("/api/generate-avatar", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt: promptToUse,
				}),
			});

			const data = await response.json();

			if (response.ok && data.imageUrl) {
				// Set the image URL from the response
				setValue("image", data.imageUrl);
				setError(null);
			} else {
				// Se houver uma mensagem de erro específica, use-a
				const errorMessage = data.errorMessage || data.error || "Falha ao gerar imagem";
				throw new Error(errorMessage);
			}
		} catch (error) {
			console.error("Erro ao gerar imagem:", error);
			setError(error instanceof Error ? error.message : "Erro desconhecido ao gerar imagem");
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<Card className="border-none shadow-none">
			<CardHeader className="px-0">
				<CardTitle className="flex items-center gap-2">
					<Sparkles className="h-5 w-5 text-blue-500" />
					Geração de Avatar
				</CardTitle>
				<CardDescription>
					Crie uma imagem personalizada para seu personagem usando inteligência artificial
				</CardDescription>
			</CardHeader>
			<CardContent className="px-0 space-y-6">
				{error && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Erro na geração de imagem</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<FormField
					control={control}
					name="imagePrompt"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descrição do avatar (opcional)</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Descreva como você quer que seu personagem apareça (ex: 'Guerreiro com armadura de aço, cicatriz no rosto, olhos azuis')."
									{...field}
									rows={3}
								/>
							</FormControl>
							<FormDescription>
								Você pode deixar em branco para usar a descrição automática baseada na raça e classe escolhidas
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="image"
					render={({ field }) => (
						<FormItem>
							<div className="flex flex-col items-center space-y-4">
								{imageUrl ? (
									<div className="rounded-lg overflow-hidden w-80 h-80 relative border-2 border-blue-500/50 shadow-lg shadow-blue-500/20">
										<Image
											src={imageUrl}
											alt="Avatar do personagem"
											fill
											className="object-cover transition-all duration-500 hover:scale-105"
										/>
									</div>
								) : (
									<div className="bg-muted flex items-center justify-center rounded-lg w-80 h-80 border border-dashed border-muted-foreground/50">
										<div className="text-center p-4">
											<Sparkles className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
											<p className="text-muted-foreground font-medium">Clique no botão abaixo para gerar seu avatar</p>
										</div>
									</div>
								)}

								<Button
									type="button"
									onClick={generateImage}
									disabled={isGenerating}
									className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
									size="lg"
								>
									{isGenerating ? (
										<>
											<Loader2 className="mr-2 h-5 w-5 animate-spin" />
											Gerando imagem...
										</>
									) : imageUrl ? (
										"Gerar nova imagem"
									) : (
										"Gerar imagem do personagem"
									)}
								</Button>

								<input type="hidden" {...field} />

								{imageUrl && (
									<p className="text-sm text-muted-foreground text-center">
										Imagem gerada com sucesso! Você pode prosseguir ou gerar uma nova imagem.
									</p>
								)}
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	);
}
