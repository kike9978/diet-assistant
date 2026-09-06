/**
 * @typedef {{ amount: number | null, unit: string | null, raw: string }} Quantity
 */

/** Canonical short units used in meal/shopping quantities. */
export const QUANTITY_UNITS = [
	"pza",
	"tza",
	"cda",
	"cdita",
	"g",
	"kg",
	"ml",
	"l",
	"puñado",
	"lata",
	"rebanada",
	"diente",
	"paq",
	"porción",
	"pizca",
	"al gusto",
	"opcional",
];

export const DEFAULT_QUANTITY_UNIT = "pza";

const UNIT_ONLY = new Set(["al gusto", "opcional"]);

/** Units that are valid without a numeric amount (al gusto, opcional). */
export function isUnitOnlyQuantity(unit) {
	return UNIT_ONLY.has(String(unit || "").toLowerCase().trim());
}

/**
 * Non-numeric / presence-only phrases → canonical unit (Spanish source labels).
 * Aliases in ES/EN collapse to the same key for shopping aggregation.
 */
const SPECIAL_CASES = {
	"c.s.": "al gusto",
	"c.s": "al gusto",
	"al gusto": "al gusto",
	"a gusto": "al gusto",
	"to taste": "al gusto",
	"cantidad suficiente": "al gusto",
	"opcional": "opcional",
	"optional": "opcional",
	"opc.": "opcional",
	"opc": "opcional",
	"pizca": "pizca",
	"pizcas": "pizca",
	"pinch": "pizca",
	"pinches": "pizca",
	"puñado": "puñado",
	"un puñado": "puñado",
	"handful": "puñado",
	"c.c.": "cucharadita",
	"c.c": "cucharadita",
};

/**
 * Parse a free-text quantity into a structured Quantity.
 * @param {string | null | undefined} quantityStr
 * @returns {Quantity}
 */
export function parseQuantity(quantityStr) {
	if (!quantityStr && quantityStr !== 0) {
		return { amount: null, unit: null, raw: "" };
	}

	const raw = String(quantityStr).trim();
	const quantity = raw.toLowerCase();

	if (SPECIAL_CASES[quantity]) {
		return { amount: null, unit: SPECIAL_CASES[quantity], raw };
	}

	const mixedMatch = quantity.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*?)$/);
	if (mixedMatch) {
		const amount =
			parseInt(mixedMatch[1], 10) +
			parseInt(mixedMatch[2], 10) / parseInt(mixedMatch[3], 10);
		const unit = mixedMatch[4] || null;
		return { amount, unit: unit || null, raw };
	}

	const fractionMatch = quantity.match(/^(\d+)\/(\d+)\s*(.*?)$/);
	if (fractionMatch) {
		const amount =
			parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10);
		const unit = fractionMatch[3] || null;
		return { amount, unit: unit || null, raw };
	}

	const simpleMatch = quantity.match(/^(\d+(?:\.\d+)?)\s*(.*?)$/);
	if (simpleMatch) {
		const amount = parseFloat(simpleMatch[1]);
		const unit = simpleMatch[2] || null;
		return { amount, unit: unit || null, raw };
	}

	return { amount: null, unit: quantity || null, raw };
}

/**
 * True when the quantity is a non-numeric misc phrase (al gusto, opcional, …).
 * @param {Quantity | string | null | undefined} q
 */
export function isMiscQuantity(q) {
	const parsed = typeof q === "string" || q == null ? parseQuantity(q) : q;
	if (!parsed || parsed.amount != null) return false;
	const unit = parsed.unit ? String(parsed.unit).toLowerCase().trim() : "";
	return Boolean(unit && Object.values(SPECIAL_CASES).includes(unit));
}

/**
 * Format a numeric amount (fractions when they match kitchen staples).
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatAmount(value) {
	if (value == null || Number.isNaN(Number(value))) return "";
	const numValue = Number(value);

	if (numValue % 1 !== 0) {
		const whole = Math.floor(numValue);
		const fraction = numValue - whole;
		let fractionStr = "";

		if (Math.abs(fraction - 0.25) < 0.001) fractionStr = "1/4";
		else if (Math.abs(fraction - 0.5) < 0.001) fractionStr = "1/2";
		else if (Math.abs(fraction - 0.75) < 0.001) fractionStr = "3/4";
		else if (Math.abs(fraction - 1 / 3) < 0.02) fractionStr = "1/3";
		else if (Math.abs(fraction - 2 / 3) < 0.02) fractionStr = "2/3";

		if (fractionStr) {
			return whole > 0 ? `${whole} ${fractionStr}` : fractionStr;
		}
	}

	return Number.isInteger(numValue)
		? String(numValue)
		: String(Math.round(numValue * 100) / 100);
}

/**
 * Split a stored quantity into form fields (amount text + unit).
 * @param {Quantity | string | null | undefined} quantity
 * @returns {{ amount: string, unit: string }}
 */
export function splitQuantityInput(quantity) {
	const parsed =
		typeof quantity === "string" || quantity == null
			? parseQuantity(quantity)
			: quantity;
	const unit = parsed?.unit ? String(parsed.unit).trim() : "";
	if (parsed?.amount == null) {
		return { amount: "", unit };
	}
	return { amount: formatAmount(parsed.amount), unit };
}

/**
 * Join amount + unit form fields into a parseable quantity string.
 * @param {string | null | undefined} amount
 * @param {string | null | undefined} unit
 * @returns {string}
 */
export function joinQuantityInput(amount, unit) {
	const a = String(amount || "").trim();
	const u = String(unit || "").trim();
	if (isUnitOnlyQuantity(u)) return u;
	if (!a) return u;
	if (!u) return a;
	return `${a} ${u}`;
}

/**
 * Format a Quantity for display (prefers raw when amount is null).
 * @param {Quantity | string | null | undefined} q
 * @returns {string}
 */
export function formatQuantity(q) {
	if (q == null) return "";
	if (typeof q === "string") return q;

	if (q.amount == null) {
		const unit = q.unit ? String(q.unit).toLowerCase().trim() : "";
		if (unit && Object.values(SPECIAL_CASES).includes(unit)) return unit;
		return q.raw || q.unit || "";
	}

	const unit = q.unit || "";
	const body = formatAmount(q.amount);
	return unit ? `${body} ${unit}` : body;
}

/**
 * Legacy adapter: old parseQuantity shape `{ value, unit, original }`.
 * @param {string | null | undefined} quantityStr
 */
export function parseQuantityLegacy(quantityStr) {
	const q = parseQuantity(quantityStr);
	return {
		value: q.amount ?? 0,
		unit: q.unit || "",
		original: q.raw || String(quantityStr || ""),
	};
}
