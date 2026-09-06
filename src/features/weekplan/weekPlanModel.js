import { createId } from "../../domain/ids.js";
import { inferMealType } from "../../domain/mealType.js";
import { formatQuantity } from "../../domain/quantity.js";
import { buildLibraryMeal } from "../calendar/calendarActions.js";
import { flavorTextFields, flavorTextFromMeal } from "../meals/flavorText.js";
import { weekDateISOs } from "../calendar/dateUtils.js";
import { clearShoppingProgressForMeals } from "../shopping/shoppingProgress.js";
import {
	createDraftMeal,
	draftMealToScheduled,
	ingredientsFromRows,
	mealFingerprint,
} from "./weekDraft.js";

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} memberId
 * @param {string[]} dateISOs
 */
function clearShoppingForCalendarDates(state, memberId, dateISOs) {
	const memberCal = state.calendars?.[memberId] || {};
	const meals = [];
	for (const dateISO of dateISOs || []) {
		for (const meal of memberCal[dateISO] || []) meals.push(meal);
	}
	return clearShoppingProgressForMeals(state, meals);
}

/**
 * Canonical Monday-or-weekStartsOn key for storing/looking up week plans.
 * @param {string} dateISO
 * @param {number} [weekStartsOn=1]
 */
export function canonicalWeekStartISO(dateISO, weekStartsOn = 1) {
	return weekDateISOs(dateISO, weekStartsOn)[0];
}

/**
 * @typedef {import("./weekDraft.js").DraftMeal} DraftMeal
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   meals: DraftMeal[]
 * }} DayPlan
 *
 * @typedef {{
 *   weekStartISO: string,
 *   memberId: string,
 *   dayPlans: DayPlan[],
 *   updatedAt: string
 * }} WeekPlan
 */

/**
 * @param {Partial<DayPlan> & { name?: string }} [opts]
 * @returns {DayPlan}
 */
export function createDayPlan(opts = {}) {
	return {
		id: opts.id || createId(),
		name: (opts.name || "Día").trim() || "Día",
		meals: (opts.meals || []).map((m) =>
			createDraftMeal({
				...m,
				name: m.name,
				mealId: m.mealId ?? null,
				source: m.source || "create",
			}),
		),
	};
}

/**
 * @param {string} weekStartISO
 * @param {string} memberId
 * @param {DayPlan[]} [dayPlans]
 * @param {{ [dateISO: string]: string | null }} [assignments]
 * @returns {WeekPlan}
 */
export function createWeekPlan(
	weekStartISO,
	memberId,
	dayPlans = [],
	assignments = {},
) {
	return {
		weekStartISO,
		memberId,
		dayPlans: dayPlans.map((dp, i) =>
			createDayPlan({
				...dp,
				name: dp.name || `Día ${i + 1}`,
			}),
		),
		assignments: { ...(assignments || {}) },
		updatedAt: new Date().toISOString(),
	};
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} weekStartISO
 * @param {string} [memberId]
 * @returns {WeekPlan | null}
 */
export function getWeekPlan(state, weekStartISO, memberId) {
	const mid = memberId || state.household.activeMemberId;
	const weekStartsOn = state.settings?.weekStartsOn ?? 1;
	const key = canonicalWeekStartISO(weekStartISO, weekStartsOn);
	const map = state.weekPlans?.[mid] || {};
	if (map[key]) return map[key];
	if (map[weekStartISO]) return map[weekStartISO];
	// Fallback: plan stored under any date that falls in this week
	const weekDates = new Set(weekDateISOs(key, weekStartsOn));
	return (
		Object.values(map).find(
			(p) => p?.weekStartISO && weekDates.has(p.weekStartISO),
		) || null
	);
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} [memberId]
 * @returns {WeekPlan[]}
 */
export function listWeekPlans(state, memberId) {
	const mid = memberId || state.household.activeMemberId;
	const map = state.weekPlans?.[mid] || {};
	return Object.values(map).sort((a, b) =>
		b.weekStartISO.localeCompare(a.weekStartISO),
	);
}

/**
 * Keep date→dayPlanId links that still point at a current day-plan slot.
 * @param {{ [dateISO: string]: string | null } | undefined} assignments
 * @param {DayPlan[]} dayPlans
 */
