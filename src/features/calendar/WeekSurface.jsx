import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useAppState } from "../../context/AppState";
import { DAY_SHORT_MSG } from "../../i18n/weekDayLabels";
import Button from "../../components/ui/Button";
import {
	parseDateISO,
	toDateISO,
	todayISO,
	weekDateISOs,
} from "./dateUtils.js";

const TYPE_COLOR = {
	desayuno: "var(--color-accent-breakfast)",
	colacion: "var(--color-accent-snack)",
	comida: "var(--color-accent-lunch)",
	merienda: "var(--color-accent-snack)",
	cena: "var(--color-accent-dinner)",
	otro: "var(--color-ink-muted)",
};

const DAY_KEYS = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
];

/**
 * Interactive week grid — primary planning surface.
 * @param {{ selectedDateISO: string, onSelectDate: (dateISO: string) => void }} props
 */
export default function WeekSurface({ selectedDateISO, onSelectDate }) {
	const { state, setCalendarCursorDate } = useAppState();
	const { _ } = useLingui();
	const memberId = state.household.activeMemberId;
	const cal = state.calendars[memberId] || {};
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const dates = weekDateISOs(state.ui.calendarCursorDate, weekStartsOn);
	const today = todayISO();

	const shiftWeek = (delta) => {
		const d = parseDateISO(state.ui.calendarCursorDate);
		d.setDate(d.getDate() + delta * 7);
		const next = toDateISO(d);
		setCalendarCursorDate(next);
		const nextWeek = weekDateISOs(next, weekStartsOn);
		if (!nextWeek.includes(selectedDateISO)) {
			onSelectDate(nextWeek[0]);
		}
	};

	const goToday = () => {
		const iso = todayISO();
		setCalendarCursorDate(iso);
		onSelectDate(iso);
	};

	return (
		<section className="mb-4">
			<div className="flex items-center justify-between gap-2 mb-3">
				<h2 className="font-display text-xl text-ink">
					<Trans>Esta semana</Trans>
				</h2>
				<div className="flex gap-2">
					<Button
						variant="secondary"
						aria-label={t`Semana anterior`}
						onClick={() => shiftWeek(-1)}
					>
						←
					</Button>
					<Button variant="secondary" onClick={goToday}>
						<Trans>Hoy</Trans>
					</Button>
					<Button
						variant="secondary"
						aria-label={t`Semana siguiente`}
						onClick={() => shiftWeek(1)}
					>
						→
					</Button>
				</div>
			</div>

			<div className="flex sm:grid sm:grid-cols-7 gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
				{dates.map((dateISO) => {
					const d = parseDateISO(dateISO);
					const meals = cal[dateISO] || [];
					const isSelected = dateISO === selectedDateISO;
					const isToday = dateISO === today;

					return (
						<button
							type="button"
							key={dateISO}
							onClick={() => onSelectDate(dateISO)}
							aria-pressed={isSelected}
							className={`snap-start shrink-0 w-[7.5rem] sm:w-auto text-left bg-surface border rounded-app p-3 min-h-28 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 ${
								isSelected
									? "border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]"
									: "border-border hover:border-ink-muted"
							}`}
						>
							<p className="text-xs font-semibold text-ink-muted mb-2 flex items-baseline gap-1">
								<span>{_(DAY_SHORT_MSG[DAY_KEYS[d.getDay()]])}</span>
								<span className={isToday ? "text-brand" : "text-ink"}>
									{d.getDate()}
								</span>
								{isToday ? (
									<span className="sr-only">
										<Trans>Hoy</Trans>
									</span>
								) : null}
							</p>
							<ul className="space-y-1">
								{meals.map((meal) => (
									<li
										key={meal.instanceId}
										className="text-xs font-semibold px-2 py-1 rounded-md text-white truncate"
										style={{
											backgroundColor:
												TYPE_COLOR[meal.mealType] || TYPE_COLOR.otro,
										}}
										title={meal.name}
									>
										{meal.name}
									</li>
								))}
							</ul>
							{meals.length === 0 ? (
								<p className="text-xs text-ink-muted mt-1">
									<Trans>Vacío</Trans>
								</p>
							) : null}
						</button>
					);
				})}
			</div>
		</section>
	);
}
