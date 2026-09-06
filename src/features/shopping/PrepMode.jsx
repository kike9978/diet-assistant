import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../../context/AppState";
import {
	formatQuantities,
	sumIngredients,
} from "../../domain/ingredient.js";
import { formatQuantity } from "../../domain/quantity.js";
import { DAY_LABEL_MSG } from "../../i18n/weekDayLabels";
import Button from "../../components/ui/Button";
import MealFlavorText from "../meals/MealFlavorText";
import {
	flavorTextSources,
	resolveMealFlavorText,
} from "../meals/flavorText.js";
import { MEAL_TYPE_COLOR } from "../calendar/mealTypeColors.js";
import { parseDateISO } from "../calendar/dateUtils.js";

function PrepMealCard({
	meal,
	dayLabel,
	hasAnySelection,
	isSelected,
	onToggleSelect,
	hideUnselected,
	flavorText,
}) {
	const [showIngredients, setShowIngredients] = useState(false);

	if (hideUnselected && hasAnySelection && !isSelected) return null;

	return (
		<button
			type="button"
			onClick={onToggleSelect}
			className={`w-full text-left bg-surface border border-border rounded-app p-4 transition ${
				hasAnySelection && !isSelected ? "opacity-40" : ""
			} ${isSelected ? "ring-1 ring-[var(--color-brand)] border-[var(--color-brand)]" : ""}`}
		>
			<div className="flex justify-between items-start gap-2">
				<div className="min-w-0">
					<p className="text-xs text-ink-muted mb-0.5">{dayLabel}</p>
					<h3 className="font-semibold text-ink flex items-center gap-2">
						<span
							className="w-2 h-2 rounded-full shrink-0"
							style={{
								backgroundColor:
									MEAL_TYPE_COLOR[meal.mealType] || MEAL_TYPE_COLOR.otro,
							}}
							aria-hidden
						/>
						<span className="truncate">{meal.name}</span>
					</h3>
				</div>
				<span
					role="button"
					tabIndex={0}
					onClick={(e) => {
						e.stopPropagation();
						setShowIngredients((v) => !v);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							e.stopPropagation();
							setShowIngredients((v) => !v);
						}
					}}
					className="text-brand text-sm font-semibold shrink-0"
				>
					{showIngredients ? <Trans>Ocultar</Trans> : <Trans>Mostrar</Trans>}
				</span>
			</div>

			{flavorText ? (
				<div className="mt-2">
					{showIngredients ? (
						<p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-0.5">
							<Trans>Descripción</Trans>
						</p>
					) : null}
					<MealFlavorText
						text={flavorText}
						variant={showIngredients ? "full" : "snippet"}
					/>
				</div>
			) : null}

			{showIngredients ? (
				<ul className="mt-2 space-y-1 text-sm text-ink-muted">
					{(meal.ingredients || []).map((ing) => (
						<li key={ing.id || ing.name} className="flex justify-between gap-2">
							<span>{ing.name}</span>
							<span>
								{typeof ing.quantity === "string"
									? ing.quantity
									: formatQuantity(ing.quantity)}
							</span>
						</li>
					))}
				</ul>
			) : null}
		</button>
	);
}

/**
 * Meal Prep mode scoped to the visible week via selectedInstanceIds.
 */