function pruneAssignments(assignments, dayPlans) {
	const validIds = new Set((dayPlans || []).map((dp) => dp.id));
	/** @type {{ [dateISO: string]: string | null }} */
	const next = {};
	for (const [dateISO, dayPlanId] of Object.entries(assignments || {})) {
		if (dayPlanId && validIds.has(dayPlanId)) next[dateISO] = dayPlanId;
	}
	return next;
}

/**
 * Write weekPlans[member][weekStart] with a patched WeekPlan.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} memberId
 * @param {string} weekStartISO
 * @param {WeekPlan} plan
 */
function putWeekPlan(state, memberId, weekStartISO, plan) {
	const weekStartsOn = state.settings?.weekStartsOn ?? 1;
	const key = canonicalWeekStartISO(weekStartISO, weekStartsOn);
	const memberPlans = { ...(state.weekPlans?.[memberId] || {}) };
	for (const existingKey of Object.keys(memberPlans)) {
		if (
			existingKey !== key &&
			canonicalWeekStartISO(existingKey, weekStartsOn) === key
		) {
			delete memberPlans[existingKey];
		}
	}
	memberPlans[key] = { ...plan, weekStartISO: key, memberId };
	return {
		...state,
		weekPlans: {
			...(state.weekPlans || {}),
			[memberId]: memberPlans,
		},
	};
}

/**
 * Save / replace a week plan's day-plan slots.
 * Preserves date→day-plan assignments for slots that still exist.
 * Clears calendar days whose assignment was pruned (removed day plan) so
 * sync/heal cannot resurrect the removed plan from leftover meals.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} weekStartISO
 * @param {DayPlan[]} dayPlans
 * @param {string} [memberId]
 */
export function saveWeekPlan(state, weekStartISO, dayPlans, memberId) {
	const mid = memberId || state.household.activeMemberId;
	const weekStartsOn = state.settings?.weekStartsOn ?? 1;
	const key = canonicalWeekStartISO(weekStartISO, weekStartsOn);
	const existing = getWeekPlan(state, key, mid);
	const prevAssignments = existing?.assignments || {};
	const nextAssignments = pruneAssignments(prevAssignments, dayPlans);

	const datesToClear = [];
	for (const [dateISO, dayPlanId] of Object.entries(prevAssignments)) {
		if (!dayPlanId) continue;
		if (nextAssignments[dateISO]) continue;
		datesToClear.push(dateISO);
	}

	let working = state;
	if (datesToClear.length) {
		working = clearShoppingForCalendarDates(working, mid, datesToClear);
		const memberCal = { ...(working.calendars[mid] || {}) };
		for (const dateISO of datesToClear) {
			memberCal[dateISO] = [];
		}
		working = {
			...working,
			calendars: { ...working.calendars, [mid]: memberCal },
		};
	}

	const plan = createWeekPlan(key, mid, dayPlans, nextAssignments);
	return {
		...putWeekPlan(working, mid, key, plan),
		ui: { ...state.ui, onboardingDismissed: true },
	};
}

/**
 * Deep-copy day plans from one week onto another (new ids). Does not copy calendar.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} fromWeekStartISO
 * @param {string} toWeekStartISO
 * @param {string} [memberId]
 */
export function copyWeekPlan(state, fromWeekStartISO, toWeekStartISO, memberId) {
	const mid = memberId || state.household.activeMemberId;
	const source = getWeekPlan(state, fromWeekStartISO, mid);
	if (!source) return state;

	const dayPlans = (source.dayPlans || []).map((dp, i) =>
		createDayPlan({
			name: dp.name || `Día ${i + 1}`,
			meals: (dp.meals || []).map((m) =>
				createDraftMeal({
					name: m.name,
					mealId: m.mealId,
					mealType: m.mealType,
					ingredients: m.ingredients,
					...flavorTextFields(m.flavorText),
					source: m.source || "library",
					dirty: false,
				}),
			),
		}),
	);

	return saveWeekPlan(state, toWeekStartISO, dayPlans, mid);
}

/**
 * Build day plans from diet JSON days (slots, not dates).
 * @param {{ days?: { name?: string, meals?: object[] }[] }} plan
 * @returns {DayPlan[]}
 */
