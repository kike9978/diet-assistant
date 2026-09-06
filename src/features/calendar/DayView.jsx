import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppState } from "../../context/AppState";
import { useToast } from "../../components/Toast";
import { DAY_LABEL_MSG } from "../../i18n/weekDayLabels";
import Button from "../../components/ui/Button";
import OverflowMenu, { OverflowMenuItem } from "../../components/ui/OverflowMenu";
import { MEAL_TYPE_MSG } from "../meals/mealTypeLabels.js";
import MealFlavorText from "../meals/MealFlavorText";
import MealLibrarySheet from "../meals/MealLibrarySheet.jsx";
import EditScheduledMealSheet from "../weekplan/EditScheduledMealSheet";
import {
	canonicalWeekStartISO,
	getWeekPlan,
	resolveDayPlanForDate,
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
 * Day agenda: assign a whole day plan to this date; tweak individual meals.
 */
export default function DayView({ dateISO }) {
	const {
		state,
		applyDayPlanToDate,
		clearCalendarDay,
		removeMealInstance,
		replaceMeal,
	} = useAppState();
	const { _, i18n } = useLingui();
	const navigate = useNavigate();
	const toast = useToast();
	const memberId = state.household.activeMemberId;
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const weekStartISO = canonicalWeekStartISO(dateISO, weekStartsOn);
	const weekPlan = getWeekPlan(state, weekStartISO);
	/** Assignable day plans = week-plan slots that already have meals. */
	const dayPlans = (weekPlan?.dayPlans || []).filter(
		(dp) => (dp.meals || []).length > 0,
	);
	const meals = state.calendars[memberId]?.[dateISO] || [];
	const assignedPlan = resolveDayPlanForDate(weekPlan, dateISO, meals);
	const d = parseDateISO(dateISO);
	const weekdayKey = DAY_KEYS[d.getDay()];
	const dateLabel = d.toLocaleDateString(
		i18n.locale === "en" ? "en-US" : "es-MX",
		{ day: "numeric", month: "long" },
	);

	const [expandedId, setExpandedId] = useState(null);
	const [expandedMealId, setExpandedMealId] = useState(null);
	const [editingMeal, setEditingMeal] = useState(null);
	const [replacingMeal, setReplacingMeal] = useState(null);

	const planHref = `/plan/week?week=${encodeURIComponent(weekStartISO)}`;
	const hasAssignSources = dayPlans.length > 0;

	const handleReplacePick = (libraryMeal) => {
		if (!replacingMeal) return;
		replaceMeal(replacingMeal.instanceId, libraryMeal.id);
		setReplacingMeal(null);
		toast?.success?.(t`Comida sustituida`);
	};

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
					{assignedPlan?.name?.trim() ? (
						<p className="text-sm font-semibold text-brand mt-1">
							{assignedPlan.name.trim()}
						</p>
					) : null}
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
								<div className="flex items-stretch gap-0">
									<button
										type="button"
										className="min-w-0 flex-1 flex items-center gap-2 px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)]"
										aria-expanded={isExpanded}
										onClick={() =>
											setExpandedMealId(
												isExpanded ? null : meal.instanceId,
											)
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
												{_(
													MEAL_TYPE_MSG[meal.mealType] ||
														MEAL_TYPE_MSG.otro,
												)}
												{ingredientCount > 0 ? (
													<>
														{" · "}
														{ingredientCount} <Trans>ingredientes</Trans>
													</>
												) : null}
											</p>
										</div>
									</button>
									<div className="shrink-0 flex items-center pr-1">
										<OverflowMenu label={t`Opciones de ${meal.name}`}>
											{(close) => (
												<>
													<OverflowMenuItem
														onClick={() => {
															close();
															setEditingMeal(meal);
														}}
													>
														<Trans>Editar</Trans>
													</OverflowMenuItem>
													<OverflowMenuItem
														onClick={() => {
															close();
															if ((state.mealLibrary || []).length === 0) {
																toast?.error?.(
																	t`La biblioteca está vacía. Crea una comida primero.`,
																);
																navigate("/meals/new");
																return;
															}
															setReplacingMeal(meal);
														}}
													>
														<Trans>Sustituir comida</Trans>
													</OverflowMenuItem>
													{meal.mealId ? (
														<OverflowMenuItem
															onClick={() => {
																close();
																navigate(`/meals/${meal.mealId}`);
															}}
														>
															<Trans>Abrir en biblioteca</Trans>
														</OverflowMenuItem>
													) : null}
													<OverflowMenuItem
														danger
														onClick={() => {
															close();
															removeMealInstance(meal.instanceId);
															toast?.success?.(t`Comida quitada del día`);
														}}
													>
														<Trans>Quitar</Trans>
													</OverflowMenuItem>
												</>
											)}
										</OverflowMenu>
									</div>
								</div>

								{isExpanded ? (
									<div className="border-t border-border bg-surface-2/40 px-3 py-3 space-y-2">
										<MealFlavorText text={meal.flavorText} />
										<ul className="text-sm text-ink-muted space-y-1">
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
										<div className="pt-1 flex flex-wrap gap-2">
											<Button
												variant="secondary"
												className="!min-h-9 !px-3 text-xs"
												onClick={() => setEditingMeal(meal)}
											>
												<Trans>Editar</Trans>
											</Button>
										</div>
									</div>
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
							const expandKey = dayPlan.id;
							const isExpanded = expandedId === expandKey;
							const isAssigned = assignedPlan?.id === dayPlan.id;

							return (
								<li
									key={dayPlan.id}
									className={`border rounded-app overflow-hidden ${
										isAssigned
											? "border-[var(--color-brand)] ring-1 ring-inset ring-[var(--color-brand)]"
											: "border-border"
									}`}
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
											<p className="font-semibold text-ink truncate">
												{dayPlan.name || `Día ${index + 1}`}
											</p>
											{isAssigned ? (
												<span className="text-xs font-semibold text-brand shrink-0">
													<Trans>Asignado</Trans>
												</span>
											) : null}
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
													<MealFlavorText
														text={meal.flavorText}
														className="mb-1 pl-4"
													/>
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

			<EditScheduledMealSheet
				open={Boolean(editingMeal)}
				onClose={() => setEditingMeal(null)}
				instanceId={editingMeal?.instanceId}
				meal={editingMeal}
			/>

			<MealLibrarySheet
				open={Boolean(replacingMeal)}
				onClose={() => setReplacingMeal(null)}
				title={<Trans>Sustituir comida</Trans>}
				meals={state.mealLibrary}
				onSelect={handleReplacePick}
			/>
		</section>
	);
}
