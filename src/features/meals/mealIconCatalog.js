import {
	Apple,
	Bean,
	Beef,
	Cake,
	Carrot,
	Cherry,
	Citrus,
	Coffee,
	Cookie,
	CookingPot,
	Croissant,
	CupSoda,
	Drumstick,
	Egg,
	Fish,
	Grape,
	Ham,
	IceCreamCone,
	Leaf,
	Milk,
	Pizza,
	Salad,
	Sandwich,
	Soup,
	Utensils,
	Wheat,
} from "lucide-react";

/** Curated food/kitchen glyphs. Keys are stored on `Meal.icon`. */
export const MEAL_ICON_CATALOG = [
	{ key: "coffee", Icon: Coffee },
	{ key: "egg", Icon: Egg },
	{ key: "wheat", Icon: Wheat },
	{ key: "croissant", Icon: Croissant },
	{ key: "sandwich", Icon: Sandwich },
	{ key: "salad", Icon: Salad },
	{ key: "soup", Icon: Soup },
	{ key: "fish", Icon: Fish },
	{ key: "drumstick", Icon: Drumstick },
	{ key: "beef", Icon: Beef },
	{ key: "ham", Icon: Ham },
	{ key: "cookingPot", Icon: CookingPot },
	{ key: "utensils", Icon: Utensils },
	{ key: "cookie", Icon: Cookie },
	{ key: "cake", Icon: Cake },
	{ key: "iceCream", Icon: IceCreamCone },
	{ key: "apple", Icon: Apple },
	{ key: "carrot", Icon: Carrot },
	{ key: "grape", Icon: Grape },
	{ key: "cherry", Icon: Cherry },
	{ key: "citrus", Icon: Citrus },
	{ key: "leaf", Icon: Leaf },
	{ key: "bean", Icon: Bean },
	{ key: "milk", Icon: Milk },
	{ key: "cupSoda", Icon: CupSoda },
	{ key: "pizza", Icon: Pizza },
];

const ICON_BY_KEY = new Map(MEAL_ICON_CATALOG.map((item) => [item.key, item]));

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeMealIcon(value) {
	if (typeof value !== "string") return null;
	return ICON_BY_KEY.has(value) ? value : null;
}

/**
 * @param {string | null | undefined} key
 * @returns {typeof Coffee}
 */
export function mealIconComponent(key) {
	return ICON_BY_KEY.get(key)?.Icon || Utensils;
}
