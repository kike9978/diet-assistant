import { describe, expect, it } from "vitest";
import { remapCheckedItems, ingredientChecklistKey } from "./checklistKeys.js";

describe("remapCheckedItems", () => {
	it("remaps category:name keys to ing:{normalized}", () => {
		const legacy = {
			"Verduras:tomate": true,
			"Frutas:manzana": true,
		};
		const next = remapCheckedItems(legacy);
		expect(next[ingredientChecklistKey("tomate")]).toBe(true);
		expect(next[ingredientChecklistKey("manzana")]).toBe(true);
		expect(next["Verduras:tomate"]).toBeUndefined();
	});

	it("remaps bare name keys from buggy check-all", () => {
		const legacy = { Tomate: true };
		const next = remapCheckedItems(legacy);
		expect(next["ing:tomate"]).toBe(true);
	});

	it("keeps already-stable keys", () => {
		const legacy = { "ing:pollo": true, "extra:abc": true };
		expect(remapCheckedItems(legacy)).toEqual(legacy);
	});

	it("drops falsy entries", () => {
		expect(remapCheckedItems({ "Verduras:ajo": false })).toEqual({});
	});
});
