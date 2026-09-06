import { describe, expect, it } from "vitest";
import {
	addMember,
	removeMember,
	setActiveMember,
	setShoppingMemberIds,
} from "./familyActions.js";

function baseState() {
	return {
		household: {
			members: [{ id: "m1", name: "Yo", color: "#2F9E7B", createdAt: "" }],
			activeMemberId: "m1",
		},
		calendars: { m1: {} },
		ui: { shoppingMemberIds: ["m1"] },
	};
}

describe("familyActions", () => {
	it("adds a member with calendar but does not auto-include in shopping", () => {
		const next = addMember(baseState(), { name: "Ana" });
		expect(next.household.members).toHaveLength(2);
		const ana = next.household.members[1];
		expect(ana.name).toBe("Ana");
		expect(next.calendars[ana.id]).toEqual({});
		expect(next.ui.shoppingMemberIds).toEqual(["m1"]);
		expect(next.ui.shoppingMemberIds).not.toContain(ana.id);
	});

	it("does not remove the last member", () => {
		const state = baseState();
		expect(removeMember(state, "m1")).toBe(state);
	});

	it("switches active when removing active member", () => {
		let state = addMember(baseState(), { name: "Ana" });
		const anaId = state.household.members[1].id;
		state = setShoppingMemberIds(state, ["m1", anaId]);
		state = setActiveMember(state, anaId);
		state = removeMember(state, anaId);
		expect(state.household.activeMemberId).toBe("m1");
		expect(state.household.members).toHaveLength(1);
	});

	it("setActiveMember aligns shopping members to the active profile", () => {
		let state = addMember(baseState(), { name: "Ana" });
		const anaId = state.household.members[1].id;
		state = setShoppingMemberIds(state, ["m1", anaId]);
		state = setActiveMember(state, anaId);
		expect(state.household.activeMemberId).toBe(anaId);
		expect(state.ui.shoppingMemberIds).toEqual([anaId]);
	});

	it("setShoppingMemberIds keeps at least one valid id", () => {
		const state = baseState();
		const next = setShoppingMemberIds(state, ["nope"]);
		expect(next.ui.shoppingMemberIds).toEqual(["m1"]);
	});
});
