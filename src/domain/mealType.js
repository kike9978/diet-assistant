/**
 * @typedef {"desayuno" | "colacion" | "comida" | "merienda" | "cena" | "otro"} MealType
 */

/** @type {{ prefixes: string[], type: MealType }[]} */
const PREFIX_MAP = [
	{ prefixes: ["desayuno", "breakfast"], type: "desayuno" },
	{
		prefixes: ["media mañana", "media manana", "colación", "colacion", "snack", "mid-morning"],
		type: "colacion",
	},
	{ prefixes: ["comida", "almuerzo", "lunch"], type: "comida" },
	{ prefixes: ["merienda", "afternoon"], type: "merienda" },
	{ prefixes: ["cena", "dinner"], type: "cena" },
];

/**
 * Infer MealType from meal name prefixes (ES + EN). Default `"otro"`.
 * @param {string} name
 * @returns {MealType}
 */
export function inferMealType(name) {
	if (!name || typeof name !== "string") return "otro";
	const lower = name.toLowerCase().trim();

	for (const { prefixes, type } of PREFIX_MAP) {
		for (const prefix of prefixes) {
			if (
				lower === prefix ||
				lower.startsWith(`${prefix}:`) ||
				lower.startsWith(`${prefix} `) ||
				lower.startsWith(`${prefix}-`)
			) {
				return type;
			}
		}
	}
	return "otro";
}
