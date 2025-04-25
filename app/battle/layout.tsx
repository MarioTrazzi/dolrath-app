"use client";

import { SocketProvider } from "./socket-provider";

export default function BattleLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <SocketProvider>{children}</SocketProvider>;
}
