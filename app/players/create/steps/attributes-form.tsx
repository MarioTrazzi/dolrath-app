"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";
import Link from "next/link";

// Constants
const TOTAL_POINTS = 30; // Total points to distribute
const MIN_VALUE = 1; // Minimum value for each attribute
const MAX_VALUE = 10; // Maximum value for each attribute

export default function AttributesForm() {
	const { control, setValue, watch } = useFormContext();
	const [remainingPoints, setRemainingPoints] = useState(TOTAL_POINTS);

	// Watch all attributes
	const strength = watch("strength") || MIN_VALUE;
	const defense = watch("defense") || MIN_VALUE;
	const speed = watch("speed") || MIN_VALUE;
	const dexterity = watch("dexterity") || MIN_VALUE;
	const intelligence = watch("intelligence") || MIN_VALUE;
	const charisma = watch("charisma") || MIN_VALUE;
	const wisdom = watch("wisdom") || MIN_VALUE;

	// Calculate HP and MP based on attributes
	useEffect(() => {
		setValue("hp", 10 + strength * 2 + defense);
		setValue("mp", 10 + intelligence * 2 + wisdom);
	}, [strength, defense, intelligence, wisdom, setValue]);

	// Update remaining points when attributes change
	useEffect(() => {
		const usedPoints =
			strength -
			MIN_VALUE +
			(defense - MIN_VALUE) +
			(speed - MIN_VALUE) +
			(dexterity - MIN_VALUE) +
			(intelligence - MIN_VALUE) +
			(charisma - MIN_VALUE) +
			(wisdom - MIN_VALUE);

		setRemainingPoints(TOTAL_POINTS - usedPoints);
	}, [strength, defense, speed, dexterity, intelligence, charisma, wisdom]);

	// Handler for attribute changes
	const handleAttributeChange = (name: string, value: number[]) => {
		const newValue = value[0];
		const currentValue = watch(name) || MIN_VALUE;

		// Calculate how this change would affect remaining points
		const pointDifference = newValue - currentValue;
		const newRemainingPoints = remainingPoints - pointDifference;

		// Only allow the change if there are enough points or if decreasing
		if (newRemainingPoints >= 0 || pointDifference < 0) {
			setValue(name, newValue);
		}
	};

	return (
		<Card className="border-none shadow-none">
			<CardHeader className="px-0">
				<CardTitle>Distribuição de Atributos</CardTitle>
				<CardDescription>
					Distribua {TOTAL_POINTS} pontos entre os atributos do seu personagem (Pontos restantes: {remainingPoints})
				</CardDescription>
			</CardHeader>
			<CardContent className="px-0 space-y-6">
				<div className="grid grid-cols-1 gap-4">
					<div className="bg-accent p-4 rounded-md mb-6">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={control}
								name="hp"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Pontos de Vida (HP)</FormLabel>
										<FormControl>
											<Input {...field} readOnly />
										</FormControl>
										<FormDescription>Baseado em força e defesa</FormDescription>
									</FormItem>
								)}
							/>

							<FormField
								control={control}
								name="mp"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Pontos de Mana (MP)</FormLabel>
										<FormControl>
											<Input {...field} readOnly />
										</FormControl>
										<FormDescription>Baseado em inteligência e sabedoria</FormDescription>
									</FormItem>
								)}
							/>
						</div>
					</div>

					{/* Attributes */}
					<FormField
						control={control}
						name="strength"
						render={({ field }) => (
							<FormItem>
								<div className="flex justify-between">
									<FormLabel>Força: {field.value}</FormLabel>
								</div>
								<FormControl>
									<Slider
										min={MIN_VALUE}
										max={MAX_VALUE}
										step={1}
										value={[field.value]}
										onValueChange={(value) => handleAttributeChange("strength", value)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="defense"
						render={({ field }) => (
							<FormItem>
								<div className="flex justify-between">
									<FormLabel>Defesa: {field.value}</FormLabel>
								</div>
								<FormControl>
									<Slider
										min={MIN_VALUE}
										max={MAX_VALUE}
										step={1}
										value={[field.value]}
										onValueChange={(value) => handleAttributeChange("defense", value)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="speed"
						render={({ field }) => (
							<FormItem>
								<div className="flex justify-between">
									<FormLabel>Velocidade: {field.value}</FormLabel>
								</div>
								<FormControl>
									<Slider
										min={MIN_VALUE}
										max={MAX_VALUE}
										step={1}
										value={[field.value]}
										onValueChange={(value) => handleAttributeChange("speed", value)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="dexterity"
						render={({ field }) => (
							<FormItem>
								<div className="flex justify-between">
									<FormLabel>Destreza: {field.value}</FormLabel>
								</div>
								<FormControl>
									<Slider
										min={MIN_VALUE}
										max={MAX_VALUE}
										step={1}
										value={[field.value]}
										onValueChange={(value) => handleAttributeChange("dexterity", value)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="intelligence"
						render={({ field }) => (
							<FormItem>
								<div className="flex justify-between">
									<FormLabel>Inteligência: {field.value}</FormLabel>
								</div>
								<FormControl>
									<Slider
										min={MIN_VALUE}
										max={MAX_VALUE}
										step={1}
										value={[field.value]}
										onValueChange={(value) => handleAttributeChange("intelligence", value)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="charisma"
						render={({ field }) => (
							<FormItem>
								<div className="flex justify-between">
									<FormLabel>Carisma: {field.value}</FormLabel>
								</div>
								<FormControl>
									<Slider
										min={MIN_VALUE}
										max={MAX_VALUE}
										step={1}
										value={[field.value]}
										onValueChange={(value) => handleAttributeChange("charisma", value)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name="wisdom"
						render={({ field }) => (
							<FormItem>
								<div className="flex justify-between">
									<FormLabel>Sabedoria: {field.value}</FormLabel>
								</div>
								<FormControl>
									<Slider
										min={MIN_VALUE}
										max={MAX_VALUE}
										step={1}
										value={[field.value]}
										onValueChange={(value) => handleAttributeChange("wisdom", value)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
