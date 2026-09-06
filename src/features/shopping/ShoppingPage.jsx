import { Trans } from "@lingui/react/macro";
import { Link } from "react-router-dom";
import { useLingui } from "@lingui/react";
import { useAppState } from "../../context/AppState";
import PrepMode from "./PrepMode";
import ShoppingList from "../../components/ShoppingList";
import { parseDateISO } from "../calendar/dateUtils.js";

/**
 * Compras page with Lista | Prep segmented control.
 * Prep mode via ?mode=prep or in-page tabs.
 */
export default function ShoppingPage({ mode = "lista" }) {
	const { visibleWeekDates } = useAppState();
	const { i18n } = useLingui();
	const isPrep = mode === "prep";
	const locale = i18n.locale === "en" ? "en-US" : "es-MX";
	const weekLabel = (() => {
		if (!visibleWeekDates?.length) return "";
		const start = parseDateISO(visibleWeekDates[0]);
		const end = parseDateISO(visibleWeekDates[6]);
		return `${start.toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${end.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`;
	})();

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3 flex-wrap">
				<div>
					<h1 className="font-display text-2xl text-ink">
						<Trans>Compras</Trans>
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
				</div>
				<div
					className="inline-flex rounded-app border border-border bg-surface p-1"
					role="tablist"
					aria-label="Modo compras"
				>
					<Link
						to="/shopping"
						role="tab"
						aria-selected={!isPrep}
						className={`min-h-11 px-4 py-2 text-sm font-semibold rounded-[calc(var(--radius-md)-2px)] ${
							!isPrep ? "bg-brand text-white" : "text-ink-muted"
						}`}
					>
						<Trans>Lista</Trans>
					</Link>
					<Link
						to="/shopping?mode=prep"
						role="tab"
						aria-selected={isPrep}
						className={`min-h-11 px-4 py-2 text-sm font-semibold rounded-[calc(var(--radius-md)-2px)] ${
							isPrep ? "bg-brand text-white" : "text-ink-muted"
						}`}
					>
						<Trans>Prep</Trans>
					</Link>
				</div>
			</div>

			{isPrep ? <PrepMode /> : <ShoppingList />}
		</div>
	);
}
