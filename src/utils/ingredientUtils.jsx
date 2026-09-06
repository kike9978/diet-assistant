// Re-export domain helpers for legacy imports during Phase 1.
export {
	WEEK_DAYS,
	WEEK_DAYS_SPANISH,
	INGREDIENT_CATEGORIES,
	OTHER_CATEGORY_NAME,
	SIMILAR_INGREDIENTS,
	INGREDIENT_EQUIVALENTS,
	getIngredientCategory,
	normalizeIngredientName,
	sumIngredients,
	formatQuantities,
} from "../domain/ingredient.js";

export { parseQuantityLegacy as parseQuantity } from "../domain/quantity.js";
