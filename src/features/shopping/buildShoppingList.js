import { formatQuantity } from "../../domain/quantity.js";
import {
	getIngredientCategory,
	normalizeIngredientName,
	OTHER_CATEGORY_NAME,
} from "../../domain/ingredient.js";
import { applyPantryToShoppingMap } from "./applyPantry.js";

/**
 * Aggregate ingredients from a legacy weekPlan into a shopping map.
 * @param {Record<string, { ingredients: { name: string, quantity: string }[] }[]>} weekPlan
 */
export function buildShoppingMap(weekPlan) {
	const shoppingList = {};
	if (!weekPlan) return shoppingList;

	Object.values(weekPlan).forEach((meals) => {
		(meals || []).forEach((meal) => {
			(meal.ingredients || []).forEach((ingredient) => {
				const normalizedName = normalizeIngredientName(
					ingredient.name.toLowerCase(),
				);
				const qty =
					typeof ingredient.quantity === "string"
						? ingredient.quantity
						: formatQuantity(ingredient.quantity);

				if (!shoppingList[normalizedName]) {
					shoppingList[normalizedName] = {
						name: ingredient.name,
						normalizedName,
						quantities: [qty],
						variations: [ingredient.name.toLowerCase()],
					};
				} else {
					shoppingList[normalizedName].quantities.push(qty);
					if (
						!shoppingList[normalizedName].variations.includes(
							ingredient.name.toLowerCase(),
						)
					) {
						shoppingList[normalizedName].variations.push(
							ingredient.name.toLowerCase(),
						);
					}
				}
			});
		});
	});

	return shoppingList;
}

/**
 * Build shopping map from week + extras, then subtract pantry.
 * @param {Record<string, object[]>} weekPlan
 * @param {import("../../domain/types.js").ShoppingExtra[]} extras
 * @param {import("../../domain/types.js").PantryItem[]} pantry
 */
export function buildShoppingListWithPantry(
	weekPlan,
	extras = [],
	pantry = [],
) {
	const base = buildShoppingMap(weekPlan);
	const withExtras = mergeExtrasIntoShoppingMap(base, extras);
	return applyPantryToShoppingMap(withExtras, pantry);
}

/**
 * Merge shoppingExtras into the map (by normalized name or as separate lines).
 * @param {Record<string, object>} shoppingList
 * @param {import("../../domain/types.js").ShoppingExtra[]} extras
 */
export function mergeExtrasIntoShoppingMap(shoppingList, extras = []) {
	const next = { ...shoppingList };
	for (const extra of extras) {
		const normalizedName = normalizeIngredientName(extra.name);
		const qty = formatQuantity(extra.quantity);
		const key = `extra:${extra.id}`;
		next[key] = {
			name: extra.name,
			normalizedName,
			quantities: [qty],
			variations: [extra.name],
			isExtra: true,
			extraId: extra.id,
			category: extra.category,
		};
	}
	return next;
}

export function groupIngredientsByCategory(shoppingList) {
	const grouped = {};
	Object.values(shoppingList).forEach((item) => {
		const category =
			item.category || getIngredientCategory(item.name) || OTHER_CATEGORY_NAME;
		if (!grouped[category]) grouped[category] = [];
		grouped[category].push(item);
	});
	return grouped;
}
