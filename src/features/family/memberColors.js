/** Palette for household members (distinct, food-friendly accents). */
export const MEMBER_COLORS = [
	"#2F9E7B", // leaf
	"#E07A3D", // tomato / citrus
	"#3B6FA0", // blueberry
	"#C4A035", // mustard
	"#C45C7A", // berry
	"#5B8A3C", // olive
	"#D97706", // amber
	"#0F766E", // teal
];

/**
 * Pick next unused color from the palette (cycles if all used).
 * @param {string[]} usedColors
 */
export function nextMemberColor(usedColors = []) {
	const used = new Set(usedColors.map((c) => c.toLowerCase()));
	const free = MEMBER_COLORS.find((c) => !used.has(c.toLowerCase()));
	return free || MEMBER_COLORS[usedColors.length % MEMBER_COLORS.length];
}
