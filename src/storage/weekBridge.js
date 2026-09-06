import { createId } from "../domain/ids.js";
import { ingredientFromLegacy } from "../domain/ingredient.js";
import { inferMealType } from "../domain/mealType.js";
import { formatQuantity } from "../domain/quantity.js";
import { WEEK_DAYS } from "../domain/ingredient.js";
import {
	parseDateISO,
	weekdayKeysToDateISO,
	weekDateISOs,
} from "../features/calendar/dateUtils.js";

/**
 * Legacy weekPlan shape from calendars for the visible week.
 * Meals use string quantities for existing ShoppingList / MealPlanner.
 *
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 * @returns {Record<string, object[]>}
 */
export function calendarsToWeekPlan(state) {
	const memberId = state.household.activeMemberId;
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const cursor = state.ui.calendarCursorDate;
	const dateByWeekday = weekdayKeysToDateISO(cursor, weekStartsOn);
	const memberCal = state.calendars[memberId] || {};

	/** @type {Record<string, object[]>} */
	const weekPlan = {};
	for (const day of WEEK_DAYS) {
		weekPlan[day] = [];
	}

	for (const [weekday, dateISO] of Object.entries(dateByWeekday)) {
		const meals = memberCal[dateISO] || [];
		weekPlan[weekday] = meals.map((m) => ({
			id: m.instanceId,
			instanceId: m.instanceId,
			mealId: m.mealId,
			name: m.name,
			ingredients: (m.ingredients || []).map((ing) => ({
				id: ing.id,
				name: ing.name,
				quantity:
					typeof ing.quantity === "string"
						? ing.quantity
						: formatQuantity(ing.quantity),
			})),
		}));
	}

	return weekPlan;
}

/**
 * Write a legacy weekPlan back into calendars for the visible week (replaces those days).
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 * @param {Record<string, object[]>} weekPlan
 */
export function applyWeekPlanToState(state, weekPlan) {
	const memberId = state.household.activeMemberId;
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const cursor = state.ui.calendarCursorDate;
	const dateByWeekday = weekdayKeysToDateISO(cursor, weekStartsOn);
	const calendars = {
		...state.calendars,
		[memberId]: { ...(state.calendars[memberId] || {}) },
	};

	for (const day of WEEK_DAYS) {
		const dateISO = dateByWeekday[day];
		const meals = weekPlan[day] || [];
		calendars[memberId][dateISO] = meals.map((meal) => ({
			instanceId: meal.instanceId || meal.id || createId(),
			dateISO,
			memberId,
			mealId: meal.mealId ?? null,
			name: meal.name,
			mealType: inferMealType(meal.name),
			ingredients: (meal.ingredients || []).map((ing) => {
				if (ing.quantity && typeof ing.quantity === "object" && "raw" in ing.quantity) {
					return {
						id: ing.id || createId(),
						name: ing.name,
						quantity: ing.quantity,
					};
				}
				return ingredientFromLegacy({
					name: ing.name,
					quantity: String(ing.quantity ?? ""),
				});
			}),
		}));
	}

	return { ...state, calendars };
}

/**
 * Reconstruct a legacy dietPlan from the first diet template (for MealPlanner).
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 */
export function dietTemplatesToLegacyDietPlan(state) {
	const template = state.dietTemplates[0];
	if (!template) return null;

	const dayById = Object.fromEntries(state.dayTemplates.map((d) => [d.id, d]));
	const mealById = Object.fromEntries(state.mealLibrary.map((m) => [m.id, m]));

	return {
		days: template.dayTemplateIds
			.map((id) => dayById[id])
			.filter(Boolean)
			.map((day) => ({
				id: day.id,
				name: day.name,
				meals: day.mealIds
					.map((mid) => mealById[mid])
					.filter(Boolean)
					.map((meal) => ({
						id: meal.id,
						name: meal.name,
						ingredients: (meal.ingredients || []).map((ing) => ({
							name: ing.name,
							quantity:
								typeof ing.quantity === "string"
									? ing.quantity
									: formatQuantity(ing.quantity),
						})),
					})),
			})),
	};
}

/**
 * Import a legacy diet JSON into v2 templates + library (does not clear calendar).
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 * @param {object} dietPlan
 * @param {string} [name]
 */
export function importDietPlanIntoState(state, dietPlan, name = "Plan importado") {
	const now = new Date().toISOString();
	const mealLibrary = [...state.mealLibrary];
	const dayTemplates = [...state.dayTemplates];
	const dietTemplates = [...state.dietTemplates];
	const dayTemplateIds = [];

	for (const day of dietPlan.days || []) {
		const mealIds = [];
		for (const meal of day.meals || []) {
			const id = createId();
			mealLibrary.push({
				id,
				name: meal.name,
				mealType: inferMealType(meal.name),
				ingredients: (meal.ingredients || []).map((ing) =>
					ingredientFromLegacy(ing),
				),
				tags: [],
				servings: 1,
				source: "import",
				createdAt: now,
				updatedAt: now,
			});
			mealIds.push(id);
		}
		const dayId = createId();
		dayTemplates.push({ id: dayId, name: day.name, mealIds });
		dayTemplateIds.push(dayId);
	}

	dietTemplates.push({
		id: createId(),
		name,
		dayTemplateIds,
		createdAt: now,
	});

	return {
		...state,
		mealLibrary,
		dayTemplates,
		dietTemplates,
	};
}

/**
 * Dates in the visible week (for week surface).
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 */
export function visibleWeekDates(state) {
	return weekDateISOs(
		parseDateISO(state.ui.calendarCursorDate),
		state.settings.weekStartsOn ?? 1,
	);
}
