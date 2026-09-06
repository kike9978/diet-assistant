import { createId } from "../../domain/ids.js";
import {
	getIngredientCategory,
	ingredientFromLegacy,
} from "../../domain/ingredient.js";
import { formatQuantity, parseQuantity } from "../../domain/quantity.js";
import { flavorTextFields, normalizeFlavorText } from "../meals/flavorText.js";
import { normalizeMealIcon } from "../meals/mealIconCatalog.js";
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
		...flavorTextFields(meal.flavorText),
		...(opts.replacedFromId ? { replacedFromId: opts.replacedFromId } : {}),
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
 * Append a library meal snapshot onto a calendar date.
 * Low-level helper for tests/legacy — UI must assign whole day plans instead.
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
 * Locate a scheduled ingredient across household calendars.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} instanceId
 * @param {string} ingredientId
 * @param {string} [preferredMemberId]
 */
function findScheduledIngredient(
	state,
	instanceId,
	ingredientId,
	preferredMemberId,
) {
	const calendars = state.calendars || {};
	const memberIds = preferredMemberId
		? [
				preferredMemberId,
				...Object.keys(calendars).filter((id) => id !== preferredMemberId),
			]
		: Object.keys(calendars);

	for (const memberId of memberIds) {
		const memberCal = calendars[memberId] || {};
		for (const dateISO of Object.keys(memberCal)) {
			const list = memberCal[dateISO] || [];
			const mealIdx = list.findIndex((m) => m.instanceId === instanceId);
			if (mealIdx === -1) continue;
			const meal = list[mealIdx];
			const ingredientIndex = (meal.ingredients || []).findIndex(
				(ing) => ing.id === ingredientId,
			);
			if (ingredientIndex === -1) continue;
			return { memberId, dateISO, mealIdx, meal, ingredientIndex };
		}
	}
	return null;
}

/**
 * Substitute ingredient on a scheduled instance; optionally sync library meal.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {{
 *   instanceId: string,
 *   ingredientId: string,
 *   replacementLine?: string,
 *   replacementName?: string,
 *   updateLibrary?: boolean,
 *   memberId?: string,
 *   keepQuantity?: boolean
 * }} payload
 */
