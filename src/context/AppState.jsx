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
	assignDayTemplateToDate,
	clearCalendarDay as clearCalendarDayInState,
} from "../features/calendar/calendarActions.js";
import { todayISO } from "../features/calendar/dateUtils.js";
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

	/**
	 * Guardar plantilla: snapshot diet/day templates only (not calendar).
	 * Pins are dietTemplates going forward.
	 */
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

	/**
	 * Load a diet template — does NOT wipe calendar (pin→calendar restore fix:
	 * loading a template only switches template focus; calendar stays).
	 * For Phase 1 "load pinned plan" UX: optionally apply first day template to today.
	 */
	const loadDietTemplate = useCallback((_templateId) => {
		// Templates are already in state; calendar is independent.
		// No-op for selection; Plans page uses templates directly.
	}, []);

	const reiniciar = useCallback(() => {
		setState((prev) => {
			const next = resetActivePlanning(prev);
			saveStateImmediate(next);
			return next;
		});
	}, []);

	/**
	 * Minimal create meal → library + schedule onto a date (default today).
	 */
	const createMealAndSchedule = useCallback(
		({ name, ingredients, dateISO, mealType }) => {
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
					servings: 1,
					source: "user",
					createdAt: now,
					updatedAt: now,
				};
				const scheduled = {
					instanceId: createId(),
					dateISO: date,
					memberId,
					mealId,
					name,
					mealType: type,
					ingredients: structuredIngredients.map((i) => ({ ...i, id: createId() })),
				};
				const memberCal = { ...(prev.calendars[memberId] || {}) };
				memberCal[date] = [...(memberCal[date] || []), scheduled];

				return {
					...prev,
					mealLibrary: [...prev.mealLibrary, meal],
					calendars: { ...prev.calendars, [memberId]: memberCal },
					ui: {
						...prev.ui,
						calendarCursorDate: date,
						onboardingDismissed: true,
					},
				};
			});

			return mealId;
		},
		[],
	);

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

	/**
	 * Persist settings immediately (Ajustes → Guardar).
	 * @param {Partial<import("../domain/types.js").Settings>} patch
	 */
	const saveSettings = useCallback((patch) => {
		setState((prev) => {
			const next = {
				...prev,
				settings: { ...prev.settings, ...patch },
				ui: {
					...prev.ui,
					...(patch.calendarDefaultView
						? { calendarView: patch.calendarDefaultView }
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

	const assignDayTemplate = useCallback((dayTemplateId, dateISO) => {
		setState((prev) => assignDayTemplateToDate(prev, dayTemplateId, dateISO));
	}, []);

	const clearCalendarDay = useCallback((dateISO) => {
		setState((prev) => clearCalendarDayInState(prev, dateISO));
	}, []);

	const weekPlan = useMemo(() => calendarsToWeekPlan(state), [state]);
	const dietPlan = useMemo(() => dietTemplatesToLegacyDietPlan(state), [state]);

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
			setWeekPlan,
			importDietPlan,
			saveCurrentAsTemplate,
			loadDietTemplate,
			reiniciar,
			createMealAndSchedule,
			setCheckedItems,
			addShoppingExtra,
			removeShoppingExtra,
			dismissOnboarding,
			setLocale,
			setWeekStartsOn,
			saveSettings,
			setCalendarCursorDate,
			assignDayTemplate,
			clearCalendarDay,
			hasContent,
		}),
		[
			state,
			updateState,
			weekPlan,
			dietPlan,
			setWeekPlan,
			importDietPlan,
			saveCurrentAsTemplate,
			loadDietTemplate,
			reiniciar,
			createMealAndSchedule,
			setCheckedItems,
			addShoppingExtra,
			removeShoppingExtra,
			dismissOnboarding,
			setLocale,
			setWeekStartsOn,
			saveSettings,
			setCalendarCursorDate,
			assignDayTemplate,
			clearCalendarDay,
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
