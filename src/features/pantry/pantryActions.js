import { createId } from "../../domain/ids.js";
import {
	getIngredientCategory,
	normalizeIngredientName,
} from "../../domain/ingredient.js";
import { formatQuantity, parseQuantity } from "../../domain/quantity.js";
import {
	extraChecklistKey,
	ingredientChecklistKey,
} from "../shopping/checklistKeys.js";

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
	/** @type {string[]} */
	const leftover = [];

	for (const raw of quantities) {
		const q = parseQuantity(raw);
		if (q.amount == null) {
			if (raw) leftover.push(raw);
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

	for (const item of toStock) {
		next = upsertPantryFromShopping(next, {
			name: item.name,
			quantity: quantityForPantryStock(item),
			category: item.category,
		});
		if (item.isExtra && item.extraId) {
			keysToClear.add(extraChecklistKey(item.extraId));
			extraIdsToRemove.add(item.extraId);
		} else {
			keysToClear.add(
				ingredientChecklistKey(item.normalizedName || item.name),
			);
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

	return {
		state: {
			...next,
			checkedItems,
			shoppingExtras,
		},
		addedCount: toStock.length,
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
		g: "g",
		gr: "g",
		gramos: "g",
		gramo: "g",
		kg: "kg",
		ml: "ml",
		l: "l",
		tza: "tza",
		taza: "tza",
		tazas: "tza",
		cdita: "cdita",
		cucharadita: "cdita",
		cda: "cda",
		cucharada: "cda",
		pza: "pza",
		pieza: "pza",
		piezas: "pza",
		pz: "pza",
	};
	return aliases[u] || u;
}
