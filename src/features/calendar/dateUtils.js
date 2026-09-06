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

/**
 * @param {Date | string} date
 * @param {number} days
 */
export function addDays(date, days) {
	const d = typeof date === "string" ? parseDateISO(date) : new Date(date);
	d.setDate(d.getDate() + days);
	return toDateISO(d);
}

/**
 * @param {Date | string} date
 * @param {number} months
 */
export function addMonths(date, months) {
	const d = typeof date === "string" ? parseDateISO(date) : new Date(date);
	const day = d.getDate();
	d.setDate(1);
	d.setMonth(d.getMonth() + months);
	const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
	d.setDate(Math.min(day, lastDay));
	return toDateISO(d);
}

/** @param {Date | string} date */
export function startOfMonth(date) {
	const d = typeof date === "string" ? parseDateISO(date) : new Date(date);
	return toDateISO(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** @param {Date | string} date */
export function endOfMonth(date) {
	const d = typeof date === "string" ? parseDateISO(date) : new Date(date);
	return toDateISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/**
 * Flat list of ISO dates for a month grid (leading/trailing days from adjacent months).
 * Always full weeks so the grid is rectangular.
 * @param {Date | string} date — any day in the target month
 * @param {number} [weekStartsOn=1]
 * @returns {string[]}
 */
export function monthGridDateISOs(date, weekStartsOn = 1) {
	const monthStart = parseDateISO(startOfMonth(date));
	const monthEnd = parseDateISO(endOfMonth(date));
	const gridStart = startOfWeek(monthStart, weekStartsOn);
	const gridEnd = startOfWeek(monthEnd, weekStartsOn);
	gridEnd.setDate(gridEnd.getDate() + 6);

	const dates = [];
	const cursor = new Date(gridStart);
	while (cursor <= gridEnd) {
		dates.push(toDateISO(cursor));
		cursor.setDate(cursor.getDate() + 1);
	}
	return dates;
}

/**
 * Weeks of ISO dates for month view.
 * @param {Date | string} date
 * @param {number} [weekStartsOn=1]
 * @returns {string[][]}
 */
export function monthGridWeeks(date, weekStartsOn = 1) {
	const flat = monthGridDateISOs(date, weekStartsOn);
	const weeks = [];
	for (let i = 0; i < flat.length; i += 7) {
		weeks.push(flat.slice(i, i + 7));
	}
	return weeks;
}

/**
 * Cutoff ISO for retention: keep from (cursor − keepMonths) month start onward.
 * @param {Date | string} cursorDate
 * @param {number} [keepMonths=4]
 */
export function retentionCutoffISO(cursorDate, keepMonths = 4) {
	const d = typeof cursorDate === "string" ? parseDateISO(cursorDate) : new Date(cursorDate);
	d.setDate(1);
	d.setMonth(d.getMonth() - keepMonths);
	return toDateISO(d);
}

/**
 * Weekday keys ordered by weekStartsOn.
 * @param {number} [weekStartsOn=1]
 * @returns {string[]}
 */
export function orderedWeekdayKeys(weekStartsOn = 1) {
	const keys = [
		"sunday",
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
	];
	return [...keys.slice(weekStartsOn), ...keys.slice(0, weekStartsOn)];
}
