import { createId } from "../../domain/ids.js";
import {
	getIngredientCategory,
	ingredientFromLegacy,
} from "../../domain/ingredient.js";
import { formatQuantity, parseQuantity } from "../../domain/quantity.js";
import { retentionCutoffISO } from "./dateUtils.js";

/**
 * Parse equivalent line like "1/2 tza de zanahoria" → { name, quantity }.
 * @param {string} replacement
 */
export function parseEquivalentLine(replacement) {
	const trimmed = (replacement || "").trim();
	const deIdx = trimmed.toLowerCase().indexOf(" de ");
	if (deIdx === -1) {
		return {
			name: trimmed,
			quantity: parseQuantity(""),
		};
	}
	const qtyRaw = trimmed.slice(0, deIdx).trim();
	const name = trimmed.slice(deIdx + 4).trim();
	return {
		name: name || trimmed,
		quantity: parseQuantity(qtyRaw),
	};
}

/**
 * Snapshot a library meal into a ScheduledMeal.
 * @param {import("../../domain/types.js").Meal} meal
 * @param {string} dateISO
 * @param {string} memberId
 * @param {{ replacedFromId?: string }} [opts]
 */
export function mealToScheduled(meal, dateISO, memberId, opts = {}) {
	return {
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
		...(opts.replacedFromId ? { replacedFromId: opts.replacedFromId } : {}),
	};
}

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
		.map((meal) => mealToScheduled(meal, dateISO, memberId));

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
 * Schedule a library meal onto a date (append).
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} mealId
 * @param {string} dateISO
 */
export function scheduleLibraryMeal(state, mealId, dateISO) {
	const meal = state.mealLibrary.find((m) => m.id === mealId);
	if (!meal) return state;
	const memberId = state.household.activeMemberId;
	const memberCal = { ...(state.calendars[memberId] || {}) };
	const scheduled = mealToScheduled(meal, dateISO, memberId);
	memberCal[dateISO] = [...(memberCal[dateISO] || []), scheduled];
	return {
		...state,
		calendars: { ...state.calendars, [memberId]: memberCal },
		ui: { ...state.ui, calendarCursorDate: dateISO },
	};
}

/**
 * Replace one scheduled instance with a library meal (keeps slot).
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} instanceId
 * @param {string} mealId
 */
export function replaceScheduledMeal(state, instanceId, mealId) {
	const meal = state.mealLibrary.find((m) => m.id === mealId);
	if (!meal) return state;
	const memberId = state.household.activeMemberId;
	const memberCal = { ...(state.calendars[memberId] || {}) };
	let found = false;

	for (const dateISO of Object.keys(memberCal)) {
		const list = memberCal[dateISO] || [];
		const idx = list.findIndex((m) => m.instanceId === instanceId);
		if (idx === -1) continue;
		const prev = list[idx];
		const next = mealToScheduled(meal, dateISO, memberId, {
			replacedFromId: prev.mealId || prev.instanceId,
		});
		next.instanceId = prev.instanceId;
		const copy = [...list];
		copy[idx] = next;
		memberCal[dateISO] = copy;
		found = true;
		break;
	}

	if (!found) return state;
	return {
		...state,
		calendars: { ...state.calendars, [memberId]: memberCal },
	};
}

/**
 * Remove one scheduled meal by instanceId.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} instanceId
 */
export function removeScheduledMeal(state, instanceId) {
	const memberId = state.household.activeMemberId;
	const memberCal = { ...(state.calendars[memberId] || {}) };
	let changed = false;

	for (const dateISO of Object.keys(memberCal)) {
		const list = memberCal[dateISO] || [];
		const next = list.filter((m) => m.instanceId !== instanceId);
		if (next.length !== list.length) {
			memberCal[dateISO] = next;
			changed = true;
		}
	}

	if (!changed) return state;
	return {
		...state,
		calendars: { ...state.calendars, [memberId]: memberCal },
		mealPrep: {
			...state.mealPrep,
			selectedInstanceIds: state.mealPrep.selectedInstanceIds.filter(
				(id) => id !== instanceId,
			),
		},
	};
}

/**
 * Move a scheduled meal to another date (dnd). Optionally insert at index.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} instanceId
 * @param {string} toDateISO
 * @param {number} [toIndex]
 */
export function moveScheduledMeal(state, instanceId, toDateISO, toIndex) {
	const memberId = state.household.activeMemberId;
	const memberCal = { ...(state.calendars[memberId] || {}) };
	let moved = null;
	let fromDate = null;

	for (const dateISO of Object.keys(memberCal)) {
		const list = memberCal[dateISO] || [];
		const idx = list.findIndex((m) => m.instanceId === instanceId);
		if (idx === -1) continue;
		moved = { ...list[idx], dateISO: toDateISO };
		fromDate = dateISO;
		memberCal[dateISO] = list.filter((_, i) => i !== idx);
		break;
	}

	if (!moved) return state;

	const dest = [...(memberCal[toDateISO] || [])];
	const insertAt =
		typeof toIndex === "number" && toIndex >= 0
			? Math.min(toIndex, dest.length)
			: dest.length;
	dest.splice(insertAt, 0, moved);
	memberCal[toDateISO] = dest;

	// Same-day reorder when from === to: already handled by remove+insert
	void fromDate;

	return {
		...state,
		calendars: { ...state.calendars, [memberId]: memberCal },
	};
}

