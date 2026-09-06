import { msg } from "@lingui/core/macro";
import { QUANTITY_UNITS } from "../../domain/quantity.js";

export { QUANTITY_UNITS };

/** Localized labels for word-like units. Codes (pza, tza, g) stay as stored. */
export const QUANTITY_UNIT_MSG = {
	puñado: msg`puñado`,
	lata: msg`lata`,
	rebanada: msg`rebanada`,
	diente: msg`diente`,
	paq: msg`paq`,
	porción: msg`porción`,
	pizca: msg`pizca`,
	"al gusto": msg`al gusto`,
	opcional: msg`opcional`,
};

/**
 * @param {string} unit
 * @param {(descriptor: import("@lingui/core").MessageDescriptor) => string} _
 */
export function unitLabel(unit, _) {
	const descriptor = QUANTITY_UNIT_MSG[unit];
	return descriptor ? _(descriptor) : unit;
}

/**
 * Standard units plus an existing custom unit so the select can show it.
 * @param {string} [currentUnit]
 */
export function unitsForSelect(currentUnit) {
	const extra = String(currentUnit || "").trim();
	if (!extra || QUANTITY_UNITS.includes(extra)) return QUANTITY_UNITS;
	return [...QUANTITY_UNITS, extra];
}
