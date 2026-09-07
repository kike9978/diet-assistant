import { Trans } from "@lingui/react/macro";
import VisibleWeekNav from "../components/VisibleWeekNav";
import PrepMode from "../features/shopping/PrepMode";

/**
 * Standalone meal-prep page for the visible calendar week.
 */
export default function PrepPage() {
	return (
		<div className="space-y-4">
			<div>
				<h1 className="font-display text-2xl text-ink">
					<Trans>Preparar</Trans>
				</h1>
				<VisibleWeekNav className="mt-1.5" />
				<p className="text-sm text-ink-muted mt-1">
					<Trans>
						Elige qué comidas de la semana vas a preparar y revisa los
						ingredientes agregados.
					</Trans>
				</p>
			</div>

			<PrepMode />
		</div>
	);
}
