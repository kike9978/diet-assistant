import { matchYieldConversion } from "../../data/yieldConversions.js";
import { formatQuantity, parseQuantity } from "../../domain/quantity.js";
import { convertYield } from "../tools/yieldConvert.js";
import { formatShoppingQuantities } from "./applyPantry.js";
import { ingredientChecklistKey } from "./checklistKeys.js";
import { shoppingItemChecklistKey } from "./applyShoppingFusions.js";
import {
	replaceScheduledIngredientWith,
	updateScheduledIngredientQuantity,
} from "../calendar/calendarActions.js";

/**
 * Shopping overrides / checks / yield / fusions are not stored on meal plans.
 * Collect line + instance keys from scheduled meals so clear paths can drop them.
 * @param {object[]} meals
 * @returns {{ lineKeys: Set<string>, instanceIds: Set<string> }}
 */
export function shoppingKeysFromMeals(meals = []) {
	/** @type {Set<string>} */
	const lineKeys = new Set();
	/** @type {Set<string>} */
	const instanceIds = new Set();
	for (const meal of meals || []) {
		const instanceId = meal?.instanceId || meal?.id;
		if (instanceId) instanceIds.add(instanceId);
		for (const ing of meal?.ingredients || []) {
			if (!ing?.name) continue;
			lineKeys.add(ingredientChecklistKey(ing.name));
		}
	}
	return { lineKeys, instanceIds };
}

/**
 * Drop shopping-only progress for the given ingredient lines / meal instances.
 * Clears qty overrides (Ajustada), yield modes (crudo/cocido), line checks,
 * source partial-checks, and fusions that include those lines.
 *
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {{ lineKeys?: Iterable<string>, instanceIds?: Iterable<string> }} keys
 */
