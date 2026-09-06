import { msg } from "@lingui/core/macro";

/** Meal type UI labels (Spanish source). Use with `_(MEAL_TYPE_MSG[type])`. */
export const MEAL_TYPE_MSG = {
	desayuno: msg`Desayuno`,
	colacion: msg`Colación`,
	comida: msg`Comida`,
	merienda: msg`Merienda`,
	cena: msg`Cena`,
	otro: msg`Otro`,
};

export const MEAL_TYPE_OPTIONS = [
	"desayuno",
	"colacion",
	"comida",
	"merienda",
	"cena",
	"otro",
];
