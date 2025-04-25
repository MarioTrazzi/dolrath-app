"use client";

import { ThemeProvider } from "next-themes";
import { SocketProvider } from "./components/SocketProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
			<SocketProvider>{children}</SocketProvider>
		</ThemeProvider>
	);
}
