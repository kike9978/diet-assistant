import { createId } from "../domain/ids.js";
import { ingredientFromLegacy } from "../domain/ingredient.js";
import { inferMealType } from "../domain/mealType.js";
import { formatQuantity } from "../domain/quantity.js";
import { WEEK_DAYS } from "../domain/ingredient.js";
import { flavorTextFields, flavorTextFromMeal } from "../features/meals/flavorText.js";
import {
	parseDateISO,
	weekdayKeysToDateISO,
	weekDateISOs,
} from "../features/calendar/dateUtils.js";
import {
	getWeekPlan,
	syncWeekPlanAssignmentsFromCalendar,
} from "../features/weekplan/weekPlanModel.js";

/**
 * Resolve which member calendars feed shopping / weekPlan merge.
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 * @param {string[] | null | undefined} memberIds
 * @returns {string[]}
 */
export function resolveShoppingMemberIds(state, memberIds) {
	const valid = new Set(state.household.members.map((m) => m.id));
	const requested =
		memberIds && memberIds.length > 0
			? memberIds
			: state.ui.shoppingMemberIds?.length
				? state.ui.shoppingMemberIds
				: [state.household.activeMemberId];
	const next = [...new Set(requested)].filter((id) => valid.has(id));
	return next.length > 0 ? next : [state.household.activeMemberId];
}

/**
 * Whether this member has a live day-plan assignment for the date.
 * Orphan calendar meals (no week plan / no assignment) do not count.
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 * @param {string} memberId
 * @param {string} dateISO
 */
function hasDayPlanAssignment(state, memberId, dateISO) {
	const plan = getWeekPlan(state, dateISO, memberId);
	const assignedId = plan?.assignments?.[dateISO];
	if (!assignedId) return false;
	return Boolean(plan.dayPlans?.some((dp) => dp.id === assignedId));
}

/**
 * Legacy weekPlan shape from calendars for the visible week.
 * Meals use string quantities for existing ShoppingList.
 *
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 * @param {string[] | null} [memberIds] — when omitted, uses active member only
 * @param {{ requireAssignment?: boolean }} [opts]
 * @returns {Record<string, object[]>}
 */
export function calendarsToWeekPlan(state, memberIds = null, opts = {}) {
	const requireAssignment = Boolean(opts.requireAssignment);
	const ids =
		memberIds == null
			? [state.household.activeMemberId]
			: resolveShoppingMemberIds(state, memberIds);
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const cursor = state.ui.calendarCursorDate;
	const dateByWeekday = weekdayKeysToDateISO(cursor, weekStartsOn);

	/** @type {Record<string, object[]>} */
	const weekPlan = {};
	for (const day of WEEK_DAYS) {
		weekPlan[day] = [];
	}

	for (const [weekday, dateISO] of Object.entries(dateByWeekday)) {
		const meals = [];
		for (const memberId of ids) {
			if (
				requireAssignment &&
				!hasDayPlanAssignment(state, memberId, dateISO)
			) {
				continue;
			}
			const memberCal = state.calendars[memberId] || {};
			for (const m of memberCal[dateISO] || []) {
				meals.push({
					id: m.instanceId,
					instanceId: m.instanceId,
					mealId: m.mealId,
					memberId,
					name: m.name,
					ingredients: (m.ingredients || []).map((ing) => ({
						id: ing.id,
						name: ing.name,
						quantity:
							typeof ing.quantity === "string"
								? ing.quantity
								: formatQuantity(ing.quantity),
					})),
				});
			}
		}
		weekPlan[weekday] = meals;
	}

	return weekPlan;
}

/**
 * Shopping list source: only meals on days with a day-plan assignment.
 * Orphan calendar meals (no week plan / unassigned) are excluded.
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 */
export function calendarsToShoppingWeekPlan(state) {
	return calendarsToWeekPlan(state, resolveShoppingMemberIds(state), {
		requireAssignment: true,
	});
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
			...flavorTextFields(flavorTextFromMeal(meal)),
		}));
	}

	const next = { ...state, calendars };
	const weekStart = Object.values(dateByWeekday)[0];
	return syncWeekPlanAssignmentsFromCalendar(
		next,
		weekStart,
		memberId,
		weekStartsOn,
	);
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
