/**
 * Convert between raw and cooked weights using a yield factor.
 * rawToCooked = cooked / raw (e.g. rice 3, chicken 0.75).
 *
 * @param {number} amount
 * @param {number} rawToCooked
 * @param {"rawToCooked" | "cookedToRaw"} direction
 * @returns {number | null}
 */
export function convertYield(amount, rawToCooked, direction) {
	if (
		typeof amount !== "number" ||
		!Number.isFinite(amount) ||
		amount < 0 ||
		typeof rawToCooked !== "number" ||
		!Number.isFinite(rawToCooked) ||
		rawToCooked <= 0
	) {
		return null;
	}

	if (direction === "cookedToRaw") {
		return roundYield(amount / rawToCooked);
	}
	return roundYield(amount * rawToCooked);
}

/**
 * @param {number} n
 */
export function roundYield(n) {
	if (!Number.isFinite(n)) return n;
	const rounded = Math.round(n * 100) / 100;
	return Object.is(rounded, -0) ? 0 : rounded;
}
