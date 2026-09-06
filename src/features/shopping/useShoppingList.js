import { useMemo } from "react";
import {
	buildShoppingListWithPantry,
	groupIngredientsByCategory,
} from "./buildShoppingList.js";
import { applyShoppingFusions } from "./applyShoppingFusions.js";

/**
 * Derived shopping list from weekPlan + shoppingExtras − pantry,
 * then shopping-only fusions (display merge; reversible).
 */
export function useShoppingList(
	weekPlan,
	shoppingExtras = [],
	pantry = [],
	{ hidePantryCovered = false, shoppingFusions = [] } = {},
) {
	return useMemo(() => {
		const withPantry = buildShoppingListWithPantry(
			weekPlan,
			shoppingExtras,
			pantry,
		);
		const withFusions = applyShoppingFusions(withPantry, shoppingFusions);
		const filtered = hidePantryCovered
			? Object.fromEntries(
					Object.entries(withFusions).filter(
						([, item]) => !item.pantryCovered,
					),
				)
			: withFusions;
		const grouped = groupIngredientsByCategory(filtered);
		return { shoppingList: filtered, groupedShoppingList: grouped };
	}, [weekPlan, shoppingExtras, pantry, hidePantryCovered, shoppingFusions]);
}
