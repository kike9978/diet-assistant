import { Trans } from "@lingui/react/macro";
import { Link } from "react-router-dom";

const LINKS = [
	{ to: "/family", label: <Trans>Familia</Trans> },
	{ to: "/tools", label: <Trans>Herramientas</Trans> },
	{ to: "/plans", label: <Trans>Planes</Trans> },
	{ to: "/settings", label: <Trans>Ajustes</Trans> },
];

export default function MorePage() {
	return (
		<div className="space-y-4">
			<h1 className="font-display text-2xl">
				<Trans>Más</Trans>
			</h1>
			<p className="text-sm text-ink-muted">
				<Trans>Familia, herramientas, planes y ajustes.</Trans>
			</p>
			<ul className="border border-border rounded-app bg-surface overflow-hidden divide-y divide-border">
				{LINKS.map((item) => (
					<li key={item.to}>
						<Link
							to={item.to}
							className="flex items-center justify-between min-h-11 px-4 py-3 font-semibold hover:bg-surface-2"
						>
							{item.label}
							<span className="text-ink-muted">→</span>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
