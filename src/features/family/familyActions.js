import { createId } from "../../domain/ids.js";
import { nextMemberColor } from "./memberColors.js";

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {{ name: string, color?: string }} payload
 */
export function addMember(state, { name, color }) {
	const trimmed = (name || "").trim();
	if (!trimmed) return state;

	const id = createId();
	const now = new Date().toISOString();
	const memberColor =
		color ||
		nextMemberColor(state.household.members.map((m) => m.color));

	const member = {
		id,
		name: trimmed,
		color: memberColor,
		createdAt: now,
	};

	return {
		...state,
		household: {
			...state.household,
			members: [...state.household.members, member],
		},
		calendars: {
			...state.calendars,
			[id]: {},
		},
	};
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} memberId
 * @param {{ name?: string, color?: string }} patch
 */
export function updateMember(state, memberId, patch) {
	const members = state.household.members.map((m) => {
		if (m.id !== memberId) return m;
		return {
			...m,
			...(patch.name != null ? { name: String(patch.name).trim() || m.name } : {}),
			...(patch.color != null ? { color: patch.color } : {}),
		};
	});
	return {
		...state,
		household: { ...state.household, members },
	};
}

/**
 * Remove a member and their calendar. Keeps at least one member.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} memberId
 */
export function removeMember(state, memberId) {
	if (state.household.members.length <= 1) return state;
	if (!state.household.members.some((m) => m.id === memberId)) return state;

	const members = state.household.members.filter((m) => m.id !== memberId);
	const { [memberId]: _removed, ...calendars } = state.calendars;
	const activeMemberId =
		state.household.activeMemberId === memberId
			? members[0].id
			: state.household.activeMemberId;

	const shoppingMemberIds = (
		state.ui.shoppingMemberIds || [activeMemberId]
	).filter((id) => id !== memberId);
	if (shoppingMemberIds.length === 0) {
		shoppingMemberIds.push(activeMemberId);
	}

	return {
		...state,
		household: { members, activeMemberId },
		calendars,
		ui: { ...state.ui, shoppingMemberIds },
	};
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} memberId
 */
export function setActiveMember(state, memberId) {
	if (!state.household.members.some((m) => m.id === memberId)) return state;
	if (state.household.activeMemberId === memberId) return state;
	return {
		...state,
		household: { ...state.household, activeMemberId: memberId },
		// Keep Compras aligned with the calendar profile you are viewing.
		// Multi-person shopping is re-selected on the Compras page when needed.
		ui: { ...state.ui, shoppingMemberIds: [memberId] },
	};
}

/**
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string[]} memberIds
 */
export function setShoppingMemberIds(state, memberIds) {
	const valid = new Set(state.household.members.map((m) => m.id));
	const next = [...new Set(memberIds)].filter((id) => valid.has(id));
	if (next.length === 0) {
		next.push(state.household.activeMemberId);
	}
	return {
		...state,
		ui: { ...state.ui, shoppingMemberIds: next },
	};
}
