import { createId } from "../domain/ids.js";
import {
	ingredientFromLegacy,
	mealFingerprint,
} from "../domain/ingredient.js";
import { inferMealType } from "../domain/mealType.js";
import { formatQuantity } from "../domain/quantity.js";
import { flavorTextFields, flavorTextFromMeal } from "../features/meals/flavorText.js";
import {
	startOfWeek,
	toDateISO,
	todayISO,
	weekdayKeysToDateISO,
} from "../features/calendar/dateUtils.js";
import { remapCheckedItems } from "../features/shopping/checklistKeys.js";
import { syncAllWeekPlanAssignmentsFromCalendar } from "../features/weekplan/weekPlanModel.js";
import { createEmptyState } from "./defaults.js";

const WEEK_DAYS = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
];

/**
 * @param {object} meal
 * @param {"user"|"import"} source
 * @param {Map<string, string>} fingerprintToId
 */
function ensureLibraryMeal(meal, source, fingerprintToId, library) {
	const fp = mealFingerprint(meal);
	if (fingerprintToId.has(fp)) {
		return fingerprintToId.get(fp);
	}
	const now = new Date().toISOString();
	const id = createId();
	library.push({
		id,
		name: meal.name,
		mealType: inferMealType(meal.name),
		ingredients: (meal.ingredients || []).map((ing) =>
			ingredientFromLegacy({
				name: ing.name,
				quantity:
					typeof ing.quantity === "string"
						? ing.quantity
						: formatQuantity(ing.quantity) || String(ing.quantity?.raw || ""),
			}),
		),
		tags: [],
		servings: 1,
		source,
		...flavorTextFields(flavorTextFromMeal(meal)),
		createdAt: now,
		updatedAt: now,
	});
	fingerprintToId.set(fp, id);
	return id;
}

/**
 * Explode a dietPlan into library meals (deduped by fingerprint).
 */
function ingestDietPlanMeals(dietPlan, library, fingerprintToId) {
	for (const day of dietPlan?.days || []) {
		for (const meal of day.meals || []) {
			ensureLibraryMeal(meal, "import", fingerprintToId, library);
		}
	}
}

/**
 * Map weekPlan weekday keys onto calendars for the week containing `anchor`.
 * Documented default: weekStartsOn = 1 (Lunes).
 */
function mapWeekPlanToCalendar(weekPlan, memberId, calendars, fingerprintToId, library, anchor) {
	if (!weekPlan || typeof weekPlan !== "object") return;
	const dateByWeekday = weekdayKeysToDateISO(anchor, 1);
	if (!calendars[memberId]) calendars[memberId] = {};

	for (const day of WEEK_DAYS) {
		const meals = weekPlan[day];
		if (!Array.isArray(meals) || meals.length === 0) continue;
		const dateISO = dateByWeekday[day];
		const scheduled = meals.map((meal) => {
			const mealId = ensureLibraryMeal(meal, "import", fingerprintToId, library);
			return {
				instanceId: createId(),
				dateISO,
				memberId,
				mealId,
				name: meal.name,
				mealType: inferMealType(meal.name),
				ingredients: (meal.ingredients || []).map((ing) =>
					ingredientFromLegacy({
						name: ing.name,
						quantity:
							typeof ing.quantity === "string"
								? ing.quantity
								: formatQuantity(ing.quantity) || "",
					}),
				),
				...flavorTextFields(flavorTextFromMeal(meal)),
			};
		});
		calendars[memberId][dateISO] = [
			...(calendars[memberId][dateISO] || []),
			...scheduled,
		];
	}
}

/**
 * Remap meal-prep selection keys (`meal.name + dayName`) to instanceIds when matchable.
 */
function remapMealPrep(selectedKeys, calendars, memberId) {
	if (!Array.isArray(selectedKeys) || selectedKeys.length === 0) {
		return [];
	}
	const memberCal = calendars[memberId] || {};
	const matched = [];

	for (const key of selectedKeys) {
		for (const [dateISO, meals] of Object.entries(memberCal)) {
			const weekday = [
				"sunday",
				"monday",
				"tuesday",
				"wednesday",
				"thursday",
				"friday",
				"saturday",
			][parseDateDay(dateISO)];
			for (const meal of meals) {
				if (key === `${meal.name}${weekday}` || key === meal.name + weekday) {
					matched.push(meal.instanceId);
				}
			}
		}
	}
	return [...new Set(matched)];
}

function parseDateDay(iso) {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y, m - 1, d).getDay();
}

/**
 * One-shot v1 → v2 migration from legacy localStorage keys.
 *
 * @param {{
 *   dietPlan?: object | null,
 *   weekPlan?: object | null,
 *   pinnedPlans?: object[],
 *   checkedItems?: Record<string, boolean>,
 *   mealPrepSelectedMeals?: string[],
 *   mealPrepUnselectedVisible?: boolean,
 *   currentPlanId?: string | null,
 * }} legacy
 * @returns {import("../domain/types.js").DietAssistantStateV2}
 */
