import { describe, expect, it } from "vitest";
import { normalizeMealIcon } from "./mealIconCatalog.js";
import { resolveMealIcon, suggestGlyph } from "./mealGlyph.js";

describe("suggestGlyph", () => {
	it("matches English and Spanish keywords", () => {
		expect(suggestGlyph("Breakfast: Oatmeal with Fruits")).toBe("wheat");
		expect(suggestGlyph("Desayuno: Avena con frutas")).toBe("wheat");
		expect(suggestGlyph("Lunch: Chicken Salad")).toBe("salad");
		expect(suggestGlyph("Comida: Ensalada de pollo")).toBe("salad");
		expect(suggestGlyph("Dinner: Salmon with Vegetables")).toBe("fish");
		expect(suggestGlyph("Cena: Salmón con verduras")).toBe("fish");
		expect(suggestGlyph("Avocado Toast")).toBe("sandwich");
		expect(suggestGlyph("Quinoa Bowl")).toBe("wheat");
		expect(suggestGlyph("Turkey")).toBe("drumstick");
	});

	it("falls back to meal type", () => {
		expect(suggestGlyph("Mystery plate", "desayuno")).toBe("coffee");
		expect(suggestGlyph("Mystery plate", "cena")).toBe("soup");
		expect(suggestGlyph("Mystery plate", "otro")).toBe("leaf");
		expect(suggestGlyph("", "unknown")).toBe("leaf");
	});
});

describe("resolveMealIcon", () => {
	it("uses a stored catalog key", () => {
		expect(
			resolveMealIcon({
				name: "Oatmeal",
				mealType: "desayuno",
				icon: "fish",
			}),
		).toBe("fish");
	});

	it("falls back for missing or unknown keys", () => {
		expect(
			resolveMealIcon({ name: "Oatmeal", mealType: "desayuno" }),
		).toBe("wheat");
		expect(
			resolveMealIcon({
				name: "Mystery",
				mealType: "cena",
				icon: "not-a-real-icon",
			}),
		).toBe("soup");
		expect(normalizeMealIcon("not-a-real-icon")).toBeNull();
		expect(normalizeMealIcon(null)).toBeNull();
	});
});
