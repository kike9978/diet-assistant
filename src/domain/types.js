/**
 * JSDoc shapes for DietAssistantStateV2 (runtime is plain JS).
 *
 * @typedef {import('./quantity.js').Quantity} Quantity
 * @typedef {import('./mealType.js').MealType} MealType
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   quantity: Quantity,
 *   categoryHint?: string,
 *   notes?: string,
 *   state?: "raw" | "cooked" | null
 * }} Ingredient
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   mealType: MealType,
 *   ingredients: Ingredient[],
 *   tags: string[],
 *   servings: number,
 *   source: "user" | "import" | "template",
 *   createdAt: string,
 *   updatedAt: string
 * }} Meal
 *
 * @typedef {{ id: string, name: string, mealIds: string[] }} DayTemplate
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   dayTemplateIds: string[],
 *   createdAt: string,
 *   archived?: boolean
 * }} DietTemplate
 *
 * @typedef {{
 *   instanceId: string,
 *   dateISO: string,
 *   memberId: string,
 *   mealId: string | null,
 *   name: string,
 *   mealType: MealType,
 *   ingredients: Ingredient[],
 *   notes?: string,
 *   replacedFromId?: string
 * }} ScheduledMeal
 *
 * @typedef {{ id: string, name: string, color: string, createdAt: string }} Member
 * @typedef {{ members: Member[], activeMemberId: string }} Household
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   quantity: Quantity,
 *   category?: string,
 *   updatedAt: string
 * }} PantryItem
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   quantity: Quantity,
 *   category?: string,
 *   note?: string,
 *   createdAt: string
 * }} ShoppingExtra
 *
 * @typedef {{ [stableKey: string]: boolean }} CheckedItems
 *
 * @typedef {{
 *   weekStartISO: string,
 *   selectedInstanceIds: string[],
 *   unselectedVisible: boolean
 * }} MealPrepState
 *
 * @typedef {{
 *   locale: "es" | "en",
 *   weekStartsOn: 0|1|2|3|4|5|6,
 *   calendarDefaultView: "month" | "week",
 * }} Settings
 *
 * @typedef {{
 *   calendarCursorDate: string,
 *   calendarView: "month" | "week",
 *   onboardingDismissed: boolean
 * }} UiState
 *
 * @typedef {{
 *   version: 2,
 *   household: Household,
 *   mealLibrary: Meal[],
 *   dayTemplates: DayTemplate[],
 *   dietTemplates: DietTemplate[],
 *   calendars: { [memberId: string]: { [dateISO: string]: ScheduledMeal[] } },
 *   pantry: PantryItem[],
 *   shoppingExtras: ShoppingExtra[],
 *   checkedItems: CheckedItems,
 *   mealPrep: MealPrepState,
 *   settings: Settings,
 *   ui: UiState,
 *   meta: {
 *     migratedFrom?: "v1",
 *     migratedAt?: string,
 *     lastSavedAt: string
 *   }
 * }} DietAssistantStateV2
 */

export {};
