import { describe, expect, it } from "vitest";
import { createDraftMeal } from "./weekDraft.js";
import {
	createDayPlan,
	fillEmptyWeekDays,
	getWeekPlan,
	nextDayPlanName,
	saveWeekPlan,
} from "./weekPlanModel.js";
import {
	countPrepSelectedInWeek,
	getWeekReadiness,
} from "./weekReadiness.js";

function baseState() {
	return {
		version: 2,
		household: {
			members: [{ id: "m1", name: "Yo", color: "#1f6f54", createdAt: "" }],
			activeMemberId: "m1",
		},
		mealLibrary: [],
		calendars: { m1: {} },
		weekPlans: {},
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
			calendarDefaultView: "month",
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

describe("fillEmptyWeekDays", () => {
	it("round-robins day plans onto empty days only", () => {
		const dayA = createDayPlan({
			name: "Menú A",
			meals: [
				createDraftMeal({
					name: "Avena",
					ingredients: [{ name: "Avena", quantity: "1 tza" }],
					source: "create",
				}),
			],
		});
		const dayB = createDayPlan({
			name: "Menú B",
			meals: [
				createDraftMeal({
					name: "Huevos",
					ingredients: [{ name: "Huevo", quantity: "2 pza" }],
					source: "create",
				}),
			],
		});
		let state = saveWeekPlan(baseState(), "2026-08-31", [dayA, dayB]);
		state = {
			...state,
			calendars: {
				m1: {
					"2026-08-31": [
						{
							instanceId: "keep",
							dateISO: "2026-08-31",
							memberId: "m1",
							mealId: null,
							name: "Existing",
							mealType: "desayuno",
							ingredients: [],
						},
					],
				},
			},
		};

		const { state: next, assignedCount } = fillEmptyWeekDays(
			state,
			"2026-08-31",
			"m1",
			1,
		);
		expect(assignedCount).toBe(6);
		expect(next.calendars.m1["2026-08-31"][0].instanceId).toBe("keep");
		expect(next.calendars.m1["2026-09-01"][0].name).toBe("Avena");
		expect(next.calendars.m1["2026-09-02"][0].name).toBe("Huevos");
		expect(getWeekPlan(next, "2026-08-31").assignments["2026-09-01"]).toBe(
			dayA.id,
		);
	});

	it("returns zero when no day plans have meals", () => {
		const state = saveWeekPlan(baseState(), "2026-08-31", [
			createDayPlan({ name: "Vacío", meals: [] }),
		]);
		const result = fillEmptyWeekDays(state, "2026-08-31");
		expect(result.assignedCount).toBe(0);
		expect(result.state.calendars.m1).toEqual({});
	});
});

describe("getWeekReadiness", () => {
	it("marks Armar incomplete until day plans have meals", () => {
		const readiness = getWeekReadiness(baseState(), "2026-08-31");
		expect(readiness.hasPlans).toBe(false);
		expect(readiness.steps[0].done).toBe(false);
		expect(readiness.currentStepId).toBe("plans");
		expect(readiness.canFillEmpty).toBe(false);
	});

	it("exposes fill when plans exist and days are empty", () => {
		const dayA = createDayPlan({
			name: "Menú A",
			meals: [
				createDraftMeal({
					name: "Avena",
					ingredients: [{ name: "Avena", quantity: "1 tza" }],
					source: "create",
				}),
			],
		});
		const state = saveWeekPlan(baseState(), "2026-08-31", [dayA]);
		const readiness = getWeekReadiness(state, "2026-08-31", {
			shoppingUncheckedCount: 0,
			prepSelectedCount: 0,
		});
		expect(readiness.hasPlans).toBe(true);
		expect(readiness.canFillEmpty).toBe(true);
		expect(readiness.steps[0].done).toBe(true);
		expect(readiness.currentStepId).toBe("assign");
		expect(readiness.libraryThin).toBe(true);
	});

	it("treats Comprar and Preparar as parallel after assignment", () => {
		const dayA = createDayPlan({
			name: "Menú A",
			meals: [
				createDraftMeal({
					name: "Avena",
					ingredients: [{ name: "Avena", quantity: "1 tza" }],
					source: "create",
				}),
			],
		});
		let state = saveWeekPlan(baseState(), "2026-08-31", [dayA]);
		const { state: filled } = fillEmptyWeekDays(state, "2026-08-31", "m1", 1);
		const readiness = getWeekReadiness(filled, "2026-08-31", {
			shoppingUncheckedCount: 5,
			prepSelectedCount: 0,
		});
		expect(readiness.currentStepId).toBe(null);
		expect(readiness.steps.find((s) => s.id === "shop")).toMatchObject({
			available: true,
			done: false,
		});
		expect(readiness.steps.find((s) => s.id === "prep")).toMatchObject({
			available: true,
			done: false,
		});
	});
});

describe("nextDayPlanName", () => {
	it("skips used Menú letters", () => {
		expect(nextDayPlanName([])).toBe("Menú A");
		expect(nextDayPlanName([{ name: "Menú A" }])).toBe("Menú B");
	});
});

describe("countPrepSelectedInWeek", () => {
	it("counts only instances in the week", () => {
		const state = {
			...baseState(),
			calendars: {
				m1: {
					"2026-08-31": [{ instanceId: "a", name: "A", ingredients: [] }],
					"2026-09-01": [{ instanceId: "b", name: "B", ingredients: [] }],
				},
			},
			mealPrep: {
				weekStartISO: "2026-08-31",
				selectedInstanceIds: ["a", "other"],
				unselectedVisible: true,
			},
		};
		expect(countPrepSelectedInWeek(state, "2026-08-31")).toBe(1);
	});
});
