import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useAppState } from "../../context/AppState";
import { DAY_SHORT_MSG } from "../../i18n/weekDayLabels";
import { MEAL_TYPE_COLOR } from "./mealTypeColors.js";
import { parseDateISO, todayISO, weekDateISOs } from "./dateUtils.js";

function MealChip({ meal }) {
	return (
		<div
			className="text-xs font-semibold px-2 py-1 rounded-md text-white truncate"
			style={{
				backgroundColor: MEAL_TYPE_COLOR[meal.mealType] || MEAL_TYPE_COLOR.otro,
			}}
			title={meal.name}
		>
			{meal.name}
		</div>
	);
}

function DayColumn({ dateISO, selected, isToday, children, onSelect }) {
	const { _ } = useLingui();
	const d = parseDateISO(dateISO);
	const dayKey = [
		"sunday",
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
	][d.getDay()];

	return (
		<div
			role="button"
			tabIndex={0}
			aria-pressed={selected}
			onClick={() => onSelect(dateISO)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect(dateISO);
				}
			}}
			className={`snap-start shrink-0 w-[7.5rem] sm:w-auto text-left bg-surface border rounded-app p-3 min-h-28 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)] ${
				selected
					? "border-[var(--color-brand)] ring-1 ring-inset ring-[var(--color-brand)]"
					: "border-border hover:border-ink-muted"
			}`}
		>
			<p className="text-xs font-semibold text-ink-muted mb-2 flex items-baseline gap-1">
				<span>{_(DAY_SHORT_MSG[dayKey])}</span>
				<span className={isToday ? "text-brand" : "text-ink"}>
					{d.getDate()}
				</span>
				{isToday ? (
					<span className="sr-only">
						<Trans>Hoy</Trans>
					</span>
				) : null}
			</p>
			<div className="space-y-1">{children}</div>
		</div>
	);
}

/**
 * Week planning grid.
 */
export default function WeekView({
	selectedDateISO,
	onSelectDate,
	onOpenMeal,
}) {
	const { state } = useAppState();
	const memberId = state.household.activeMemberId;
	const cal = state.calendars[memberId] || {};
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const dates = weekDateISOs(state.ui.calendarCursorDate, weekStartsOn);
	const today = todayISO();

	return (
		<section className="mb-4" aria-label="Semana">
			<div className="flex sm:grid sm:grid-cols-7 gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
				{dates.map((dateISO) => {
					const meals = cal[dateISO] || [];
					return (
						<DayColumn
							key={dateISO}
							dateISO={dateISO}
							selected={dateISO === selectedDateISO}
							isToday={dateISO === today}
							onSelect={onSelectDate}
						>
							{meals.map((meal) => (
								<button
									key={meal.instanceId}
									type="button"
									className="w-full text-left"
									onClick={(e) => {
										e.stopPropagation();
										onOpenMeal?.(meal);
									}}
								>
									<MealChip meal={meal} />
								</button>
							))}
							{meals.length === 0 ? (
								<p className="text-xs text-ink-muted mt-1">
									<Trans>Vacío</Trans>
								</p>
							) : null}
						</DayColumn>
					);
				})}
			</div>
		</section>
	);
}
