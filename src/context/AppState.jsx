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
	assignDayTemplateToDate,
	buildLibraryMeal,
	clearCalendarDay as clearCalendarDayInState,
	moveScheduledMeal as moveScheduledMealInState,
	prunePastCalendarDays,
	removeScheduledMeal as removeScheduledMealInState,
	replaceScheduledMeal as replaceScheduledMealInState,
	scheduleLibraryMeal as scheduleLibraryMealInState,
} from "../features/calendar/calendarActions.js";
import { todayISO, weekDateISOs } from "../features/calendar/dateUtils.js";
import {
	loadState,
	resetActivePlanning,
	saveState,
	saveStateImmediate,
} from "../storage/loadSave.js";
import {
	applyWeekPlanToState,
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

	const saveCurrentAsTemplate = useCallback((name) => {
		setState((prev) => {
			const legacy = dietTemplatesToLegacyDietPlan(prev);
			if (!legacy) return prev;
			return importDietPlanIntoState(
				prev,
				legacy,
				name || `Plantilla ${prev.dietTemplates.length + 1}`,
			);
		});
	}, []);

	const loadDietTemplate = useCallback((_templateId) => {}, []);

	const reiniciar = useCallback(() => {
		setState((prev) => {
			const next = resetActivePlanning(prev);
			saveStateImmediate(next);
			return next;
		});
	}, []);

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

	const addShoppingExtra = useCallback(({ name, quantity, category }) => {
		setState((prev) => {
			const extra = {
				id: createId(),
				name,
				quantity: parseQuantity(quantity),
				category,
				createdAt: new Date().toISOString(),
			};
			return {
				...prev,
				shoppingExtras: [...prev.shoppingExtras, extra],
			};
		});
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

	const assignDayTemplate = useCallback((dayTemplateId, dateISO) => {
		setState((prev) => assignDayTemplateToDate(prev, dayTemplateId, dateISO));
	}, []);

	const clearCalendarDay = useCallback((dateISO) => {
		setState((prev) => clearCalendarDayInState(prev, dateISO));
	}, []);

	const scheduleMeal = useCallback((mealId, dateISO) => {
		setState((prev) => scheduleLibraryMealInState(prev, mealId, dateISO));
	}, []);

	const replaceMeal = useCallback((instanceId, mealId) => {
		setState((prev) =>
			replaceScheduledMealInState(prev, instanceId, mealId),
		);
	}, []);

	const removeMealInstance = useCallback((instanceId) => {
		setState((prev) => removeScheduledMealInState(prev, instanceId));
	}, []);

	const moveMealInstance = useCallback((instanceId, toDateISO, toIndex) => {
		setState((prev) =>
			moveScheduledMealInState(prev, instanceId, toDateISO, toIndex),
		);
	}, []);

	const substituteIngredient = useCallback((payload) => {
		setState((prev) => applyIngredientSubstitution(prev, payload));
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
	const dietPlan = useMemo(() => dietTemplatesToLegacyDietPlan(state), [state]);

	const visibleWeekDates = useMemo(() => {
		return weekDateISOs(
			state.ui.calendarCursorDate,
			state.settings.weekStartsOn ?? 1,
		);
	}, [state.ui.calendarCursorDate, state.settings.weekStartsOn]);

	const hasContent = useMemo(() => {
		const memberId = state.household.activeMemberId;
		const cal = state.calendars[memberId] || {};
		const hasScheduled = Object.values(cal).some((m) => m.length > 0);
		return (
			hasScheduled ||
			state.mealLibrary.length > 0 ||
			state.dietTemplates.length > 0
		);
	}, [state]);

	const value = useMemo(
		() => ({
			state,
			updateState,
			weekPlan,
			dietPlan,
			visibleWeekDates,
			setWeekPlan,
			importDietPlan,
			saveCurrentAsTemplate,
			loadDietTemplate,
			reiniciar,
			createMealAndSchedule,
			createMeal,
			updateMeal,
			deleteMeal,
			setCheckedItems,
			addShoppingExtra,
			removeShoppingExtra,
			dismissOnboarding,
			setLocale,
			setWeekStartsOn,
			saveSettings,
			setCalendarCursorDate,
			setCalendarView,
			assignDayTemplate,
			clearCalendarDay,
			scheduleMeal,
			replaceMeal,
			removeMealInstance,
			moveMealInstance,
			substituteIngredient,
			prunePastWeeks,
			setMealPrepSelection,
			toggleMealPrepInstance,
			setMealPrepUnselectedVisible,
			hasContent,
		}),
		[
			state,
			updateState,
			weekPlan,
			dietPlan,
			visibleWeekDates,
			setWeekPlan,
			importDietPlan,
			saveCurrentAsTemplate,
			loadDietTemplate,
			reiniciar,
			createMealAndSchedule,
			createMeal,
			updateMeal,
			deleteMeal,
			setCheckedItems,
			addShoppingExtra,
			removeShoppingExtra,
			dismissOnboarding,
			setLocale,
			setWeekStartsOn,
			saveSettings,
			setCalendarCursorDate,
			setCalendarView,
			assignDayTemplate,
			clearCalendarDay,
			scheduleMeal,
			replaceMeal,
			removeMealInstance,
			moveMealInstance,
			substituteIngredient,
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
