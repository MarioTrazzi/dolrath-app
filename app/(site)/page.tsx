import { Rocket, Gamepad2 } from "lucide-react";

export default function Home() {
	return (
		<main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 relative">
			{/* Futuristic background elements with fixed positioning */}
			<div className="fixed z-0 inset-0 w-full h-screen pointer-events-none">
				<div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#0a84ff_100%)] opacity-80" />
				<div className="absolute inset-0 bg-[url('/syrilianos.gif')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
				<div className="absolute inset-0 bg-[url('/Ishtarianos.gif')] opacity-20 mix-blend-overlay" />
			</div>

			{/* Content section with proper z-index to appear above background */}
			<section className="z-10 relative">
				<div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
					<a
						href="/players/create"
						className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm text-blue-500 bg-blue-900/20 backdrop-blur-sm rounded-full hover:bg-blue-900/40 border border-blue-500/20 transition-all duration-300 group"
					>
						<span className="text-xs bg-blue-600 rounded-full text-white px-4 py-1.5 mr-3 group-hover:bg-blue-700 transition-colors">
							{"Novo"}
						</span>
						<span className="text-sm font-medium">{"Dolrath NFT Game"}</span>
						<svg
							className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
							fill="currentColor"
							viewBox="0 0 20 20"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
						>
							<path
								fillRule="evenodd"
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
								clipRule="evenodd"
							/>
						</svg>
					</a>
					<h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl lg:text-6xl">
						<span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-purple-600 text-transparent bg-clip-text">
							{"DOLRATH: THE FUTURE OF GAMING"}
						</span>
					</h1>
					<p className="mb-8 text-lg font-normal text-gray-400 lg:text-xl sm:px-16 xl:px-48 max-w-3xl mx-auto">
						{
							"Um épico futurístico onde tecnologia e aventura se encontram. Prepare-se para uma experiência imersiva em um mundo onde seus NFTs definem seu destino."
						}
					</p>
					<div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
						<a
							href="/players/create"
							className="inline-flex justify-center items-center py-3 px-5 text-white font-medium text-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 focus:ring-4 focus:ring-blue-300/50 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
						>
							{"Comece a Jogar"}
							<Rocket className="ml-2 -mr-1 w-5 h-5" />
						</a>
						<a
							href="/gallery"
							className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg border border-blue-500/30 bg-black/30 backdrop-blur-sm hover:bg-black/50 hover:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
						>
							<Gamepad2 className="mr-2 -ml-1 w-5 h-5" />
							{"Assista o trailer"}
						</a>
					</div>

					{/* Floating cyberpunk cards with game features */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
						<div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20 text-left">
							<div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mb-4">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-bold text-white mb-2">{"Personagens Únicos"}</h3>
							<p className="text-gray-400">
								{"Crie e personalize seu herói com características e habilidades exclusivas em um mundo futurístico."}
							</p>
						</div>

						<div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20 text-left">
							<div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mb-4">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-bold text-white mb-2">{"Colecionáveis NFT"}</h3>
							<p className="text-gray-400">
								{"Adquira itens raros e equipamentos lendários como NFTs que possuem valor real no mercado digital."}
							</p>
						</div>

						<div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/20 text-left">
							<div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center mb-4">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-bold text-white mb-2">{"Multijogador PvP"}</h3>
							<p className="text-gray-400">
								{"Desafie outros jogadores em arenas futurísticas e prove sua habilidade em combates estratégicos."}
							</p>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
