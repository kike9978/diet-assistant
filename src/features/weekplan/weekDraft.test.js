import { describe, expect, it } from "vitest";
import {
	applyLibrarySaveSelections,
	commitWeekDraft,
	createEmptyWeekDraft,
	draftFromCalendar,
	draftFromDietJson,
	mealFingerprint,
	uniqueDraftMealsForSave,
} from "./weekDraft.js";
import {
	applyMealSaveDisposition,
	scheduleLibraryMeal,
	updateScheduledMeal,
} from "../calendar/calendarActions.js";

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

const WEEK = [
	"2026-08-31",
	"2026-09-01",
	"2026-09-02",
	"2026-09-03",
	"2026-09-04",
	"2026-09-05",
	"2026-09-06",
];

describe("weekDraft", () => {
	it("createEmptyWeekDraft has 7 empty days", () => {
		const draft = createEmptyWeekDraft(WEEK);
		expect(draft.weekStartISO).toBe("2026-08-31");
		expect(draft.days).toHaveLength(7);
		expect(draft.days.every((d) => d.meals.length === 0)).toBe(true);
	});

	it("draftFromDietJson maps days by index and ignores extras", () => {
		const draft = draftFromDietJson(
			{
				days: [
					{
						name: "Día 1",
						meals: [
							{
								name: "Breakfast: Oats",
								ingredients: [{ name: "Oats", quantity: "1/2 cup" }],
							},
						],
					},
					{
						name: "Día 2",
						meals: [
							{
								name: "Lunch: Salad",
								ingredients: [{ name: "Lettuce", quantity: "1 cup" }],
							},
						],
					},
					{ name: "Día 3", meals: [{ name: "Extra", ingredients: [] }] },
					{ name: "Día 4", meals: [{ name: "Extra2", ingredients: [] }] },
					{ name: "Día 5", meals: [{ name: "Extra3", ingredients: [] }] },
					{ name: "Día 6", meals: [{ name: "Extra4", ingredients: [] }] },
					{ name: "Día 7", meals: [{ name: "Extra5", ingredients: [] }] },
					{ name: "Día 8", meals: [{ name: "Ignored", ingredients: [] }] },
				],
			},
			WEEK,
		);

		expect(draft.days[0].meals[0].name).toBe("Breakfast: Oats");
		expect(draft.days[0].meals[0].source).toBe("import");
		expect(draft.days[0].meals[0].mealType).toBe("desayuno");
		expect(draft.days[1].meals[0].name).toBe("Lunch: Salad");
		expect(draft.days).toHaveLength(7);
	});

	it("draftFromCalendar snapshots scheduled meals", () => {
		let state = scheduleLibraryMeal(baseState(), "meal1", "2026-09-01");
		const draft = draftFromCalendar(state, WEEK);
		expect(draft.days[1].meals).toHaveLength(1);
		expect(draft.days[1].meals[0].mealId).toBe("meal1");
		expect(draft.days[1].meals[0].source).toBe("library");
	});

	it("uniqueDraftMealsForSave dedupes by fingerprint", () => {
		const draft = draftFromDietJson(
			{
				days: [
					{
						meals: [
							{
								name: "Same",
								ingredients: [{ name: "A", quantity: "1" }],
							},
						],
					},
					{
						meals: [
							{
								name: "Same",
								ingredients: [{ name: "A", quantity: "1" }],
							},
						],
					},
				],
			},
			WEEK,
		);
		const groups = uniqueDraftMealsForSave(draft);
		expect(groups).toHaveLength(1);
		expect(groups[0].tempIds).toHaveLength(2);
		expect(mealFingerprint(groups[0].meal)).toContain("same::");
	});

	it("applyLibrarySaveSelections links selected meals then commit writes calendar", () => {
		let draft = draftFromDietJson(
			{
				days: [
					{
						meals: [
							{
								name: "Dinner: Fish",
								ingredients: [{ name: "Salmon", quantity: "150g" }],
							},
						],
					},
				],
			},
			WEEK,
		);
		const groups = uniqueDraftMealsForSave(draft);
		const { state, draft: linked } = applyLibrarySaveSelections(
			baseState(),
			draft,
			groups[0].tempIds,
		);
		expect(state.mealLibrary.some((m) => m.name === "Dinner: Fish")).toBe(true);
		expect(linked.days[0].meals[0].mealId).toBeTruthy();

		const committed = commitWeekDraft(state, linked);
		expect(committed.calendars.m1["2026-08-31"]).toHaveLength(1);
		expect(committed.calendars.m1["2026-08-31"][0].name).toBe("Dinner: Fish");
		expect(committed.calendars.m1["2026-08-31"][0].mealId).toBe(
			linked.days[0].meals[0].mealId,
		);
	});

	it("updateScheduledMeal and disposition once detaches mealId", () => {
		let state = scheduleLibraryMeal(baseState(), "meal1", "2026-09-05");
		const instanceId = state.calendars.m1["2026-09-05"][0].instanceId;
		state = updateScheduledMeal(state, instanceId, {
			name: "Desayuno: Avena XL",
		});
		expect(state.calendars.m1["2026-09-05"][0].name).toBe("Desayuno: Avena XL");

		state = applyMealSaveDisposition(state, {
			instanceId,
			payload: {
				name: "Desayuno: Avena XL",
				mealType: "desayuno",
				ingredients: [{ name: "avena", quantity: "1 tza" }],
			},
			disposition: "once",
		});
		expect(state.calendars.m1["2026-09-05"][0].mealId).toBeNull();
		expect(state.mealLibrary.find((m) => m.id === "meal1").name).toBe(
			"Desayuno: Avena",
		);
	});

	it("disposition update syncs library meal", () => {
		let state = scheduleLibraryMeal(baseState(), "meal1", "2026-09-05");
		const instanceId = state.calendars.m1["2026-09-05"][0].instanceId;
		state = applyMealSaveDisposition(state, {
			instanceId,
			payload: {
				name: "Desayuno: Avena nueva",
				mealType: "desayuno",
				ingredients: [{ name: "avena", quantity: "1 tza" }],
			},
			disposition: "update",
		});
		expect(state.mealLibrary.find((m) => m.id === "meal1").name).toBe(
			"Desayuno: Avena nueva",
		);
		expect(state.calendars.m1["2026-09-05"][0].mealId).toBe("meal1");
	});

	it("flavorText survives import → library → calendar", () => {
		const draft = draftFromDietJson(
			{
				days: [
					{
						meals: [
							{
								name: "Cena: Salmón",
								description: "  Hornear con limón.  ",
								ingredients: [{ name: "Salmón", quantity: "150g" }],
							},
						],
					},
				],
			},
			WEEK,
		);
		expect(draft.days[0].meals[0].flavorText).toBe("Hornear con limón.");
		expect(draft.days[0].meals[0]).not.toHaveProperty("description");

		const groups = uniqueDraftMealsForSave(draft);
		const { state, draft: linked } = applyLibrarySaveSelections(
			baseState(),
			draft,
			groups[0].tempIds,
		);
		const libraryMeal = state.mealLibrary.find((m) => m.name === "Cena: Salmón");
		expect(libraryMeal.flavorText).toBe("Hornear con limón.");

		const committed = commitWeekDraft(state, linked);
		expect(committed.calendars.m1["2026-08-31"][0].flavorText).toBe(
			"Hornear con limón.",
		);
	});
});
