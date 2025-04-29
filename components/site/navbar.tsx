"use client";

import LoginBadge from "@/components/auth/login-badge";
import LogoutButton from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Fingerprint, Menu, X, LogOut } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const Navbar = () => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const { data: session } = useSession();

	return (
		<div className="w-full flex items-center justify-between">
			{/* Desktop Navigation */}
			<nav className="hidden md:flex md:flex-row md:w-full md:items-center md:justify-between">
				<div className="flex items-center space-x-6">
					<Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
						<Fingerprint className="h-6 w-6 text-primary" />
						<span>Dolrath</span>
					</Link>

					<div className="flex items-center space-x-1">
						<Link
							href="/"
							className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
						>
							Home
						</Link>
						<Link
							href="/players"
							className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
						>
							Players
						</Link>
						<Link
							href="/chat"
							className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
						>
							Chat
						</Link>
						<Link
							href="/ranking"
							className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
						>
							Ranking
						</Link>
					</div>
				</div>

				<div className="flex items-center gap-4">
					<LoginBadge user={session?.user} />
					<ThemeToggle />
				</div>
			</nav>

			{/* Mobile Navigation */}
			<div className="flex justify-between items-center w-full md:hidden">
				<Link href="/" className="flex items-center gap-2">
					<Fingerprint className="h-6 w-6 text-primary" />
					<span className="font-semibold text-foreground">Dolrath</span>
				</Link>

				<div className="flex items-center gap-2">
					{!session?.user && <LoginBadge user={session?.user} />}
					<ThemeToggle />
					<Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
						{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
					</Button>
				</div>
			</div>

			{/* Mobile Menu Overlay */}
			{mobileMenuOpen && (
				<div
					className={cn(
						"fixed inset-0 z-50 md:hidden",
						"bg-background/80 backdrop-blur-sm",
						"animate-in fade-in-0 slide-in-from-top-5",
					)}
				>
					<div className="fixed inset-x-0 top-0 z-50 min-h-screen p-4 pt-16 border-r shadow-lg bg-background">
						<Button
							variant="ghost"
							size="icon"
							className="absolute top-4 right-4"
							onClick={() => setMobileMenuOpen(false)}
						>
							<X size={24} />
						</Button>

						<div className="flex flex-col gap-4">
							<Link
								href="/"
								className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-md"
								onClick={() => setMobileMenuOpen(false)}
							>
								Home
							</Link>
							<Link
								href="/players"
								className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-md"
								onClick={() => setMobileMenuOpen(false)}
							>
								Players
							</Link>
							<Link
								href="/chat"
								className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-md"
								onClick={() => setMobileMenuOpen(false)}
							>
								Chat
							</Link>
							<Link
								href="/ranking"
								className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-md"
								onClick={() => setMobileMenuOpen(false)}
							>
								Ranking
							</Link>

							{session?.user && (
								<LogoutButton>
									<Button variant="destructive" className="w-full mt-4">
										<LogOut size={18} className="mr-2" />
										Sair
									</Button>
								</LogoutButton>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Navbar;
