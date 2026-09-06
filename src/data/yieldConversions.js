/**
 * Approximate cooked ↔ raw yield factors for meal prep planning.
 * `rawToCooked` = cookedWeight / rawWeight (multiply raw → cooked).
 * Factors are kitchen averages — not lab-precise.
 *
 * @typedef {{
 *   id: string,
 *   nameEs: string,
 *   nameEn: string,
 *   category: "grano" | "legumbre" | "carne" | "pescado" | "verdura" | "otro",
 *   rawToCooked: number,
 *   notesEs?: string
 * }} YieldConversion
 */

/** @type {YieldConversion[]} */
export const YIELD_CONVERSIONS = [
	{
		id: "arroz-blanco",
		nameEs: "Arroz blanco (seco)",
		nameEn: "White rice (dry)",
		category: "grano",
		rawToCooked: 3,
		notesEs: "Absorbe agua; ~3× el peso seco.",
	},
	{
		id: "arroz-integral",
		nameEs: "Arroz integral (seco)",
		nameEn: "Brown rice (dry)",
		category: "grano",
		rawToCooked: 2.5,
	},
	{
		id: "avena",
		nameEs: "Avena (hojuelas)",
		nameEn: "Rolled oats",
		category: "grano",
		rawToCooked: 2.4,
	},
	{
		id: "pasta",
		nameEs: "Pasta seca",
		nameEn: "Dry pasta",
		category: "grano",
		rawToCooked: 2.25,
		notesEs: "Varía según forma y tiempo de cocción.",
	},
	{
		id: "lentejas",
		nameEs: "Lentejas (secas)",
		nameEn: "Lentils (dry)",
		category: "legumbre",
		rawToCooked: 2.5,
	},
	{
		id: "garbanzos",
		nameEs: "Garbanzos (secos)",
		nameEn: "Chickpeas (dry)",
		category: "legumbre",
		rawToCooked: 2.4,
	},
	{
		id: "frijol",
		nameEs: "Frijol (seco)",
		nameEn: "Beans (dry)",
		category: "legumbre",
		rawToCooked: 2.5,
	},
	{
		id: "pollo",
		nameEs: "Pollo (pechuga)",
		nameEn: "Chicken breast",
		category: "carne",
		rawToCooked: 0.75,
		notesEs: "Pierde humedad; ~25% menos al cocinar.",
	},
	{
		id: "res",
		nameEs: "Res (corte magro)",
		nameEn: "Lean beef",
		category: "carne",
		rawToCooked: 0.7,
	},
	{
		id: "cerdo",
		nameEs: "Cerdo (chuleta)",
		nameEn: "Pork chop",
		category: "carne",
		rawToCooked: 0.75,
	},
	{
		id: "pavo",
		nameEs: "Pavo (pechuga)",
		nameEn: "Turkey breast",
		category: "carne",
		rawToCooked: 0.76,
	},
	{
		id: "bacon",
		nameEs: "Tocino / bacon",
		nameEn: "Bacon",
		category: "carne",
		rawToCooked: 0.35,
		notesEs: "Pierde mucha grasa; factor muy variable.",
	},
	{
		id: "salmon",
		nameEs: "Salmón",
		nameEn: "Salmon",
		category: "pescado",
		rawToCooked: 0.8,
	},
	{
		id: "camaron",
		nameEs: "Camarón",
		nameEn: "Shrimp",
		category: "pescado",
		rawToCooked: 0.8,
	},
	{
		id: "verduras-asadas",
		nameEs: "Verduras asadas",
		nameEn: "Roasted vegetables",
		category: "verdura",
		rawToCooked: 0.85,
	},
	{
		id: "champinones",
		nameEs: "Champiñones salteados",
		nameEn: "Sautéed mushrooms",
		category: "verdura",
		rawToCooked: 0.5,
	},
	{
		id: "papa",
		nameEs: "Papa (hervida)",
		nameEn: "Potato (boiled)",
		category: "verdura",
		rawToCooked: 0.95,
	},
];

/**
 * @param {string} id
 * @returns {YieldConversion | undefined}
 */
export function getYieldById(id) {
	return YIELD_CONVERSIONS.find((y) => y.id === id);
}
