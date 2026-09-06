import {
	Apple,
	CircleDot,
	Coffee,
	Cookie,
	LayoutGrid,
	Moon,
	UtensilsCrossed,
} from "lucide-react";

/** Tab icons for meal-type filters (not stored on meals). */
export const MEAL_TYPE_TAB_ICONS = {
	all: LayoutGrid,
	desayuno: Coffee,
	colacion: Apple,
	comida: UtensilsCrossed,
	merienda: Cookie,
	cena: Moon,
	otro: CircleDot,
};

/** Catalog keys used when a meal has no stored icon. */
export const MEAL_TYPE_GLYPH = {
	desayuno: "coffee",
	colacion: "apple",
	comida: "utensils",
	merienda: "cookie",
	cena: "soup",
	otro: "leaf",
};
