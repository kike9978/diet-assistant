import { describe, expect, it } from "vitest";
import {
	addDays,
	addMonths,
	monthGridWeeks,
	orderedWeekdayKeys,
	retentionCutoffISO,
	startOfWeek,
	toDateISO,
	weekDateISOs,
} from "./dateUtils.js";

describe("dateUtils", () => {
	it("startOfWeek defaults to Monday", () => {
		// 2026-09-05 is Saturday
		const start = startOfWeek("2026-09-05", 1);
		expect(toDateISO(start)).toBe("2026-08-31");
	});

	it("weekDateISOs returns 7 consecutive days", () => {
		const week = weekDateISOs("2026-09-05", 1);
		expect(week).toHaveLength(7);
		expect(week[0]).toBe("2026-08-31");
		expect(week[6]).toBe("2026-09-06");
	});

	it("weekStartsOn Sunday shifts columns", () => {
		const week = weekDateISOs("2026-09-05", 0);
		expect(week[0]).toBe("2026-08-30");
	});

	it("addDays and addMonths", () => {
		expect(addDays("2026-09-05", 3)).toBe("2026-09-08");
		expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
	});

	it("monthGridWeeks is rectangular and includes adjacent months", () => {
		const weeks = monthGridWeeks("2026-09-15", 1);
		expect(weeks.length).toBeGreaterThanOrEqual(5);
		expect(weeks.every((w) => w.length === 7)).toBe(true);
		expect(weeks.flat()).toContain("2026-09-01");
		expect(weeks.flat()).toContain("2026-09-30");
	});

	it("orderedWeekdayKeys respects weekStartsOn", () => {
		expect(orderedWeekdayKeys(1)[0]).toBe("monday");
		expect(orderedWeekdayKeys(0)[0]).toBe("sunday");
	});

	it("retentionCutoffISO goes back keepMonths", () => {
		expect(retentionCutoffISO("2026-09-05", 4)).toBe("2026-05-01");
	});
});
