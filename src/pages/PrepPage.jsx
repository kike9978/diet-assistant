import { Trans } from "@lingui/react/macro";
import { Link } from "react-router-dom";
import { useLingui } from "@lingui/react";
import { useAppState } from "../context/AppState";
import PrepMode from "../features/shopping/PrepMode";
import { parseDateISO } from "../features/calendar/dateUtils.js";

/**
 * Standalone meal-prep page for the visible calendar week.
 */
export default function PrepPage() {
	const { visibleWeekDates } = useAppState();
	const { i18n } = useLingui();
	const locale = i18n.locale === "en" ? "en-US" : "es-MX";
	const weekLabel = (() => {
		if (!visibleWeekDates?.length) return "";
		const start = parseDateISO(visibleWeekDates[0]);
		const end = parseDateISO(visibleWeekDates[6]);
		return `${start.toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${end.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`;
	})();

	return (
		<div className="space-y-4">
			<div>
				<h1 className="font-display text-2xl text-ink">
					<Trans>Preparar</Trans>
				</h1>
				{weekLabel ? (
					<p className="text-sm text-ink-muted mt-0.5">
						<Trans>Semana visible:</Trans>{" "}
						<span className="font-semibold text-ink">{weekLabel}</span>
						{" · "}
						<Link to="/" className="text-brand underline">
							<Trans>Cambiar en calendario</Trans>
						</Link>
					</p>
				) : null}
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
