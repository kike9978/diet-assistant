import { createId } from "../../domain/ids.js";
import { formatQuantity } from "../../domain/quantity.js";

/**
 * Replace all meals on a date with meals from a day template.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} dayTemplateId
 * @param {string} dateISO
 */
export function assignDayTemplateToDate(state, dayTemplateId, dateISO) {
	const template = state.dayTemplates.find((d) => d.id === dayTemplateId);
	if (!template) return state;

	const mealById = Object.fromEntries(state.mealLibrary.map((m) => [m.id, m]));
	const memberId = state.household.activeMemberId;
	const scheduled = template.mealIds
		.map((mealId) => mealById[mealId])
		.filter(Boolean)
		.map((meal) => ({
			instanceId: createId(),
			dateISO,
			memberId,
			mealId: meal.id,
			name: meal.name,
			mealType: meal.mealType,
			ingredients: (meal.ingredients || []).map((ing) => ({
				...ing,
				id: createId(),
			})),
		}));

	const memberCal = { ...(state.calendars[memberId] || {}) };
	memberCal[dateISO] = scheduled;

	return {
		...state,
		calendars: { ...state.calendars, [memberId]: memberCal },
		ui: { ...state.ui, calendarCursorDate: dateISO },
	};
}

/**
 * Clear all scheduled meals for a date.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} dateISO
 */
export function clearCalendarDay(state, dateISO) {
	const memberId = state.household.activeMemberId;
	const memberCal = { ...(state.calendars[memberId] || {}) };
	memberCal[dateISO] = [];
	return {
		...state,
		calendars: { ...state.calendars, [memberId]: memberCal },
	};
}

/**
 * Display string for a structured or legacy quantity.
 * @param {import("../../domain/types.js").Ingredient["quantity"] | string} quantity
 */
export function quantityLabel(quantity) {
	if (quantity == null) return "";
	if (typeof quantity === "string") return quantity;
	return formatQuantity(quantity);
}