export function dayPlansFromDietJson(plan) {
	return (plan?.days || []).map((day, i) =>
		createDayPlan({
			name: day.name || `Día ${i + 1}`,
			meals: (day.meals || []).map((meal) =>
				createDraftMeal({
					name: meal.name,
					mealType: inferMealType(meal.name),
					ingredients: (meal.ingredients || []).map((ing) => ({
						name: ing.name,
						quantity:
							typeof ing.quantity === "string"
								? ing.quantity
								: formatQuantity(ing.quantity) || "",
					})),
					...flavorTextFields(flavorTextFromMeal(meal)),
					source: "import",
					dirty: false,
				}),
			),
		}),
	);
}

/**
 * Unique unsaved meals across day plans for library save prompt.
 * @param {DayPlan[]} dayPlans
 */
export function uniqueDayPlanMealsForSave(dayPlans) {
	/** @type {Map<string, { fingerprint: string, meal: DraftMeal, tempIds: string[] }>} */
	const map = new Map();
	for (const dp of dayPlans || []) {
		for (const meal of dp.meals || []) {
			if (meal.mealId) continue;
			if (meal.source !== "import" && meal.source !== "create") continue;
			const fingerprint = mealFingerprint(meal);
			const existing = map.get(fingerprint);
			if (existing) existing.tempIds.push(meal.tempId);
			else map.set(fingerprint, { fingerprint, meal, tempIds: [meal.tempId] });
		}
	}
	return [...map.values()];
}

/**
 * Link selected draft meals to library after save selections.
 * @param {DayPlan[]} dayPlans
 * @param {Map<string, string>} tempIdToMealId
 * @returns {DayPlan[]}
 */
export function linkDayPlanMeals(dayPlans, tempIdToMealId) {
	return (dayPlans || []).map((dp) => ({
		...dp,
		meals: (dp.meals || []).map((meal) => {
			const linked = tempIdToMealId.get(meal.tempId);
			if (!linked) return meal;
			return { ...meal, mealId: linked, dirty: false };
		}),
	}));
}

/**
 * Default assignment: dayPlan[i] → weekDates[i].
 * @param {string[]} weekDates
 * @param {DayPlan[]} dayPlans
 * @returns {{ [dateISO: string]: string | null }}
 */
export function defaultAssignment(weekDates, dayPlans) {
	/** @type {{ [dateISO: string]: string | null }} */
	const assignment = {};
	for (let i = 0; i < (weekDates || []).length; i++) {
		assignment[weekDates[i]] = dayPlans[i]?.id || null;
	}
	return assignment;
}

/**
 * Apply one week-plan day slot onto a single calendar date (does not clear other days).
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} weekStartISO
 * @param {string} dayPlanId
 * @param {string} dateISO
 * @param {string} [memberId]
 * @param {number} [weekStartsOn]
 */
export function applyDayPlanToDate(
	state,
	weekStartISO,
	dayPlanId,
	dateISO,
	memberId,
	weekStartsOn = 1,
) {
	const mid = memberId || state.household.activeMemberId;
	const key = canonicalWeekStartISO(weekStartISO, weekStartsOn);
	const plan = getWeekPlan(state, key, mid);
	const dayPlan = plan?.dayPlans?.find((dp) => dp.id === dayPlanId);
	if (!dayPlan) return state;

	// Replacing a day's meals orphans shopping-only progress for the old instances.
	const working = clearShoppingForCalendarDates(state, mid, [dateISO]);
	const memberCal = { ...(working.calendars[mid] || {}) };
	memberCal[dateISO] = (dayPlan.meals || []).map((meal) =>
		draftMealToScheduled(meal, dateISO, mid),
	);

	const nextPlan = {
		...(plan || createWeekPlan(key, mid, [])),
		assignments: {
			...(plan?.assignments || {}),
			[dateISO]: dayPlanId,
		},
		updatedAt: new Date().toISOString(),
	};

	return {
		...putWeekPlan(
			{
				...working,
				calendars: { ...working.calendars, [mid]: memberCal },
			},
			mid,
			key,
			nextPlan,
		),
		ui: { ...working.ui, calendarCursorDate: dateISO },
	};
}

/**
 * Apply week plan day slots onto calendar dates via assignment map.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} weekStartISO
 * @param {{ [dateISO: string]: string | null }} assignment dateISO → dayPlanId
 * @param {string} [memberId]
 * @param {number} [weekStartsOn]
 */
