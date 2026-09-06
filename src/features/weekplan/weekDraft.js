import { createId } from "../../domain/ids.js";
import { ingredientFromLegacy } from "../../domain/ingredient.js";
import { inferMealType } from "../../domain/mealType.js";
import { formatQuantity } from "../../domain/quantity.js";
import { buildLibraryMeal } from "../calendar/calendarActions.js";

/**
 * @typedef {{
 *   tempId: string,
 *   mealId: string | null,
 *   name: string,
 *   mealType: string,
 *   ingredients: import("../../domain/types.js").Ingredient[],
 *   dirty: boolean,
 *   source: "library" | "create" | "import"
 * }} DraftMeal
 *
 * @typedef {{
 *   weekStartISO: string,
 *   days: { dateISO: string, meals: DraftMeal[] }[]
 * }} WeekDraft
 */

/**
 * Fingerprint for deduping meals in the save-to-library prompt.
 * @param {{ name?: string, ingredients?: { name?: string, quantity?: unknown }[] }} meal
 */
export function mealFingerprint(meal) {
	const name = (meal.name || "").trim().toLowerCase();
	const ings = (meal.ingredients || [])
		.map((ing) => {
			const qty =
				typeof ing.quantity === "string"
					? ing.quantity
					: formatQuantity(ing.quantity);
			return `${(ing.name || "").trim().toLowerCase()}|${(qty || "").trim().toLowerCase()}`;
		})
		.sort()
		.join(";");
	return `${name}::${ings}`;
}

/**
 * Normalize ingredients from form rows or legacy JSON into Ingredient[].
 * @param {{ name: string, quantity: string | object }[]} rows
 */
export function ingredientsFromRows(rows) {
	return (rows || [])
		.map((ing) => {
			if (ing && typeof ing.quantity === "object" && ing.quantity !== null) {
				return {
					id: ing.id || createId(),
					name: String(ing.name || "").trim(),
					quantity: ing.quantity,
					...(ing.categoryHint ? { categoryHint: ing.categoryHint } : {}),
					...(ing.notes ? { notes: ing.notes } : {}),
					...(ing.state != null ? { state: ing.state } : {}),
				};
			}
			return ingredientFromLegacy({
				name: ing?.name,
				quantity:
					typeof ing?.quantity === "string"
						? ing.quantity
						: formatQuantity(ing?.quantity) || "",
			});
		})
		.filter((ing) => ing.name);
}

/**
 * @param {Partial<DraftMeal> & { name: string }} opts
 * @returns {DraftMeal}
 */
export function createDraftMeal(opts) {
	const name = (opts.name || "").trim();
	return {
		tempId: opts.tempId || createId(),
		mealId: opts.mealId ?? null,
		name,
		mealType: opts.mealType || inferMealType(name),
		ingredients: ingredientsFromRows(opts.ingredients || []),
		dirty: Boolean(opts.dirty),
		source: opts.source || "create",
	};
}

/**
 * @param {string[]} weekDates
 * @returns {WeekDraft}
 */
export function createEmptyWeekDraft(weekDates) {
	const dates = weekDates || [];
	return {
		weekStartISO: dates[0] || "",
		days: dates.map((dateISO) => ({ dateISO, meals: [] })),
	};
}

/**
 * Build a draft from the active member's calendar for the given week dates.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string[]} weekDates
 * @returns {WeekDraft}
 */
export function draftFromCalendar(state, weekDates) {
	const memberId = state.household.activeMemberId;
	const cal = state.calendars[memberId] || {};
	const dates = weekDates || [];

	return {
		weekStartISO: dates[0] || "",
		days: dates.map((dateISO) => ({
			dateISO,
			meals: (cal[dateISO] || []).map((scheduled) =>
				createDraftMeal({
					mealId: scheduled.mealId || null,
					name: scheduled.name,
					mealType: scheduled.mealType,
					ingredients: scheduled.ingredients || [],
					dirty: false,
					source: scheduled.mealId ? "library" : "create",
				}),
			),
		})),
	};
}

/**
 * Map diet JSON days onto weekDates (by index). Extra JSON days ignored.
 * @param {{ days?: { name?: string, meals?: object[] }[] }} plan
 * @param {string[]} weekDates
 * @returns {WeekDraft}
 */
