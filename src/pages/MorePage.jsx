import { Trans } from "@lingui/react/macro";
import { Link } from "react-router-dom";
import {
	Utensils,
	Users,
	Wrench,
	ClipboardList,
	Settings,
	ChevronRight,
} from "lucide-react";

const LINKS = [
	{ to: "/meals", label: <Trans>Comidas</Trans>, Icon: Utensils },
	{ to: "/family", label: <Trans>Familia</Trans>, Icon: Users },
	{ to: "/tools", label: <Trans>Herramientas</Trans>, Icon: Wrench },
	{ to: "/plans", label: <Trans>Planes</Trans>, Icon: ClipboardList },
	{ to: "/settings", label: <Trans>Ajustes</Trans>, Icon: Settings },
];

export default function MorePage() {
	return (
		<div className="space-y-4">
			<h1 className="font-display text-2xl">
				<Trans>Más</Trans>
			</h1>
			<p className="text-sm text-ink-muted">
				<Trans>Comidas, familia, herramientas, planes y ajustes.</Trans>
			</p>
			<p className="text-xs text-ink-muted">
				<Trans>Los datos viven en este dispositivo.</Trans>{" "}
				<Link to="/settings" className="text-brand font-semibold underline">
					<Trans>Copia de seguridad en Ajustes</Trans>
				</Link>
			</p>
			<ul className="border border-border rounded-app bg-surface overflow-hidden divide-y divide-border">
				{LINKS.map((item) => (
					<li key={item.to}>
						<Link
							to={item.to}
							className="flex items-center justify-between min-h-11 px-4 py-3 font-semibold hover:bg-surface-2"
						>
							<span className="inline-flex items-center gap-3">
								<item.Icon className="size-5 text-ink-muted" aria-hidden />
								{item.label}
							</span>
							<ChevronRight className="size-4 text-ink-muted" aria-hidden />
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
