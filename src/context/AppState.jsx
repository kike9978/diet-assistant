import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { createId } from "../domain/ids.js";
import { ingredientFromLegacy } from "../domain/ingredient.js";
import { inferMealType } from "../domain/mealType.js";
import { parseQuantity } from "../domain/quantity.js";
import {
	applyIngredientSubstitution,
	applyMealSaveDisposition as applyMealSaveDispositionInState,
	buildLibraryMeal,
	clearCalendarDay as clearCalendarDayInState,
	moveScheduledMeal as moveScheduledMealInState,
	prunePastCalendarDays,
	removeScheduledMeal as removeScheduledMealInState,
	replaceScheduledMeal as replaceScheduledMealInState,
	scheduleLibraryMeal as scheduleLibraryMealInState,
	updateScheduledMeal as updateScheduledMealInState,
} from "../features/calendar/calendarActions.js";
import { todayISO, weekDateISOs } from "../features/calendar/dateUtils.js";
import {
	applyLibrarySaveSelections,
	commitWeekDraft,
} from "../features/weekplan/weekDraft.js";
import {
	applyLibrarySaveToDayPlans,
	applyDayPlanToDate as applyDayPlanToDateInState,
	applyWeekPlanToCalendar as applyWeekPlanToCalendarInState,
	clearDayPlanAssignment as clearDayPlanAssignmentInState,
	copyWeekPlan as copyWeekPlanInState,
	getWeekPlan as getWeekPlanFromState,
	listWeekPlans as listWeekPlansFromState,
	saveWeekPlan as saveWeekPlanInState,
} from "../features/weekplan/weekPlanModel.js";
import { loadState, saveState, saveStateImmediate } from "../storage/loadSave.js";
import {
	addMember as addMemberInState,
	removeMember as removeMemberInState,
	setActiveMember as setActiveMemberInState,
	setShoppingMemberIds as setShoppingMemberIdsInState,
	updateMember as updateMemberInState,
} from "../features/family/familyActions.js";
import {
	addPantryItem as addPantryItemInState,
	finishShoppingToPantry as finishShoppingToPantryInState,
	removePantryItem as removePantryItemInState,
	updatePantryItem as updatePantryItemInState,
	upsertPantryFromShopping as upsertPantryFromShoppingInState,
} from "../features/pantry/pantryActions.js";
import {
	applyWeekPlanToState,
	calendarsToShoppingWeekPlan,
	calendarsToWeekPlan,
	dietTemplatesToLegacyDietPlan,
	importDietPlanIntoState,
} from "../storage/weekBridge.js";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
	const [state, setState] = useState(() => loadState());

	useEffect(() => {
		saveState(state);
	}, [state]);

	const updateState = useCallback((updater) => {
		setState((prev) => {
			const next = typeof updater === "function" ? updater(prev) : updater;
			return next;
		});
	}, []);

	const setWeekPlan = useCallback((weekPlanOrUpdater) => {
		setState((prev) => {
			const current = calendarsToWeekPlan(prev);
			const nextWeek =
				typeof weekPlanOrUpdater === "function"
					? weekPlanOrUpdater(current)
					: weekPlanOrUpdater;
			return applyWeekPlanToState(prev, nextWeek);
		});
	}, []);

	const importDietPlan = useCallback((dietPlan, name) => {
		setState((prev) => importDietPlanIntoState(prev, dietPlan, name));
	}, []);

	const loadDietTemplate = useCallback((_templateId) => {}, []);

	const createMealAndSchedule = useCallback(
		({ name, ingredients, dateISO, mealType, servings, schedule = true }) => {
			const now = new Date().toISOString();
			const mealId = createId();
			const date = dateISO || todayISO();
			const type = mealType || inferMealType(name);
			const structuredIngredients = (ingredients || []).map((ing) =>
				ingredientFromLegacy({
					name: ing.name,
					quantity: ing.quantity,
				}),
			);

			setState((prev) => {
				const memberId = prev.household.activeMemberId;
				const meal = {
					id: mealId,
					name,
					mealType: type,
					ingredients: structuredIngredients,
					tags: [],
					servings: servings ?? 1,
					source: "user",
					createdAt: now,
					updatedAt: now,
				};

				let calendars = prev.calendars;
				if (schedule) {
					const scheduled = {
						instanceId: createId(),
						dateISO: date,
						memberId,
						mealId,
						name,
						mealType: type,
						ingredients: structuredIngredients.map((i) => ({
							...i,
							id: createId(),
						})),
					};
					const memberCal = { ...(prev.calendars[memberId] || {}) };
					memberCal[date] = [...(memberCal[date] || []), scheduled];
					calendars = { ...prev.calendars, [memberId]: memberCal };
				}

				return {
					...prev,
					mealLibrary: [...prev.mealLibrary, meal],
					calendars,
					ui: {
						...prev.ui,
						calendarCursorDate: schedule ? date : prev.ui.calendarCursorDate,
						onboardingDismissed: true,
					},
				};
			});

			return mealId;
		},
		[],
	);

	const createMeal = useCallback((payload) => {
		const meal = buildLibraryMeal(payload);
		setState((prev) => ({
			...prev,
			mealLibrary: [...prev.mealLibrary, meal],
			ui: { ...prev.ui, onboardingDismissed: true },
		}));
		return meal.id;
	}, []);

	const updateMeal = useCallback((mealId, payload) => {
		setState((prev) => {
			const existing = prev.mealLibrary.find((m) => m.id === mealId);
			if (!existing) return prev;
			const updated = buildLibraryMeal(payload, existing);
			return {
				...prev,
				mealLibrary: prev.mealLibrary.map((m) =>
					m.id === mealId ? updated : m,
				),
			};
		});
	}, []);

	const deleteMeal = useCallback((mealId) => {
		setState((prev) => {
			const inUse = Object.values(prev.calendars || {}).some((days) =>
				Object.values(days || {}).some((meals) =>
					(meals || []).some((m) => m.mealId === mealId),
				),
			);
			if (inUse) {
				// Soft-delete from library only; scheduled snapshots stay.
			}
			return {
				...prev,
				mealLibrary: prev.mealLibrary.filter((m) => m.id !== mealId),
				dayTemplates: prev.dayTemplates.map((dt) => ({
					...dt,
					mealIds: (dt.mealIds || []).filter((id) => id !== mealId),
				})),
			};
		});
	}, []);

	const setCheckedItems = useCallback((checkedOrUpdater) => {
		setState((prev) => {
			const nextChecked =
				typeof checkedOrUpdater === "function"
					? checkedOrUpdater(prev.checkedItems)
					: checkedOrUpdater;
			return { ...prev, checkedItems: nextChecked };
		});
	}, []);

	const fuseShoppingItems = useCallback((memberKeys) => {
		const unique = [...new Set((memberKeys || []).filter(Boolean))];
		if (unique.length < 2) return;
		setState((prev) => {
			const fusion = {
				id: createId(),
				memberKeys: unique,
			};
			const checked = { ...(prev.checkedItems || {}) };
			const allChecked = unique.every((k) => checked[k]);
			for (const k of unique) {
				delete checked[k];
			}
			if (allChecked) {
				checked[`fuse:${fusion.id}`] = true;
			}
			return {
				...prev,
				shoppingFusions: [...(prev.shoppingFusions || []), fusion],
				checkedItems: checked,
			};
		});
	}, []);

	const unfuseShoppingItem = useCallback((fusionId) => {
		if (!fusionId) return;
		setState((prev) => {
			const checked = { ...(prev.checkedItems || {}) };
			delete checked[`fuse:${fusionId}`];
			return {
				...prev,
				shoppingFusions: (prev.shoppingFusions || []).filter(
					(f) => f.id !== fusionId,
				),
				checkedItems: checked,
			};
		});
	}, []);

	const addShoppingExtra = useCallback(({ name, quantity, category, note }) => {
		setState((prev) => {
			const extra = {
				id: createId(),
				name,
				quantity: parseQuantity(quantity),
				category,
				...(note ? { note } : {}),
				createdAt: new Date().toISOString(),
			};
			return {
				...prev,
				shoppingExtras: [...prev.shoppingExtras, extra],
			};
		});
	}, []);

	const updateShoppingExtra = useCallback((id, patch) => {
		setState((prev) => ({
			...prev,
			shoppingExtras: prev.shoppingExtras.map((e) => {
				if (e.id !== id) return e;
				return {
					...e,
					...(patch.name != null
						? { name: String(patch.name).trim() || e.name }
						: {}),
					...(patch.quantity != null
						? { quantity: parseQuantity(patch.quantity) }
						: {}),
					...(patch.category != null ? { category: patch.category } : {}),
					...(patch.note != null ? { note: patch.note } : {}),
				};
			}),
		}));
	}, []);

	const removeShoppingExtra = useCallback((id) => {
		setState((prev) => ({
			...prev,
			shoppingExtras: prev.shoppingExtras.filter((e) => e.id !== id),
			checkedItems: Object.fromEntries(
				Object.entries(prev.checkedItems).filter(([k]) => k !== `extra:${id}`),
			),
		}));
	}, []);

	const addPantryItem = useCallback((payload) => {
		setState((prev) => addPantryItemInState(prev, payload));
	}, []);

	const updatePantryItem = useCallback((id, patch) => {
		setState((prev) => updatePantryItemInState(prev, id, patch));
	}, []);

	const removePantryItem = useCallback((id) => {
		setState((prev) => removePantryItemInState(prev, id));
	}, []);

	const moveToPantryFromShopping = useCallback((payload) => {
		setState((prev) => upsertPantryFromShoppingInState(prev, payload));
	}, []);

	const finishShoppingToPantry = useCallback((items) => {
		let addedCount = 0;
		setState((prev) => {
			const result = finishShoppingToPantryInState(prev, items);
			addedCount = result.addedCount;
			return result.state;
		});
		return addedCount;
	}, []);

	const addHouseholdMember = useCallback((payload) => {
		setState((prev) => addMemberInState(prev, payload));
	}, []);

	const updateHouseholdMember = useCallback((memberId, patch) => {
		setState((prev) => updateMemberInState(prev, memberId, patch));
	}, []);

	const removeHouseholdMember = useCallback((memberId) => {
		setState((prev) => removeMemberInState(prev, memberId));
	}, []);

	const setActiveMember = useCallback((memberId) => {
		setState((prev) => setActiveMemberInState(prev, memberId));
	}, []);

	const setShoppingMemberIds = useCallback((memberIds) => {
		setState((prev) => setShoppingMemberIdsInState(prev, memberIds));
	}, []);

	const dismissOnboarding = useCallback(() => {
		setState((prev) => ({
			...prev,
			ui: { ...prev.ui, onboardingDismissed: true },
		}));
	}, []);

	const setLocale = useCallback((locale) => {
		setState((prev) => ({
			...prev,
			settings: { ...prev.settings, locale },
		}));
	}, []);

	const setWeekStartsOn = useCallback((weekStartsOn) => {
		setState((prev) => ({
			...prev,
			settings: { ...prev.settings, weekStartsOn },
		}));
	}, []);

	const saveSettings = useCallback((patch) => {
		setState((prev) => {
			const settingsPatch = { ...patch };
			if (settingsPatch.calendarDefaultView === "day") {
				settingsPatch.calendarDefaultView = "week";
			}
			const next = {
				...prev,
				settings: { ...prev.settings, ...settingsPatch },
				ui: {
					...prev.ui,
					...(settingsPatch.calendarDefaultView
						? {
								calendarView:
									settingsPatch.calendarDefaultView === "month"
										? "month"
										: "week",
							}
						: {}),
				},
			};
			saveStateImmediate(next);
			return next;
		});
	}, []);

	const setCalendarCursorDate = useCallback((dateISO) => {
		setState((prev) => ({
			...prev,
			ui: { ...prev.ui, calendarCursorDate: dateISO },
		}));
	}, []);

	const setCalendarView = useCallback((calendarView) => {
		const next = calendarView === "month" ? "month" : "week";
		setState((prev) => ({
			...prev,
			ui: { ...prev.ui, calendarView: next },
		}));
	}, []);

	const clearCalendarDay = useCallback((dateISO) => {
		setState((prev) => {
			const weekStartsOn = prev.settings.weekStartsOn ?? 1;
			return clearDayPlanAssignmentInState(
				clearCalendarDayInState(prev, dateISO),
				dateISO,
				undefined,
				weekStartsOn,
			);
		});
	}, []);

	const scheduleMeal = useCallback((mealId, dateISO) => {
		setState((prev) => {
			const weekStartsOn = prev.settings.weekStartsOn ?? 1;
			return clearDayPlanAssignmentInState(
				scheduleLibraryMealInState(prev, mealId, dateISO),
				dateISO,
				undefined,
				weekStartsOn,
			);
		});
	}, []);

	const replaceMeal = useCallback((instanceId, mealId) => {
		setState((prev) => {
			const weekStartsOn = prev.settings.weekStartsOn ?? 1;
			const mid = prev.household.activeMemberId;
			const cal = prev.calendars[mid] || {};
			const dateISO = Object.keys(cal).find((d) =>
				(cal[d] || []).some((m) => m.instanceId === instanceId),
			);
			let next = replaceScheduledMealInState(prev, instanceId, mealId);
			if (dateISO) {
				next = clearDayPlanAssignmentInState(
					next,
					dateISO,
					undefined,
					weekStartsOn,
				);
			}
			return next;
		});
	}, []);

	const removeMealInstance = useCallback((instanceId) => {
		setState((prev) => {
			const weekStartsOn = prev.settings.weekStartsOn ?? 1;
			const mid = prev.household.activeMemberId;
			const cal = prev.calendars[mid] || {};
			const dateISO = Object.keys(cal).find((d) =>
				(cal[d] || []).some((m) => m.instanceId === instanceId),
			);
			let next = removeScheduledMealInState(prev, instanceId);
			if (dateISO) {
				next = clearDayPlanAssignmentInState(
					next,
					dateISO,
					undefined,
					weekStartsOn,
				);
			}
			return next;
		});
	}, []);

	const moveMealInstance = useCallback((instanceId, toDateISO, toIndex) => {
		setState((prev) => {
			const weekStartsOn = prev.settings.weekStartsOn ?? 1;
			const mid = prev.household.activeMemberId;
			const cal = prev.calendars[mid] || {};
			const fromDateISO = Object.keys(cal).find((d) =>
				(cal[d] || []).some((m) => m.instanceId === instanceId),
			);
			let next = moveScheduledMealInState(
				prev,
				instanceId,
				toDateISO,
				toIndex,
			);
			if (fromDateISO) {
				next = clearDayPlanAssignmentInState(
					next,
					fromDateISO,
					undefined,
					weekStartsOn,
				);
			}
			if (toDateISO && toDateISO !== fromDateISO) {
				next = clearDayPlanAssignmentInState(
					next,
					toDateISO,
					undefined,
					weekStartsOn,
				);
			}
			return next;
		});
	}, []);

	const substituteIngredient = useCallback((payload) => {
		setState((prev) => applyIngredientSubstitution(prev, payload));
	}, []);

	const updateScheduledMeal = useCallback((instanceId, patch) => {
		setState((prev) => {
			const weekStartsOn = prev.settings.weekStartsOn ?? 1;
			const mid = prev.household.activeMemberId;
			const cal = prev.calendars[mid] || {};
			const dateISO = Object.keys(cal).find((d) =>
				(cal[d] || []).some((m) => m.instanceId === instanceId),
			);
			let next = updateScheduledMealInState(prev, instanceId, patch);
			if (dateISO) {
				next = clearDayPlanAssignmentInState(
					next,
					dateISO,
					undefined,
					weekStartsOn,
				);
			}
			return next;
		});
	}, []);

	const applyMealSaveDisposition = useCallback((opts) => {
		setState((prev) => applyMealSaveDispositionInState(prev, opts));
	}, []);

	/**
	 * Save day-plan slots for a calendar week (does not write calendars).
	 * Optionally save selected meals to the library first.
	 */
	const saveWeekPlan = useCallback((weekStartISO, dayPlans, opts = {}) => {
		setState((prev) => {
			let plans = dayPlans;
			let next = prev;
			if (opts.selectedSaveTempIds != null || opts.saveAsTemplate) {
				const result = applyLibrarySaveToDayPlans(
					prev,
					dayPlans,
					opts.selectedSaveTempIds || [],
					{
						saveAsTemplate: opts.saveAsTemplate,
						templateName: opts.templateName,
					},
				);
				next = result.state;
				plans = result.dayPlans;
			}
			return saveWeekPlanInState(next, weekStartISO, plans);
		});
	}, []);

	const copyWeekPlan = useCallback((fromWeekStartISO, toWeekStartISO) => {
		setState((prev) =>
			copyWeekPlanInState(prev, fromWeekStartISO, toWeekStartISO),
		);
	}, []);

	const applyWeekPlanToCalendar = useCallback(
		(weekStartISO, assignment) => {
			setState((prev) =>
				applyWeekPlanToCalendarInState(
					prev,
					weekStartISO,
					assignment,
					undefined,
					prev.settings.weekStartsOn ?? 1,
				),
			);
		},
		[],
	);

	const applyDayPlanToDate = useCallback((weekStartISO, dayPlanId, dateISO) => {
		setState((prev) =>
			applyDayPlanToDateInState(
				prev,
				weekStartISO,
				dayPlanId,
				dateISO,
				undefined,
				prev.settings.weekStartsOn ?? 1,
			),
		);
	}, []);

	/** @deprecated Prefer saveWeekPlan + applyWeekPlanToCalendar */
	const commitWeekPlan = useCallback((draft, opts = {}) => {
		setState((prev) => {
			let workingDraft = draft;
			let next = prev;
			if (opts.selectedSaveTempIds != null || opts.saveAsTemplate) {
				const result = applyLibrarySaveSelections(
					prev,
					draft,
					opts.selectedSaveTempIds || [],
					{
						saveAsTemplate: opts.saveAsTemplate,
						templateName: opts.templateName,
					},
				);
				next = result.state;
				workingDraft = result.draft;
			}
			return commitWeekDraft(next, workingDraft, { replaceDays: true });
		});
	}, []);

	const saveMealsToLibrary = useCallback((draft, selectedTempIds, opts = {}) => {
		setState((prev) => {
			const result = applyLibrarySaveSelections(
				prev,
				draft,
				selectedTempIds,
				opts,
			);
			return result.state;
		});
	}, []);

	const prunePastWeeks = useCallback((opts) => {
		setState((prev) => {
			const next = prunePastCalendarDays(prev, opts);
			saveStateImmediate(next);
			return next;
		});
	}, []);

	const setMealPrepSelection = useCallback((selectedInstanceIds) => {
		setState((prev) => {
			const weekStartsOn = prev.settings.weekStartsOn ?? 1;
			const weekStartISO = weekDateISOs(
				prev.ui.calendarCursorDate,
				weekStartsOn,
			)[0];
			return {
				...prev,
				mealPrep: {
					...prev.mealPrep,
					weekStartISO,
					selectedInstanceIds: [...selectedInstanceIds],
				},
			};
		});
	}, []);

	const toggleMealPrepInstance = useCallback((instanceId) => {
		setState((prev) => {
			const weekStartsOn = prev.settings.weekStartsOn ?? 1;
			const weekStartISO = weekDateISOs(
				prev.ui.calendarCursorDate,
				weekStartsOn,
			)[0];
			const current = new Set(prev.mealPrep.selectedInstanceIds || []);
			if (current.has(instanceId)) current.delete(instanceId);
			else current.add(instanceId);
			return {
				...prev,
				mealPrep: {
					...prev.mealPrep,
					weekStartISO,
					selectedInstanceIds: [...current],
				},
			};
		});
	}, []);

	const setMealPrepUnselectedVisible = useCallback((unselectedVisible) => {
		setState((prev) => ({
			...prev,
			mealPrep: { ...prev.mealPrep, unselectedVisible },
		}));
	}, []);

	const weekPlan = useMemo(() => calendarsToWeekPlan(state), [state]);
	const shoppingWeekPlan = useMemo(
		() => calendarsToShoppingWeekPlan(state),
		[state],
	);
	const dietPlan = useMemo(() => dietTemplatesToLegacyDietPlan(state), [state]);

	const visibleWeekDates = useMemo(() => {
		return weekDateISOs(
			state.ui.calendarCursorDate,
			state.settings.weekStartsOn ?? 1,
		);
	}, [state.ui.calendarCursorDate, state.settings.weekStartsOn]);

	const activeMember = useMemo(() => {
		return (
			state.household.members.find(
				(m) => m.id === state.household.activeMemberId,
			) || state.household.members[0]
		);
	}, [state.household]);

	const hasContent = useMemo(() => {
		const memberId = state.household.activeMemberId;
		const cal = state.calendars[memberId] || {};
		const hasScheduled = Object.values(cal).some((m) => m.length > 0);
		const hasWeekPlans = Object.values(state.weekPlans?.[memberId] || {}).some(
			(p) => (p.dayPlans || []).some((dp) => (dp.meals || []).length > 0),
		);
		return (
			hasScheduled ||
			hasWeekPlans ||
			state.mealLibrary.length > 0 ||
			state.dietTemplates.length > 0
		);
	}, [state]);

	const value = useMemo(
		() => ({
			state,
			updateState,
			weekPlan,
			shoppingWeekPlan,
			dietPlan,
			visibleWeekDates,
			activeMember,
			setWeekPlan,
			importDietPlan,
			loadDietTemplate,
			createMealAndSchedule,
			createMeal,
			updateMeal,
			deleteMeal,
			setCheckedItems,
			fuseShoppingItems,
			unfuseShoppingItem,
			addShoppingExtra,
			updateShoppingExtra,
			removeShoppingExtra,
			addPantryItem,
			updatePantryItem,
			removePantryItem,
			moveToPantryFromShopping,
			finishShoppingToPantry,
			addHouseholdMember,
			updateHouseholdMember,
			removeHouseholdMember,
			setActiveMember,
			setShoppingMemberIds,
			dismissOnboarding,
			setLocale,
			setWeekStartsOn,
			saveSettings,
			setCalendarCursorDate,
			setCalendarView,
			clearCalendarDay,
			scheduleMeal,
			replaceMeal,
			removeMealInstance,
			moveMealInstance,
			substituteIngredient,
			updateScheduledMeal,
			applyMealSaveDisposition,
			saveWeekPlan,
			copyWeekPlan,
			applyWeekPlanToCalendar,
			applyDayPlanToDate,
			commitWeekPlan,
			saveMealsToLibrary,
			prunePastWeeks,
			setMealPrepSelection,
			toggleMealPrepInstance,
			setMealPrepUnselectedVisible,
			hasContent,
			getWeekPlan: (weekStartISO) => getWeekPlanFromState(state, weekStartISO),
			listWeekPlans: () => listWeekPlansFromState(state),
		}),
		[
			state,
			updateState,
			weekPlan,
			shoppingWeekPlan,
			dietPlan,
			visibleWeekDates,
			activeMember,
			setWeekPlan,
			importDietPlan,
			loadDietTemplate,
			createMealAndSchedule,
			createMeal,
			updateMeal,
			deleteMeal,
			setCheckedItems,
			fuseShoppingItems,
			unfuseShoppingItem,
			addShoppingExtra,
			updateShoppingExtra,
			removeShoppingExtra,
			addPantryItem,
			updatePantryItem,
			removePantryItem,
			moveToPantryFromShopping,
			finishShoppingToPantry,
			addHouseholdMember,
			updateHouseholdMember,
			removeHouseholdMember,
			setActiveMember,
			setShoppingMemberIds,
			dismissOnboarding,
			setLocale,
			setWeekStartsOn,
			saveSettings,
			setCalendarCursorDate,
			setCalendarView,
			clearCalendarDay,
			scheduleMeal,
			replaceMeal,
			removeMealInstance,
			moveMealInstance,
			substituteIngredient,
			updateScheduledMeal,
			applyMealSaveDisposition,
			saveWeekPlan,
			copyWeekPlan,
			applyWeekPlanToCalendar,
			applyDayPlanToDate,
			commitWeekPlan,
			saveMealsToLibrary,
			prunePastWeeks,
			setMealPrepSelection,
			toggleMealPrepInstance,
			setMealPrepUnselectedVisible,
			hasContent,
		],
	);

	return (
		<AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
	);
}

export function useAppState() {
	const ctx = useContext(AppStateContext);
	if (!ctx) {
		throw new Error("useAppState must be used within AppStateProvider");
	}
	return ctx;
}
