import { describe, expect, it } from "vitest";
import {
	backfillCalendarFlavorText,
	flavorTextFields,
	flavorTextFromMeal,
	normalizeFlavorText,
	resolveMealFlavorText,
} from "./flavorText.js";

describe("flavorText helpers", () => {
	it("normalizeFlavorText trims and omits empty values", () => {
		expect(normalizeFlavorText("  Hornear.  ")).toBe("Hornear.");
		expect(normalizeFlavorText("   ")).toBeUndefined();
		expect(normalizeFlavorText("")).toBeUndefined();
		expect(normalizeFlavorText(null)).toBeUndefined();
	});

	it("flavorTextFromMeal prefers flavorText over description", () => {
		expect(
			flavorTextFromMeal({
				flavorText: "Desde flavorText",
				description: "Desde description",
			}),
		).toBe("Desde flavorText");
		expect(flavorTextFromMeal({ description: "  Alias  " })).toBe("Alias");
		expect(flavorTextFields("")).toEqual({});
		expect(flavorTextFields("Notas")).toEqual({ flavorText: "Notas" });
	});

	it("resolveMealFlavorText falls back to the library meal", () => {
		expect(
			resolveMealFlavorText(
				{ mealId: "meal1" },
				[{ id: "meal1", flavorText: "Del recetario" }],
			),
		).toBe("Del recetario");
		expect(
			resolveMealFlavorText(
				{ mealId: "meal1", flavorText: "Del snapshot" },
				[{ id: "meal1", flavorText: "Del recetario" }],
			),
		).toBe("Del snapshot");
		expect(
			resolveMealFlavorText(
				{ name: "Comida: Filete" },
				[{ name: "Comida: Filete", flavorText: "Por nombre" }],
			),
		).toBe("Por nombre");
	});

	it("backfillCalendarFlavorText copies from library onto snapshots", () => {
		const next = backfillCalendarFlavorText({
			mealLibrary: [
				{ id: "meal1", name: "Comida: Filete", flavorText: "A la plancha." },
			],
			weekPlans: {},
			calendars: {
				m1: {
					"2026-09-07": [
						{
							instanceId: "i1",
							mealId: "meal1",
							name: "Comida: Filete",
							ingredients: [],
						},
					],
				},
			},
		});
		expect(next.calendars.m1["2026-09-07"][0].flavorText).toBe("A la plancha.");
	});
});
