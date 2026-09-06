import { describe, expect, it } from "vitest";
import { createDraftMeal } from "./weekDraft.js";
import {
	applyDayPlanToDate,
	applyWeekPlanToCalendar,
	clearDayPlanAssignment,
	copyWeekPlan,
	createDayPlan,
	createWeekPlan,
	dayPlansFromDietJson,
	defaultAssignment,
	getWeekPlan,
	matchDayPlanForMeals,
	resolveDayPlanForDate,
	saveWeekPlan,
	syncWeekPlanAssignmentsFromCalendar,
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
	it("saveWeekPlan stores by member and weekStartISO", () => {
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
		expect(getWeekPlan(state, "2026-08-31").assignments["2026-09-02"]).toBe(
			plan.dayPlans[0].id,
		);
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
		const saved = getWeekPlan(state, "2026-08-31");
		expect(saved.assignments["2026-08-31"]).toBe(plan.dayPlans[0].id);
		expect(saved.assignments["2026-09-01"]).toBe(plan.dayPlans[1].id);
		expect(saved.assignments["2026-09-02"]).toBeUndefined();
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

	it("matchDayPlanForMeals finds the day plan by meal names", () => {
		const dayPlans = [
			createDayPlan({
				name: "Día 1",
				meals: [
					createDraftMeal({
						name: "Desayuno: Pan con aguacate",
						ingredients: [{ name: "Pan", quantity: "2" }],
					}),
					createDraftMeal({
						name: "Comida: Bowl de quinoa",
						ingredients: [{ name: "Quinoa", quantity: "1 taza" }],
					}),
				],
			}),
			createDayPlan({
				name: "Día 2",
				meals: [
					createDraftMeal({
						name: "Cena: Pescado",
						ingredients: [{ name: "Pescado", quantity: "150g" }],
					}),
				],
			}),
		];
		const matched = matchDayPlanForMeals(dayPlans, [
			{ name: "Comida: Bowl de quinoa", mealId: null },
			{ name: "Desayuno: Pan con aguacate", mealId: null },
		]);
		expect(matched?.name).toBe("Día 1");
		expect(matchDayPlanForMeals(dayPlans, [{ name: "Other" }])).toBeNull();
		expect(matchDayPlanForMeals(dayPlans, [])).toBeNull();
	});

	it("matchDayPlanForMeals matches when only one side has mealId", () => {
		const dayPlans = [
			createDayPlan({
				name: "Día 1",
				meals: [
					createDraftMeal({
						name: "Desayuno: Huevos",
						mealId: "lib-1",
						ingredients: [{ name: "Huevo", quantity: "2" }],
					}),
				],
			}),
		];
		expect(
			matchDayPlanForMeals(dayPlans, [
				{ name: "Desayuno: Huevos", mealId: null },
			])?.name,
		).toBe("Día 1");
	});

	it("resolveDayPlanForDate prefers stored assignment over meal matching", () => {
		const dayPlans = [
			createDayPlan({
				name: "Día A",
				meals: [
					createDraftMeal({
						name: "A",
						ingredients: [{ name: "x", quantity: "1" }],
					}),
				],
			}),
			createDayPlan({
				name: "Día B",
				meals: [
					createDraftMeal({
						name: "B",
						ingredients: [{ name: "y", quantity: "1" }],
					}),
				],
			}),
		];
		let state = saveWeekPlan(baseState(), "2026-08-31", dayPlans);
		const plan = getWeekPlan(state, "2026-08-31");
		state = applyDayPlanToDate(
			state,
			"2026-08-31",
			plan.dayPlans[1].id,
			"2026-09-01",
		);
		const resolved = resolveDayPlanForDate(
			getWeekPlan(state, "2026-08-31"),
			"2026-09-01",
			[{ name: "A", mealId: null }],
		);
		expect(resolved?.name).toBe("Día B");

		state = clearDayPlanAssignment(state, "2026-09-01");
		expect(
			resolveDayPlanForDate(getWeekPlan(state, "2026-08-31"), "2026-09-01", [
				{ name: "B", mealId: null },
			])?.name,
		).toBe("Día B");
	});

	it("syncWeekPlanAssignmentsFromCalendar rebuilds day plans from calendar meals", () => {
		const memberId = "m1";
		let state = baseState();
		state = {
			...state,
			calendars: {
				[memberId]: {
					"2026-08-31": [
						{
							instanceId: "i1",
							dateISO: "2026-08-31",
							memberId,
							mealId: null,
							name: "Desayuno: A",
							mealType: "desayuno",
							ingredients: [],
						},
						{
							instanceId: "i2",
							dateISO: "2026-08-31",
							memberId,
							mealId: null,
							name: "Cena: B",
							mealType: "cena",
							ingredients: [],
						},
					],
					"2026-09-01": [
						{
							instanceId: "i3",
							dateISO: "2026-09-01",
							memberId,
							mealId: null,
							name: "Desayuno: A",
							mealType: "desayuno",
							ingredients: [],
						},
						{
							instanceId: "i4",
							dateISO: "2026-09-01",
							memberId,
							mealId: null,
							name: "Cena: B",
							mealType: "cena",
							ingredients: [],
						},
					],
					"2026-09-02": [
						{
							instanceId: "i5",
							dateISO: "2026-09-02",
							memberId,
							mealId: null,
							name: "Comida: C",
							mealType: "comida",
							ingredients: [],
						},
					],
				},
			},
			weekPlans: {
				[memberId]: {
					"2026-08-31": createWeekPlan("2026-08-31", memberId, [
						createDayPlan({ name: "Vacío", meals: [] }),
					]),
				},
			},
		};

		state = syncWeekPlanAssignmentsFromCalendar(state, "2026-08-31");
		const plan = getWeekPlan(state, "2026-08-31");
		// Keeps empty stub + creates slots for unmatched calendar meal sets
		expect(plan.dayPlans.length).toBeGreaterThanOrEqual(2);
		expect(plan.assignments["2026-08-31"]).toBe(plan.assignments["2026-09-01"]);
		expect(plan.assignments["2026-09-02"]).toBeTruthy();
		expect(plan.assignments["2026-08-31"]).not.toBe(
			plan.assignments["2026-09-02"],
		);
		expect(
			resolveDayPlanForDate(
				plan,
				"2026-08-31",
				state.calendars[memberId]["2026-08-31"],
			)?.name,
		).toMatch(/^Día /);
	});

	it("saveWeekPlan removing a day plan clears its assigned calendar days", () => {
		const dayA = createDayPlan({
			name: "Día A",
			meals: [
				createDraftMeal({
					name: "A",
					ingredients: [{ name: "x", quantity: "1" }],
				}),
			],
		});
		const dayB = createDayPlan({
			name: "Día B",
			meals: [
				createDraftMeal({
					name: "B",
					ingredients: [{ name: "y", quantity: "1" }],
				}),
			],
		});
		let state = saveWeekPlan(baseState(), "2026-08-31", [dayA, dayB]);
		state = applyDayPlanToDate(state, "2026-08-31", dayA.id, "2026-08-31");
		state = applyDayPlanToDate(state, "2026-08-31", dayB.id, "2026-09-01");
		expect(state.calendars.m1["2026-08-31"]).toHaveLength(1);
		expect(state.calendars.m1["2026-09-01"]).toHaveLength(1);

		state = saveWeekPlan(state, "2026-08-31", [dayB]);
		const plan = getWeekPlan(state, "2026-08-31");
		expect(plan.dayPlans).toHaveLength(1);
		expect(plan.dayPlans[0].id).toBe(dayB.id);
		expect(plan.assignments["2026-08-31"]).toBeUndefined();
		expect(plan.assignments["2026-09-01"]).toBe(dayB.id);
		expect(state.calendars.m1["2026-08-31"]).toEqual([]);
		expect(state.calendars.m1["2026-09-01"]).toHaveLength(1);

		// Heal must not resurrect the removed day plan
		state = syncWeekPlanAssignmentsFromCalendar(state, "2026-08-31");
		expect(getWeekPlan(state, "2026-08-31").dayPlans.map((dp) => dp.id)).toEqual([
			dayB.id,
		]);
	});

	it("clearing day plan assignment drops shopping-only progress for that day", () => {
		const dayA = createDayPlan({
			name: "Día A",
			meals: [
				createDraftMeal({
					name: "Pollo",
					ingredients: [{ name: "Pollo deshebrado", quantity: "920 g" }],
				}),
			],
		});
		let state = saveWeekPlan(baseState(), "2026-08-31", [dayA]);
		state = applyDayPlanToDate(state, "2026-08-31", dayA.id, "2026-08-31");
		const meal = state.calendars.m1["2026-08-31"][0];
		const lineKey = `ing:pollo deshebrado`;
		state = {
			...state,
			shoppingQtyOverrides: { [lineKey]: "900 g" },
			shoppingYieldMode: { [lineKey]: "cookedToRaw" },
			shoppingSourceChecks: {
				[`src:${meal.instanceId}:${meal.ingredients[0].id}`]: true,
			},
			checkedItems: { [lineKey]: true },
		};

		state = clearDayPlanAssignment(state, "2026-08-31");
		expect(getWeekPlan(state, "2026-08-31").assignments["2026-08-31"]).toBeUndefined();
		expect(state.calendars.m1["2026-08-31"]).toHaveLength(1);
		expect(state.shoppingQtyOverrides[lineKey]).toBeUndefined();
		expect(state.shoppingYieldMode[lineKey]).toBeUndefined();
		expect(state.checkedItems[lineKey]).toBeUndefined();
		expect(
			state.shoppingSourceChecks[
				`src:${meal.instanceId}:${meal.ingredients[0].id}`
			],
		).toBeUndefined();
	});

	it("removing an assigned day plan clears shopping overrides for its meals", () => {
		const dayA = createDayPlan({
			name: "Día A",
			meals: [
				createDraftMeal({
					name: "Pollo",
					ingredients: [{ name: "Pollo deshebrado", quantity: "920 g" }],
				}),
			],
		});
		const dayB = createDayPlan({
			name: "Día B",
			meals: [
				createDraftMeal({
					name: "Arroz",
					ingredients: [{ name: "Arroz", quantity: "1 tza" }],
				}),
			],
		});
		let state = saveWeekPlan(baseState(), "2026-08-31", [dayA, dayB]);
		state = applyDayPlanToDate(state, "2026-08-31", dayA.id, "2026-08-31");
		state = applyDayPlanToDate(state, "2026-08-31", dayB.id, "2026-09-01");
		const polloKey = "ing:pollo deshebrado";
		const arrozKey = "ing:arroz";
		state = {
			...state,
			shoppingQtyOverrides: { [polloKey]: "900 g", [arrozKey]: "2 tza" },
			shoppingYieldMode: { [polloKey]: "cookedToRaw" },
		};

		state = saveWeekPlan(state, "2026-08-31", [dayB]);
		expect(state.shoppingQtyOverrides[polloKey]).toBeUndefined();
		expect(state.shoppingYieldMode[polloKey]).toBeUndefined();
		expect(state.shoppingQtyOverrides[arrozKey]).toBe("2 tza");
	});
});