export function clearShoppingProgressForKeys(state, keys = {}) {
	const lineKeys = keys.lineKeys instanceof Set
		? keys.lineKeys
		: new Set(keys.lineKeys || []);
	const instanceIds = keys.instanceIds instanceof Set
		? keys.instanceIds
		: new Set(keys.instanceIds || []);
	if (!lineKeys.size && !instanceIds.size) return state;

	const checkedItems = { ...(state.checkedItems || {}) };
	const shoppingSourceChecks = { ...(state.shoppingSourceChecks || {}) };
	const shoppingQtyOverrides = { ...(state.shoppingQtyOverrides || {}) };
	const shoppingYieldMode = { ...(state.shoppingYieldMode || {}) };
	let changed = false;

	for (const key of lineKeys) {
		if (checkedItems[key]) {
			delete checkedItems[key];
			changed = true;
		}
		if (shoppingQtyOverrides[key]) {
			delete shoppingQtyOverrides[key];
			changed = true;
		}
		if (shoppingYieldMode[key]) {
			delete shoppingYieldMode[key];
			changed = true;
		}
	}

	for (const key of Object.keys(shoppingSourceChecks)) {
		if (!key.startsWith("src:")) continue;
		const rest = key.slice(4);
		const colon = rest.indexOf(":");
		const instanceId = colon >= 0 ? rest.slice(0, colon) : rest;
		if (instanceIds.has(instanceId)) {
			delete shoppingSourceChecks[key];
			changed = true;
		}
	}

	const prevFusions = state.shoppingFusions || [];
	const shoppingFusions = prevFusions.filter((fusion) => {
		const members = fusion?.memberKeys || [];
		return !members.some((k) => lineKeys.has(k));
	});
	if (shoppingFusions.length !== prevFusions.length) {
		changed = true;
		const kept = new Set(shoppingFusions.map((f) => f.id));
		for (const fusion of prevFusions) {
			if (kept.has(fusion.id)) continue;
			const fuseKey = `fuse:${fusion.id}`;
			if (checkedItems[fuseKey]) delete checkedItems[fuseKey];
		}
	}

	if (!changed) return state;
	return {
		...state,
		checkedItems,
		shoppingSourceChecks,
		shoppingQtyOverrides,
		shoppingYieldMode,
		shoppingFusions,
	};
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {object[]} meals
 */
export function clearShoppingProgressForMeals(state, meals = []) {
	return clearShoppingProgressForKeys(state, shoppingKeysFromMeals(meals));
}

/**
 * @param {object} item
 * @returns {object[]}
 */
export function usableSources(item) {
	if (!item || item.isFused || item.isExtra) return [];
	return Array.isArray(item.sources) ? item.sources : [];
}

/**
 * Yield mode is shopping-only state. Unset / legacy asWritten / applied → raw.
 * @param {object} _item
 * @param {string | undefined} storedMode
 * @returns {"cookedToRaw" | "rawToCooked"}
 */
export function resolvedYieldMode(_item, storedMode) {
	if (storedMode === "cookedToRaw") return "cookedToRaw";
	return "rawToCooked";
}

/**
 * @param {object} item
 * @param {Record<string, boolean>} [checkedItems]
 * @param {Record<string, boolean>} [sourceChecks]
 * @returns {"unchecked" | "mixed" | "checked"}
 */
export function lineCheckState(
	item,
	checkedItems = {},
	sourceChecks = {},
) {
	const lineKey = shoppingItemChecklistKey(item);
	if (checkedItems[lineKey]) return "checked";
	const sources = usableSources(item);
	if (!sources.length) return "unchecked";
	const n = sources.filter((s) => sourceChecks[s.key]).length;
	// Partial selection only — none or all source checks mean the full plan qty.
	if (n === 0 || n >= sources.length) return "unchecked";
	return "mixed";
}

/**
 * Need-to-buy string (unconverted).
 * Source checks select which plan meals to include: none/all → full plan qty;
 * partial → sum of checked sources only.
 * @param {object} item
 * @param {{ override?: string, sourceChecks?: Record<string, boolean>, checkedItems?: Record<string, boolean> }} [opts]
 */
export function remainingQuantity(
	item,
	{ override, sourceChecks = {}, checkedItems = {} } = {},
) {
	if (item?.pantryCovered) return "";
	if (override) return override;
	const sources = usableSources(item);
	if (lineCheckState(item, checkedItems, sourceChecks) === "mixed") {
		return formatShoppingQuantities(
			sources.filter((s) => sourceChecks[s.key]).map((s) => s.quantity),
		);
	}
	return formatShoppingQuantities(item.quantities || []);
}

/**
 * Amount to stock in pantry for a completed / Ya lo tengo action.
 * @param {object} item
 * @param {{ checkedItems?: Record<string, boolean>, sourceChecks?: Record<string, boolean>, overrides?: Record<string, string> }} progress
 */
export function boughtQuantity(item, progress = {}) {
	const lineKey = shoppingItemChecklistKey(item);
	const override = progress.overrides?.[lineKey];
	if (override) return override;
	const sources = usableSources(item);
	const sourceChecks = progress.sourceChecks || {};
	const checkedItems = progress.checkedItems || {};
	if (checkedItems[lineKey] || !sources.length) {
		return formatShoppingQuantities(item.quantities || []);
	}
	const checked = sources.filter((s) => sourceChecks[s.key]);
	if (checked.length) {
		return formatShoppingQuantities(checked.map((s) => s.quantity));
	}
	return formatShoppingQuantities(item.quantities || []);
}

/**
 * @param {string} qtyString
 * @param {{ rawToCooked: number }} yieldEntry
 * @param {"asWritten" | "cookedToRaw" | "rawToCooked"} direction
 */
export function convertQuantityString(qtyString, yieldEntry, direction) {
	if (!qtyString || !yieldEntry || direction === "asWritten") return null;
	const parsed = parseQuantity(qtyString);
	if (parsed.amount == null) return null;
	const amount = convertYield(
		parsed.amount,
		yieldEntry.rawToCooked,
		direction,
	);
	if (amount == null) return null;
	return formatQuantity({ amount, unit: parsed.unit, raw: "" });
}

/**
 * Derived display state for a shopping line.
 * @param {object} item
 * @param {{
 *   checkedItems?: Record<string, boolean>,
 *   sourceChecks?: Record<string, boolean>,
 *   overrides?: Record<string, string>,
 *   yieldModes?: Record<string, string>,
 * }} [progress]
 */
export function shoppingLineView(
	item,
	{
		checkedItems = {},
		sourceChecks = {},
		overrides = {},
		yieldModes = {},
	} = {},
) {
	const lineKey = shoppingItemChecklistKey(item);
	const checkState = lineCheckState(item, checkedItems, sourceChecks);
	const override = overrides[lineKey] || "";
	const remaining = remainingQuantity(item, {
		override,
		sourceChecks,
		checkedItems,
	});
	const planRemaining = remainingQuantity(item, {
		sourceChecks,
		checkedItems,
	});
	const yieldEntry = matchYieldConversion(item?.normalizedName || item?.name, [
		item?.name,
		...(item?.variations || []),
	]);
	const storedYield = yieldModes[lineKey];
	const yieldMode = resolvedYieldMode(item, storedYield);
	const sources = usableSources(item).map((source) => ({
		...source,
		convertedQuantity:
			yieldEntry && yieldMode === "cookedToRaw"
				? convertQuantityString(source.quantity, yieldEntry, yieldMode)
				: null,
	}));
	// Convert from plan amounts only — never from an override (that stacked forever).
	const converted = (() => {
		if (!yieldEntry) return null;
		if (yieldMode === "rawToCooked") {
			return convertQuantityString(planRemaining, yieldEntry, yieldMode);
		}
		const includedSources =
			checkState === "mixed"
				? sources.filter((s) => sourceChecks[s.key])
				: sources;
		const parts = includedSources
			.map((s) => s.convertedQuantity)
			.filter(Boolean);
		if (parts.length) return formatShoppingQuantities(parts);
		return convertQuantityString(planRemaining, yieldEntry, yieldMode);
	})();
	const displayQty = override
		? remaining
		: yieldMode === "cookedToRaw" && converted
			? converted
			: remaining;
	const checkedSourceCount =
		checkState === "checked"
			? sources.length
			: sources.filter((s) => sourceChecks[s.key]).length;

	/** @type {{ type: string, remaining?: number, total?: number } | null} */
	let chip = null;
	if (override) {
		chip = { type: "ajustada" };
	} else if (checkState === "mixed" && sources.length) {
		chip = {
			type: "remaining",
			remaining: checkedSourceCount,
			total: sources.length,
		};
	} else if (yieldMode === "cookedToRaw" && converted) {
		chip = { type: "crudo" };
	}

	return {
		lineKey,
		checkState,
		remainingQty: remaining,
		planRemainingQty: planRemaining,
		displayQty,
		convertedQty: converted,
		yieldEntry,
		yieldMode,
		override,
		sources,
		checkedSourceCount,
		chip,
	};
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {object} item
 */
export function toggleLineCheck(state, item) {
	const lineKey = shoppingItemChecklistKey(item);
	const sources = usableSources(item);
	const checkState = lineCheckState(
		item,
		state.checkedItems,
		state.shoppingSourceChecks,
	);
	const checkedItems = { ...(state.checkedItems || {}) };
	const shoppingSourceChecks = { ...(state.shoppingSourceChecks || {}) };
	const shoppingQtyOverrides = { ...(state.shoppingQtyOverrides || {}) };

	if (checkState === "checked") {
		delete checkedItems[lineKey];
		for (const s of sources) delete shoppingSourceChecks[s.key];
		delete shoppingQtyOverrides[lineKey];
	} else {
		checkedItems[lineKey] = true;
		for (const s of sources) shoppingSourceChecks[s.key] = true;
	}
	return {
		...state,
		checkedItems,
		shoppingSourceChecks,
		shoppingQtyOverrides,
	};
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {object} item
 * @param {string} sourceKey
 */
export function toggleSourceCheck(state, item, sourceKey) {
	const lineKey = shoppingItemChecklistKey(item);
	const sources = usableSources(item);
	if (!sources.length) return state;

	const checkedItems = { ...(state.checkedItems || {}) };
	const shoppingSourceChecks = { ...(state.shoppingSourceChecks || {}) };
	const lineChecked = Boolean(checkedItems[lineKey]);
	const currentlyOn =
		lineChecked || Boolean(shoppingSourceChecks[sourceKey]);

	if (lineChecked) {
		// Leaving “bought”: keep other sources included, drop this one.
		for (const s of sources) shoppingSourceChecks[s.key] = true;
		delete shoppingSourceChecks[sourceKey];
		delete checkedItems[lineKey];
	} else if (currentlyOn) {
		delete shoppingSourceChecks[sourceKey];
		delete checkedItems[lineKey];
		// None left selected → treat as full plan (clear stray keys).
		if (!sources.some((s) => shoppingSourceChecks[s.key])) {
			for (const s of sources) delete shoppingSourceChecks[s.key];
		}
	} else {
		shoppingSourceChecks[sourceKey] = true;
		// All sources included again → same as default full plan.
		if (sources.every((s) => shoppingSourceChecks[s.key])) {
			for (const s of sources) delete shoppingSourceChecks[s.key];
		}
	}

	return { ...state, checkedItems, shoppingSourceChecks };
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} lineKey
 * @param {string} value
 */
export function setQtyOverride(state, lineKey, value) {
	const shoppingQtyOverrides = { ...(state.shoppingQtyOverrides || {}) };
	const trimmed = String(value || "").trim();
	if (!trimmed) delete shoppingQtyOverrides[lineKey];
	else shoppingQtyOverrides[lineKey] = trimmed;
	return { ...state, shoppingQtyOverrides };
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} lineKey
 * @param {"asWritten" | "cookedToRaw" | "rawToCooked"} mode
 */
export function setYieldMode(state, lineKey, mode) {
	const shoppingYieldMode = { ...(state.shoppingYieldMode || {}) };
	if (mode === "applied") {
		delete shoppingYieldMode[lineKey];
		return { ...state, shoppingYieldMode };
	}
	shoppingYieldMode[lineKey] = mode || "rawToCooked";
	return { ...state, shoppingYieldMode };
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {object} item
 */
export function clearLineProgress(state, item) {
	const lineKey = shoppingItemChecklistKey(item);
	const sources = usableSources(item);
	const checkedItems = { ...(state.checkedItems || {}) };
	const shoppingSourceChecks = { ...(state.shoppingSourceChecks || {}) };
	const shoppingQtyOverrides = { ...(state.shoppingQtyOverrides || {}) };
	const shoppingYieldMode = { ...(state.shoppingYieldMode || {}) };
	delete checkedItems[lineKey];
	delete shoppingQtyOverrides[lineKey];
	delete shoppingYieldMode[lineKey];
	for (const s of sources) delete shoppingSourceChecks[s.key];
	return {
		...state,
		checkedItems,
		shoppingSourceChecks,
		shoppingQtyOverrides,
		shoppingYieldMode,
	};
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {object[]} items
 */
export function markAllShoppingChecked(state, items) {
	const checkedItems = { ...(state.checkedItems || {}) };
	const shoppingSourceChecks = { ...(state.shoppingSourceChecks || {}) };
	for (const item of items || []) {
		const lineKey = shoppingItemChecklistKey(item);
		checkedItems[lineKey] = true;
		for (const s of usableSources(item)) shoppingSourceChecks[s.key] = true;
	}
	return { ...state, checkedItems, shoppingSourceChecks };
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 */
export function uncheckAllShopping(state) {
	return {
		...state,
		checkedItems: {},
		shoppingSourceChecks: {},
	};
}

/**
 * Replace this shopping line’s ingredient on every contributing calendar meal.
 * Empty quantity on the first replacement keeps each meal’s amount.
 *
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {{ sources: object[], replacements?: { name: string, quantity?: string }[], replacementName?: string, updateLibrary?: boolean, item?: object }} payload
 */
export function applyShoppingItemSubstitution(
	state,
	{ sources, replacementName, replacements, updateLibrary, item },
) {
	const rows = (replacements?.length
		? replacements
		: [{ name: replacementName, quantity: "" }]
	)
		.map((row) => ({
			name: String(row?.name || "").trim(),
			quantity: String(row?.quantity || "").trim(),
		}))
		.filter((row) => row.name);
	if (!rows.length || !sources?.length) return state;

	let next = state;
	const seenLibrary = new Set();
	for (const source of sources) {
		const shouldUpdateLib =
			Boolean(updateLibrary) &&
			source.mealId &&
			!seenLibrary.has(source.mealId);
		if (shouldUpdateLib) seenLibrary.add(source.mealId);
		next = replaceScheduledIngredientWith(next, {
			instanceId: source.instanceId,
			ingredientId: source.ingredientId,
			memberId: source.memberId,
			replacements: rows,
			updateLibrary: shouldUpdateLib,
		});
	}
	if (item) next = clearLineProgress(next, item);
	return next;
}

/**
 * Undo a previous cooked→raw write to the calendar. Yield stays a shopping
 * display state (cooked) so buy qty is converted without changing meals.
 *
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {object[]} items
 */
export function revertAppliedYieldConversions(state, items = []) {
	const shoppingYieldMode = { ...(state.shoppingYieldMode || {}) };
	let next = state;
	let any = false;

	for (const item of items) {
		const lineKey = shoppingItemChecklistKey(item);
		if (shoppingYieldMode[lineKey] !== "applied") continue;
		const yieldEntry = matchYieldConversion(
			item?.normalizedName || item?.name,
			[item?.name, ...(item?.variations || [])],
		);
		if (!yieldEntry) {
			shoppingYieldMode[lineKey] = "cookedToRaw";
			any = true;
			continue;
		}
		for (const source of usableSources(item)) {
			const parsed = parseQuantity(source.quantity);
			if (parsed.amount == null) continue;
			const amount = convertYield(
				parsed.amount,
				yieldEntry.rawToCooked,
				"rawToCooked",
			);
			if (amount == null) continue;
			next = updateScheduledIngredientQuantity(next, {
				instanceId: source.instanceId,
				ingredientId: source.ingredientId,
				memberId: source.memberId,
				quantity: { amount, unit: parsed.unit, raw: "" },
			});
		}
		shoppingYieldMode[lineKey] = "cookedToRaw";
		any = true;
	}

	if (!any) return state;
	return { ...next, shoppingYieldMode };
}
