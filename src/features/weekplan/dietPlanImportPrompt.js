/**
 * Prompt for converting a meal plan (PDF/image text) into importable JSON.
 * Kept in sync with diet-assistant-backend/routes/compatibility-routes.js
 * (`getDietPlanPromptRules`). Not localized — technical LLM instructions.
 */
const DIET_PLAN_PROMPT_RULES = `Explicit Chat Rules for Generating Meal Plan JSON
Below is a comprehensive set of rules derived from the chat history. These rules ensure consistency, accuracy, and proper formatting when converting meal plans (from PDFs/images) into JSON.

1. JSON Structure
The JSON must follow this template:

json
{
"days": [
{
"id": "dayX",          // Replace X with day number (e.g., "day1", "day2")
"name": "Día X",       // Replace X with day number (e.g., "Día 1")
"meals": [
		{
		  "id": "mealX",     // Replace X with meal number (e.g., "meal1")
		  "name": "Meal Name", // Format: "Category: Meal Title" (e.g., "Desayuno: Smoothie de proteína vegetal")
		  "ingredients": [
		    { "name": "Ingredient", "quantity": "Quantity" }, // Individual objects
		    // ...
		  ]
		}
]
}
]
}

2. Meal Categories & Order
Each day MUST include 5 meals in this exact order:

Desayuno (Breakfast)

Media mañana (Mid-Morning Snack)

Almuerzo (Lunch)

Merienda (Afternoon Snack)

Cena (Dinner)

3. Ingredient Formatting
Names:

Use simple, singular names (e.g., "Tomate" instead of "Tomate picado").

Remove unnecessary descriptors like "cubitos", "rodajas", or "partida en trocitos".

❌ Incorrect: "Plátano en rodajas"

✅ Correct: "Plátano"

Quantities:

Use standardized units:

pza (pieza), tza (taza), cdita (cucharadita), cda (cucharada), puñado, lata, reb (rebanada).

Do not mix units:

❌ Incorrect: "1/2 pza de zanahoria rallada"

✅ Correct: "Zanahoria", "quantity": "1/2 pza"

"c.s.": Preserve "cantidad suficiente" as "c.s." (e.g., { "name": "Sal", "quantity": "c.s." }).

4. Handling Subheadings
"Acompañar con": Treat items under this as additional ingredients, not separate sections.

Example:

text
Desayuno: Huevos a la mexicana
Acompañar con: 1 paq de salmas + 1 fruta
Becomes:

json
{
"name": "Desayuno: Huevos a la mexicana",
"ingredients": [
{ "name": "Salmas", "quantity": "1 paq" },
{ "name": "Fruta", "quantity": "1 porción" }
]
}

5. Special Cases
Salsa de tomate: Break it down into components:

"Tomate", "Cebolla", "Ajo".

Example:

❌ Incorrect: "Salsa de tomate: 2 pzas"

✅ Correct:

json
{ "name": "Tomate", "quantity": "2 pzas" },
{ "name": "Cebolla", "quantity": "1/4 pza" },
{ "name": "Ajo", "quantity": "1 diente" }

6. Consistency Rules
Day/Meal IDs: Always increment numerically (e.g., day1, day2; meal1, meal2).

Language:

If input is in English, translate meal names and ingredients to Spanish (e.g., "Breakfast" → "Desayuno").

Preserve Spanish terms if the input is already in Spanish.

No Extra Fields: Do not add description, calories, or other fields unless explicitly requested.

7. Validation & Error Handling
Check for Missing Meals: Ensure all 5 meals are present per day.

Unit Standardization: Validate units (e.g., pza, tza, cda).

Typos: Correct misspellings (e.g., "pañuelo" → "panucho").

Ambiguity: If unclear, flag with a comment (e.g., // WARNING: Missing quantity for 'Aguacate').

8. Example Workflow
Input (PDF/Image):

text
Día 1
Desayuno: Smoothie de proteína vegetal (plátano, espinacas, leche de almendras).
Media mañana: 10 almendras tostadas.
Almuerzo: Ensalada de quinoa con tomate.
Merienda: Yogurt griego.
Cena: Pollo al horno con verduras.
Expected JSON:

json
{
"days": [
{
"id": "day1",
"name": "Día 1",
"meals": [
		{
		  "id": "meal1",
		  "name": "Desayuno: Smoothie de proteína vegetal",
		  "ingredients": [
		    { "name": "Plátano", "quantity": "1 pza" },
		    { "name": "Espinacas", "quantity": "1 taza" },
		    { "name": "Leche de almendras", "quantity": "1 taza" }
		  ]
		},
		{
		  "id": "meal2",
		  "name": "Media mañana: Almendras tostadas",
		  "ingredients": [
		    { "name": "Almendras", "quantity": "10 pzas" }
		  ]
		},
		// ... (other meals)
]
}
]
}

9. Additional Contextual Considerations
When the data shows different options for one meal, pick one of those options for that meal to create a complete one-day plan.

If the data has 5 columns, create five days accordingly.

Remove "fruta (lista de equivalencias)" from the "pre desayuno" if present.

10. Final Notes
Strict Adherence: Follow these rules exactly. Deviations will cause errors.

Ask for Clarification: If the input is ambiguous (e.g., missing quantities), request confirmation.`;

/**
 * Full prompt to paste into an external LLM together with the meal plan source.
 */
export const DIET_PLAN_IMPORT_PROMPT = `You are a diet plan converter. Convert the meal plan I provide (PDF text, image description, or notes) into valid JSON following the rules below.

Return ONLY a single JSON object — no markdown fences, no commentary.

${DIET_PLAN_PROMPT_RULES}

---
After these rules, I will paste the meal plan content. Convert it now.`;
