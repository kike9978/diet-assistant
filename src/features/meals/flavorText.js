/**
 * Trim optional recipe copy. Empty/whitespace is omitted, not stored as "".
 * @param {unknown} value
 * @returns {string | undefined}
 */
export function normalizeFlavorText(value) {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed || undefined;
}

/**
 * Flavor text from a meal object or import JSON (`description` is an import-only alias).
 * @param {{ flavorText?: unknown, description?: unknown } | null | undefined} meal
 * @returns {string | undefined}
 */
export function flavorTextFromMeal(meal) {
	return (
		normalizeFlavorText(meal?.flavorText) ??
		normalizeFlavorText(meal?.description)
	);
}

/**
 * Flavor text on a snapshot, falling back to library / week-plan meals
 * by mealId then by name.
 * @param {{ flavorText?: unknown, mealId?: string | null, name?: string, id?: string } | null | undefined} meal
 * @param {{ id?: string, mealId?: string | null, name?: string, flavorText?: unknown, description?: unknown }[] | null | undefined} sources
 * @returns {string | undefined}
 */
export function resolveMealFlavorText(meal, sources) {
	const own = flavorTextFromMeal(meal);
	if (own) return own;
	const list = sources || [];
	if (meal?.mealId) {
		const linked = list.find(
			(m) => m.id === meal.mealId || m.mealId === meal.mealId,
		);
		const fromLinked = flavorTextFromMeal(linked);
		if (fromLinked) return fromLinked;
	}
	const name = (meal?.name || "").trim().toLowerCase();
	if (!name) return undefined;
	const named = list.find((m) => (m.name || "").trim().toLowerCase() === name);
	return flavorTextFromMeal(named);
}

/**
 * Library + week-plan draft meals that can supply flavor text.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 */
export function flavorTextSources(state) {
	const sources = [...(state?.mealLibrary || [])];
	for (const byWeek of Object.values(state?.weekPlans || {})) {
		for (const plan of Object.values(byWeek || {})) {
			for (const dp of plan?.dayPlans || []) {
				for (const meal of dp.meals || []) {
					sources.push(meal);
				}
			}
		}
	}
	return sources;
}

/**
 * Copy missing flavorText onto calendar snapshots from library / week plans.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 */
export function backfillCalendarFlavorText(state) {
	const sources = flavorTextSources(state);
	let changed = false;
	const calendars = { ...(state.calendars || {}) };

	for (const memberId of Object.keys(calendars)) {
		const days = calendars[memberId] || {};
		let memberChanged = false;
		const nextDays = { ...days };
		for (const [dateISO, meals] of Object.entries(nextDays)) {
			nextDays[dateISO] = (meals || []).map((meal) => {
				if (flavorTextFromMeal(meal)) return meal;
				const flavorText = resolveMealFlavorText(meal, sources);
				if (!flavorText) return meal;
				changed = true;
				memberChanged = true;
				return { ...meal, flavorText };
			});
		}
		if (memberChanged) calendars[memberId] = nextDays;
	}

	return changed ? { ...state, calendars } : state;
}

/**
 * Spread onto a meal object: `{ flavorText }` or `{}`.
 * @param {unknown} value
 * @returns {{ flavorText?: string }}
 */
export function flavorTextFields(value) {
	const flavorText = normalizeFlavorText(value);
	return flavorText ? { flavorText } : {};
}
