/**
 * @typedef {{ amount: number | null, unit: string | null, raw: string }} Quantity
 */

const SPECIAL_CASES = {
	"c.s.": "al gusto",
	"c.s": "al gusto",
	"al gusto": "al gusto",
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
 * Format a Quantity for display (prefers raw when amount is null).
 * @param {Quantity | string | null | undefined} q
 * @returns {string}
 */
export function formatQuantity(q) {
	if (q == null) return "";
	if (typeof q === "string") return q;

	if (q.amount == null) {
		if (q.unit === "al gusto") return "al gusto";
		return q.raw || q.unit || "";
	}

	const unit = q.unit || "";
	const value = q.amount;

	if (value % 1 !== 0) {
		const whole = Math.floor(value);
		const fraction = value - whole;
		let fractionStr = "";

		if (Math.abs(fraction - 0.25) < 0.001) fractionStr = "1/4";
		else if (Math.abs(fraction - 0.5) < 0.001) fractionStr = "1/2";
		else if (Math.abs(fraction - 0.75) < 0.001) fractionStr = "3/4";
		else if (Math.abs(fraction - 1 / 3) < 0.02) fractionStr = "1/3";
		else if (Math.abs(fraction - 2 / 3) < 0.02) fractionStr = "2/3";

		if (fractionStr) {
			const body =
				whole > 0 ? `${whole} ${fractionStr}` : fractionStr;
			return unit ? `${body} ${unit}` : body;
		}
	}

	const num =
		Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
	return unit ? `${num} ${unit}` : num;
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
