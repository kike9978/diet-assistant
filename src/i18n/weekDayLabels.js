import { msg } from "@lingui/core/macro";

/** Full weekday labels (Spanish source). Use with `_(DAY_LABEL_MSG.id)`. */
export const DAY_LABEL_MSG = {
	sunday: msg`Domingo`,
	monday: msg`Lunes`,
	tuesday: msg`Martes`,
	wednesday: msg`Miércoles`,
	thursday: msg`Jueves`,
	friday: msg`Viernes`,
	saturday: msg`Sábado`,
};

/** Short weekday labels for compact calendar chrome. */
export const DAY_SHORT_MSG = {
	sunday: msg`Dom`,
	monday: msg`Lun`,
	tuesday: msg`Mar`,
	wednesday: msg`Mié`,
	thursday: msg`Jue`,
	friday: msg`Vie`,
	saturday: msg`Sáb`,
};

export const WEEK_DAY_IDS = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
];
