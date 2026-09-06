import { syncAllWeekPlanAssignmentsFromCalendar } from "../features/weekplan/weekPlanModel.js";
import { backfillCalendarFlavorText } from "../features/meals/flavorText.js";
import { normalizeMealIcon } from "../features/meals/mealIconCatalog.js";
import { isValidV2State, createEmptyState } from "./defaults.js";
import {
	clearLegacyKeys,
	migrateV1toV2,
	readLegacyFromStorage,
} from "./migrate.js";

export const STORAGE_KEY_V2 = "dietAssistant:v2";
export const STORAGE_KEY_V1_BACKUP = "dietAssistant:v1-backup";

const SAVE_DEBOUNCE_MS = 200;

let saveTimer = null;

function safeParse(raw) {
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

/**
 * Snapshot selected legacy keys for backup.
 * @param {Storage} storage
 */
function snapshotV1(storage) {
	const keys = [
		"dietPlan",
		"weekPlan",
		"currentPlanId",
		"pinnedPlans",
		"checkedItems",
		"mealPrepSelectedMeals",
		"mealPrepUnselectedVisible",
	];
	/** @type {Record<string, unknown>} */
	const snap = {};
	for (const key of keys) {
		const raw = storage.getItem(key);
		if (raw != null) {
			const parsed = safeParse(raw);
			snap[key] = parsed !== null ? parsed : raw;
		}
	}
	return snap;
}

/**
 * Soft-normalize older v2 documents (fill missing Phase 3 fields).
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 */
export function normalizeV2State(state) {
	const members = state.household?.members || [];
	const activeMemberId =
		state.household?.activeMemberId || members[0]?.id || null;
	let shoppingMemberIds = state.ui?.shoppingMemberIds;
	if (!Array.isArray(shoppingMemberIds) || shoppingMemberIds.length === 0) {
		shoppingMemberIds = activeMemberId ? [activeMemberId] : [];
	} else {
		const valid = new Set(members.map((m) => m.id));
		shoppingMemberIds = shoppingMemberIds.filter((id) => valid.has(id));
		if (shoppingMemberIds.length === 0 && activeMemberId) {
			shoppingMemberIds = [activeMemberId];
		}
	}

	const calendars = { ...(state.calendars || {}) };
	for (const m of members) {
		if (!calendars[m.id]) calendars[m.id] = {};
	}

	const weekPlans = { ...(state.weekPlans || {}) };
	for (const m of members) {
		if (!weekPlans[m.id] || typeof weekPlans[m.id] !== "object") {
			weekPlans[m.id] = {};
		}
	}

	const mealLibrary = (state.mealLibrary || []).map((meal) => {
		const next =
			meal?.source === "template" ? { ...meal, source: "import" } : { ...meal };
		return { ...next, icon: normalizeMealIcon(next.icon) };
	});

	const next = {
		...state,
		mealLibrary,
		pantry: Array.isArray(state.pantry) ? state.pantry : [],
		shoppingExtras: Array.isArray(state.shoppingExtras)
			? state.shoppingExtras
			: [],
		shoppingFusions: Array.isArray(state.shoppingFusions)
			? state.shoppingFusions
			: [],
		shoppingSourceChecks:
			state.shoppingSourceChecks &&
			typeof state.shoppingSourceChecks === "object"
				? state.shoppingSourceChecks
				: {},
		shoppingQtyOverrides:
			state.shoppingQtyOverrides &&
			typeof state.shoppingQtyOverrides === "object"
				? state.shoppingQtyOverrides
				: {},
		shoppingYieldMode:
			state.shoppingYieldMode && typeof state.shoppingYieldMode === "object"
				? state.shoppingYieldMode
				: {},
		calendars,
		weekPlans,
		ui: {
			...state.ui,
			shoppingMemberIds,
		},
	};
	delete next.dayTemplates;
	delete next.dietTemplates;
	// Calendar days are whole day-plan materializations — heal missing assignments.
	return syncAllWeekPlanAssignmentsFromCalendar(
		backfillCalendarFlavorText(next),
	);
}

/**
 * Load v2 state. One-shot migrate from legacy keys if needed.
 * @param {Storage} [storage]
 * @returns {import("../domain/types.js").DietAssistantStateV2}
 */
export function loadState(storage = localStorage) {
	const existing = safeParse(storage.getItem(STORAGE_KEY_V2));
	if (isValidV2State(existing)) {
		return normalizeV2State(
			/** @type {import("../domain/types.js").DietAssistantStateV2} */ (
				existing
			),
		);
	}

	const { hasAny, legacy } = readLegacyFromStorage(storage);
	if (hasAny) {
		const migrated = normalizeV2State(migrateV1toV2(legacy));
		try {
			storage.setItem(STORAGE_KEY_V1_BACKUP, JSON.stringify(snapshotV1(storage)));
		} catch (err) {
			console.warn("Could not write v1 backup:", err);
		}
		saveStateImmediate(migrated, storage);
		clearLegacyKeys(storage);
		return migrated;
	}

	const empty = createEmptyState();
	saveStateImmediate(empty, storage);
	return empty;
}

/**
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 * @param {Storage} [storage]
 */
export function saveStateImmediate(state, storage = localStorage) {
	const next = {
		...state,
		meta: {
			...state.meta,
			lastSavedAt: new Date().toISOString(),
		},
	};
	try {
		storage.setItem(STORAGE_KEY_V2, JSON.stringify(next));
	} catch (err) {
		console.error("Failed to save dietAssistant:v2", err);
	}
	return next;
}

/**
 * Debounced save; sets meta.lastSavedAt on flush.
 * @param {import("../domain/types.js").DietAssistantStateV2} state
 * @param {Storage} [storage]
 */
export function saveState(state, storage = localStorage) {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveStateImmediate(state, storage);
		saveTimer = null;
	}, SAVE_DEBOUNCE_MS);
}

/**
 * Export full state JSON string (Phase 4 polish; available early for backup).
 */
export function exportState(state) {
	return JSON.stringify(state, null, 2);
}

/**
 * @param {string} json
 * @returns {import("../domain/types.js").DietAssistantStateV2}
 */
export function importState(json) {
	const parsed = typeof json === "string" ? JSON.parse(json) : json;
	if (!isValidV2State(parsed)) {
		throw new Error("Invalid DietAssistantStateV2 document");
	}
	return normalizeV2State(
		/** @type {import("../domain/types.js").DietAssistantStateV2} */ (parsed),
	);
}