export function applyWeekPlanToCalendar(
	state,
	weekStartISO,
	assignment,
	memberId,
	weekStartsOn = 1,
) {
	const mid = memberId || state.household.activeMemberId;
	const plan = getWeekPlan(state, weekStartISO, mid);
	if (!plan) return state;

	const weekDates = weekDateISOs(weekStartISO, weekStartsOn);
	const dayById = Object.fromEntries(
		(plan.dayPlans || []).map((dp) => [dp.id, dp]),
	);

	// Clear shopping-only state for every day we rewrite or empty — progress is
	// not linked to meal plans and would otherwise stick to new instance ids.
	const working = clearShoppingForCalendarDates(state, mid, weekDates);
	const memberCal = { ...(working.calendars[mid] || {}) };
	/** @type {{ [dateISO: string]: string | null }} */
	const nextAssignments = { ...(plan.assignments || {}) };

	for (const dateISO of weekDates) {
		const dayPlanId = assignment?.[dateISO];
		if (!dayPlanId) {
			memberCal[dateISO] = [];
			delete nextAssignments[dateISO];
			continue;
		}
		const dayPlan = dayById[dayPlanId];
		if (!dayPlan) {
			memberCal[dateISO] = [];
			delete nextAssignments[dateISO];
			continue;
		}
		memberCal[dateISO] = (dayPlan.meals || []).map((meal) =>
			draftMealToScheduled(meal, dateISO, mid),
		);
		nextAssignments[dateISO] = dayPlanId;
	}

	const nextPlan = {
		...plan,
		assignments: nextAssignments,
		updatedAt: new Date().toISOString(),
	};

	return {
		...putWeekPlan(
			{
				...working,
				calendars: { ...working.calendars, [mid]: memberCal },
			},
			mid,
			weekStartISO,
			nextPlan,
		),
		ui: {
			...working.ui,
			calendarCursorDate: weekStartISO,
			calendarView: "week",
			onboardingDismissed: true,
		},
	};
}

/**
 * Clear the day-plan assignment for a calendar date (does not touch meals).
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} dateISO
 * @param {string} [memberId]
 * @param {number} [weekStartsOn]
 */
export function clearDayPlanAssignment(
	state,
	dateISO,
	memberId,
	weekStartsOn = 1,
) {
	const mid = memberId || state.household.activeMemberId;
	const key = canonicalWeekStartISO(dateISO, weekStartsOn);
	const plan = getWeekPlan(state, key, mid);
	if (!plan?.assignments?.[dateISO]) return state;

	// Assignment itself does not store shopping progress, but clearing it is
	// part of "limpiar día" — drop shopping-only annotations for that day's meals.
	const working = clearShoppingForCalendarDates(state, mid, [dateISO]);
	const assignments = { ...(plan.assignments || {}) };
	delete assignments[dateISO];
	return putWeekPlan(working, mid, key, {
		...plan,
		assignments,
		updatedAt: new Date().toISOString(),
	});
}

/**
 * Resolve which day plan a calendar date points to.
 * Prefers stored assignment; falls back to meal matching for older data.
 * @param {WeekPlan | null | undefined} weekPlan
 * @param {string} dateISO
 * @param {{ mealId?: string | null, name?: string }[]} [meals]
 * @returns {DayPlan | null}
 */
export function resolveDayPlanForDate(weekPlan, dateISO, meals) {
	if (!weekPlan) return null;
	const assignedId = weekPlan.assignments?.[dateISO];
	if (assignedId) {
		const byId = (weekPlan.dayPlans || []).find((dp) => dp.id === assignedId);
		if (byId) return byId;
	}
	return matchDayPlanForMeals(weekPlan.dayPlans, meals || []);
}

/**
 * Whether a week plan document exists (has day-plan slots).
 * @param {WeekPlan | null | undefined} plan
 */
export function weekPlanExists(plan) {
	return Boolean(plan?.dayPlans?.length);
}

/**
 * Whether the week plan has at least one meal in any slot.
 * @param {WeekPlan | null | undefined} plan
 */
export function weekPlanHasContent(plan) {
	if (!weekPlanExists(plan)) return false;
	return plan.dayPlans.some((dp) => (dp.meals || []).length > 0);
}

/**
 * Stable identity keys for matching a scheduled/draft meal to a day-plan meal.
 * Includes both mealId and name so library-link updates still match.
 * @param {{ mealId?: string | null, name?: string }} meal
 * @returns {Set<string>}
 */
