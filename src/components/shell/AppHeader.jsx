import { Link } from "react-router-dom";
import MemberSwitcher from "../../features/family/MemberSwitcher";
import { MalangaIcon } from "../Icons";

export default function AppHeader() {
	return (
		<>
			<header className="shrink-0 bg-brand text-[var(--color-surface)] sm:shadow-soft">
				<div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<Link to="/" className="min-w-0 shrink flex items-center gap-2">
							<MalangaIcon className="size-7 sm:size-8 shrink-0" />
							<p className="font-display text-xl sm:text-2xl tracking-tight truncate">
								Malanga
							</p>
						</Link>
						<div className="hidden sm:flex items-center gap-3 min-w-0">
							<div className="h-8 w-px bg-white/25 shrink-0" aria-hidden />
							<MemberSwitcher />
						</div>
					</div>
				</div>
			</header>
			<div className="sm:hidden sticky top-0 z-20 bg-brand text-[var(--color-surface)] border-t border-white/15 shadow-soft">
				<div className="px-3 py-1.5 overflow-x-auto">
					<MemberSwitcher />
				</div>
			</div>
		</>
	);
}
