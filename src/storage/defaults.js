import { createId } from "../domain/ids.js";
import { todayISO } from "../features/calendar/dateUtils.js";

const DEFAULT_MEMBER_COLOR = "#2F9E7B";

/**
 * @returns {import("../domain/types.js").DietAssistantStateV2}
 */
export function createEmptyState() {
	const memberId = createId();
	const now = new Date().toISOString();
	const today = todayISO();

	return {
		version: 2,
		household: {
			members: [
				{
					id: memberId,
					name: "Yo",
					color: DEFAULT_MEMBER_COLOR,
					createdAt: now,
				},
			],
			activeMemberId: memberId,
		},
		mealLibrary: [],
		dayTemplates: [],
		dietTemplates: [],
		calendars: { [memberId]: {} },
		weekPlans: { [memberId]: {} },
		pantry: [],
		shoppingExtras: [],
		checkedItems: {},
		mealPrep: {
			weekStartISO: today,
			selectedInstanceIds: [],
			unselectedVisible: true,
		},
		settings: {
			locale: "es",
			weekStartsOn: 1,
			calendarDefaultView: "month",
			currency: "MXN",
		},
		ui: {
			calendarCursorDate: today,
			calendarView: "month",
			onboardingDismissed: false,
			shoppingMemberIds: [memberId],
		},
		meta: {
			lastSavedAt: now,
		},
	};
}

/**
 * Soft validation of a v2 document root.
 * @param {unknown} state
 */
export function isValidV2State(state) {
	if (!state || typeof state !== "object") return false;
	const s = /** @type {Record<string, unknown>} */ (state);
	return (
		s.version === 2 &&
		s.household &&
		Array.isArray(s.mealLibrary) &&
		Array.isArray(s.dayTemplates) &&
		Array.isArray(s.dietTemplates) &&
		s.calendars &&
		typeof s.calendars === "object" &&
		s.settings &&
		s.ui &&
		s.meta
	);
}