export function draftFromDietJson(plan, weekDates) {
	const draft = createEmptyWeekDraft(weekDates);
	const planDays = plan?.days || [];

	for (let i = 0; i < draft.days.length; i++) {
		const planDay = planDays[i];
		if (!planDay) continue;
		draft.days[i] = {
			dateISO: draft.days[i].dateISO,
			meals: (planDay.meals || []).map((meal) =>
				createDraftMeal({
					name: meal.name,
					mealType: inferMealType(meal.name),
					ingredients: (meal.ingredients || []).map((ing) => ({
						name: ing.name,
						quantity:
							typeof ing.quantity === "string"
								? ing.quantity
								: formatQuantity(ing.quantity) || "",
					})),
					dirty: false,
					source: "import",
				}),
			),
		};
	}

	return draft;
}

/**
 * Unique unsaved meals (import/create without mealId) for the save prompt.
 * @param {WeekDraft} draft
 * @returns {{ fingerprint: string, meal: DraftMeal, tempIds: string[] }[]}
 */
export function uniqueDraftMealsForSave(draft) {
	/** @type {Map<string, { fingerprint: string, meal: DraftMeal, tempIds: string[] }>} */
	const map = new Map();

	for (const day of draft.days || []) {
		for (const meal of day.meals || []) {
			if (meal.mealId) continue;
			if (meal.source !== "import" && meal.source !== "create") continue;
			const fingerprint = mealFingerprint(meal);
			const existing = map.get(fingerprint);
			if (existing) {
				existing.tempIds.push(meal.tempId);
			} else {
				map.set(fingerprint, {
					fingerprint,
					meal,
					tempIds: [meal.tempId],
				});
			}
		}
	}

	return [...map.values()];
}

/**
 * Whether the draft needs a library-save prompt before commit.
 * @param {WeekDraft} draft
 */
export function draftNeedsLibrarySavePrompt(draft) {
	return uniqueDraftMealsForSave(draft).length > 0;
}

/**
 * Add selected draft meals to the library and link mealId on matching draft slots.
 * Optionally create day/diet templates from the (linked) draft.
 *
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {WeekDraft} draft
 * @param {string[]} selectedTempIds
 * @param {{ saveAsTemplate?: boolean, templateName?: string }} [opts]
 * @returns {{ state: import("../../domain/types.js").DietAssistantStateV2, draft: WeekDraft }}
 */
export function applyLibrarySaveSelections(
	state,
	draft,
	selectedTempIds,
	opts = {},
) {
	const selected = new Set(selectedTempIds || []);
	const groups = uniqueDraftMealsForSave(draft);
	const now = new Date().toISOString();
	/** @type {Map<string, string>} tempId -> mealId */
	const tempToLibraryId = new Map();
	const newLibraryMeals = [];

	for (const group of groups) {
		const anySelected = group.tempIds.some((id) => selected.has(id));
		if (!anySelected) continue;

		const meal = buildLibraryMeal(
			{
				name: group.meal.name,
				mealType: group.meal.mealType,
				servings: 1,
				ingredients: (group.meal.ingredients || []).map((ing) => ({
					name: ing.name,
					quantity:
						typeof ing.quantity === "string"
							? ing.quantity
							: formatQuantity(ing.quantity) || "",
				})),
				source: group.meal.source === "import" ? "import" : "user",
			},
			undefined,
		);
		meal.createdAt = now;
		meal.updatedAt = now;
		newLibraryMeals.push(meal);
		for (const tempId of group.tempIds) {
			tempToLibraryId.set(tempId, meal.id);
		}
	}

	const nextDraft = {
		...draft,
		days: draft.days.map((day) => ({
			...day,
			meals: day.meals.map((meal) => {
				const linked = tempToLibraryId.get(meal.tempId);
				if (!linked) return meal;
				return { ...meal, mealId: linked, dirty: false };
			}),
		})),
	};

	let nextState = {
		...state,
		mealLibrary: [...state.mealLibrary, ...newLibraryMeals],
		ui: { ...state.ui, onboardingDismissed: true },
	};

	if (opts.saveAsTemplate) {
		nextState = saveDraftAsTemplates(
			nextState,
			nextDraft,
			opts.templateName || "Plan importado",
		);
	}

	return { state: nextState, draft: nextDraft };
}

/**
 * Persist draft days as day + diet templates (meals must already have mealIds when possible).
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {WeekDraft} draft
 * @param {string} name
 */
