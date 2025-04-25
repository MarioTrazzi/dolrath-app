"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LegacyBattlePage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		// Redirect to the new battle page with the same parameters
		const params = new URLSearchParams();
		if (searchParams) {
			// Convert entries to array and then iterate
			for (const [key, value] of Array.from(searchParams.entries())) {
				params.append(key, value);
			}
		}

		router.replace(`/battle?${params.toString()}`);
	}, [router, searchParams]);

	return (
		<div className="flex items-center justify-center h-screen">
			<p>Redirecionando para a nova página de batalha...</p>
		</div>
	);
}
