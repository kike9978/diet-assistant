import { describe, expect, it } from "vitest";
import { matchYieldConversion } from "../../data/yieldConversions.js";
import { convertYield } from "../tools/yieldConvert.js";
import { ingredientChecklistKey } from "./checklistKeys.js";
import {
	applyShoppingItemSubstitution,
	boughtQuantity,
	clearShoppingProgressForMeals,
	convertQuantityString,
	lineCheckState,
	remainingQuantity,
	revertAppliedYieldConversions,
	shoppingLineView,
	toggleLineCheck,
	toggleSourceCheck,
} from "./shoppingProgress.js";
import {
	buildShoppingMap,
	groupIngredientsByCategory,
} from "./buildShoppingList.js";

const avenaItem = {
	name: "Avena",
	normalizedName: "avena",
	quantities: ["1 1/2 tza"],
	variations: ["avena cocida"],
	sources: [
		{
			key: "src:m1:i1",
			instanceId: "m1",
			ingredientId: "i1",
			memberId: "mem1",
			dayKey: "monday",
			mealName: "Avena cocida",
			ingredientName: "avena cocida",
			quantity: "1 tza",
		},
		{
			key: "src:m2:i2",
			instanceId: "m2",
			ingredientId: "i2",
			memberId: "mem1",
			dayKey: "thursday",
			mealName: "Overnight oats",
			ingredientName: "avena",
			quantity: "1/2 tza",
		},
	],
};

describe("matchYieldConversion + convert", () => {
	it("matches avena and converts 1.5 tza cooked to raw", () => {
		const food = matchYieldConversion("Avena");
		expect(food?.id).toBe("avena");
		expect(convertYield(1.5, food.rawToCooked, "cookedToRaw")).toBe(0.63);
		expect(
			convertQuantityString("1 1/2 tza", food, "cookedToRaw"),
		).toMatch(/tza/);
	});

	it("matches arroz and prefers integral when named", () => {
		expect(matchYieldConversion("arroz")?.id).toBe("arroz-blanco");
		expect(matchYieldConversion("arroz integral")?.id).toBe("arroz-integral");
	});
});

describe("buildShoppingMap sources", () => {
	it("attaches instance and ingredient ids", () => {
		const map = buildShoppingMap({
			monday: [
				{
					instanceId: "inst1",
					mealId: "meal1",
					memberId: "m1",
					name: "Desayuno",
					ingredients: [
						{ id: "ing1", name: "Avena", quantity: "1 tza" },
					],
				},
			],
		});
		expect(map.avena.sources).toHaveLength(1);
		expect(map.avena.sources[0]).toMatchObject({
			key: "src:inst1:ing1",
			instanceId: "inst1",
			ingredientId: "ing1",
			dayKey: "monday",
		});
	});
});

describe("groupIngredientsByCategory", () => {
	it("sorts items alphabetically within each category", () => {
		const grouped = groupIngredientsByCategory({
			yogur: { name: "Yogur griego", quantities: ["1 taza"] },
			pechuga: { name: "Pechuga de pollo", quantities: ["800 g"] },
			claras: { name: "Claras de huevo", quantities: ["22 piezas"] },
			huevos: { name: "Huevos", quantities: ["12 piezas"] },
		});
		expect(
			grouped["Alimentos de origen animal"].map((item) => item.name),
		).toEqual([
			"Claras de huevo",
			"Huevos",
			"Pechuga de pollo",
			"Yogur griego",
		]);
	});
});