export function saveDraftAsTemplates(state, draft, name) {
	const now = new Date().toISOString();
	const mealLibrary = [...state.mealLibrary];
	const dayTemplates = [...state.dayTemplates];
	const dayTemplateIds = [];

	for (const [index, day] of (draft.days || []).entries()) {
		if (!day.meals?.length) continue;
		const mealIds = [];
		for (const draftMeal of day.meals) {
			if (draftMeal.mealId) {
				mealIds.push(draftMeal.mealId);
				continue;
			}
			const meal = buildLibraryMeal({
				name: draftMeal.name,
				mealType: draftMeal.mealType,
				servings: 1,
				ingredients: (draftMeal.ingredients || []).map((ing) => ({
					name: ing.name,
					quantity:
						typeof ing.quantity === "string"
							? ing.quantity
							: formatQuantity(ing.quantity) || "",
				})),
				source: "template",
			});
			mealLibrary.push(meal);
			mealIds.push(meal.id);
		}
		const dayId = createId();
		dayTemplates.push({
			id: dayId,
			name: `Día ${index + 1}`,
			mealIds,
		});
		dayTemplateIds.push(dayId);
	}

	if (dayTemplateIds.length === 0) {
		return { ...state, mealLibrary };
	}

	return {
		...state,
		mealLibrary,
		dayTemplates,
		dietTemplates: [
			...state.dietTemplates,
			{
				id: createId(),
				name,
				dayTemplateIds,
				createdAt: now,
			},
		],
	};
}

/**
 * Convert a draft meal into a ScheduledMeal snapshot.
 * @param {DraftMeal} draftMeal
 * @param {string} dateISO
 * @param {string} memberId
 */
export function draftMealToScheduled(draftMeal, dateISO, memberId) {
	return {
		instanceId: createId(),
		dateISO,
		memberId,
		mealId: draftMeal.mealId || null,
		name: draftMeal.name,
		mealType: draftMeal.mealType || inferMealType(draftMeal.name),
		ingredients: (draftMeal.ingredients || []).map((ing) => ({
			...ing,
			id: createId(),
		})),
	};
}

/**
 * Write draft onto the active member calendar (replaces each draft day).
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {WeekDraft} draft
 * @param {{ replaceDays?: boolean }} [opts]
 */
export function commitWeekDraft(state, draft, opts = {}) {
	const replaceDays = opts.replaceDays !== false;
	const memberId = state.household.activeMemberId;
	const memberCal = { ...(state.calendars[memberId] || {}) };

	for (const day of draft.days || []) {
		const scheduled = (day.meals || []).map((meal) =>
			draftMealToScheduled(meal, day.dateISO, memberId),
		);
		if (replaceDays) {
			memberCal[day.dateISO] = scheduled;
		} else {
			memberCal[day.dateISO] = [
				...(memberCal[day.dateISO] || []),
				...scheduled,
			];
		}
	}

	return {
		...state,
		calendars: { ...state.calendars, [memberId]: memberCal },
		ui: {
			...state.ui,
			calendarCursorDate: draft.weekStartISO || state.ui.calendarCursorDate,
			calendarView: "week",
			onboardingDismissed: true,
		},
	};
}

/**
 * Patch a draft meal by tempId.
 * @param {WeekDraft} draft
 * @param {string} tempId
 * @param {Partial<DraftMeal>} patch
 */
export function updateDraftMeal(draft, tempId, patch) {
	return {
		...draft,
		days: draft.days.map((day) => ({
			...day,
			meals: day.meals.map((meal) =>
				meal.tempId === tempId ? { ...meal, ...patch, dirty: true } : meal,
			),
		})),
	};
}

/**
 * Remove a draft meal by tempId.
 * @param {WeekDraft} draft
 * @param {string} tempId
 */
export function removeDraftMeal(draft, tempId) {
	return {
		...draft,
		days: draft.days.map((day) => ({
			...day,
			meals: day.meals.filter((meal) => meal.tempId !== tempId),
		})),
	};
}

/**
 * Append a draft meal to a day.
 * @param {WeekDraft} draft
 * @param {string} dateISO
 * @param {DraftMeal} meal
 */
export function addDraftMealToDay(draft, dateISO, meal) {
	return {
		...draft,
		days: draft.days.map((day) =>
			day.dateISO === dateISO
				? { ...day, meals: [...day.meals, meal] }
				: day,
		),
	};
}

/**
 * Replace all meals on a draft day.
 * @param {WeekDraft} draft
 * @param {string} dateISO
 * @param {DraftMeal[]} meals
 */
export function setDraftDayMeals(draft, dateISO, meals) {
	return {
		...draft,
		days: draft.days.map((day) =>
			day.dateISO === dateISO ? { ...day, meals } : day,
		),
	};
}
