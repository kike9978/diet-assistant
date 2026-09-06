import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import Button from "../../components/ui/Button";
import {
	addDays,
	addMonths,
	parseDateISO,
	startOfMonth,
	todayISO,
	weekDateISOs,
} from "./dateUtils.js";

const VIEWS = [
	{ id: "month", label: <Trans>Mes</Trans> },
	{ id: "week", label: <Trans>Semana</Trans> },
];

/**
 * Shared calendar chrome: range label, prev/next, Hoy, Mes|Semana.
 */
export default function CalendarChrome({
	view,
	cursorDate,
	weekStartsOn,
	onViewChange,
	onCursorChange,
	onToday,
	activeMember = null,
}) {
	const { i18n } = useLingui();
	const locale = i18n.locale === "en" ? "en-US" : "es-MX";
	const activeView = view === "month" ? "month" : "week";

	const rangeLabel = (() => {
		if (activeView === "month") {
			const d = parseDateISO(startOfMonth(cursorDate));
			return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
		}
		const week = weekDateISOs(cursorDate, weekStartsOn);
		const start = parseDateISO(week[0]);
		const end = parseDateISO(week[6]);
		const sameMonth = start.getMonth() === end.getMonth();
		if (sameMonth) {
			return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString(locale, { month: "long", year: "numeric" })}`;
		}
		return `${start.toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${end.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`;
	})();

	const shift = (delta) => {
		if (activeView === "month") {
			onCursorChange(addMonths(cursorDate, delta));
		} else {
			onCursorChange(addDays(cursorDate, delta * 7));
		}
	};

	const goToday = () => {
		const iso = todayISO();
		onCursorChange(iso);
		onToday?.(iso);
	};

	return (
		<div className="flex flex-col gap-3 mb-4">
			{activeMember ? (
				<p className="inline-flex items-center gap-2 text-sm text-ink-muted">
					<span
						className="w-2.5 h-2.5 rounded-full"
						style={{ backgroundColor: activeMember.color }}
						aria-hidden
					/>
					<span>
						<Trans>Semana de</Trans>{" "}
						<span className="font-semibold text-ink">{activeMember.name}</span>
					</span>
				</p>
			) : null}
			<div className="flex items-center justify-between gap-2 flex-wrap">
				<p className="font-display text-lg sm:text-xl text-ink capitalize">
					{rangeLabel}
				</p>
				<div className="flex gap-2">
					<Button
						variant="secondary"
						aria-label={t`Anterior`}
						onClick={() => shift(-1)}
					>
						←
					</Button>
					<Button variant="secondary" onClick={goToday}>
						<Trans>Hoy</Trans>
					</Button>
					<Button
						variant="secondary"
						aria-label={t`Siguiente`}
						onClick={() => shift(1)}
					>
						→
					</Button>
				</div>
			</div>

			<div
				className="inline-flex self-start rounded-app border border-border bg-surface p-1"
				role="tablist"
				aria-label={t`Vista de calendario`}
			>
				{VIEWS.map((v) => (
					<button
						key={v.id}
						type="button"
						role="tab"
						aria-selected={activeView === v.id}
						onClick={() => onViewChange(v.id)}
						className={`min-h-11 px-3 sm:px-4 py-2 text-sm font-semibold rounded-[calc(var(--radius-md)-2px)] transition ${
							activeView === v.id
								? "bg-brand text-white"
								: "text-ink-muted hover:text-ink"
						}`}
					>
						{v.label}
					</button>
				))}
			</div>
		</div>
	);
}
