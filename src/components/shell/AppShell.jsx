import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";

export default function AppShell() {
	return (
		<div className="h-full bg-bg flex flex-col overflow-hidden text-ink">
			<AppHeader />
			<main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
				<div className="max-w-5xl mx-auto px-4 py-5">
					<Outlet />
				</div>
			</main>
			<BottomNav />
		</div>
	);
}
