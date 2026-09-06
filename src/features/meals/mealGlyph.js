import { normalizeMealIcon } from "./mealIconCatalog.js";
import { MEAL_TYPE_GLYPH } from "./mealTypeIcons.js";

/** @type {{ needles: string[], icon: string }[]} */
const NAME_GLYPHS = [
	{ needles: ["avena", "oat", "granola", "cereal", "quinoa"], icon: "wheat" },
	{ needles: ["ensalada", "salad"], icon: "salad" },
	{
		needles: ["salmón", "salmon", "pescado", "fish", "atún", "atun", "tuna"],
		icon: "fish",
	},
	{ needles: ["pollo", "chicken", "pavo", "turkey"], icon: "drumstick" },
	{ needles: [" res", "carne", "beef", "steak", "filete"], icon: "beef" },
	{ needles: ["jamón", "jamon", "ham", "tocino", "bacon"], icon: "ham" },
	{
		needles: [
			"aguacate",
			"avocado",
			"tostada",
			"toast",
			"sándwich",
			"sandwich",
		],
		icon: "sandwich",
	},
	{ needles: ["huevo", "egg", "omelet", "revuelto"], icon: "egg" },
	{ needles: ["café", "cafe", "coffee", "espresso", "latte"], icon: "coffee" },
	{ needles: ["sopa", "soup", "caldo", "guiso", "stew"], icon: "soup" },
	{ needles: ["galleta", "cookie", "brownie"], icon: "cookie" },
	{ needles: ["manzana", "apple"], icon: "apple" },
	{ needles: ["zanahoria", "carrot"], icon: "carrot" },
	{ needles: ["yogurt", "yogur", "leche", "milk"], icon: "milk" },
	{ needles: ["pasta", "fideo", "arroz", "rice", "bowl"], icon: "cookingPot" },
	{ needles: ["pizza"], icon: "pizza" },
	{ needles: ["helado", "ice cream", "nieve"], icon: "iceCream" },
	{
		needles: ["smoothie", "licuado", "jugo", "juice", "refresco"],
		icon: "cupSoda",
	},
	{ needles: ["fruta", "fruit", "berries", "uva", "grape"], icon: "grape" },
	{ needles: ["croissant", "cuernito"], icon: "croissant" },
	{ needles: ["verdura", "vegetable", "veggie"], icon: "leaf" },
	{ needles: ["postre", "dessert", "pastel", "cake"], icon: "cake" },
	{ needles: ["frijol", "bean", "lenteja"], icon: "bean" },
	{ needles: ["naranja", "orange", "limón", "limon", "lemon"], icon: "citrus" },
	{ needles: ["cereza", "cherry"], icon: "cherry" },
];

function padded(name) {
	return ` ${String(name || "").toLowerCase()} `;
}

/**
 * Suggest a catalog icon from the meal name, then meal type.
 * @param {string} [name]
 * @param {string} [mealType]
 * @returns {string}
 */
export function suggestGlyph(name, mealType) {
	const haystack = padded(name);
	for (const { needles, icon } of NAME_GLYPHS) {
		if (needles.some((n) => haystack.includes(n))) return icon;
	}
	return MEAL_TYPE_GLYPH[mealType] || MEAL_TYPE_GLYPH.otro;
}

/**
 * Stored catalog key, or a suggestion when unset / unknown.
 * @param {{ name?: string, mealType?: string, icon?: unknown } | null | undefined} meal
 * @returns {string}
 */
export function resolveMealIcon(meal) {
	const stored = normalizeMealIcon(meal?.icon);
	if (stored) return stored;
	return suggestGlyph(meal?.name, meal?.mealType);
}
