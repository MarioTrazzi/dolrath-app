import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/site/navbar";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Dolrath RPG",
	description: "Uma plataforma digital para jogadores e mestres de RPG.",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<body className={cn("min-h-screen bg-background text-foreground", inter.className)}>
				<Providers>
					<SessionProvider session={session}>
						<div className="flex min-h-screen flex-col">
							<header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/85 backdrop-blur-md px-4 md:px-6">
								<Navbar />
							</header>
							<main className="flex-1 bg-background">{children}</main>
						</div>
					</SessionProvider>
				</Providers>
			</body>
		</html>
	);
}
