"use client";

import { ThemeProvider } from "next-themes";
import { SocketProvider } from "./components/SocketProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<SocketProvider>{children}</SocketProvider>
		</ThemeProvider>
	);
}
