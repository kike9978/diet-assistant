import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useAppState } from "../../context/AppState";
import { DAY_SHORT_MSG } from "../../i18n/weekDayLabels";
import {
	canonicalWeekStartISO,
	getWeekPlan,
	resolveDayPlanForDate,
} from "../weekplan/weekPlanModel.js";
import { parseDateISO, todayISO, weekDateISOs } from "./dateUtils.js";

/** Distinct accents for day-plan badges (cycles by plan index). */
const DAY_PLAN_BADGE_COLORS = [
	"var(--color-accent-breakfast)",
	"var(--color-accent-lunch)",
	"var(--color-accent-dinner)",
	"var(--color-accent-snack)",
	"var(--color-accent-blueberry)",
	"var(--color-accent-tomato)",
	"var(--color-accent-citrus)",
	"var(--color-accent-leaf)",
];

function dayPlanBadgeColor(dayPlans, dayPlanId) {
	const index = Math.max(
		0,
		(dayPlans || []).findIndex((dp) => dp.id === dayPlanId),
	);
	return DAY_PLAN_BADGE_COLORS[index % DAY_PLAN_BADGE_COLORS.length];
}

function DayPlanBadge({ name, color }) {
	return (
		<span
			className="block w-full text-xs font-semibold px-2 py-1 rounded-md text-white leading-tight line-clamp-2 break-words"
			style={{ backgroundColor: color }}
			title={name}
		>
			{name}
		</span>
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
			className={`snap-start shrink-0 w-[7.5rem] sm:w-auto text-left bg-surface border rounded-app p-3 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)] ${
				selected
					? "border-[var(--color-brand)] ring-1 ring-inset ring-[var(--color-brand)]"
					: "border-border hover:border-ink-muted"
			}`}
		>
			<p className="text-xs font-semibold text-ink-muted mb-1.5 flex items-baseline gap-1">
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
			{children}
		</div>
	);
}

/**
 * Week planning grid — day columns show the assigned day-plan name, or empty.
 */
export default function WeekView({ selectedDateISO, onSelectDate }) {
	const { state } = useAppState();
	const memberId = state.household.activeMemberId;
	const cal = state.calendars[memberId] || {};
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const dates = weekDateISOs(state.ui.calendarCursorDate, weekStartsOn);
	const today = todayISO();
	const weekStartISO = canonicalWeekStartISO(
		state.ui.calendarCursorDate,
		weekStartsOn,
	);
	const weekPlan = getWeekPlan(state, weekStartISO, memberId);
	const dayPlans = weekPlan?.dayPlans || [];

	return (
		<section className="mb-4" aria-label="Semana">
			<div className="flex sm:grid sm:grid-cols-7 gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory items-stretch">
				{dates.map((dateISO) => {
					const meals = cal[dateISO] || [];
					const matched = resolveDayPlanForDate(weekPlan, dateISO, meals);
					const dayPlanName = matched?.name?.trim() || null;

					return (
						<DayColumn
							key={dateISO}
							dateISO={dateISO}
							selected={dateISO === selectedDateISO}
							isToday={dateISO === today}
							onSelect={onSelectDate}
						>
							{dayPlanName ? (
								<DayPlanBadge
									name={dayPlanName}
									color={dayPlanBadgeColor(dayPlans, matched.id)}
								/>
							) : (
								<p className="text-xs text-ink-muted">
									<Trans>Vacío</Trans>
								</p>
							)}
						</DayColumn>
					);
				})}
			</div>
		</section>
	);
}
