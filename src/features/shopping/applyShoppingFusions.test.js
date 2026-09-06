import { describe, expect, it } from "vitest";
import {
	applyShoppingFusions,
	createShoppingFusion,
	expandFusedShoppingItem,
	shoppingItemChecklistKey,
} from "./applyShoppingFusions.js";
import { ingredientChecklistKey } from "./checklistKeys.js";

describe("applyShoppingFusions", () => {
	const salmon = {
		name: "Salmón",
		normalizedName: "salmon",
		quantities: ["450 g"],
		variations: ["salmón"],
		category: "Proteínas",
	};
	const egg = {
		name: "Huevo",
		normalizedName: "huevo",
		quantities: ["2 pzas"],
		variations: ["huevo"],
		category: "Proteínas",
	};

	it("merges names with commas and concatenates quantities", () => {
		const list = { salmon, huevo: egg };
		const fusion = createShoppingFusion([
			ingredientChecklistKey("salmon"),
			ingredientChecklistKey("huevo"),
		]);
		const next = applyShoppingFusions(list, [fusion]);
		const fused = Object.values(next).find((i) => i.isFused);
		expect(fused).toBeTruthy();
		expect(fused.name).toBe("Salmón, Huevo");
		expect(fused.quantities).toEqual(["450 g", "2 pzas"]);
		expect(fused.fusedMembers).toHaveLength(2);
		expect(Object.keys(next)).toHaveLength(1);
	});

	it("skips incomplete fusions so members stay visible", () => {
		const list = { salmon };
		const fusion = {
			id: "f1",
			memberKeys: [
				ingredientChecklistKey("salmon"),
				ingredientChecklistKey("huevo"),
			],
		};
		const next = applyShoppingFusions(list, [fusion]);
		expect(next.salmon).toEqual(salmon);
		expect(Object.values(next).some((i) => i.isFused)).toBe(false);
	});

	it("expands fused items for pantry", () => {
		const fused = {
			isFused: true,
			fusionId: "f1",
			name: "Salmón, Huevo",
			fusedMembers: [salmon, egg],
		};
		expect(expandFusedShoppingItem(fused)).toEqual([salmon, egg]);
		expect(shoppingItemChecklistKey(fused)).toBe("fuse:f1");
	});
});
