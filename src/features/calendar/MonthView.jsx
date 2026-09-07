import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppState";
import { DAY_SHORT_MSG } from "../../i18n/weekDayLabels";
import {
	monthGridWeeks,
	orderedWeekdayKeys,
	parseDateISO,
	startOfMonth,
	todayISO,
} from "./dateUtils.js";
import {
	getWeekPlan,
	resolveDayPlanForDate,
	weekCalendarHasMeals,
	weekPlanHasContent,
} from "../weekplan/weekPlanModel.js";

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
			className="block w-full text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-md text-white leading-tight line-clamp-2 break-words"
			style={{ backgroundColor: color }}
			title={name}
		>
			{name}
		</span>
	);
}

/**
 * Month calendar as one grid. First cell of each week row edits that week's plan.
 * Day cells show the assigned day-plan name (never individual meal chips).
 */
export default function MonthView({ selectedDateISO, onSelectDate }) {
	const { state } = useAppState();
	const navigate = useNavigate();
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
			<div className="grid grid-cols-8 gap-px rounded-app border border-border overflow-hidden bg-border">
				<div className="bg-surface-2/60 p-1.5 sm:p-2" aria-hidden />
				{weekdayKeys.map((key) => (
					<p
						key={key}
						className="bg-surface-2/60 text-center text-xs font-semibold text-ink-muted py-2"
					>
						{_(DAY_SHORT_MSG[key])}
					</p>
				))}

				{weeks.map((weekDates) => {
					const weekStart = weekDates[0];
					const plan = getWeekPlan(state, weekStart, memberId);
					const dayPlans = plan?.dayPlans || [];
					const hasPlan = weekPlanHasContent(plan);
					const hasCal = weekCalendarHasMeals(
						state,
						weekStart,
						weekStartsOn,
						memberId,
					);
					const planTitle = hasCal
						? "Plan asignado — editar"
						: hasPlan
							? "Plan listo — editar"
							: "Editar plan de semana";

					return (
						<div key={weekStart} className="contents">
							<button
								type="button"
								title={planTitle}
								aria-label={planTitle}
								onClick={() =>
									navigate(
										`/plan/week?week=${encodeURIComponent(weekStart)}`,
									)
								}
								className={`min-h-[4.5rem] sm:min-h-[5.5rem] p-1.5 flex flex-col items-center justify-center gap-1 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)] ${hasCal || hasPlan
										? "bg-[var(--color-brand)]/10 hover:bg-[var(--color-brand)]/15 text-brand"
										: "bg-surface hover:bg-surface-2 text-ink-muted"
									}`}
							>
								<span className="text-lg leading-none" aria-hidden>
									✎
								</span>
								<span className="text-[10px] font-semibold leading-tight">
									{hasCal ? (
										<Trans>Asignado</Trans>
									) : hasPlan ? (
										<Trans>Listo</Trans>
									) : (
										<Trans>Editar</Trans>
									)}
								</span>
							</button>

							{weekDates.map((dateISO) => {
								const inMonth = dateISO.startsWith(monthPrefix);
								const meals = cal[dateISO] || [];
								const matched = resolveDayPlanForDate(plan, dateISO, meals);
								const dayPlanName = matched?.name?.trim() || null;
								const isToday = dateISO === today;
								const selected = dateISO === selectedDateISO;
								const d = parseDateISO(dateISO);

								return (
									<button
										type="button"
										key={dateISO}
										onClick={() => onSelectDate(dateISO)}
										className={`min-h-[4.5rem] sm:min-h-[5.5rem] p-1.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)] ${selected
												? "bg-[var(--color-brand)]/10 ring-1 ring-inset ring-[var(--color-brand)]"
												: inMonth
													? "bg-surface hover:bg-surface-2"
													: "bg-surface-2/40"
											}`}
									>
										<span
											className={`inline-flex items-center justify-center min-w-6 h-6 text-sm font-semibold rounded-full mb-1 ${isToday
													? "bg-brand text-white"
													: inMonth
														? "text-ink"
														: "text-ink-muted"
												}`}
										>
											{d.getDate()}
										</span>
										{dayPlanName ? (
											<DayPlanBadge
												name={dayPlanName}
												color={dayPlanBadgeColor(dayPlans, matched.id)}
											/>
										) : null}
									</button>
								);
							})}
						</div>
					);
				})}
			</div>
		</section>
	);
}
