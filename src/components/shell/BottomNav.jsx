import { NavLink } from "react-router-dom";
import { Trans } from "@lingui/react/macro";

const linkClass = ({ isActive }) =>
	`flex flex-col items-center justify-center gap-0.5 min-h-11 w-full px-1 text-xs font-semibold transition ${
		isActive ? "text-brand" : "text-ink-muted hover:text-ink"
	}`;

export default function BottomNav() {
	return (
		<nav
			className="shrink-0 bg-surface border-t border-border safe-bottom"
			aria-label="Principal"
		>
			<ul className="flex justify-around items-stretch max-w-lg mx-auto py-1">
				<li className="flex-1 min-w-0">
					<NavLink to="/" end className={linkClass}>
						<span aria-hidden className="text-lg">
							◉
						</span>
						<Trans>Calendario</Trans>
					</NavLink>
				</li>
				<li className="flex-1 min-w-0">
					<NavLink to="/meals" className={linkClass}>
						<span aria-hidden className="text-lg">
							◎
						</span>
						<Trans>Comidas</Trans>
					</NavLink>
				</li>
				<li className="flex-1 min-w-0">
					<NavLink to="/shopping" className={linkClass}>
						<span aria-hidden className="text-lg">
							▣
						</span>
						<Trans>Compras</Trans>
					</NavLink>
				</li>
				<li className="flex-1 min-w-0">
					<NavLink to="/pantry" className={linkClass}>
						<span aria-hidden className="text-lg">
							▦
						</span>
						<Trans>Despensa</Trans>
					</NavLink>
				</li>
				<li className="flex-1 min-w-0">
					<NavLink to="/more" className={linkClass}>
						<span aria-hidden className="text-lg">
							☰
						</span>
						<Trans>Más</Trans>
					</NavLink>
				</li>
			</ul>
		</nav>
	);
}
