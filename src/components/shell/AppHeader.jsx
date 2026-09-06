import { Link } from "react-router-dom";
import { Trans } from "@lingui/react/macro";
import MemberSwitcher from "../../features/family/MemberSwitcher";

export default function AppHeader({ actions }) {
	return (
		<header className="shrink-0 bg-brand text-[var(--color-surface)] shadow-soft">
			<div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
				<div className="flex items-center gap-3 min-w-0">
					<Link to="/" className="min-w-0 shrink">
						<p className="font-display text-xl sm:text-2xl tracking-tight truncate">
							Plan Alimenticio
						</p>
						<p className="text-[11px] uppercase tracking-wider opacity-80">
							<Trans>Tu cocina, organizada</Trans>
						</p>
					</Link>
					<div className="hidden sm:flex items-center gap-3 min-w-0">
						<div className="h-8 w-px bg-white/25 shrink-0" aria-hidden />
						<MemberSwitcher />
					</div>
				</div>
				{actions ? (
					<div className="flex items-center gap-2 shrink-0">{actions}</div>
				) : null}
			</div>
			<div className="sm:hidden border-t border-white/15 px-3 py-1.5 overflow-x-auto">
				<MemberSwitcher />
			</div>
		</header>
	);
}
