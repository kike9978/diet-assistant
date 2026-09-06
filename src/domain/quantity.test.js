import { describe, expect, it } from "vitest";
import { parseQuantity, formatQuantity } from "./quantity.js";

describe("parseQuantity", () => {
	it("parses simple amounts with units", () => {
		expect(parseQuantity("150g")).toEqual({
			amount: 150,
			unit: "g",
			raw: "150g",
		});
		expect(parseQuantity("1 tza")).toEqual({
			amount: 1,
			unit: "tza",
			raw: "1 tza",
		});
	});

	it("parses fractions", () => {
		expect(parseQuantity("1/2 tza")).toEqual({
			amount: 0.5,
			unit: "tza",
			raw: "1/2 tza",
		});
	});

	it("parses mixed numbers", () => {
		expect(parseQuantity("1 1/2 tza")).toEqual({
			amount: 1.5,
			unit: "tza",
			raw: "1 1/2 tza",
		});
	});

	it("handles special cases", () => {
		expect(parseQuantity("al gusto")).toEqual({
			amount: null,
			unit: "al gusto",
			raw: "al gusto",
		});
		expect(parseQuantity("c.s.")).toEqual({
			amount: null,
			unit: "al gusto",
			raw: "c.s.",
		});
		expect(parseQuantity("to taste")).toEqual({
			amount: null,
			unit: "al gusto",
			raw: "to taste",
		});
		expect(parseQuantity("opcional")).toEqual({
			amount: null,
			unit: "opcional",
			raw: "opcional",
		});
		expect(parseQuantity("optional")).toEqual({
			amount: null,
			unit: "opcional",
			raw: "optional",
		});
	});

	it("normalizes un puñado as misc", () => {
		expect(parseQuantity("un puñado")).toEqual({
			amount: null,
			unit: "puñado",
			raw: "un puñado",
		});
	});

	it("returns null amount for unparsed text", () => {
		const q = parseQuantity("según se necesite");
		expect(q.amount).toBeNull();
		expect(q.raw).toBe("según se necesite");
	});
});

describe("formatQuantity", () => {
	it("formats common fractions", () => {
		expect(formatQuantity({ amount: 0.5, unit: "tza", raw: "1/2 tza" })).toBe(
			"1/2 tza",
		);
	});

	it("falls back to raw when amount is null", () => {
		expect(
			formatQuantity({ amount: null, unit: "al gusto", raw: "al gusto" }),
		).toBe("al gusto");
	});
});
