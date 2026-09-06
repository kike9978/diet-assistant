import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";

export default function AppShell() {
	const { pathname } = useLocation();
	const lockPageScroll = pathname === "/shopping";

	return (
		<div className="h-full bg-bg flex flex-col overflow-hidden text-ink">
			<AppHeader />
			<main
				className={
					lockPageScroll
						? "flex-1 min-h-0 overflow-hidden flex flex-col"
						: "flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
				}
			>
				<div
					className={
						lockPageScroll
							? "max-w-5xl mx-auto px-4 py-5 w-full flex-1 min-h-0 flex flex-col"
							: "max-w-5xl mx-auto px-4 py-5"
					}
				>
					<Outlet />
				</div>
			</main>
			<BottomNav />
		</div>
	);
}
