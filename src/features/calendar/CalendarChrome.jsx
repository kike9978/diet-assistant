import { t } from "@lingui/core/macro";
import { Plural, Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
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
 * Shared calendar chrome: member + range, prev/next/Hoy, Mes|Semana,
 * edit plan + optional auto-fill (week view).
 */
export default function CalendarChrome({
	view,
	cursorDate,
	weekStartsOn,
	onViewChange,
	onCursorChange,
	onToday,
	activeMember = null,
	editPlanWeekStartISO = null,
	assignedDays = null,
	totalDays = null,
	canFillEmpty = false,
	emptyDays = 0,
	onFillEmpty = null,
}) {
	const { i18n } = useLingui();
	const locale = i18n.locale === "en" ? "en-US" : "es-MX";
	const activeView = view === "month" ? "month" : "week";

	const rangeLabel = (() => {
		if (activeView === "month") {
			const d = parseDateISO(startOfMonth(cursorDate));
			return d.toLocaleDateString(locale, { month: "short", year: "numeric" });
		}
		const week = weekDateISOs(cursorDate, weekStartsOn);
		const start = parseDateISO(week[0]);
		const end = parseDateISO(week[6]);
		const sameMonth = start.getMonth() === end.getMonth();
		if (sameMonth) {
			return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString(locale, { month: "short", year: "numeric" })}`;
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

	const showEditPlan =
		activeView === "week" && typeof editPlanWeekStartISO === "string";
	const showAssignMeta =
		activeView === "week" &&
		typeof assignedDays === "number" &&
		typeof totalDays === "number" &&
		totalDays > 0;

	return (
		<div className="flex flex-col gap-2 mb-3">
			<div className="flex items-center gap-2 min-w-0">
				<div className="min-w-0 flex-1">
					{activeMember ? (
						<p className="flex items-center gap-1.5 text-sm text-ink-muted truncate">
							<span
								className="w-2 h-2 rounded-full shrink-0"
								style={{ backgroundColor: activeMember.color }}
								aria-hidden
							/>
							<span className="truncate">
								<span className="font-semibold text-ink">
									{activeMember.name}
								</span>
								<span className="text-ink-muted"> · </span>
								<span className="capitalize">{rangeLabel}</span>
								{showAssignMeta ? (
									<>
										<span className="text-ink-muted"> · </span>
										<span className="tabular-nums text-ink">
											{assignedDays}/{totalDays}{" "}
											<Trans>asignados</Trans>
										</span>
									</>
								) : null}
							</span>
						</p>
					) : (
						<p className="font-display text-base sm:text-lg text-ink capitalize truncate">
							{rangeLabel}
						</p>
					)}
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					<Button
						variant="secondary"
						aria-label={t`Anterior`}
						onClick={() => shift(-1)}
						className="min-h-9 px-2.5"
					>
						<ChevronLeft className="size-4" aria-hidden />
					</Button>
					<Button
						variant="secondary"
						onClick={goToday}
						className="min-h-9 px-2.5 text-xs"
					>
						<Trans>Hoy</Trans>
					</Button>
					<Button
						variant="secondary"
						aria-label={t`Siguiente`}
						onClick={() => shift(1)}
						className="min-h-9 px-2.5"
					>
						<ChevronRight className="size-4" aria-hidden />
					</Button>
				</div>
			</div>

			<div className="flex items-center justify-between gap-2 flex-wrap">
				<div
					className="inline-flex rounded-app border border-border bg-surface p-0.5"
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
							className={`min-h-9 px-3 py-1.5 text-sm font-semibold rounded-[calc(var(--radius-md)-2px)] transition ${
								activeView === v.id
									? "bg-brand text-white"
									: "text-ink-muted hover:text-ink"
							}`}
						>
							{v.label}
						</button>
					))}
				</div>

				{showEditPlan ? (
					<div className="flex items-center gap-1.5 shrink-0">
						{canFillEmpty && onFillEmpty ? (
							<Button
								onClick={onFillEmpty}
								className="min-h-9 px-3 text-xs"
							>
								<Plural
									value={emptyDays}
									one="Autocompletar # día"
									other="Autocompletar # días"
								/>
							</Button>
						) : null}
						<Link
							to={`/plan/week?week=${encodeURIComponent(editPlanWeekStartISO)}`}
							className="inline-flex items-center justify-center min-h-9 px-3 rounded-app text-xs font-semibold border border-border bg-surface hover:bg-surface-2"
						>
							<Trans>Editar plan</Trans>
						</Link>
					</div>
				) : null}
			</div>
		</div>
	);
}