function mealIdentityKeys(meal) {
	const keys = new Set();
	if (meal?.mealId) keys.add(`id:${meal.mealId}`);
	const name = (meal?.name || "").trim().toLowerCase();
	if (name) keys.add(`name:${name}`);
	return keys;
}

/**
 * Whether two meal lists represent the same day-plan slot (order-insensitive).
 * @param {{ mealId?: string | null, name?: string }[]} a
 * @param {{ mealId?: string | null, name?: string }[]} b
 */
function mealsMatchAsSet(a, b) {
	if (a.length !== b.length) return false;
	const used = new Set();
	for (const mealA of a) {
		const keysA = mealIdentityKeys(mealA);
		let found = -1;
		for (let i = 0; i < b.length; i++) {
			if (used.has(i)) continue;
			const keysB = mealIdentityKeys(b[i]);
			let overlap = false;
			for (const key of keysA) {
				if (keysB.has(key)) {
					overlap = true;
					break;
				}
			}
			if (overlap) {
				found = i;
				break;
			}
		}
		if (found === -1) return false;
		used.add(found);
	}
	return true;
}

/**
 * Find the week-plan day slot whose meals match a calendar day's scheduled meals.
 * @param {DayPlan[] | null | undefined} dayPlans
 * @param {{ mealId?: string | null, name?: string }[]} meals
 * @returns {DayPlan | null}
 */
export function matchDayPlanForMeals(dayPlans, meals) {
	if (!meals?.length) return null;
	for (const dp of dayPlans || []) {
		const planMeals = dp.meals || [];
		if (mealsMatchAsSet(planMeals, meals)) return dp;
	}
	return null;
}

/**
 * Turn scheduled calendar meals into draft meals for a day-plan slot.
 * @param {{ mealId?: string | null, name?: string, mealType?: string, ingredients?: object[] }[]} meals
 * @returns {DraftMeal[]}
 */
export function scheduledMealsToDraftMeals(meals) {
	return (meals || []).map((m) =>
		createDraftMeal({
			mealId: m.mealId ?? null,
			name: m.name,
			mealType: m.mealType,
			ingredients: m.ingredients || [],
			...flavorTextFields(m.flavorText),
			dirty: false,
			source: m.mealId ? "library" : "create",
		}),
	);
}

/**
 * Rebuild date→dayPlan assignments from calendar meals for one week.
 * Calendar content is treated as whole-day materializations of day plans —
 * never as individually assigned meals.
 *
 * Preserves existing day-plan slots (including empty editor stubs). Only adds
 * new slots when calendar meals cannot be linked to a current day plan.
 *
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} weekStartISO
 * @param {string} [memberId]
 * @param {number} [weekStartsOn]
 */
export function syncWeekPlanAssignmentsFromCalendar(
	state,
	weekStartISO,
	memberId,
	weekStartsOn = 1,
) {
	const mid = memberId || state.household.activeMemberId;
	const key = canonicalWeekStartISO(weekStartISO, weekStartsOn);
	const dates = weekDateISOs(key, weekStartsOn);
	const cal = state.calendars[mid] || {};
	const existing = getWeekPlan(state, key, mid);

	/** @type {DayPlan[]} */
	let dayPlans = [...(existing?.dayPlans || [])];
	/** @type {{ [dateISO: string]: string | null }} */
	const assignments = {};
	let changed = false;

	for (const dateISO of dates) {
		const meals = cal[dateISO] || [];
		if (!meals.length) {
			if (existing?.assignments?.[dateISO]) changed = true;
			continue;
		}

		const prevAssignedId = existing?.assignments?.[dateISO] ?? null;
		const prevPlan = prevAssignedId
			? dayPlans.find((dp) => dp.id === prevAssignedId)
			: null;
		if (prevPlan && mealsMatchAsSet(prevPlan.meals || [], meals)) {
			assignments[dateISO] = prevPlan.id;
			continue;
		}

		let matched = matchDayPlanForMeals(dayPlans, meals);
		if (!matched) {
			matched = createDayPlan({
				name: `Día ${dayPlans.length + 1}`,
				meals: scheduledMealsToDraftMeals(meals),
			});
			dayPlans = [...dayPlans, matched];
			changed = true;
		}
		assignments[dateISO] = matched.id;
		if (prevAssignedId !== matched.id) changed = true;
	}

	const prevAssignmentKeys = Object.keys(existing?.assignments || {}).sort();
	const nextAssignmentKeys = Object.keys(assignments).sort();
	if (
		prevAssignmentKeys.length !== nextAssignmentKeys.length ||
		prevAssignmentKeys.some((k, i) => k !== nextAssignmentKeys[i]) ||
		nextAssignmentKeys.some(
			(k) => existing?.assignments?.[k] !== assignments[k],
		)
	) {
		changed = true;
	}

	const prevPlanIds = (existing?.dayPlans || []).map((dp) => dp.id).join(",");
	const nextPlanIds = dayPlans.map((dp) => dp.id).join(",");
	if (prevPlanIds !== nextPlanIds) changed = true;

	if (!changed && existing) return state;

	const nextPlan = createWeekPlan(key, mid, dayPlans, assignments);
	if (existing?.updatedAt) {
		nextPlan.updatedAt = changed
			? new Date().toISOString()
			: existing.updatedAt;
	}

	return putWeekPlan(state, mid, key, nextPlan);
}

