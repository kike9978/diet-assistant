import { normalizeIngredientName } from "../../domain/ingredient.js";
import { formatQuantity, parseQuantity } from "../../domain/quantity.js";
import { unitsCompatible } from "../pantry/pantryActions.js";

/**
 * Sum parseable quantities that share a compatible unit.
 * @param {string[]} quantityStrings
 * @returns {{ amount: number | null, unit: string | null, rawParts: string[] }}
 */
export function sumCompatibleQuantities(quantityStrings = []) {
	/** @type {Record<string, number>} */
	const byUnit = {};
	/** @type {string[]} */
	const leftover = [];

	for (const raw of quantityStrings) {
		const q = parseQuantity(raw);
		if (q.amount == null) {
			if (raw) leftover.push(raw);
			continue;
		}
		const unitKey = q.unit ? String(q.unit).toLowerCase().trim() : "";
		// Find compatible bucket
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
		const unit = units[0] || null;
		return { amount: byUnit[units[0]], unit, rawParts: [] };
	}

	const parts = [
		...units.map((u) =>
			formatQuantity({ amount: byUnit[u], unit: u || null, raw: "" }),
		),
		...leftover,
	];
	return { amount: null, unit: null, rawParts: parts };
}

/**
 * Display string for aggregated shopping-line quantities (sums compatible units).
 * @param {string[]} quantityStrings
 * @returns {string}
 */
export function formatShoppingQuantities(quantityStrings = []) {
	if (!quantityStrings.length) return "";
	const summed = sumCompatibleQuantities(quantityStrings);
	if (summed.amount != null) {
		return formatQuantity({
			amount: summed.amount,
			unit: summed.unit,
			raw: "",
		});
	}
	return summed.rawParts.filter(Boolean).join(", ");
}

/**
 * Subtract pantry inventory from a shopping map.
 * Fully covered items get `inPantry: true` (kept for “ya lo tengo” UX / hide toggle).
 * Partially covered items get reduced quantities.
 *
 * @param {Record<string, object>} shoppingList
 * @param {import("../../domain/types.js").PantryItem[]} pantry
 */
export function applyPantryToShoppingMap(shoppingList, pantry = []) {
	if (!pantry.length) return shoppingList;

	const pantryByName = new Map();
	for (const item of pantry) {
		const key = normalizeIngredientName(item.name);
		if (!pantryByName.has(key)) pantryByName.set(key, []);
		pantryByName.get(key).push(item);
	}

	const next = {};
	for (const [mapKey, item] of Object.entries(shoppingList)) {
		if (item.isExtra) {
			next[mapKey] = item;
			continue;
		}

		const normalized = item.normalizedName || normalizeIngredientName(item.name);
		const matches = pantryByName.get(normalized);
		if (!matches?.length) {
			next[mapKey] = item;
			continue;
		}

		const summed = sumCompatibleQuantities(item.quantities || []);
		const pantryQty = matches[0].quantity;
		const pantryAmount = pantryQty?.amount ?? null;
		const pantryUnit = pantryQty?.unit ?? null;

		// Presence-only pantry (no amount) → mark owned
		if (pantryAmount == null) {
			next[mapKey] = {
				...item,
				inPantry: true,
				pantryCovered: true,
			};
			continue;
		}

		if (
			summed.amount != null &&
			unitsCompatible(summed.unit, pantryUnit)
		) {
			const remaining = summed.amount - pantryAmount;
			if (remaining <= 0.001) {
				next[mapKey] = {
					...item,
					quantities: [],
					inPantry: true,
					pantryCovered: true,
				};
			} else {
				const display = formatQuantity({
					amount: remaining,
					unit: summed.unit,
					raw: "",
				});
				next[mapKey] = {
					...item,
					quantities: [display],
					inPantry: true,
					pantryCovered: false,
					pantrySubtracted: formatQuantity(pantryQty),
				};
			}
			continue;
		}

		// Incompatible units / unparsed — flag but keep list lines
		next[mapKey] = {
			...item,
			inPantry: true,
			pantryCovered: false,
			pantryNote: formatQuantity(pantryQty),
		};
	}

	return next;
}