export function applyIngredientSubstitution(state, payload) {
	const {
		instanceId,
		ingredientId,
		replacementLine,
		replacementName,
		updateLibrary,
		memberId: payloadMemberId,
		keepQuantity,
	} = payload;
	const parsed = replacementName
		? { name: String(replacementName).trim(), quantity: null }
		: parseEquivalentLine(replacementLine);
	if (!parsed.name) return state;

	const found = findScheduledIngredient(
		state,
		instanceId,
		ingredientId,
		payloadMemberId,
	);
	if (!found) return state;

	const { memberId, dateISO, mealIdx, meal, ingredientIndex } = found;
	const existing = meal.ingredients[ingredientIndex];
	const nextQty =
		keepQuantity || parsed.quantity == null
			? existing.quantity
			: parsed.quantity;

	const memberCal = { ...(state.calendars[memberId] || {}) };
	const list = [...(memberCal[dateISO] || [])];
	const ingredients = [...(meal.ingredients || [])];
	ingredients[ingredientIndex] = {
		...existing,
		id: createId(),
		name: parsed.name,
		quantity: nextQty,
		categoryHint: getIngredientCategory(parsed.name),
	};
	list[mealIdx] = { ...meal, ingredients };
	memberCal[dateISO] = list;

	let mealLibrary = state.mealLibrary;
	if (updateLibrary && meal.mealId && ingredientIndex >= 0) {
		mealLibrary = mealLibrary.map((m) => {
			if (m.id !== meal.mealId) return m;
			const libIngredients = [...(m.ingredients || [])];
			if (!libIngredients[ingredientIndex]) return m;
			libIngredients[ingredientIndex] = {
				...libIngredients[ingredientIndex],
				id: libIngredients[ingredientIndex].id || createId(),
				name: parsed.name,
				quantity: keepQuantity
					? libIngredients[ingredientIndex].quantity
					: parsed.quantity || libIngredients[ingredientIndex].quantity,
				categoryHint: getIngredientCategory(parsed.name),
			};
			return {
				...m,
				ingredients: libIngredients,
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

function toIngredient(name, quantity, fallbackQty) {
	const qty =
		quantity && String(quantity).trim()
			? parseQuantity(quantity)
			: fallbackQty;
	return {
		id: createId(),
		name,
		quantity: qty,
		categoryHint: getIngredientCategory(name),
	};
}

/**
 * Replace one scheduled ingredient with one or more free-form ingredients.
 * Empty quantity on the first row keeps the meal's existing amount.
 *
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {{
 *   instanceId: string,
 *   ingredientId: string,
 *   memberId?: string,
 *   replacements: { name: string, quantity?: string }[],
 *   updateLibrary?: boolean,
 * }} payload
 */
export function replaceScheduledIngredientWith(state, payload) {
	const replacements = (payload.replacements || [])
		.map((row) => ({
			name: String(row?.name || "").trim(),
			quantity: String(row?.quantity || "").trim(),
		}))
		.filter((row) => row.name);
	if (!replacements.length) return state;

	const found = findScheduledIngredient(
		state,
		payload.instanceId,
		payload.ingredientId,
		payload.memberId,
	);
	if (!found) return state;

	const { memberId, dateISO, mealIdx, meal, ingredientIndex } = found;
	const existing = meal.ingredients[ingredientIndex];
	const first = toIngredient(
		replacements[0].name,
		replacements[0].quantity,
		existing.quantity,
	);
	const extras = replacements.slice(1).map((row) =>
		toIngredient(row.name, row.quantity, parseQuantity(row.quantity || "1 pza")),
	);

	const memberCal = { ...(state.calendars[memberId] || {}) };
	const list = [...(memberCal[dateISO] || [])];
	const ingredients = [...(meal.ingredients || [])];
	ingredients.splice(ingredientIndex, 1, first, ...extras);
	list[mealIdx] = { ...meal, ingredients };
	memberCal[dateISO] = list;

	let mealLibrary = state.mealLibrary;
	if (payload.updateLibrary && meal.mealId) {
		mealLibrary = mealLibrary.map((m) => {
			if (m.id !== meal.mealId) return m;
			const libIngredients = [...(m.ingredients || [])];
			if (!libIngredients[ingredientIndex]) return m;
			const libFirst = {
				...libIngredients[ingredientIndex],
				id: libIngredients[ingredientIndex].id || createId(),
				name: first.name,
				quantity: replacements[0].quantity
					? first.quantity
					: libIngredients[ingredientIndex].quantity,
				categoryHint: first.categoryHint,
			};
			const libExtras = extras.map((ing) => ({
				...ing,
				id: createId(),
			}));
			libIngredients.splice(ingredientIndex, 1, libFirst, ...libExtras);
			return {
				...m,
				ingredients: libIngredients,
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
 * Update only the quantity of a scheduled ingredient (keeps id and name).
 *
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {{
 *   instanceId: string,
 *   ingredientId: string,
 *   memberId?: string,
 *   quantity: import("../../domain/quantity.js").Quantity | string,
 * }} payload
 */
export function updateScheduledIngredientQuantity(state, payload) {
	const found = findScheduledIngredient(
		state,
		payload.instanceId,
		payload.ingredientId,
		payload.memberId,
	);
	if (!found) return state;

	const { memberId, dateISO, mealIdx, meal, ingredientIndex } = found;
	const existing = meal.ingredients[ingredientIndex];
	const nextQty =
		typeof payload.quantity === "string" || payload.quantity == null
			? parseQuantity(payload.quantity)
			: payload.quantity;
	if (!nextQty || (nextQty.amount == null && !nextQty.unit && !nextQty.raw)) {
		return state;
	}

	const memberCal = { ...(state.calendars[memberId] || {}) };
	const list = [...(memberCal[dateISO] || [])];
	const ingredients = [...(meal.ingredients || [])];
	ingredients[ingredientIndex] = { ...existing, quantity: nextQty };
	list[mealIdx] = { ...meal, ingredients };
	memberCal[dateISO] = list;

	return {
		...state,
		calendars: { ...state.calendars, [memberId]: memberCal },
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
 * Patch a scheduled meal instance (snapshot fields). Use mealId: null to detach.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} instanceId
 * @param {{
 *   name?: string,
 *   mealType?: string,
 *   ingredients?: import("../../domain/types.js").Ingredient[],
 *   mealId?: string | null,
 *   flavorText?: string,
 *   notes?: string
 * }} patch
 */
export function updateScheduledMeal(state, instanceId, patch) {
	const memberId = state.household.activeMemberId;
	const memberCal = { ...(state.calendars[memberId] || {}) };
	let found = false;

	for (const dateISO of Object.keys(memberCal)) {
		const list = memberCal[dateISO] || [];
		const idx = list.findIndex((m) => m.instanceId === instanceId);
		if (idx === -1) continue;
		const prev = list[idx];
		const next = {
			...prev,
			...(patch.name != null ? { name: patch.name } : {}),
			...(patch.mealType != null ? { mealType: patch.mealType } : {}),
			...(patch.notes !== undefined ? { notes: patch.notes } : {}),
			...(Object.prototype.hasOwnProperty.call(patch, "mealId")
				? { mealId: patch.mealId }
				: {}),
			...(patch.ingredients
				? {
						ingredients: patch.ingredients.map((ing) => ({
							...ing,
							id: ing.id || createId(),
						})),
					}
				: {}),
		};
		if (Object.prototype.hasOwnProperty.call(patch, "flavorText")) {
			const flavorText = normalizeFlavorText(patch.flavorText);
			if (flavorText) next.flavorText = flavorText;
			else delete next.flavorText;
		}
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
 * Apply edit disposition for a linked scheduled meal.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {{
 *   instanceId: string,
 *   payload: {
 *     name: string,
 *     mealType?: string,
 *     servings?: number,
 *     flavorText?: string,
 *     ingredients: { name: string, quantity: string }[]
 *   },
 *   disposition: "update" | "duplicate" | "once"
 * }} opts
 */
export function applyMealSaveDisposition(state, opts) {
	const { instanceId, payload, disposition } = opts;
	const memberId = state.household.activeMemberId;
	const memberCal = state.calendars[memberId] || {};
	let current = null;

	for (const dateISO of Object.keys(memberCal)) {
		const found = (memberCal[dateISO] || []).find(
			(m) => m.instanceId === instanceId,
		);
		if (found) {
			current = found;
			break;
		}
	}
	if (!current) return state;

	const ingredients = (payload.ingredients || [])
		.map((ing) =>
			ingredientFromLegacy({
				name: ing.name,
				quantity: ing.quantity,
			}),
		)
		.filter((ing) => ing.name);

	const snapshotPatch = {
		name: payload.name.trim(),
		mealType: payload.mealType || current.mealType,
		ingredients,
		...(payload.flavorText !== undefined
			? { flavorText: payload.flavorText }
			: {}),
	};

	if (disposition === "once" || !current.mealId) {
		return updateScheduledMeal(state, instanceId, {
			...snapshotPatch,
			mealId: null,
		});
	}

	if (disposition === "update") {
		const existing = state.mealLibrary.find((m) => m.id === current.mealId);
		if (!existing) {
			return updateScheduledMeal(state, instanceId, {
				...snapshotPatch,
				mealId: null,
			});
		}
		const updated = buildLibraryMeal(payload, existing);
		const withLibrary = {
			...state,
			mealLibrary: state.mealLibrary.map((m) =>
				m.id === current.mealId ? updated : m,
			),
		};
		return updateScheduledMeal(withLibrary, instanceId, {
			...snapshotPatch,
			mealId: current.mealId,
		});
	}

	if (disposition === "duplicate") {
		const created = buildLibraryMeal({ ...payload, source: "user" });
		const withLibrary = {
			...state,
			mealLibrary: [...state.mealLibrary, created],
		};
		return updateScheduledMeal(withLibrary, instanceId, {
			...snapshotPatch,
			mealId: created.id,
		});
	}

	return state;
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
 *   source?: string,
 *   flavorText?: string,
 *   icon?: string | null
 * }} payload
 * @param {import("../../domain/types.js").Meal} [existing]
 */
export function buildLibraryMeal(payload, existing) {
	const now = new Date().toISOString();
	const ingredients =
		payload.ingredients !== undefined
			? (payload.ingredients || [])
					.map((ing) =>
						ingredientFromLegacy({
							name: ing.name,
							quantity: ing.quantity,
						}),
					)
					.filter((ing) => ing.name)
			: existing?.ingredients || [];

	const flavorText =
		payload.flavorText !== undefined
			? normalizeFlavorText(payload.flavorText)
			: normalizeFlavorText(existing?.flavorText);

	const name = String(
		payload.name !== undefined ? payload.name : existing?.name || "",
	).trim();

	const icon =
		payload.icon !== undefined
			? normalizeMealIcon(payload.icon)
			: normalizeMealIcon(existing?.icon);

	return {
		id: existing?.id || createId(),
		name,
		mealType: payload.mealType || existing?.mealType || "otro",
		ingredients,
		tags: payload.tags || existing?.tags || [],
		servings: payload.servings ?? existing?.servings ?? 1,
		source: existing?.source || payload.source || "user",
		...flavorTextFields(flavorText),
		icon,
		createdAt: existing?.createdAt || now,
		updatedAt: now,
	};
}