/**
 * Heal every member/week that has calendar meals into day-plan assignments.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 */
export function syncAllWeekPlanAssignmentsFromCalendar(state) {
	const weekStartsOn = state.settings?.weekStartsOn ?? 1;
	let next = state;
	for (const [mid, cal] of Object.entries(state.calendars || {})) {
		const weekKeys = new Set();
		for (const [dateISO, meals] of Object.entries(cal || {})) {
			if ((meals || []).length === 0) continue;
			weekKeys.add(canonicalWeekStartISO(dateISO, weekStartsOn));
		}
		for (const weekStart of weekKeys) {
			next = syncWeekPlanAssignmentsFromCalendar(
				next,
				weekStart,
				mid,
				weekStartsOn,
			);
		}
	}
	return next;
}

/**
 * Whether any calendar day in the week has scheduled meals.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} weekStartISO
 * @param {number} [weekStartsOn]
 * @param {string} [memberId]
 */
export function weekCalendarHasMeals(
	state,
	weekStartISO,
	weekStartsOn = 1,
	memberId,
) {
	const mid = memberId || state.household.activeMemberId;
	const cal = state.calendars[mid] || {};
	return weekDateISOs(weekStartISO, weekStartsOn).some(
		(d) => (cal[d] || []).length > 0,
	);
}

/**
 * Link selected meals into library and return updated day plans.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {DayPlan[]} dayPlans
 * @param {string[]} selectedTempIds
 * @returns {{ state: import("../../domain/types.js").DietAssistantStateV2, dayPlans: DayPlan[] }}
 */
export function applyLibrarySaveToDayPlans(
	state,
	dayPlans,
	selectedTempIds,
) {
	const selected = new Set(selectedTempIds || []);
	const groups = uniqueDayPlanMealsForSave(dayPlans);
	const now = new Date().toISOString();
	/** @type {Map<string, string>} */
	const tempToLibraryId = new Map();
	const newLibraryMeals = [];

	for (const group of groups) {
		const anySelected = group.tempIds.some((id) => selected.has(id));
		if (!anySelected) continue;
		const meal = buildLibraryMeal(
			{
				name: group.meal.name,
				mealType: group.meal.mealType,
				servings: 1,
				ingredients: (group.meal.ingredients || []).map((ing) => ({
					name: ing.name,
					quantity:
						typeof ing.quantity === "string"
							? ing.quantity
							: formatQuantity(ing.quantity) || "",
				})),
				flavorText: group.meal.flavorText,
				source: group.meal.source === "import" ? "import" : "user",
			},
			undefined,
		);
		meal.createdAt = now;
		meal.updatedAt = now;
		newLibraryMeals.push(meal);
		for (const tempId of group.tempIds) {
			tempToLibraryId.set(tempId, meal.id);
		}
	}

	const linked = linkDayPlanMeals(dayPlans, tempToLibraryId);
	const nextState = {
		...state,
		mealLibrary: [...state.mealLibrary, ...newLibraryMeals],
		ui: { ...state.ui, onboardingDismissed: true },
	};

	return { state: nextState, dayPlans: linked };
}

export { ingredientsFromRows, createDraftMeal };
