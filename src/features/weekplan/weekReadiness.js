import { weekDateISOs } from "../calendar/dateUtils.js";
import {
	getWeekPlan,
	weekPlanHasContent,
} from "./weekPlanModel.js";

/**
 * @typedef {{
 *   id: "plans" | "assign" | "shop" | "prep",
 *   done: boolean,
 *   available: boolean,
 *   href: string,
 *   assignedDays?: number,
 *   totalDays?: number,
 * }} WeekReadinessStep
 *
 * @typedef {{
 *   weekStartISO: string,
 *   hasPlans: boolean,
 *   assignedDays: number,
 *   totalDays: number,
 *   emptyDays: number,
 *   canFillEmpty: boolean,
 *   assignablePlanCount: number,
 *   libraryThin: boolean,
 *   steps: WeekReadinessStep[],
 *   currentStepId: WeekReadinessStep["id"] | null,
 * }} WeekReadiness
 */

/**
 * Pure week-loop readiness for the calendar command center.
 *
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} weekStartISO
 * @param {{
 *   weekStartsOn?: number,
 *   memberId?: string,
 *   shoppingUncheckedCount?: number,
 *   prepSelectedCount?: number,
 * }} [opts]
 * @returns {WeekReadiness}
 */
export function getWeekReadiness(state, weekStartISO, opts = {}) {
	const weekStartsOn = opts.weekStartsOn ?? state.settings.weekStartsOn ?? 1;
	const memberId = opts.memberId ?? state.household.activeMemberId;
	const plan = getWeekPlan(state, weekStartISO, memberId);
	const hasPlans = weekPlanHasContent(plan);
	const assignablePlanCount = (plan?.dayPlans || []).filter(
		(dp) => (dp.meals || []).length > 0,
	).length;
	const dates = weekDateISOs(weekStartISO, weekStartsOn);
	const cal = state.calendars[memberId] || {};
	const assignedDays = dates.filter((d) => (cal[d] || []).length > 0).length;
	const emptyDays = dates.length - assignedDays;
	const canFillEmpty = assignablePlanCount > 0 && emptyDays > 0;
	const libraryThin = (state.mealLibrary || []).length < 3;

	const planHref = `/plan/week?week=${encodeURIComponent(weekStartISO)}`;
	const assignDone = assignedDays === dates.length && dates.length > 0;
	const assignAvailable = hasPlans;
	const shopAvailable = assignedDays > 0;
	const unchecked =
		typeof opts.shoppingUncheckedCount === "number"
			? opts.shoppingUncheckedCount
			: null;
	const shopDone =
		shopAvailable && unchecked !== null ? unchecked === 0 : false;
	const prepAvailable = assignedDays > 0;
	const prepSelected =
		typeof opts.prepSelectedCount === "number" ? opts.prepSelectedCount : 0;
	const prepDone = prepAvailable && prepSelected > 0;

	/** @type {WeekReadinessStep[]} */
	const steps = [
		{
			id: "plans",
			done: hasPlans,
			available: true,
			href: planHref,
		},
		{
			id: "assign",
			done: assignDone,
			available: assignAvailable,
			href: "/",
			assignedDays,
			totalDays: dates.length,
		},
		{
			id: "shop",
			done: shopDone,
			available: shopAvailable,
			href: "/shopping",
		},
		{
			id: "prep",
			done: prepDone,
			available: prepAvailable,
			href: "/prep",
		},
	];

	// Exclusive “current” only for Armar → Asignar. Comprar and Preparar are
	// parallel once any day is assigned — shopping does not gate prep.
	/** @type {WeekReadinessStep["id"] | null} */
	let currentStepId = null;
	if (!hasPlans) currentStepId = "plans";
	else if (!assignDone) currentStepId = "assign";

	return {
		weekStartISO,
		hasPlans,
		assignedDays,
		totalDays: dates.length,
		emptyDays,
		canFillEmpty,
		assignablePlanCount,
		libraryThin,
		steps,
		currentStepId,
	};
}

/**
 * Count prep selections that belong to this week’s calendar instances.
 * @param {import("../../domain/types.js").DietAssistantStateV2} state
 * @param {string} weekStartISO
 * @param {{ weekStartsOn?: number, memberId?: string }} [opts]
 */
export function countPrepSelectedInWeek(state, weekStartISO, opts = {}) {
	const weekStartsOn = opts.weekStartsOn ?? state.settings.weekStartsOn ?? 1;
	const memberId = opts.memberId ?? state.household.activeMemberId;
	const cal = state.calendars[memberId] || {};
	const valid = new Set();
	for (const dateISO of weekDateISOs(weekStartISO, weekStartsOn)) {
		for (const meal of cal[dateISO] || []) {
			if (meal.instanceId) valid.add(meal.instanceId);
		}
	}
	return (state.mealPrep?.selectedInstanceIds || []).filter((id) =>
		valid.has(id),
	).length;
}
