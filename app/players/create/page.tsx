"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { SuccessDialog } from "@/components/success-dialog";

// Step 1: Race and Subclass Selection
import RaceSubclassForm from "./steps/race-subclass-form";
// @ts-ignore
import AttributesForm from "./steps/attributes-form";
// @ts-ignore
import AvatarForm from "./steps/avatar-form";

// Schema for player creation
const playerSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	race: z.string().min(1, "Raça é obrigatória"),
	subclass: z.string().min(1, "Subclasse é obrigatória"),
	hp: z.number().min(1),
	mp: z.number().min(1),
	strength: z.number().min(1),
	defense: z.number().min(1),
	speed: z.number().min(1),
	dexterity: z.number().min(1),
	intelligence: z.number().min(1),
	charisma: z.number().min(1),
	wisdom: z.number().min(1),
	experience: z.number().default(0),
	image: z.string().optional(),
	imagePrompt: z.string().optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

// Default values for the form
const defaultValues: PlayerFormData = {
	name: "",
	race: "",
	subclass: "",
	hp: 10,
	mp: 10,
	strength: 1,
	defense: 1,
	speed: 1,
	dexterity: 1,
	intelligence: 1,
	charisma: 1,
	wisdom: 1,
	experience: 0,
	image: "",
	imagePrompt: "",
};

// Mapping de raças
const races = {
	human: "Humano",
	elf: "Elfo",
	dwarf: "Anão",
	orc: "Orc",
	halfling: "Halfling",
};

// Mapping de subclasses
const subclasses = {
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

export default function CreatePlayerPage() {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(0);
	const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
	const [createdPlayer, setCreatedPlayer] = useState<PlayerFormData | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const methods = useForm<PlayerFormData>({
		resolver: zodResolver(playerSchema),
		defaultValues,
	});

	const forms = [
		{
			id: 1,
			label: "Raça e Subclasse",
			fields: ["name", "race", "subclass"],
			form: RaceSubclassForm,
		},
		{
			id: 2,
			label: "Atributos",
			fields: ["hp", "mp", "strength", "defense", "speed", "dexterity", "intelligence", "charisma", "wisdom"],
			form: AttributesForm,
		},
		{
			id: 3,
			label: "Avatar",
			fields: ["image", "imagePrompt"],
			form: AvatarForm,
		},
	];

	// Function to save the player data to the database
	const saveFormData = async (data: PlayerFormData) => {
		setIsSubmitting(true);
		try {
			console.log("Enviando dados para API:", data);
			const response = await fetch("/api/players", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const responseData = await response.json();
			console.log("Resposta da API:", responseData);

			if (response.ok) {
				// Armazenar os dados do jogador criado
				setCreatedPlayer(data);
				// Abrir diálogo de sucesso
				setIsSuccessDialogOpen(true);
			} else {
				console.error("Erro ao criar personagem:", responseData);
				alert(`Erro ao criar personagem: ${responseData.error || "Erro desconhecido"}`);
			}
		} catch (error) {
			console.error("Erro de exceção ao criar personagem:", error);
			alert("Erro ao criar personagem. Por favor, verifique o console para mais detalhes.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Componentes dos passos
	const StepComponents = [RaceSubclassForm, AttributesForm, AvatarForm];
	const CurrentStepComponent = StepComponents[currentStep];

	// Navegar entre os passos
	const nextStep = () => {
		methods.trigger().then((isValid) => {
			if (isValid) {
				if (currentStep < StepComponents.length - 1) {
					setCurrentStep(currentStep + 1);
				} else {
					// Último passo, enviar o formulário
					const formData = methods.getValues();
					saveFormData(formData);
				}
			}
		});
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const isFirstStep = currentStep === 0;
	const isLastStep = currentStep === StepComponents.length - 1;

	// Obter os valores para o diálogo de confirmação
	const getDisplayName = (race: string) => races[race as keyof typeof races] || race;
	const getDisplayClass = (subclass: string) => subclasses[subclass as keyof typeof subclasses] || subclass;

	return (
		<div className="container max-w-2xl py-10">
			<Card>
				<CardContent className="pt-6">
					<div className="mb-8">
						<div className="flex justify-between mb-2">
							{forms.map((formItem, index) => (
								<div
									key={`step-${formItem.id}`}
									className={`flex flex-col items-center ${index <= currentStep ? "text-primary" : "text-muted-foreground"}`}
								>
									<div
										className={`flex items-center justify-center w-8 h-8 rounded-full mb-2 
                    ${
											index < currentStep
												? "bg-primary text-white"
												: index === currentStep
													? "border-2 border-primary"
													: "border-2 border-muted-foreground"
										}`}
									>
										{index < currentStep ? "✓" : index + 1}
									</div>
									<span className="text-sm">{formItem.label}</span>
								</div>
							))}
						</div>
						<div className="w-full bg-muted h-2 rounded-full">
							<div
								className="bg-primary h-2 rounded-full transition-all"
								style={{ width: `${((currentStep + 1) / forms.length) * 100}%` }}
							/>
						</div>
					</div>

					<FormProvider {...methods}>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								nextStep();
							}}
							noValidate
						>
							<CurrentStepComponent />

							<div className="flex justify-between mt-8">
								<Button type="button" variant="outline" onClick={prevStep} disabled={isFirstStep}>
									Voltar
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<svg
												className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												/>
											</svg>
											Processando...
										</>
									) : isLastStep ? (
										"Criar Personagem"
									) : (
										"Próximo"
									)}
								</Button>
							</div>
						</form>
					</FormProvider>

					{/* Diálogo de sucesso */}
					{createdPlayer && (
						<SuccessDialog
							isOpen={isSuccessDialogOpen}
							onClose={() => setIsSuccessDialogOpen(false)}
							playerName={createdPlayer.name}
							playerRace={getDisplayName(createdPlayer.race)}
							playerClass={getDisplayClass(createdPlayer.subclass)}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
