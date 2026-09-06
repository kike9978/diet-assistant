import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";

export default function AppShell({ headerActions }) {
	return (
		<div className="h-dvh max-h-dvh bg-bg flex flex-col overflow-hidden text-ink">
			<AppHeader actions={headerActions} />
			<main className="flex-1 overflow-y-auto">
				<div className="max-w-5xl mx-auto px-4 py-5">
					<Outlet />
				</div>
			</main>
			<BottomNav />
		</div>
	);
}
