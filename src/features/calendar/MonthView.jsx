import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useAppState } from "../../context/AppState";
import { DAY_SHORT_MSG } from "../../i18n/weekDayLabels";
import { MEAL_TYPE_COLOR } from "./mealTypeColors.js";
import {
	monthGridWeeks,
	orderedWeekdayKeys,
	parseDateISO,
	startOfMonth,
	todayISO,
} from "./dateUtils.js";

/**
 * Month overview — dots/counts per day; tap → day (or jump week via parent).
 */
export default function MonthView({ onSelectDate }) {
	const { state } = useAppState();
	const { _ } = useLingui();
	const memberId = state.household.activeMemberId;
	const cal = state.calendars[memberId] || {};
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const cursor = state.ui.calendarCursorDate;
	const weeks = monthGridWeeks(cursor, weekStartsOn);
	const monthPrefix = startOfMonth(cursor).slice(0, 7);
	const today = todayISO();
	const weekdayKeys = orderedWeekdayKeys(weekStartsOn);

	return (
		<section aria-label="Mes">
			<div className="grid grid-cols-7 gap-1 mb-1">
				{weekdayKeys.map((key) => (
					<p
						key={key}
						className="text-center text-xs font-semibold text-ink-muted py-1"
					>
						{_(DAY_SHORT_MSG[key])}
					</p>
				))}
			</div>
			<div className="grid grid-cols-7 gap-1">
				{weeks.flat().map((dateISO) => {
					const inMonth = dateISO.startsWith(monthPrefix);
					const meals = cal[dateISO] || [];
					const isToday = dateISO === today;
					const count = meals.length;
					const d = parseDateISO(dateISO);

					return (
						<button
							type="button"
							key={dateISO}
							onClick={() => onSelectDate(dateISO, "week")}
							className={`min-h-16 sm:min-h-20 rounded-app border p-1.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${
								inMonth
									? "bg-surface border-border hover:border-ink-muted"
									: "bg-transparent border-transparent opacity-45"
							} ${isToday ? "ring-1 ring-[var(--color-brand)]" : ""}`}
						>
							<span
								className={`text-sm font-semibold ${
									isToday ? "text-brand" : inMonth ? "text-ink" : "text-ink-muted"
								}`}
							>
								{d.getDate()}
							</span>
							{count > 0 ? (
								<div className="mt-1 flex flex-wrap gap-0.5">
									{meals.slice(0, 3).map((meal) => (
										<span
											key={meal.instanceId}
											className="w-1.5 h-1.5 rounded-full"
											style={{
												backgroundColor:
													MEAL_TYPE_COLOR[meal.mealType] || MEAL_TYPE_COLOR.otro,
											}}
											title={meal.name}
										/>
									))}
									{count > 3 ? (
										<span className="text-[10px] text-ink-muted leading-none">
											+{count - 3}
										</span>
									) : null}
								</div>
							) : (
								<span className="sr-only">
									<Trans>Vacío</Trans>
								</span>
							)}
						</button>
					);
				})}
			</div>
		</section>
	);
}
