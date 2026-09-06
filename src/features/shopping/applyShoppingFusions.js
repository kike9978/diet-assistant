import { createId } from "../../domain/ids.js";
import {
	extraChecklistKey,
	fusionChecklistKey,
	ingredientChecklistKey,
} from "./checklistKeys.js";

/**
 * Checklist key for a shopping-map entry (pre-fusion).
 * @param {object} item
 */
export function shoppingItemChecklistKey(item) {
	if (item?.isFused && item.fusionId) {
		return fusionChecklistKey(item.fusionId);
	}
	if (item?.isExtra && item.extraId) {
		return extraChecklistKey(item.extraId);
	}
	return ingredientChecklistKey(item?.normalizedName || item?.name || "");
}

/**
 * Apply shopping-only fusions: merge selected lines into one display row.
 * Name = member names joined by ", "; quantities concatenated (summed at display).
 * Incomplete fusions (<2 live members) are skipped so the list stays reversible.
 *
 * @param {Record<string, object>} shoppingList
 * @param {{ id: string, memberKeys: string[] }[]} fusions
 * @returns {Record<string, object>}
 */
export function applyShoppingFusions(shoppingList, fusions = []) {
	if (!fusions?.length) return shoppingList;

	/** @type {Record<string, string>} checklistKey → mapKey */
	const byChecklist = {};
	for (const [mapKey, item] of Object.entries(shoppingList)) {
		byChecklist[shoppingItemChecklistKey(item)] = mapKey;
	}

	const next = { ...shoppingList };
	const consumed = new Set();

	for (const fusion of fusions) {
		if (!fusion?.id || !Array.isArray(fusion.memberKeys)) continue;

		/** @type {{ mapKey: string, item: object, checklistKey: string }[]} */
		const members = [];
		for (const checklistKey of fusion.memberKeys) {
			const mapKey = byChecklist[checklistKey];
			if (!mapKey || consumed.has(mapKey) || !next[mapKey]) continue;
			members.push({
				mapKey,
				item: next[mapKey],
				checklistKey,
			});
		}

		if (members.length < 2) continue;

		for (const { mapKey } of members) {
			delete next[mapKey];
			consumed.add(mapKey);
		}

		const memberItems = members.map((m) => m.item);
		next[`fuse:${fusion.id}`] = {
			name: memberItems.map((m) => m.name).join(", "),
			normalizedName: memberItems
				.map((m) => m.normalizedName || m.name)
				.join(", "),
			quantities: memberItems.flatMap((m) => m.quantities || []),
			variations: [
				...new Set(memberItems.flatMap((m) => m.variations || [])),
			],
			category: memberItems[0].category,
			isFused: true,
			fusionId: fusion.id,
			fusedMembers: memberItems,
			fusedMemberKeys: members.map((m) => m.checklistKey),
			pantryCovered: memberItems.every((m) => m.pantryCovered),
			inPantry: memberItems.some((m) => m.inPantry),
		};
	}

	return next;
}

/**
 * @param {string[]} memberKeys — checklist keys of items to fuse
 * @returns {{ id: string, memberKeys: string[] } | null}
 */
export function createShoppingFusion(memberKeys = []) {
	const unique = [...new Set(memberKeys.filter(Boolean))];
	if (unique.length < 2) return null;
	return { id: createId(), memberKeys: unique };
}

/**
 * Expand a fused shopping line into its original members (for pantry actions).
 * Non-fused items return as a single-element array.
 * @param {object} item
 * @returns {object[]}
 */
export function expandFusedShoppingItem(item) {
	if (item?.isFused && Array.isArray(item.fusedMembers) && item.fusedMembers.length) {
		return item.fusedMembers;
	}
	return item ? [item] : [];
}
