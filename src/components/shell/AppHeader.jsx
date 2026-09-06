import { Link } from "react-router-dom";
import { Trans } from "@lingui/react/macro";

export default function AppHeader({ actions }) {
	return (
		<header className="bg-brand text-[var(--color-surface)] shadow-soft">
			<div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
				<Link to="/" className="min-w-0">
					<p className="font-display text-xl sm:text-2xl tracking-tight truncate">
						Plan Alimenticio
					</p>
					<p className="text-[11px] uppercase tracking-wider opacity-80">
						<Trans>Tu cocina, organizada</Trans>
					</p>
				</Link>
				{actions ? (
					<div className="flex items-center gap-2 shrink-0">{actions}</div>
				) : null}
			</div>
		</header>
	);
}
