"use client";

import LoginBadge from "@/components/auth/login-badge";
import LogoutButton from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Fingerprint, Menu, X, LogOut } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";
import { useState } from "react";
import { useSession } from "next-auth/react";

const Navbar = () => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const { data: session } = useSession();

	return (
		<>
			{/* Desktop Navigation */}
			<nav className="hidden md:flex md:flex-row md:min-w-full md:items-center md:justify-between md:gap-5 md:text-sm lg:gap-6">
				<div className="flex flex-row w-full gap-6">
					<Link href="/" className="flex items-center text-lg font-semibold md:text-base mr-4">
						<Fingerprint className="h-6 w-6 text-green-500" />
						<span className="sr-only">{"Dolrath NFT Game"}</span>
					</Link>
					<Link href="/" className="text-foreground transition-colors hover:text-foreground px-2">
						{"HOME"}
					</Link>
					<Link
						href="/players"
						className="text-muted-foreground transition-colors hover:text-foreground min-w-fit z-50 px-2"
					>
						{"PLAYERS"}
					</Link>
					<Link href="/create-room" className="text-muted-foreground transition-colors hover:text-foreground px-2">
						{"BATTLE"}
					</Link>
					<Link href="/ranking" className="text-muted-foreground transition-colors hover:text-foreground px-2">
						{"RANKING"}
					</Link>
					<Link href="/roadmap" className="text-muted-foreground transition-colors hover:text-foreground px-2">
						{"ROADMAP"}
					</Link>
				</div>

				<div className="flex items-center gap-4 md:ml-auto md:gap-4 lg:gap-4">
					<LoginBadge user={session?.user} />
					<ThemeToggle />
				</div>
			</nav>

			{/* Mobile Navigation */}
			<div className="flex justify-between items-center w-full md:hidden">
				<Link href="/" className="flex items-center text-lg font-semibold">
					<Fingerprint className="h-6 w-6 text-green-500" />
					<span>{"Dolrath"}</span>
				</Link>

				<div className="flex items-center">
					{/* Simplified login/logout for mobile */}
					{!session?.user && <LoginBadge user={session?.user} />}
					<ThemeToggle />
					<button
						type="button"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="p-2 text-foreground focus:outline-none"
					>
						{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>
			</div>

			{/* Mobile Menu Overlay */}
			{mobileMenuOpen && (
				<div className="fixed top-8 left-0 right-0 bottom-0 z-50 bg-background/80 backdrop-blur-md border-b md:hidden">
					<div className="flex flex-col items-center py-8 px-4 w-full space-y-0 text-lg font-medium">
						<Button
							variant="outline"
							className="w-full justify-center rounded-md"
							asChild
							onClick={() => setMobileMenuOpen(false)}
						>
							<Link href="/players">{"PLAYERS"}</Link>
						</Button>

						<Button
							variant="outline"
							className="w-full justify-center rounded-md"
							asChild
							onClick={() => setMobileMenuOpen(false)}
						>
							<Link href="/create-room">{"BATTLE"}</Link>
						</Button>

						<Button
							variant="outline"
							className="w-full justify-center rounded-md"
							asChild
							onClick={() => setMobileMenuOpen(false)}
						>
							<Link href="/ranking">{"RANKING"}</Link>
						</Button>

						<Button
							variant="outline"
							className="w-full justify-center rounded-md"
							asChild
							onClick={() => setMobileMenuOpen(false)}
						>
							<Link href="/roadmap">{"ROADMAP"}</Link>
						</Button>

						{/* Add Logout button when user is logged in */}
						{session?.user && (
							<LogoutButton>
								<Button variant="destructive" className="w-full mt-4">
									<LogOut size={18} className="mr-2" />
									{"Sair"}
								</Button>
							</LogoutButton>
						)}
					</div>
				</div>
			)}
		</>
	);
};

export default Navbar;
