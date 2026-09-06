/** Stable ids — never Date.now alone. */
export function createId() {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}
