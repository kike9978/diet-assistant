import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/v1-golden.json";
import { migrateV1toV2 } from "./migrate.js";
import { ingredientChecklistKey } from "../features/shopping/checklistKeys.js";
import { weekdayKeysToDateISO } from "../features/calendar/dateUtils.js";

describe("migrateV1toV2 golden fixture", () => {
	it("produces a valid v2 document with library, templates, calendar, and remapped checks", () => {
		const state = migrateV1toV2(fixture);

		expect(state.version).toBe(2);
		expect(state.meta.migratedFrom).toBe("v1");
		expect(state.household.members).toHaveLength(1);
		expect(state.household.members[0].name).toBe("Yo");

		expect(state.mealLibrary.length).toBeGreaterThanOrEqual(2);
		expect(state.dietTemplates.length).toBeGreaterThanOrEqual(2);
		expect(state.dayTemplates.length).toBeGreaterThanOrEqual(2);

		const memberId = state.household.activeMemberId;
		const cal = state.calendars[memberId];
		expect(cal).toBeTruthy();

		const dates = weekdayKeysToDateISO(new Date(), 1);
		expect(cal[dates.monday]?.length).toBe(1);
		expect(cal[dates.monday][0].name).toContain("Avena");
		expect(cal[dates.monday][0].instanceId).toBeTruthy();
		expect(cal[dates.tuesday]?.length).toBe(1);

		expect(state.checkedItems[ingredientChecklistKey("tomate")]).toBe(true);
		expect(state.checkedItems[ingredientChecklistKey("Avena")]).toBe(true);
		expect(state.checkedItems["ing:already"]).toBe(true);
		expect(state.checkedItems["Verduras:tomate"]).toBeUndefined();

		const desayuno = state.mealLibrary.find((m) => m.name.includes("Avena"));
		expect(desayuno.mealType).toBe("desayuno");
		expect(desayuno.ingredients[0].quantity.amount).toBe(0.5);
		expect(desayuno.ingredients[0].quantity.unit).toBe("tza");
	});
});
