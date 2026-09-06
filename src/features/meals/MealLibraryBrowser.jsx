import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { MEAL_TYPE_MSG, MEAL_TYPE_OPTIONS } from "./mealTypeLabels.js";
import { MEAL_TYPE_TAB_ICONS } from "./mealTypeIcons.js";
import MealTile from "./MealTile.jsx";

const SORT_MODES = ["name", "updated", "ingredients"];

function MealTypeTabs({ value, onChange, chrome }) {
	const { _ } = useLingui();
	const inventory = chrome === "inventory";
	const tabs = [{ id: "all", label: t`Todas` }, ...MEAL_TYPE_OPTIONS.map((id) => ({
		id,
		label: _(MEAL_TYPE_MSG[id]),
	}))];

	return (
		<div
			className={
				inventory
					? "flex gap-1 overflow-x-auto px-2 py-2"
					: "flex gap-1 overflow-x-auto"
			}
			role="tablist"
			aria-label={t`Tipo de comida`}
		>
			{tabs.map((tab) => {
				const Icon = MEAL_TYPE_TAB_ICONS[tab.id] || MEAL_TYPE_TAB_ICONS.otro;
				const selected = value === tab.id;
				return (
					<button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={selected}
						aria-label={tab.label}
						title={tab.label}
						onClick={() => onChange(tab.id)}
						className={`flex size-11 shrink-0 items-center justify-center rounded-app transition ${inventory
								? selected
									? "bg-[var(--color-accent-citrus)] text-ink"
									: "text-white/90 hover:bg-white/10"
								: selected
									? "bg-[var(--color-accent-citrus)] text-ink"
									: "bg-surface text-ink-muted border border-border hover:text-ink"
							}`}
					>
						<Icon className="size-5" aria-hidden />
					</button>
				);
			})}
		</div>
	);
}

/**
 * Shared meal-library grid with type tabs, search, and sort.
 */
export default function MealLibraryBrowser({
	meals,
	chrome = "page",
	heading = null,
	onSelect,
}) {
	const { _ } = useLingui();
	const [typeFilter, setTypeFilter] = useState("all");
	const [query, setQuery] = useState("");
	const [sortMode, setSortMode] = useState("name");

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		const list = (meals || []).filter((m) => {
			if (typeFilter !== "all" && m.mealType !== typeFilter) return false;
			if (!q) return true;
			return (
				m.name.toLowerCase().includes(q) ||
				(m.flavorText || "").toLowerCase().includes(q)
			);
		});
		const next = [...list];
		next.sort((a, b) => {
			if (sortMode === "updated") {
				return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
			}
			if (sortMode === "ingredients") {
				return (b.ingredients?.length || 0) - (a.ingredients?.length || 0);
			}
			return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
		});
		return next;
	}, [meals, typeFilter, query, sortMode]);

	const typeTitle =
		typeFilter === "all"
			? t`Todas`
			: _(MEAL_TYPE_MSG[typeFilter] || MEAL_TYPE_MSG.otro);

	const sortLabel =
		sortMode === "updated"
			? t`Ordenar por fecha`
			: sortMode === "ingredients"
				? t`Ordenar por ingredientes`
				: t`Ordenar por nombre`;

	const cycleSort = () => {
		const i = SORT_MODES.indexOf(sortMode);
		setSortMode(SORT_MODES[(i + 1) % SORT_MODES.length]);
	};

	const inventory = chrome === "inventory";

	return (
		<div
			className={
				inventory
					? "flex min-h-0 flex-1 flex-col bg-bg"
					: "space-y-3"
			}
		>
			<div className={inventory ? "bg-brand" : ""}>
				{heading && inventory ? (
					<h3 className="font-display text-lg text-white px-4 pt-3">
						{heading}
					</h3>
				) : null}
				<MealTypeTabs
					value={typeFilter}
					onChange={setTypeFilter}
					chrome={chrome}
				/>
			</div>

			<div
				className={`flex flex-wrap items-center gap-2 ${inventory ? "px-4 pt-3" : ""}`}
			>
				<p className="shrink-0 truncate font-display text-lg text-ink">
					{typeTitle}
				</p>
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={t`Buscar comida…`}
					className="min-h-11 min-w-0 flex-1 px-3 rounded-app border border-border bg-surface text-sm"
				/>
				<button
					type="button"
					onClick={cycleSort}
					className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink hover:bg-surface-2"
					aria-label={sortLabel}
					title={sortLabel}
				>
					<ArrowUpDown className="size-4" aria-hidden />
				</button>
			</div>

			<div
				className={
					inventory
						? "min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2"
						: ""
				}
			>
				{filtered.length === 0 ? (
					<p className="text-sm text-ink-muted px-1 py-6">
						{(meals || []).length === 0 ? (
							<Trans>No hay comidas en la biblioteca.</Trans>
						) : (
							<Trans>No hay comidas que coincidan.</Trans>
						)}
					</p>
				) : (
					<ul className="grid grid-cols-3 sm:grid-cols-4 gap-x-2 gap-y-4">
						{filtered.map((meal) => (
							<li key={meal.id} className="h-full">
								<MealTile meal={meal} onSelect={onSelect} />
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