describe("partial source selection + override", () => {
	it("buy qty is the sum of checked sources", () => {
		const remaining = remainingQuantity(avenaItem, {
			sourceChecks: { "src:m1:i1": true },
		});
		expect(remaining).toBe("1 tza");
		expect(
			lineCheckState(avenaItem, {}, { "src:m1:i1": true }),
		).toBe("mixed");
	});

	it("two of three checked sources sum together", () => {
		const pollo = {
			name: "Pechuga de pollo",
			normalizedName: "pechuga de pollo",
			quantities: ["200 g", "200 g", "200 g"],
			sources: [
				{ key: "src:d", quantity: "200 g", dayKey: "sunday", mealName: "Comida" },
				{ key: "src:l", quantity: "200 g", dayKey: "monday", mealName: "Comida" },
				{ key: "src:m", quantity: "200 g", dayKey: "tuesday", mealName: "Comida" },
			],
		};
		expect(
			remainingQuantity(pollo, {
				sourceChecks: { "src:l": true, "src:m": true },
			}),
		).toBe("400 g");
	});

	it("override wins over source remaining", () => {
		expect(
			remainingQuantity(avenaItem, {
				override: "1 tza",
				sourceChecks: { "src:m1:i1": true },
			}),
		).toBe("1 tza");
	});

	it("checking every source clears selection back to full plan (not bought)", () => {
		let state = {
			checkedItems: {},
			shoppingSourceChecks: { "src:m1:i1": true },
		};
		state = toggleSourceCheck(state, avenaItem, "src:m2:i2");
		expect(state.checkedItems[ingredientChecklistKey("avena")]).toBeUndefined();
		expect(state.shoppingSourceChecks["src:m1:i1"]).toBeUndefined();
		expect(state.shoppingSourceChecks["src:m2:i2"]).toBeUndefined();
		expect(
			lineCheckState(avenaItem, state.checkedItems, state.shoppingSourceChecks),
		).toBe("unchecked");
		expect(remainingQuantity(avenaItem, { sourceChecks: state.shoppingSourceChecks })).toBe(
			"1 1/2 tza",
		);
	});

	it("unchecking one source from a full line keeps the others included", () => {
		let state = toggleLineCheck(
			{ checkedItems: {}, shoppingSourceChecks: {} },
			avenaItem,
		);
		expect(lineCheckState(avenaItem, state.checkedItems, state.shoppingSourceChecks)).toBe(
			"checked",
		);
		state = toggleSourceCheck(state, avenaItem, "src:m1:i1");
		expect(
			lineCheckState(avenaItem, state.checkedItems, state.shoppingSourceChecks),
		).toBe("mixed");
		expect(
			remainingQuantity(avenaItem, {
				sourceChecks: state.shoppingSourceChecks,
				checkedItems: state.checkedItems,
			}),
		).toBe("1/2 tza");
	});

	it("bought qty uses checked sources when mixed", () => {
		expect(
			boughtQuantity(avenaItem, {
				sourceChecks: { "src:m1:i1": true },
				checkedItems: {},
			}),
		).toBe("1 tza");
	});

	it("defaults to raw: buy the plan amount and show cooked yield", () => {
		const view = shoppingLineView(avenaItem, {});
		expect(view.yieldEntry?.id).toBe("avena");
		expect(view.yieldMode).toBe("rawToCooked");
		expect(view.convertedQty).toBeTruthy();
		expect(view.displayQty).toBe("1 1/2 tza");
	});

	it("shows raw buy qty only after the user marks the plan amount as cooked", () => {
		const view = shoppingLineView(avenaItem, {
			yieldModes: { [ingredientChecklistKey("avena")]: "cookedToRaw" },
		});
		expect(view.yieldMode).toBe("cookedToRaw");
		expect(view.convertedQty).toBeTruthy();
		expect(view.displayQty).toBe(view.convertedQty);
		expect(view.chip?.type).toBe("crudo");
	});

	it("does not convert an override a second time", () => {
		const key = ingredientChecklistKey("avena");
		const view = shoppingLineView(avenaItem, {
			overrides: { [key]: "3 tza" },
			yieldModes: { [key]: "cookedToRaw" },
		});
		expect(view.displayQty).toBe("3 tza");
		expect(view.remainingQty).toBe("3 tza");
		expect(view.convertedQty).not.toBe("3 tza");
	});

	it("mixed + cooked converts the sum of included sources", () => {
		const pollo = {
			name: "Pechuga de pollo",
			normalizedName: "pechuga de pollo",
			quantities: ["200 g", "200 g", "200 g"],
			variations: ["pechuga de pollo"],
			sources: [
				{ key: "src:d", quantity: "200 g" },
				{ key: "src:l", quantity: "200 g" },
				{ key: "src:m", quantity: "200 g" },
			],
		};
		const key = ingredientChecklistKey("pechuga de pollo");
		const view = shoppingLineView(pollo, {
			sourceChecks: { "src:l": true, "src:m": true },
			yieldModes: { [key]: "cookedToRaw" },
		});
		expect(view.planRemainingQty).toBe("400 g");
		expect(view.displayQty).toBe(view.convertedQty);
		expect(view.chip).toEqual({ type: "remaining", remaining: 2, total: 3 });
	});
});

