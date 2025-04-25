"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormContext } from "react-hook-form";

const races = [
	{ id: "human", name: "Humano" },
	{ id: "elf", name: "Elfo" },
	{ id: "dwarf", name: "Anão" },
	{ id: "orc", name: "Orc" },
	{ id: "halfling", name: "Halfling" },
];

const subclasses = {
	human: [
		{ id: "warrior", name: "Guerreiro" },
		{ id: "paladin", name: "Paladino" },
		{ id: "rogue", name: "Ladino" },
	],
	elf: [
		{ id: "mage", name: "Mago" },
		{ id: "ranger", name: "Arqueiro" },
		{ id: "druid", name: "Druida" },
	],
	dwarf: [
		{ id: "warrior", name: "Guerreiro" },
		{ id: "cleric", name: "Clérigo" },
		{ id: "engineer", name: "Engenheiro" },
	],
	orc: [
		{ id: "berserker", name: "Berserker" },
		{ id: "shaman", name: "Xamã" },
		{ id: "hunter", name: "Caçador" },
	],
	halfling: [
		{ id: "rogue", name: "Ladino" },
		{ id: "bard", name: "Bardo" },
		{ id: "cook", name: "Cozinheiro" },
	],
};

export default function RaceSubclassForm() {
	const { control, watch } = useFormContext();
	const selectedRace = watch("race");

	return (
		<Card className="border-none shadow-none">
			<CardHeader className="px-0">
				<CardTitle>Escolha sua Raça e Subclasse</CardTitle>
				<CardDescription>Defina a raça e subclasse do seu personagem</CardDescription>
			</CardHeader>
			<CardContent className="px-0 space-y-4">
				<FormField
					control={control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nome do Personagem</FormLabel>
							<FormControl>
								<Input placeholder="Digite o nome do seu personagem" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="race"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Raça</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecione uma raça" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{races.map((race) => (
										<SelectItem key={race.id} value={race.id}>
											{race.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="subclass"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Subclasse</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedRace}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecione uma subclasse" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{selectedRace &&
										subclasses[selectedRace as keyof typeof subclasses]?.map((subclass) => (
											<SelectItem key={subclass.id} value={subclass.id}>
												{subclass.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	);
}
