import { describe, expect, it } from "vitest";
import {
	calendarsToShoppingWeekPlan,
	calendarsToWeekPlan,
} from "./weekBridge.js";

function baseState(overrides = {}) {
	return {
		version: 2,
		household: {
			members: [{ id: "m1", name: "Yo", color: "#1f6f54", createdAt: "" }],
			activeMemberId: "m1",
		},
		mealLibrary: [],
		calendars: {
			m1: {
				"2026-08-31": [
					{
						instanceId: "orphan-1",
						mealId: null,
						name: "Atún bowl",
						ingredients: [
							{ id: "i1", name: "Atún", quantity: { amount: 1, unit: "lata", raw: "1 lata" } },
						],
					},
				],
			},
		},
		weekPlans: { m1: {} },
		pantry: [],
		shoppingExtras: [],
		settings: {
			locale: "es",
			weekStartsOn: 1,
			calendarDefaultView: "week",
		},
		ui: {
			calendarCursorDate: "2026-08-31",
			calendarView: "week",
			onboardingDismissed: true,
			shoppingMemberIds: ["m1"],
		},
		...overrides,
	};
}

describe("calendarsToShoppingWeekPlan", () => {
	it("excludes orphan calendar meals when there is no week plan", () => {
		const plan = calendarsToShoppingWeekPlan(baseState());
		expect(plan.monday).toEqual([]);
		expect(Object.values(plan).flat()).toEqual([]);
	});

	it("excludes meals on days without a day-plan assignment", () => {
		const state = baseState({
			weekPlans: {
				m1: {
					"2026-08-31": {
						weekStartISO: "2026-08-31",
						memberId: "m1",
						dayPlans: [
							{
								id: "dp1",
								name: "Día 1",
								meals: [{ tempId: "t1", name: "Atún bowl", mealId: null }],
							},
						],
						assignments: {},
						updatedAt: "",
					},
				},
			},
		});
		const plan = calendarsToShoppingWeekPlan(state);
		expect(plan.monday).toEqual([]);
	});

	it("includes meals only on assigned days", () => {
		const state = baseState({
			weekPlans: {
				m1: {
					"2026-08-31": {
						weekStartISO: "2026-08-31",
						memberId: "m1",
						dayPlans: [
							{
								id: "dp1",
								name: "Día 1",
								meals: [{ tempId: "t1", name: "Atún bowl", mealId: null }],
							},
						],
						assignments: { "2026-08-31": "dp1" },
						updatedAt: "",
					},
				},
			},
		});
		const plan = calendarsToShoppingWeekPlan(state);
		expect(plan.monday).toHaveLength(1);
		expect(plan.monday[0].name).toBe("Atún bowl");
	});

	it("calendarsToWeekPlan without requireAssignment still shows orphan meals", () => {
		const plan = calendarsToWeekPlan(baseState());
		expect(plan.monday).toHaveLength(1);
	});
});
