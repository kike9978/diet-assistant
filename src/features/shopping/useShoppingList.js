import { useMemo } from "react";
import {
	buildShoppingListWithPantry,
	groupIngredientsByCategory,
} from "./buildShoppingList.js";

/**
 * Derived shopping list from weekPlan + shoppingExtras − pantry.
 */
export function useShoppingList(
	weekPlan,
	shoppingExtras = [],
	pantry = [],
	{ hidePantryCovered = false } = {},
) {
	return useMemo(() => {
		const withPantry = buildShoppingListWithPantry(
			weekPlan,
			shoppingExtras,
			pantry,
		);
		const filtered = hidePantryCovered
			? Object.fromEntries(
					Object.entries(withPantry).filter(
						([, item]) => !item.pantryCovered,
					),
				)
			: withPantry;
		const grouped = groupIngredientsByCategory(filtered);
		return { shoppingList: filtered, groupedShoppingList: grouped };
	}, [weekPlan, shoppingExtras, pantry, hidePantryCovered]);
}