/**
 * Substitute ingredient on a scheduled instance; optionally sync library meal.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {{
 *   instanceId: string,
 *   ingredientId: string,
 *   replacementLine: string,
 *   updateLibrary?: boolean
 * }} payload
 */
export function applyIngredientSubstitution(state, payload) {
	const { instanceId, ingredientId, replacementLine, updateLibrary } = payload;
	const parsed = parseEquivalentLine(replacementLine);
	if (!parsed.name) return state;

	const memberId = state.household.activeMemberId;
	const memberCal = { ...(state.calendars[memberId] || {}) };
	let libraryMealId = null;
	let ingredientIndex = -1;
	let found = false;

	for (const dateISO of Object.keys(memberCal)) {
		const list = memberCal[dateISO] || [];
		const mealIdx = list.findIndex((m) => m.instanceId === instanceId);
		if (mealIdx === -1) continue;
		const meal = list[mealIdx];
		ingredientIndex = (meal.ingredients || []).findIndex(
			(ing) => ing.id === ingredientId,
		);
		if (ingredientIndex === -1) continue;

		libraryMealId = meal.mealId;
		const ingredients = [...(meal.ingredients || [])];
		ingredients[ingredientIndex] = {
			...ingredients[ingredientIndex],
			id: createId(),
			name: parsed.name,
			quantity: parsed.quantity,
			categoryHint: getIngredientCategory(parsed.name),
		};
		const copy = [...list];
		copy[mealIdx] = { ...meal, ingredients };
		memberCal[dateISO] = copy;
		found = true;
		break;
	}

	if (!found) return state;

	let mealLibrary = state.mealLibrary;
	if (updateLibrary && libraryMealId && ingredientIndex >= 0) {
		mealLibrary = mealLibrary.map((m) => {
			if (m.id !== libraryMealId) return m;
			const ingredients = [...(m.ingredients || [])];
			if (!ingredients[ingredientIndex]) return m;
			ingredients[ingredientIndex] = {
				...ingredients[ingredientIndex],
				id: ingredients[ingredientIndex].id || createId(),
				name: parsed.name,
				quantity: parsed.quantity,
				categoryHint: getIngredientCategory(parsed.name),
			};
			return {
				...m,
				ingredients,
				updatedAt: new Date().toISOString(),
			};
		});
	}

	return {
		...state,
		calendars: { ...state.calendars, [memberId]: memberCal },
		mealLibrary,
	};
}

/**
 * Remove calendar days before retention cutoff (all members).
 * Default: keep ~4 months before cursor.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {{ beforeISO?: string, keepMonths?: number }} [opts]
 */
export function prunePastCalendarDays(state, opts = {}) {
	const cutoff =
		opts.beforeISO ||
		retentionCutoffISO(state.ui.calendarCursorDate, opts.keepMonths ?? 4);

	const calendars = {};
	for (const [memberId, days] of Object.entries(state.calendars || {})) {
		const next = {};
		for (const [dateISO, meals] of Object.entries(days || {})) {
			if (dateISO >= cutoff) {
				next[dateISO] = meals;
			}
		}
		calendars[memberId] = next;
	}

	const remainingIds = new Set(
		Object.values(calendars)
			.flatMap((days) => Object.values(days))
			.flat()
			.map((m) => m.instanceId),
	);

	return {
		...state,
		calendars,
		mealPrep: {
			...state.mealPrep,
			selectedInstanceIds: state.mealPrep.selectedInstanceIds.filter((id) =>
				remainingIds.has(id),
			),
		},
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

/**
 * Build meal from form payload for library create/update.
 * @param {{
 *   name: string,
 *   mealType?: string,
 *   servings?: number,
 *   ingredients: { name: string, quantity: string }[],
 *   tags?: string[],
 *   source?: string
 * }} payload
 * @param {import("../../domain/types.js").Meal} [existing]
 */
export function buildLibraryMeal(payload, existing) {
	const now = new Date().toISOString();
	const ingredients = (payload.ingredients || [])
		.map((ing) =>
			ingredientFromLegacy({
				name: ing.name,
				quantity: ing.quantity,
			}),
		)
		.filter((ing) => ing.name);

	return {
		id: existing?.id || createId(),
		name: payload.name.trim(),
		mealType: payload.mealType || existing?.mealType || "otro",
		ingredients,
		tags: payload.tags || existing?.tags || [],
		servings: payload.servings ?? existing?.servings ?? 1,
		source: existing?.source || payload.source || "user",
		createdAt: existing?.createdAt || now,
		updatedAt: now,
	};
}
