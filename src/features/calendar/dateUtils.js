/**
 * Calendar date helpers. weekStartsOn affects column order / "this week" only —
 * never remaps stored ISO keys.
 */

/** @param {Date} d */
export function toDateISO(d) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

/** @param {string} iso */
export function parseDateISO(iso) {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y, m - 1, d);
}

/**
 * Start of the week containing `date`, using weekStartsOn (0=Sun … 6=Sat).
 * Default weekStartsOn = 1 (Monday).
 * @param {Date | string} date
 * @param {number} [weekStartsOn=1]
 */
export function startOfWeek(date, weekStartsOn = 1) {
	const d = typeof date === "string" ? parseDateISO(date) : new Date(date);
	const day = d.getDay();
	const diff = (day - weekStartsOn + 7) % 7;
	const start = new Date(d);
	start.setDate(d.getDate() - diff);
	start.setHours(0, 0, 0, 0);
	return start;
}

/**
 * @param {Date | string} date
 * @param {number} [weekStartsOn=1]
 * @returns {string[]} seven ISO dates starting at week start
 */
export function weekDateISOs(date, weekStartsOn = 1) {
	const start = startOfWeek(date, weekStartsOn);
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		return toDateISO(d);
	});
}

/**
 * Map weekday key (sunday…saturday) → ISO for the week containing `anchor`.
 * Uses weekStartsOn only to choose which week; the weekday itself is absolute.
 * @param {Date | string} anchor
 * @param {number} [weekStartsOn=1]
 * @returns {Record<string, string>}
 */
export function weekdayKeysToDateISO(anchor, weekStartsOn = 1) {
	const start = startOfWeek(anchor, weekStartsOn);
	const map = {};
	for (let i = 0; i < 7; i++) {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		const key = [
			"sunday",
			"monday",
			"tuesday",
			"wednesday",
			"thursday",
			"friday",
			"saturday",
		][d.getDay()];
		map[key] = toDateISO(d);
	}
	return map;
}

export function todayISO() {
	return toDateISO(new Date());
}