describe("applyShoppingItemSubstitution", () => {
	it("renames the ingredient on every source meal and keeps quantities", () => {
		const state = {
			household: { activeMemberId: "mem1", members: [{ id: "mem1" }] },
			mealLibrary: [],
			calendars: {
				mem1: {
					"2026-09-07": [
						{
							instanceId: "m1",
							mealId: null,
							name: "Avena cocida",
							ingredients: [
								{
									id: "i1",
									name: "avena cocida",
									quantity: { amount: 1, unit: "tza", raw: "1 tza" },
								},
							],
						},
					],
					"2026-09-10": [
						{
							instanceId: "m2",
							mealId: null,
							name: "Overnight oats",
							ingredients: [
								{
									id: "i2",
									name: "avena",
									quantity: { amount: 0.5, unit: "tza", raw: "1/2 tza" },
								},
							],
						},
					],
				},
			},
			checkedItems: {},
			shoppingSourceChecks: {},
			shoppingQtyOverrides: {},
			shoppingYieldMode: {},
		};

		const next = applyShoppingItemSubstitution(state, {
			sources: avenaItem.sources,
			replacementName: "quinoa",
			item: avenaItem,
		});

		expect(next.calendars.mem1["2026-09-07"][0].ingredients[0].name).toBe(
			"quinoa",
		);
		expect(next.calendars.mem1["2026-09-07"][0].ingredients[0].quantity.amount).toBe(
			1,
		);
		expect(next.calendars.mem1["2026-09-10"][0].ingredients[0].name).toBe(
			"quinoa",
		);
		expect(next.calendars.mem1["2026-09-10"][0].ingredients[0].quantity.amount).toBe(
			0.5,
		);
	});

	it("can set a new quantity and add extra replacement ingredients", () => {
		const state = {
			household: { activeMemberId: "mem1", members: [{ id: "mem1" }] },
			mealLibrary: [],
			calendars: {
				mem1: {
					"2026-09-07": [
						{
							instanceId: "m1",
							ingredients: [
								{
									id: "i1",
									name: "salmón",
									quantity: { amount: 150, unit: "g", raw: "150 g" },
								},
								{
									id: "side",
									name: "brócoli",
									quantity: { amount: 1, unit: "tza", raw: "1 tza" },
								},
							],
						},
					],
				},
			},
			checkedItems: {},
			shoppingSourceChecks: {},
			shoppingQtyOverrides: {},
			shoppingYieldMode: {},
		};

		const next = applyShoppingItemSubstitution(state, {
			sources: [
				{
					key: "src:m1:i1",
					instanceId: "m1",
					ingredientId: "i1",
					memberId: "mem1",
				},
			],
			replacements: [
				{ name: "trucha", quantity: "180 g" },
				{ name: "limón", quantity: "1 pza" },
			],
		});

		const ings = next.calendars.mem1["2026-09-07"][0].ingredients;
		expect(ings.map((i) => i.name)).toEqual(["trucha", "limón", "brócoli"]);
		expect(ings[0].quantity.amount).toBe(180);
		expect(ings[1].quantity.amount).toBe(1);
	});
});

