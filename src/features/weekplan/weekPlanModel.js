import { createId } from "../../domain/ids.js";
import { inferMealType } from "../../domain/mealType.js";
import { formatQuantity } from "../../domain/quantity.js";
import { buildLibraryMeal } from "../calendar/calendarActions.js";
import { weekDateISOs } from "../calendar/dateUtils.js";
import {
	createDraftMeal,
	draftMealToScheduled,
	ingredientsFromRows,
	mealFingerprint,
} from "./weekDraft.js";

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
 * Save / replace a week plan (does not touch calendars).
 * Preserves date→day-plan assignments for slots that still exist.
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
	const plan = createWeekPlan(
		key,
		mid,
		dayPlans,
		pruneAssignments(existing?.assignments, dayPlans),
	);
	return {
		...putWeekPlan(state, mid, key, plan),
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
					source: "import",
					dirty: false,
				}),
			),
		}),
	);
}

/**
 * Copy a library day template into a week-plan day-plan slot.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} dayTemplateId
 * @returns {DayPlan | null}
 */
export function dayPlanFromDayTemplate(state, dayTemplateId) {
	const template = (state.dayTemplates || []).find(
		(d) => d.id === dayTemplateId,
	);
	if (!template) return null;
	const mealById = Object.fromEntries(
		(state.mealLibrary || []).map((m) => [m.id, m]),
	);
	const meals = (template.mealIds || [])
		.map((id) => mealById[id])
		.filter(Boolean)
		.map((meal) =>
			createDraftMeal({
				name: meal.name,
				mealType: meal.mealType || inferMealType(meal.name),
				ingredients: (meal.ingredients || []).map((ing) => ({
					name: ing.name,
					quantity:
						typeof ing.quantity === "string"
							? ing.quantity
							: formatQuantity(ing.quantity) || "",
				})),
				mealId: meal.id,
				source: "library",
				dirty: false,
			}),
		);
	return createDayPlan({ name: template.name, meals });
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

	const memberCal = { ...(state.calendars[mid] || {}) };
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
				...state,
				calendars: { ...state.calendars, [mid]: memberCal },
			},
			mid,
			key,
			nextPlan,
		),
		ui: { ...state.ui, calendarCursorDate: dateISO },
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
	const memberCal = { ...(state.calendars[mid] || {}) };
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
				...state,
				calendars: { ...state.calendars, [mid]: memberCal },
			},
			mid,
			weekStartISO,
			nextPlan,
		),
		ui: {
			...state.ui,
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

	const assignments = { ...(plan.assignments || {}) };
	delete assignments[dateISO];
	return putWeekPlan(state, mid, key, {
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
 * @param {{ saveAsTemplate?: boolean, templateName?: string }} [opts]
 * @returns {{ state: import("../../domain/types.js").DietAssistantStateV2, dayPlans: DayPlan[] }}
 */
export function applyLibrarySaveToDayPlans(
	state,
	dayPlans,
	selectedTempIds,
	opts = {},
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

	let linked = linkDayPlanMeals(dayPlans, tempToLibraryId);
	let nextState = {
		...state,
		mealLibrary: [...state.mealLibrary, ...newLibraryMeals],
		ui: { ...state.ui, onboardingDismissed: true },
	};

	if (opts.saveAsTemplate) {
		const nowIso = new Date().toISOString();
		const mealLibrary = [...nextState.mealLibrary];
		const dayTemplates = [...nextState.dayTemplates];
		const dayTemplateIds = [];
		for (const [index, dp] of linked.entries()) {
			if (!dp.meals?.length) continue;
			const mealIds = [];
			for (const draftMeal of dp.meals) {
				if (draftMeal.mealId) {
					mealIds.push(draftMeal.mealId);
					continue;
				}
				const meal = buildLibraryMeal({
					name: draftMeal.name,
					mealType: draftMeal.mealType,
					servings: 1,
					ingredients: (draftMeal.ingredients || []).map((ing) => ({
						name: ing.name,
						quantity:
							typeof ing.quantity === "string"
								? ing.quantity
								: formatQuantity(ing.quantity) || "",
					})),
					source: "template",
				});
				mealLibrary.push(meal);
				mealIds.push(meal.id);
			}
			const dayId = createId();
			dayTemplates.push({
				id: dayId,
				name: dp.name || `Día ${index + 1}`,
				mealIds,
			});
			dayTemplateIds.push(dayId);
		}
		if (dayTemplateIds.length > 0) {
			nextState = {
				...nextState,
				mealLibrary,
				dayTemplates,
				dietTemplates: [
					...nextState.dietTemplates,
					{
						id: createId(),
						name: opts.templateName || "Plan importado",
						dayTemplateIds,
						createdAt: nowIso,
					},
				],
			};
			// refresh mealIds on linked from newly created
			linked = linked.map((dp, index) => {
				const tmpl = dayTemplates.find(
					(d) => d.name === (dp.name || `Día ${index + 1}`),
				);
				if (!tmpl) return dp;
				return {
					...dp,
					meals: dp.meals.map((m, mi) => ({
						...m,
						mealId: m.mealId || tmpl.mealIds[mi] || m.mealId,
					})),
				};
			});
		}
	}

	return { state: nextState, dayPlans: linked };
}

export { ingredientsFromRows, createDraftMeal };