export default function PrepMode() {
	const {
		state,
		visibleWeekDates,
		toggleMealPrepInstance,
		setMealPrepSelection,
		setMealPrepUnselectedVisible,
	} = useAppState();
	const { _, i18n } = useLingui();

	const memberId = state.household.activeMemberId;
	const cal = state.calendars[memberId] ?? {};
	const flavorSources = useMemo(
		() => flavorTextSources(state),
		[state.mealLibrary, state.weekPlans],
	);
	const weekDates = visibleWeekDates;
	const weekStartISO = weekDates[0];
	const selected = new Set(state.mealPrep.selectedInstanceIds || []);
	const hideUnselected = state.mealPrep.unselectedVisible;
	const selectedIdsKey = (state.mealPrep.selectedInstanceIds || []).join(",");
	const calWeekKey = weekDates
		.map((d) => `${d}:${(cal[d] || []).map((m) => m.instanceId).join(",")}`)
		.join("|");

	// When focused week changes, drop selections that are no longer in the week
	useEffect(() => {
		const validIds = new Set();
		for (const dateISO of weekDates) {
			for (const meal of cal[dateISO] || []) {
				validIds.add(meal.instanceId);
			}
		}
		const prevIds = state.mealPrep.selectedInstanceIds || [];
		const next = prevIds.filter((id) => validIds.has(id));
		const same =
			next.length === prevIds.length &&
			next.every((id, i) => id === prevIds[i]) &&
			state.mealPrep.weekStartISO === weekStartISO;
		if (!same) {
			setMealPrepSelection(next);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by week + selection fingerprint
	}, [weekStartISO, calWeekKey, selectedIdsKey, setMealPrepSelection]);

	const mealsByDay = useMemo(() => {
		return weekDates
			.map((dateISO) => {
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
				return {
					dateISO,
					dayKey,
					dayLabel: _(DAY_LABEL_MSG[dayKey]),
					meals: cal[dateISO] || [],
				};
			})
			.filter((day) => day.meals.length > 0);
	}, [weekDates, cal, _]);

	const selectedMeals = useMemo(() => {
		const out = [];
		for (const day of mealsByDay) {
			for (const meal of day.meals) {
				if (selected.has(meal.instanceId)) {
					out.push({ ...meal, dayLabel: day.dayLabel, dateISO: day.dateISO });
				}
			}
		}
		return out;
	}, [mealsByDay, selected]);

	const aggregated = useMemo(() => {
		const flat = [];
		for (const meal of selectedMeals) {
			for (const ing of meal.ingredients || []) {
				flat.push({
					name: ing.name,
					quantity:
						typeof ing.quantity === "string"
							? ing.quantity
							: formatQuantity(ing.quantity),
					mealName: meal.name,
					day: meal.dayLabel,
				});
			}
		}
		return sumIngredients(flat);
	}, [selectedMeals]);

	const hasAnySelection = selected.size > 0;
	const locale = i18n.locale === "en" ? "en-US" : "es-MX";
	const weekLabel = (() => {
		const start = parseDateISO(weekDates[0]);
		const end = parseDateISO(weekDates[6]);
		return `${start.toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${end.toLocaleDateString(locale, { day: "numeric", month: "short" })}`;
	})();

	if (mealsByDay.length === 0) {
		return (
			<div className="bg-surface border border-border rounded-app p-6 text-center space-y-3">
				<p className="text-ink-muted">
					<Trans>
						No hay comidas en la semana visible ({weekLabel}). Arma la semana
						primero.
					</Trans>
				</p>
				<div className="flex flex-wrap gap-3 justify-center">
					<Link to="/plan/week" className="text-brand font-semibold underline">
						<Trans>Planear esta semana</Trans>
					</Link>
					<Link to="/" className="text-ink-muted underline text-sm">
						<Trans>Ir al calendario</Trans>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-end gap-3 flex-wrap">
				<Button
					variant="secondary"
					onClick={() => setMealPrepUnselectedVisible(!hideUnselected)}
				>
					{hideUnselected ? (
						<Trans>Mostrar no seleccionados</Trans>
					) : (
						<Trans>Ocultar no seleccionados</Trans>
					)}
				</Button>
			</div>

			{mealsByDay.map((day) => (
				<div key={day.dateISO} className="space-y-2">
					<h2 className="font-display text-lg text-ink">{day.dayLabel}</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{day.meals.map((meal) => (
							<PrepMealCard
								key={meal.instanceId}
								meal={meal}
								flavorText={resolveMealFlavorText(meal, flavorSources)}
								dayLabel={day.dayLabel}
								isSelected={selected.has(meal.instanceId)}
								hasAnySelection={hasAnySelection}
								hideUnselected={hideUnselected}
								onToggleSelect={() =>
									toggleMealPrepInstance(meal.instanceId)
								}
							/>
						))}
					</div>
				</div>
			))}

			{hasAnySelection ? (
				<section className="bg-surface border border-border rounded-app p-4 shadow-soft">
					<h2 className="font-display text-xl text-ink mb-4">
						<Trans>Ingredientes para prep</Trans>
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
						{aggregated
							.sort((a, b) => a.name.localeCompare(b.name))
							.map((ingredient) => (
								<div
									key={ingredient.name}
									className="bg-surface-2 rounded-app p-3 border border-border"
								>
									<h3 className="font-semibold text-ink">{ingredient.name}</h3>
									<p className="text-ink-muted mt-1 text-sm">
										{formatQuantities(ingredient.quantities)}
									</p>
									{ingredient.sources?.length > 0 ? (
										<details className="mt-2 text-sm text-ink-muted">
											<summary className="cursor-pointer text-brand font-semibold">
												<Trans>Fuentes ({ingredient.sources.length})</Trans>
											</summary>
											<ul className="mt-2 space-y-1 pl-3 border-l-2 border-border">
												{ingredient.sources.map((source, idx) => (
													<li key={idx}>
														<span className="font-medium">{source.day}</span> —{" "}
														{source.meal}
														<span className="block text-xs">
															{source.quantity}
														</span>
													</li>
												))}
											</ul>
										</details>
									) : null}
								</div>
							))}
					</div>
				</section>
			) : (
				<p className="text-sm text-ink-muted text-center py-4">
					<Trans>Toca las comidas que vas a preparar esta semana.</Trans>
				</p>
			)}
		</div>
	);
}
