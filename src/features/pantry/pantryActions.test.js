import { describe, expect, it } from "vitest";
import {
	finishShoppingToPantry,
	quantityForPantryStock,
} from "./pantryActions.js";
import { ingredientChecklistKey } from "../shopping/checklistKeys.js";

function baseState() {
	return {
		pantry: [],
		shoppingExtras: [
			{
				id: "e1",
				name: "Servilletas",
				quantity: { amount: 1, unit: "pza", raw: "1 pza" },
				createdAt: "",
			},
		],
		checkedItems: {
			[ingredientChecklistKey("jitomate")]: true,
			"extra:e1": true,
		},
	};
}

describe("quantityForPantryStock", () => {
	it("sums compatible quantities", () => {
		expect(quantityForPantryStock({ quantities: ["1 tza", "1/2 tza"] })).toBe(
			"1 1/2 tza",
		);
	});

	it("sums cup with taza", () => {
		expect(
			quantityForPantryStock({ quantities: ["1 taza", "1/2 cup"] }),
		).toBe("1 1/2 taza");
	});

	it("falls back when empty", () => {
		expect(quantityForPantryStock({ quantities: [] })).toBe("1 pza");
	});
});

describe("finishShoppingToPantry", () => {
	it("stocks pantry from checked items and clears checks", () => {
		const { state, addedCount } = finishShoppingToPantry(baseState(), [
			{
				name: "Jitomate",
				normalizedName: "jitomate",
				quantities: ["2 pza"],
				category: "Verduras",
			},
			{
				name: "Servilletas",
				quantities: ["1 pza"],
				isExtra: true,
				extraId: "e1",
			},
		]);

		expect(addedCount).toBe(2);
		expect(state.pantry).toHaveLength(2);
		expect(state.pantry.map((p) => p.name)).toEqual(
			expect.arrayContaining(["Jitomate", "Servilletas"]),
		);
		expect(state.checkedItems[ingredientChecklistKey("jitomate")]).toBeUndefined();
		expect(state.checkedItems["extra:e1"]).toBeUndefined();
		expect(state.shoppingExtras).toHaveLength(0);
	});

	it("skips pantry-covered lines", () => {
		const { state, addedCount } = finishShoppingToPantry(baseState(), [
			{
				name: "Arroz",
				quantities: ["1 tza"],
				pantryCovered: true,
			},
		]);
		expect(addedCount).toBe(0);
		expect(state.pantry).toHaveLength(0);
	});
});
