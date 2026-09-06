import { createId } from "../../domain/ids.js";
import {
	getIngredientCategory,
	normalizeIngredientName,
} from "../../domain/ingredient.js";
import { formatQuantity, parseQuantity } from "../../domain/quantity.js";
import {
	extraChecklistKey,
	fusionChecklistKey,
	ingredientChecklistKey,
} from "../shopping/checklistKeys.js";
import { expandFusedShoppingItem } from "../shopping/applyShoppingFusions.js";

/**
 * @param {string | import("../../domain/types.js").Quantity} quantity
 */
function toQuantity(quantity) {
	if (quantity && typeof quantity === "object" && "raw" in quantity) {
		return quantity;
	}
	return parseQuantity(quantity);
}

/**
 * Best-effort quantity string for stocking pantry from a shopping line.
 * @param {{ quantities?: string[] }} item
 */
export function quantityForPantryStock(item) {
	const quantities = item?.quantities || [];
	if (!quantities.length) return "1 pza";

	/** @type {Record<string, number>} */
	const byUnit = {};
	/** @type {Map<string, string>} */
	const leftoverByKey = new Map();

	for (const raw of quantities) {
		const q = parseQuantity(raw);
		if (q.amount == null) {
			if (!raw) continue;
			const key = String(q.unit || raw)
				.toLowerCase()
				.trim();
			if (!key || leftoverByKey.has(key)) continue;
			leftoverByKey.set(key, formatQuantity(q) || String(raw).trim());
			continue;
		}
		const unitKey = q.unit ? String(q.unit).toLowerCase().trim() : "";
		let bucket = Object.keys(byUnit).find((k) =>
			unitsCompatible(k || null, unitKey || null),
		);
		if (bucket == null) {
			bucket = unitKey;
			byUnit[bucket] = 0;
		}
		byUnit[bucket] += q.amount;
	}

	const leftover = [...leftoverByKey.values()];
	const units = Object.keys(byUnit);
	if (units.length === 1 && leftover.length === 0) {
		return formatQuantity({
			amount: byUnit[units[0]],
			unit: units[0] || null,
			raw: "",
		});
	}

	const parts = [
		...units.map((u) =>
			formatQuantity({ amount: byUnit[u], unit: u || null, raw: "" }),
		),
		...leftover,
	];
	return parts.filter(Boolean).join(", ") || "1 pza";
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {{ name: string, quantity: string | import("../../domain/types.js").Quantity, category?: string }} payload
 */
export function addPantryItem(state, { name, quantity, category }) {
	const trimmed = (name || "").trim();
	if (!trimmed) return state;

	const now = new Date().toISOString();
	const item = {
		id: createId(),
		name: trimmed,
		quantity: toQuantity(quantity),
		category: category || getIngredientCategory(trimmed) || undefined,
		updatedAt: now,
	};

	return {
		...state,
		pantry: [...state.pantry, item],
	};
}

/**
 * Upsert by normalized name: bump quantity if same unit, else replace entry.
 * Used by “ya lo tengo → despensa”.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {{ name: string, quantity?: string | import("../../domain/types.js").Quantity, category?: string }} payload
 */
export function upsertPantryFromShopping(state, { name, quantity, category }) {
	const trimmed = (name || "").trim();
	if (!trimmed) return state;

	const normalized = normalizeIngredientName(trimmed);
	const qty = toQuantity(quantity || "");
	const now = new Date().toISOString();
	const existingIdx = state.pantry.findIndex(
		(p) => normalizeIngredientName(p.name) === normalized,
	);

	if (existingIdx === -1) {
		return addPantryItem(state, {
			name: trimmed,
			quantity: qty,
			category,
		});
	}

	const existing = state.pantry[existingIdx];
	let nextQty = qty;
	if (
		qty.amount != null &&
		existing.quantity?.amount != null &&
		unitsCompatible(existing.quantity.unit, qty.unit)
	) {
		const amount = existing.quantity.amount + qty.amount;
		const unit = existing.quantity.unit || qty.unit;
		nextQty = {
			amount,
			unit,
			raw: unit ? `${amount} ${unit}` : String(amount),
		};
	}

	const pantry = state.pantry.map((p, i) =>
		i === existingIdx
			? {
					...p,
					quantity: nextQty,
					category: category || p.category,
					updatedAt: now,
				}
			: p,
	);

	return { ...state, pantry };
}

/**
 * After shopping: stock pantry with checked list items, then clear those checks
 * (and drop checked extras from the persistent extras list).
 *
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {Array<{
 *   name: string,
 *   quantities?: string[],
 *   category?: string,
 *   isExtra?: boolean,
 *   extraId?: string,
 *   pantryCovered?: boolean,
 *   normalizedName?: string
 * }>} items — shopping lines currently checked
 * @returns {{ state: import("../../domain/types.js").DietAssistantStateV2, addedCount: number }}
 */
export function finishShoppingToPantry(state, items = []) {
	const toStock = (items || []).filter(
		(item) => item?.name && !item.pantryCovered,
	);
	if (toStock.length === 0) {
		return { state, addedCount: 0 };
	}

	let next = state;
	const keysToClear = new Set();
	const extraIdsToRemove = new Set();
	const fusionIdsToRemove = new Set();
	let addedCount = 0;

	for (const item of toStock) {
		const members = expandFusedShoppingItem(item);
		if (item.isFused && item.fusionId) {
			fusionIdsToRemove.add(item.fusionId);
			keysToClear.add(fusionChecklistKey(item.fusionId));
		}

		for (const member of members) {
			if (member.pantryCovered) continue;
			next = upsertPantryFromShopping(next, {
				name: member.name,
				quantity: quantityForPantryStock(member),
				category: member.category,
			});
			addedCount += 1;
			if (member.isExtra && member.extraId) {
				keysToClear.add(extraChecklistKey(member.extraId));
				extraIdsToRemove.add(member.extraId);
			} else {
				keysToClear.add(
					ingredientChecklistKey(member.normalizedName || member.name),
				);
			}
		}
	}

	const checkedItems = Object.fromEntries(
		Object.entries(next.checkedItems || {}).filter(
			([k]) => !keysToClear.has(k),
		),
	);
	const shoppingExtras = (next.shoppingExtras || []).filter(
		(e) => !extraIdsToRemove.has(e.id),
	);
	const shoppingFusions = (next.shoppingFusions || []).filter(
		(f) => !fusionIdsToRemove.has(f.id),
	);

	const shoppingSourceChecks = { ...(next.shoppingSourceChecks || {}) };
	const shoppingQtyOverrides = { ...(next.shoppingQtyOverrides || {}) };
	const shoppingYieldMode = { ...(next.shoppingYieldMode || {}) };
	for (const key of keysToClear) {
		delete shoppingQtyOverrides[key];
		delete shoppingYieldMode[key];
	}
	for (const item of toStock) {
		for (const member of expandFusedShoppingItem(item)) {
			for (const source of member.sources || []) {
				if (source?.key) delete shoppingSourceChecks[source.key];
			}
		}
	}

	return {
		state: {
			...next,
			checkedItems,
			shoppingExtras,
			shoppingFusions,
			shoppingSourceChecks,
			shoppingQtyOverrides,
			shoppingYieldMode,
		},
		addedCount,
	};
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} id
 * @param {{ name?: string, quantity?: string | import("../../domain/types.js").Quantity, category?: string }} patch
 */
export function updatePantryItem(state, id, patch) {
	const now = new Date().toISOString();
	const pantry = state.pantry.map((item) => {
		if (item.id !== id) return item;
		return {
			...item,
			...(patch.name != null
				? { name: String(patch.name).trim() || item.name }
				: {}),
			...(patch.quantity != null
				? { quantity: toQuantity(patch.quantity) }
				: {}),
			...(patch.category != null ? { category: patch.category } : {}),
			updatedAt: now,
		};
	});
	return { ...state, pantry };
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} id
 */
export function removePantryItem(state, id) {
	return {
		...state,
		pantry: state.pantry.filter((p) => p.id !== id),
	};
}

/**
 * Loose unit equality for pantry math (g≈gr, tza≈taza, etc.).
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 */
export function unitsCompatible(a, b) {
	const na = normalizeUnit(a);
	const nb = normalizeUnit(b);
	if (!na && !nb) return true;
	if (!na || !nb) return false;
	return na === nb;
}

function normalizeUnit(unit) {
	if (!unit) return "";
	const u = String(unit).toLowerCase().trim();
	const aliases = {
		// mass
		g: "g",
		gr: "g",
		gramos: "g",
		gramo: "g",
		gram: "g",
		grams: "g",
		kg: "kg",
		kilogram: "kg",
		kilograms: "kg",
		kilogramo: "kg",
		kilogramos: "kg",
		// volume metric
		ml: "ml",
		milliliter: "ml",
		milliliters: "ml",
		millilitre: "ml",
		millilitres: "ml",
		l: "l",
		lt: "l",
		litro: "l",
		litros: "l",
		liter: "l",
		liters: "l",
		litre: "l",
		litres: "l",
		// cups / tazas
		tza: "tza",
		taza: "tza",
		tazas: "tza",
		cup: "tza",
		cups: "tza",
		// teaspoons
		cdita: "cdita",
		cucharadita: "cdita",
		cucharaditas: "cdita",
		tsp: "cdita",
		teaspoon: "cdita",
		teaspoons: "cdita",
		// tablespoons
		cda: "cda",
		cucharada: "cda",
		cucharadas: "cda",
		tbsp: "cda",
		tablespoon: "cda",
		tablespoons: "cda",
		// pieces
		pza: "pza",
		pzas: "pza",
		pieza: "pza",
		piezas: "pza",
		pz: "pza",
		pc: "pza",
		pcs: "pza",
		piece: "pza",
		pieces: "pza",
		// slices / rebanadas
		rebanada: "rebanada",
		rebanadas: "rebanada",
		slice: "rebanada",
		slices: "rebanada",
		// cloves / dientes
		diente: "diente",
		dientes: "diente",
		clove: "diente",
		cloves: "diente",
	};
	return aliases[u] || u;
}
