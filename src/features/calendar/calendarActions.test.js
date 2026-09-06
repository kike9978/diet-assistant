import { describe, expect, it } from "vitest";
import {
	applyIngredientSubstitution,
	parseEquivalentLine,
	prunePastCalendarDays,
	scheduleLibraryMeal,
} from "./calendarActions.js";

function baseState() {
	return {
		version: 2,
		household: {
			members: [{ id: "m1", name: "Yo", color: "#1f6f54", createdAt: "" }],
			activeMemberId: "m1",
		},
		mealLibrary: [
			{
				id: "meal1",
				name: "Desayuno: Avena",
				mealType: "desayuno",
				ingredients: [
					{
						id: "ing1",
						name: "avena",
						quantity: { amount: 0.5, unit: "tza", raw: "1/2 tza" },
					},
				],
				tags: [],
				servings: 1,
				source: "user",
				createdAt: "",
				updatedAt: "",
			},
		],
		dayTemplates: [],
		dietTemplates: [],
		calendars: { m1: {} },
		pantry: [],
		shoppingExtras: [],
		checkedItems: {},
		mealPrep: {
			weekStartISO: "2026-08-31",
			selectedInstanceIds: [],
			unselectedVisible: false,
		},
		settings: {
			locale: "es",
			weekStartsOn: 1,
			calendarDefaultView: "week",
			currency: "MXN",
		},
		ui: {
			calendarCursorDate: "2026-09-05",
			calendarView: "week",
			onboardingDismissed: true,
			shoppingMemberIds: ["m1"],
		},
		meta: { lastSavedAt: "" },
	};
}

describe("calendarActions", () => {
	it("parseEquivalentLine splits quantity and name", () => {
		expect(parseEquivalentLine("1/2 tza de zanahoria")).toEqual({
			name: "zanahoria",
			quantity: expect.objectContaining({
				amount: 0.5,
				unit: "tza",
			}),
		});
	});

	it("scheduleLibraryMeal appends a snapshot", () => {
		const next = scheduleLibraryMeal(baseState(), "meal1", "2026-09-05");
		const meals = next.calendars.m1["2026-09-05"];
		expect(meals).toHaveLength(1);
		expect(meals[0].mealId).toBe("meal1");
		expect(meals[0].name).toBe("Desayuno: Avena");
		expect(meals[0].instanceId).toBeTruthy();
	});

	it("applyIngredientSubstitution updates instance and optionally library", () => {
		let state = scheduleLibraryMeal(baseState(), "meal1", "2026-09-05");
		const instance = state.calendars.m1["2026-09-05"][0];
		const ingredientId = instance.ingredients[0].id;

		state = applyIngredientSubstitution(state, {
			instanceId: instance.instanceId,
			ingredientId,
			replacementLine: "1 tza de pepino",
			updateLibrary: true,
		});

		expect(state.calendars.m1["2026-09-05"][0].ingredients[0].name).toBe(
			"pepino",
		);
		expect(state.mealLibrary[0].ingredients[0].name).toBe("pepino");
	});

	it("prunePastCalendarDays removes old dates", () => {
		const state = baseState();
		state.calendars.m1 = {
			"2025-01-01": [
				{
					instanceId: "old",
					dateISO: "2025-01-01",
					memberId: "m1",
					mealId: null,
					name: "Old",
					mealType: "otro",
					ingredients: [],
				},
			],
			"2026-09-05": [
				{
					instanceId: "new",
					dateISO: "2026-09-05",
					memberId: "m1",
					mealId: null,
					name: "New",
					mealType: "otro",
					ingredients: [],
				},
			],
		};
		state.mealPrep.selectedInstanceIds = ["old", "new"];

		const next = prunePastCalendarDays(state, { keepMonths: 4 });
		expect(next.calendars.m1["2025-01-01"]).toBeUndefined();
		expect(next.calendars.m1["2026-09-05"]).toHaveLength(1);
		expect(next.mealPrep.selectedInstanceIds).toEqual(["new"]);
	});
});
