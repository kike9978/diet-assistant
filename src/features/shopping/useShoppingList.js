import { useMemo } from "react";
import {
	buildShoppingMap,
	groupIngredientsByCategory,
	mergeExtrasIntoShoppingMap,
} from "./buildShoppingList.js";

/**
 * Derived shopping list from weekPlan + shoppingExtras.
 */
export function useShoppingList(weekPlan, shoppingExtras = []) {
	return useMemo(() => {
		const base = buildShoppingMap(weekPlan);
		const withExtras = mergeExtrasIntoShoppingMap(base, shoppingExtras);
		const grouped = groupIngredientsByCategory(withExtras);
		return { shoppingList: withExtras, groupedShoppingList: grouped };
	}, [weekPlan, shoppingExtras]);
}
