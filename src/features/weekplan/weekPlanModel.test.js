import { describe, expect, it } from "vitest";
import {
	applyDayPlanToDate,
	applyWeekPlanToCalendar,
	copyWeekPlan,
	createDayPlan,
	createDraftMeal,
	createWeekPlan,
	dayPlansFromDietJson,
	defaultAssignment,
	getWeekPlan,
	saveWeekPlan,
	weekPlanExists,
	weekPlanHasContent,
} from "./weekPlanModel.js";

function baseState() {
	return {
		version: 2,
		household: {
			members: [{ id: "m1", name: "Yo", color: "#1f6f54", createdAt: "" }],
			activeMemberId: "m1",
		},
		mealLibrary: [],
		dayTemplates: [],
		dietTemplates: [],
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
			calendarView: "month",
			onboardingDismissed: true,
			shoppingMemberIds: ["m1"],
		},
		meta: { lastSavedAt: "" },
	};
}

describe("weekPlanModel", () => {
	it("saveWeekPlan stores by member and weekStartISO without touching calendar", () => {
		const dayPlans = [
			createDayPlan({
				name: "Día 1",
				meals: [
					createDraftMeal({
						name: "Desayuno: Avena",
						ingredients: [{ name: "Avena", quantity: "1/2 tza" }],
						source: "create",
					}),
				],
			}),
		];
		const next = saveWeekPlan(baseState(), "2026-08-31", dayPlans);
		expect(getWeekPlan(next, "2026-08-31")?.dayPlans).toHaveLength(1);
		expect(next.calendars.m1).toEqual({});
		expect(weekPlanHasContent(getWeekPlan(next, "2026-08-31"))).toBe(true);
	});

	it("dayPlansFromDietJson maps JSON days to slots", () => {
		const slots = dayPlansFromDietJson({
			days: [
				{
					name: "Día A",
					meals: [
						{
							name: "Lunch: Salad",
							ingredients: [{ name: "Lettuce", quantity: "1 cup" }],
						},
					],
				},
				{ name: "Día B", meals: [] },
			],
		});
		expect(slots).toHaveLength(2);
		expect(slots[0].name).toBe("Día A");
		expect(slots[0].meals[0].source).toBe("import");
		expect(slots[0].meals[0].mealType).toBe("comida");
	});

	it("copyWeekPlan deep-copies with new ids", () => {
		let state = saveWeekPlan(baseState(), "2026-08-31", [
			createDayPlan({
				name: "Día 1",
				meals: [
					createDraftMeal({
						name: "Cena: Pescado",
						ingredients: [{ name: "Salmón", quantity: "150g" }],
					}),
				],
			}),
		]);
		const from = getWeekPlan(state, "2026-08-31");
		state = copyWeekPlan(state, "2026-08-31", "2026-09-07");
		const to = getWeekPlan(state, "2026-09-07");
		expect(to.dayPlans[0].name).toBe("Día 1");
		expect(to.dayPlans[0].id).not.toBe(from.dayPlans[0].id);
		expect(to.dayPlans[0].meals[0].tempId).not.toBe(
			from.dayPlans[0].meals[0].tempId,
		);
		expect(to.dayPlans[0].meals[0].name).toBe("Cena: Pescado");
	});

	it("applyDayPlanToDate writes one day without clearing others", () => {
		const dayPlans = [
			createDayPlan({
				name: "Día 1",
				meals: [
					createDraftMeal({
						name: "Desayuno: Huevos",
						ingredients: [{ name: "Huevo", quantity: "2 pzas" }],
					}),
				],
			}),
			createDayPlan({
				name: "Día 2",
				meals: [
					createDraftMeal({
						name: "Comida: Sopa",
						ingredients: [{ name: "Caldo", quantity: "1 taza" }],
					}),
				],
			}),
		];
		let state = saveWeekPlan(baseState(), "2026-08-31", dayPlans);
		state = {
			...state,
			calendars: {
				m1: {
					"2026-09-01": [
						{
							instanceId: "keep",
							dateISO: "2026-09-01",
							memberId: "m1",
							name: "Existing",
							mealType: "otro",
							ingredients: [],
						},
					],
				},
			},
		};
		const plan = getWeekPlan(state, "2026-08-31");
		state = applyDayPlanToDate(
			state,
			"2026-08-31",
			plan.dayPlans[0].id,
			"2026-09-02",
		);
		expect(state.calendars.m1["2026-09-02"][0].name).toBe("Desayuno: Huevos");
		expect(state.calendars.m1["2026-09-01"][0].name).toBe("Existing");
		expect(state.ui.calendarCursorDate).toBe("2026-09-02");
	});

	it("applyWeekPlanToCalendar writes scheduled meals by assignment", () => {
		const dayPlans = [
			createDayPlan({
				name: "Día 1",
				meals: [
					createDraftMeal({
						name: "Desayuno: Huevos",
						ingredients: [{ name: "Huevo", quantity: "2 pzas" }],
					}),
				],
			}),
			createDayPlan({
				name: "Día 2",
				meals: [
					createDraftMeal({
						name: "Comida: Sopa",
						ingredients: [{ name: "Caldo", quantity: "1 taza" }],
					}),
				],
			}),
		];
		let state = saveWeekPlan(baseState(), "2026-08-31", dayPlans);
		const plan = getWeekPlan(state, "2026-08-31");
		const weekDates = [
			"2026-08-31",
			"2026-09-01",
			"2026-09-02",
			"2026-09-03",
			"2026-09-04",
			"2026-09-05",
			"2026-09-06",
		];
		const assignment = defaultAssignment(weekDates, plan.dayPlans);
		state = applyWeekPlanToCalendar(state, "2026-08-31", assignment);
		expect(state.calendars.m1["2026-08-31"][0].name).toBe("Desayuno: Huevos");
		expect(state.calendars.m1["2026-09-01"][0].name).toBe("Comida: Sopa");
		expect(state.calendars.m1["2026-09-02"]).toEqual([]);
		expect(state.ui.calendarView).toBe("week");
	});

	it("getWeekPlan finds plan via canonical week key", () => {
		let state = saveWeekPlan(baseState(), "2026-09-02", [
			createDayPlan({
				name: "Día 1",
				meals: [
					createDraftMeal({
						name: "Snack",
						ingredients: [{ name: "Nuts", quantity: "10" }],
					}),
				],
			}),
		]);
		// Saved under Monday 2026-08-31 (canonical for mid-week Wed)
		expect(getWeekPlan(state, "2026-08-31")?.dayPlans[0].name).toBe("Día 1");
		expect(getWeekPlan(state, "2026-09-05")?.dayPlans[0].name).toBe("Día 1");
		expect(weekPlanExists(getWeekPlan(state, "2026-09-03"))).toBe(true);
	});
});
