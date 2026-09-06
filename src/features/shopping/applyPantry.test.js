import { describe, expect, it } from "vitest";
import {
	applyPantryToShoppingMap,
	formatShoppingQuantities,
	sumCompatibleQuantities,
} from "./applyPantry.js";

describe("sumCompatibleQuantities", () => {
	it("sums same unit", () => {
		expect(sumCompatibleQuantities(["1 tza", "1/2 tza"])).toEqual({
			amount: 1.5,
			unit: "tza",
			rawParts: [],
		});
	});

	it("keeps incompatible as raw parts", () => {
		const result = sumCompatibleQuantities(["100 g", "1 tza"]);
		expect(result.amount).toBeNull();
		expect(result.rawParts.length).toBe(2);
	});
});

describe("formatShoppingQuantities", () => {
	it("sums repeated compatible amounts for display", () => {
		expect(formatShoppingQuantities(["150 g", "150 g", "150 g"])).toBe(
			"450 g",
		);
		expect(
			formatShoppingQuantities(["1/2 taza", "1/2 taza", "1/2 taza"]),
		).toBe("1 1/2 taza");
	});

	it("returns empty for no quantities", () => {
		expect(formatShoppingQuantities([])).toBe("");
	});
});

describe("applyPantryToShoppingMap", () => {
	it("marks fully covered items", () => {
		const shopping = {
			jitomate: {
				name: "Jitomate",
				normalizedName: "jitomate",
				quantities: ["2 pza"],
				variations: ["jitomate"],
			},
		};
		const pantry = [
			{
				id: "p1",
				name: "jitomate",
				quantity: { amount: 3, unit: "pza", raw: "3 pza" },
				updatedAt: "",
			},
		];
		const next = applyPantryToShoppingMap(shopping, pantry);
		expect(next.jitomate.pantryCovered).toBe(true);
		expect(next.jitomate.inPantry).toBe(true);
	});

	it("subtracts partial pantry amounts", () => {
		const shopping = {
			arroz: {
				name: "Arroz",
				normalizedName: "arroz",
				quantities: ["2 tza"],
				variations: ["arroz"],
			},
		};
		const pantry = [
			{
				id: "p1",
				name: "arroz",
				quantity: { amount: 0.5, unit: "tza", raw: "1/2 tza" },
				updatedAt: "",
			},
		];
		const next = applyPantryToShoppingMap(shopping, pantry);
		expect(next.arroz.pantryCovered).toBe(false);
		expect(next.arroz.quantities[0]).toMatch(/1\.?5|1 1\/2/);
	});

	it("leaves extras untouched", () => {
		const shopping = {
			"extra:1": {
				name: "Servilletas",
				normalizedName: "servilletas",
				quantities: ["1 pza"],
				isExtra: true,
				extraId: "1",
			},
		};
		const pantry = [
			{
				id: "p1",
				name: "servilletas",
				quantity: { amount: 10, unit: "pza", raw: "10" },
				updatedAt: "",
			},
		];
		const next = applyPantryToShoppingMap(shopping, pantry);
		expect(next["extra:1"].inPantry).toBeUndefined();
	});
});
