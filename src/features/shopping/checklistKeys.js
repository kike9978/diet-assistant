import { normalizeIngredientName } from "../../domain/ingredient.js";

/** Stable checklist keys: `ing:{normalizedName}` | `extra:{id}` */

export function ingredientChecklistKey(name) {
	return `ing:${normalizeIngredientName(name)}`;
}

export function extraChecklistKey(id) {
	return `extra:${id}`;
}

export function fusionChecklistKey(id) {
	return `fuse:${id}`;
}

/**
 * Remap legacy checkedItems keys to the stable scheme.
 * Drops unmapped / broken `item.name`-only keys that cannot be normalized safely
 * when they look like category-prefixed keys we don't recognize.
 *
 * @param {Record<string, boolean>} legacy
 * @returns {Record<string, boolean>}
 */
export function remapCheckedItems(legacy) {
	if (!legacy || typeof legacy !== "object") return {};

	/** @type {Record<string, boolean>} */
	const next = {};

	for (const [key, value] of Object.entries(legacy)) {
		if (!value) continue;

		if (key.startsWith("ing:") || key.startsWith("extra:")) {
			next[key] = true;
			continue;
		}

		// Legacy `category:normalizedName`
		const colon = key.indexOf(":");
		if (colon > 0) {
			const namePart = key.slice(colon + 1);
			if (namePart) {
				next[ingredientChecklistKey(namePart)] = true;
			}
			continue;
		}

		// Bare name (from buggy check-all) — keep if it looks like an ingredient name
		if (key.trim()) {
			next[ingredientChecklistKey(key)] = true;
		}
	}

	return next;
}
