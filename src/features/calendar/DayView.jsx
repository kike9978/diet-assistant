import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAppState } from "../../context/AppState";
import { DAY_LABEL_MSG } from "../../i18n/weekDayLabels";
import Button from "../../components/ui/Button";
import { MEAL_TYPE_MSG } from "../meals/mealTypeLabels.js";
import {
	canonicalWeekStartISO,
	getWeekPlan,
} from "../weekplan/weekPlanModel.js";
import { quantityLabel } from "./calendarActions.js";
import { parseDateISO } from "./dateUtils.js";
import { MEAL_TYPE_COLOR } from "./mealTypeColors.js";

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
 * Day agenda: assign a week-plan day slot to this date, then tweak meals.
 */
export default function DayView({ dateISO }) {
	const { state, applyDayPlanToDate, clearCalendarDay } = useAppState();
	const { _, i18n } = useLingui();
	const memberId = state.household.activeMemberId;
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const weekStartISO = canonicalWeekStartISO(dateISO, weekStartsOn);
	const weekPlan = getWeekPlan(state, weekStartISO);
	/** Assignable day plans = week-plan slots that already have meals. */
	const dayPlans = (weekPlan?.dayPlans || []).filter(
		(dp) => (dp.meals || []).length > 0,
	);
	const meals = state.calendars[memberId]?.[dateISO] || [];
	const d = parseDateISO(dateISO);
	const weekdayKey = DAY_KEYS[d.getDay()];
	const dateLabel = d.toLocaleDateString(
		i18n.locale === "en" ? "en-US" : "es-MX",
		{ day: "numeric", month: "long" },
	);

	const [expandedId, setExpandedId] = useState(null);
	const [expandedMealId, setExpandedMealId] = useState(null);

	const planHref = `/plan/week?week=${encodeURIComponent(weekStartISO)}`;
	const hasAssignSources = dayPlans.length > 0;

	return (
		<section
			className="bg-surface border border-border rounded-app p-4 sm:p-5"
			aria-labelledby="day-view-heading"
		>
			<div className="flex items-start justify-between gap-3 flex-wrap mb-4">
				<div>
					<h2
						id="day-view-heading"
						className="font-display text-xl text-ink"
					>
						{_(DAY_LABEL_MSG[weekdayKey])}{" "}
						<span className="text-ink-muted font-normal text-base">
							{dateLabel}
						</span>
					</h2>
					<p className="text-sm text-ink-muted mt-1">
						{meals.length === 0 ? (
							<Trans>Sin comidas. Aplica un plan de día abajo.</Trans>
						) : meals.length === 1 ? (
							<Trans>1 comida</Trans>
						) : (
							<Trans>{meals.length} comidas</Trans>
						)}
					</p>
				</div>
				{meals.length > 0 ? (
					<Button
						variant="danger"
						onClick={() => clearCalendarDay(dateISO)}
					>
						<Trans>Limpiar día</Trans>
					</Button>
				) : null}
			</div>

			{meals.length > 0 ? (
				<ul className="space-y-2 mb-6">
					{meals.map((meal) => {
						const ingredients = meal.ingredients || [];
						const isExpanded = expandedMealId === meal.instanceId;
						const ingredientCount = ingredients.length;

						return (
							<li
								key={meal.instanceId}
								className="border border-border rounded-app overflow-hidden"
							>
								<button
									type="button"
									className="w-full flex items-center gap-2 px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)]"
									aria-expanded={isExpanded}
									onClick={() =>
										setExpandedMealId(isExpanded ? null : meal.instanceId)
									}
								>
									<svg
										className={`w-4 h-4 shrink-0 text-ink-muted transition-transform ${
											isExpanded ? "rotate-180" : ""
										}`}
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 9l-7 7-7-7"
										/>
									</svg>
									<span
										className="w-2.5 h-2.5 rounded-full shrink-0"
										style={{
											backgroundColor:
												MEAL_TYPE_COLOR[meal.mealType] ||
												MEAL_TYPE_COLOR.otro,
										}}
										aria-hidden
									/>
									<div className="min-w-0 flex-1">
										<h3 className="font-semibold text-ink line-clamp-2">
											{meal.name}
										</h3>
										<p className="text-xs text-ink-muted">
											{_(MEAL_TYPE_MSG[meal.mealType] || MEAL_TYPE_MSG.otro)}
											{ingredientCount > 0 ? (
												<>
													{" · "}
													{ingredientCount} <Trans>ingredientes</Trans>
												</>
											) : null}
										</p>
									</div>
								</button>

								{isExpanded ? (
									<ul className="border-t border-border bg-surface-2/40 px-3 py-3 text-sm text-ink-muted space-y-1">
										{ingredientCount === 0 ? (
											<li>
												<Trans>Sin ingredientes</Trans>
											</li>
										) : (
											ingredients.map((ing) => (
												<li
													key={
														ing.id ||
														`${ing.name}-${quantityLabel(ing.quantity)}`
													}
												>
													{ing.name}
													{quantityLabel(ing.quantity)
														? ` (${quantityLabel(ing.quantity)})`
														: ""}
												</li>
											))
										)}
									</ul>
								) : null}
							</li>
						);
					})}
				</ul>
			) : null}

			<div>
				<h3 className="text-sm font-semibold text-ink mb-2">
					<Trans>Usar plan de día</Trans>
				</h3>
				{!hasAssignSources ? (
					<div className="space-y-3">
						<p className="text-sm text-ink-muted">
							<Trans>
								No hay planes de día con comidas en el plan de esta semana.
							</Trans>
						</p>
						<Link
							to={planHref}
							className="inline-flex items-center justify-center min-h-11 px-4 rounded-app text-sm font-semibold border border-border bg-surface hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
						>
							<Trans>Edita el plan</Trans>
						</Link>
					</div>
				) : (
					<ul className="space-y-2">
						{dayPlans.map((dayPlan, index) => {
							const planMeals = dayPlan.meals || [];
							const mealCount = planMeals.length;
							const expandKey = dayPlan.id;
							const isExpanded = expandedId === expandKey;

							return (
								<li
									key={dayPlan.id}
									className="border border-border rounded-app overflow-hidden"
								>
									<div className="flex items-center gap-2 px-3 py-2">
										<button
											type="button"
											className="flex-1 min-w-0 text-left flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] rounded-md"
											aria-expanded={isExpanded}
											onClick={() =>
												setExpandedId(isExpanded ? null : expandKey)
											}
										>
											<svg
												className={`w-4 h-4 shrink-0 text-ink-muted transition-transform ${
													isExpanded ? "rotate-180" : ""
												}`}
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												aria-hidden
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M19 9l-7 7-7-7"
												/>
											</svg>
											<div className="min-w-0">
												<p className="font-semibold text-ink truncate">
													{dayPlan.name || `Día ${index + 1}`}
												</p>
												<p className="text-xs text-ink-muted">
													{mealCount === 1 ? (
														<Trans>1 comida</Trans>
													) : (
														<Trans>{mealCount} comidas</Trans>
													)}
												</p>
											</div>
										</button>
										<Button
											variant="secondary"
											className="shrink-0"
											onClick={() =>
												applyDayPlanToDate(
													weekStartISO,
													dayPlan.id,
													dateISO,
												)
											}
										>
											<Trans>Usar</Trans>
										</Button>
									</div>

									{isExpanded ? (
										<ul className="border-t border-border bg-surface-2/40 px-3 py-3 space-y-3">
											{planMeals.map((meal) => (
												<li key={meal.tempId || meal.mealId || meal.name}>
													<div className="flex items-center gap-2 mb-1">
														<span
															className="w-2 h-2 rounded-full shrink-0"
															style={{
																backgroundColor:
																	MEAL_TYPE_COLOR[meal.mealType] ||
																	MEAL_TYPE_COLOR.otro,
															}}
															aria-hidden
														/>
														<p className="font-semibold text-sm text-ink">
															{meal.name}
														</p>
														<span className="text-xs text-ink-muted">
															{_(
																MEAL_TYPE_MSG[meal.mealType] ||
																	MEAL_TYPE_MSG.otro,
															)}
														</span>
													</div>
													<ul className="text-xs text-ink-muted pl-4 list-disc space-y-0.5">
														{(meal.ingredients || []).map((ing) => (
															<li
																key={
																	ing.id ||
																	`${ing.name}-${quantityLabel(ing.quantity)}`
																}
															>
																{ing.name}
																{quantityLabel(ing.quantity)
																	? ` (${quantityLabel(ing.quantity)})`
																	: ""}
															</li>
														))}
													</ul>
												</li>
											))}
										</ul>
									) : null}
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</section>
	);
}
