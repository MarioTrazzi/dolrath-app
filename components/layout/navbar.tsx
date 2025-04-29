import { ThemeToggle } from "@/components/theme-toggle";
// import { siteConfig } from "@/config/site"; // Temporarily removed
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
// import { Icons } from "@/components/icons"; // Temporarily removed
// import { MainNav } from "@/components/layout/main-nav"; // Temporarily removed
// import { MobileNav } from "@/components/layout/mobile-nav"; // Temporarily removed
import Link from "next/link";
import { MessageSquare } from "lucide-react";

// Placeholder UserNav component
const UserNav = () => {
	// Basic placeholder - replace with actual auth logic later
	const isLoggedIn = false; // Assume logged out for now
	if (isLoggedIn) {
		return <div className="px-3 py-2 text-sm">User Menu</div>; // Placeholder for logged-in state
	}
	// Removed else for linter
	return (
		<Link href="/login">
			<div className={cn(buttonVariants({ variant: "outline" }), "px-3")}>Login</div>
		</Link>
	);
};

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 max-w-screen-2xl items-center">
				{/* <MainNav /> // Temporarily removed */}
				{/* <MobileNav /> // Temporarily removed */}
				{/* Simplified Header Content */}
				<div className="font-bold mr-auto">Dolrath App</div> {/* Simple Title */}
				<div className="flex flex-1 items-center justify-end space-x-2">
					{/* <div className="w-full flex-1 md:w-auto md:flex-none"></div> // Removed command menu placeholder */}
					<nav className="flex items-center space-x-2">
						{/* GitHub Link Temporarily Removed 
						<Link href={siteConfig.links.github} target="_blank" rel="noreferrer">
							<div className={cn(buttonVariants({ variant: "ghost" }), "w-9 px-0")}>
								<Icons.gitHub className="h-4 w-4" /> 
								<span className="sr-only">GitHub</span>
							</div>
						</Link>
						 */}
						{/* Chat Link */}
						<Link href="/chat">
							<div className={cn(buttonVariants({ variant: "ghost" }), "px-3")}>
								<MessageSquare className="h-4 w-4 mr-2" /> {/* Optional Icon */}
								Chat
							</div>
						</Link>
						<ThemeToggle />
						<UserNav />
					</nav>
				</div>
			</div>
		</header>
	);
}
