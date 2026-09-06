import { describe, expect, it } from "vitest";
import { convertYield, roundYield } from "./yieldConvert.js";

describe("convertYield", () => {
	it("converts raw rice to cooked", () => {
		expect(convertYield(100, 3, "rawToCooked")).toBe(300);
	});

	it("converts cooked chicken to raw", () => {
		expect(convertYield(150, 0.75, "cookedToRaw")).toBe(200);
	});

	it("rejects invalid inputs", () => {
		expect(convertYield(-1, 3, "rawToCooked")).toBeNull();
		expect(convertYield(100, 0, "rawToCooked")).toBeNull();
		expect(convertYield(NaN, 3, "rawToCooked")).toBeNull();
	});

	it("rounds to 2 decimals", () => {
		expect(roundYield(33.333)).toBe(33.33);
	});
});