export function migrateV1toV2(legacy = {}) {
	const state = createEmptyState();
	const memberId = state.household.activeMemberId;
	const fingerprintToId = new Map();
	const now = new Date().toISOString();
	const anchor = new Date();

	const {
		dietPlan,
		weekPlan,
		pinnedPlans = [],
		checkedItems = {},
		mealPrepSelectedMeals = [],
		mealPrepUnselectedVisible = true,
	} = legacy;

	if (dietPlan?.days?.length) {
		ingestDietPlanMeals(dietPlan, state.mealLibrary, fingerprintToId);
	}

	for (const pin of pinnedPlans) {
		if (!pin?.dietPlan?.days) continue;
		ingestDietPlanMeals(pin.dietPlan, state.mealLibrary, fingerprintToId);
		// Restore that pin's weekPlan onto the current week when present
		if (pin.weekPlan && Object.keys(pin.weekPlan).length > 0) {
			// Only apply pin week if we don't already have a live weekPlan
			// (live weekPlan handled below takes precedence for calendar fill)
		}
	}

	// Live weekPlan is the source of truth for the current calendar week
	const liveWeek =
		weekPlan && Object.keys(weekPlan).some((k) => (weekPlan[k] || []).length > 0)
			? weekPlan
			: null;

	if (liveWeek) {
		mapWeekPlanToCalendar(
			liveWeek,
			memberId,
			state.calendars,
			fingerprintToId,
			state.mealLibrary,
			anchor,
		);
	} else {
		// If no live week but a pin had weekPlan and was the "active" path —
		// use the most recent pin with a non-empty weekPlan once during migrate
		const pinWithWeek = [...pinnedPlans]
			.reverse()
			.find(
				(p) =>
					p?.weekPlan &&
					Object.keys(p.weekPlan).some((k) => (p.weekPlan[k] || []).length > 0),
			);
		if (pinWithWeek) {
			mapWeekPlanToCalendar(
				pinWithWeek.weekPlan,
				memberId,
				state.calendars,
				fingerprintToId,
				state.mealLibrary,
				anchor,
			);
		}
	}

	state.checkedItems = remapCheckedItems(checkedItems);

	const weekStart = toDateISO(startOfWeek(anchor, 1));
	state.mealPrep = {
		weekStartISO: weekStart,
		selectedInstanceIds: remapMealPrep(
			mealPrepSelectedMeals,
			state.calendars,
			memberId,
		),
		unselectedVisible: mealPrepUnselectedVisible !== false,
	};

	state.ui.calendarCursorDate = todayISO();
	state.meta = {
		migratedFrom: "v1",
		migratedAt: now,
		lastSavedAt: now,
	};

	// Legacy weekPlan filled calendars without day-plan assignments — heal them.
	return syncAllWeekPlanAssignmentsFromCalendar(state);
}

/**
 * Read legacy keys from a Storage-like object (localStorage or test fixture).
 * @param {Storage | Record<string, string>} storage
 */
export function readLegacyFromStorage(storage) {
	const get = (key) => {
		try {
			if (typeof storage.getItem === "function") return storage.getItem(key);
			return storage[key] ?? null;
		} catch {
			return null;
		}
	};

	const parse = (raw) => {
		if (!raw) return null;
		try {
			return JSON.parse(raw);
		} catch {
			return null;
		}
	};

	const dietPlan = parse(get("dietPlan"));
	const weekPlan = parse(get("weekPlan")) || {};
	const pinnedPlans = parse(get("pinnedPlans")) || [];
	const checkedItems = parse(get("checkedItems")) || {};
	const mealPrepSelectedMeals = parse(get("mealPrepSelectedMeals")) || [];
	const mealPrepVisRaw = get("mealPrepUnselectedVisible");
	const mealPrepUnselectedVisible =
		mealPrepVisRaw == null ? true : mealPrepVisRaw === "true" || mealPrepVisRaw === true;
	const currentPlanId = get("currentPlanId");

	const hasAny =
		dietPlan ||
		(weekPlan && Object.keys(weekPlan).length > 0) ||
		(Array.isArray(pinnedPlans) && pinnedPlans.length > 0) ||
		(checkedItems && Object.keys(checkedItems).length > 0);

	return {
		hasAny: Boolean(hasAny),
		legacy: {
			dietPlan,
			weekPlan,
			pinnedPlans,
			checkedItems,
			mealPrepSelectedMeals: Array.isArray(mealPrepSelectedMeals)
				? mealPrepSelectedMeals
				: [],
			mealPrepUnselectedVisible,
			currentPlanId,
		},
	};
}

/** Keys that must no longer be read after migration. */
export const LEGACY_KEYS = [
	"dietPlan",
	"weekPlan",
	"currentPlanId",
	"pinnedPlans",
	"checkedItems",
	"mealPrepSelectedMeals",
	"mealPrepUnselectedVisible",
];

export function clearLegacyKeys(storage = localStorage) {
	for (const key of LEGACY_KEYS) {
		try {
			storage.removeItem(key);
		} catch {
			/* ignore */
		}
	}
}