describe("revertAppliedYieldConversions", () => {
	it("restores meal quantities and keeps yield as shopping-only cooked state", () => {
		const lineKey = ingredientChecklistKey("pollo");
		const polloItem = {
			name: "Pollo",
			normalizedName: "pollo",
			quantities: ["266.67 g", "133.33 g"],
			sources: [
				{
					key: "src:m1:i1",
					instanceId: "m1",
					ingredientId: "i1",
					memberId: "mem1",
					quantity: "266.67 g",
				},
				{
					key: "src:m2:i2",
					instanceId: "m2",
					ingredientId: "i2",
					memberId: "mem1",
					quantity: "133.33 g",
				},
			],
		};
		const state = {
			household: { activeMemberId: "mem1", members: [{ id: "mem1" }] },
			calendars: {
				mem1: {
					"2026-09-07": [
						{
							instanceId: "m1",
							ingredients: [
								{
									id: "i1",
									name: "pollo",
									quantity: { amount: 266.67, unit: "g", raw: "" },
								},
							],
						},
					],
					"2026-09-08": [
						{
							instanceId: "m2",
							ingredients: [
								{
									id: "i2",
									name: "pollo",
									quantity: { amount: 133.33, unit: "g", raw: "" },
								},
							],
						},
					],
				},
			},
			shoppingYieldMode: { [lineKey]: "applied" },
		};

		const next = revertAppliedYieldConversions(state, [polloItem]);
		expect(next.calendars.mem1["2026-09-07"][0].ingredients[0].quantity.amount).toBe(
			200,
		);
		expect(next.calendars.mem1["2026-09-08"][0].ingredients[0].quantity.amount).toBe(
			100,
		);
		expect(next.shoppingYieldMode[lineKey]).toBe("cookedToRaw");
	});
});

describe("clearShoppingProgressForMeals", () => {
	it("clears overrides, yield modes, checks, source checks, and fusions", () => {
		const lineKey = ingredientChecklistKey("pollo deshebrado");
		const otherKey = ingredientChecklistKey("arroz");
		const fusionId = "fuse-1";
		const meals = [
			{
				instanceId: "inst-pollo",
				ingredients: [
					{ id: "ing1", name: "Pollo deshebrado" },
					{ id: "ing2", name: "aceite" },
				],
			},
		];
		const state = {
			checkedItems: {
				[lineKey]: true,
				[otherKey]: true,
				[`fuse:${fusionId}`]: true,
			},
			shoppingSourceChecks: {
				"src:inst-pollo:ing1": true,
				"src:other:x": true,
			},
			shoppingQtyOverrides: {
				[lineKey]: "900 g",
				[otherKey]: "2 tza",
			},
			shoppingYieldMode: {
				[lineKey]: "cookedToRaw",
				[otherKey]: "rawToCooked",
			},
			shoppingFusions: [
				{ id: fusionId, memberKeys: [lineKey, otherKey] },
				{ id: "fuse-keep", memberKeys: [otherKey, ingredientChecklistKey("frijol")] },
			],
		};

		const next = clearShoppingProgressForMeals(state, meals);

		expect(next.shoppingQtyOverrides[lineKey]).toBeUndefined();
		expect(next.shoppingQtyOverrides[otherKey]).toBe("2 tza");
		expect(next.shoppingYieldMode[lineKey]).toBeUndefined();
		expect(next.shoppingYieldMode[otherKey]).toBe("rawToCooked");
		expect(next.checkedItems[lineKey]).toBeUndefined();
		expect(next.checkedItems[otherKey]).toBe(true);
		expect(next.checkedItems[`fuse:${fusionId}`]).toBeUndefined();
		expect(next.shoppingSourceChecks["src:inst-pollo:ing1"]).toBeUndefined();
		expect(next.shoppingSourceChecks["src:other:x"]).toBe(true);
		expect(next.shoppingFusions.map((f) => f.id)).toEqual(["fuse-keep"]);
		expect(next.shoppingQtyOverrides[ingredientChecklistKey("aceite")]).toBeUndefined();
	});
});
