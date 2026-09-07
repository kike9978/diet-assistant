import { Trans } from "@lingui/react/macro";
import {
	Braces,
	CalendarDays,
	ChefHat,
	ChevronRight,
	FileText,
	ShoppingCart,
	Sparkles,
} from "lucide-react";
import MealTile from "../features/meals/MealTile.jsx";
import { MEAL_TYPE_COLOR } from "../features/calendar/mealTypeColors.js";
import ShoppingChecklistRow from "./shopping/ShoppingChecklistRow.jsx";

const SAMPLE_MEALS = [
	{
		id: "ob-1",
		name: "Huevo Revuelto con Chilaquiles",
		mealType: "desayuno",
		ingredients: [{}, {}, {}, {}, {}],
	},
	{
		id: "ob-2",
		name: "Filete de Pescado a la Mexicana",
		mealType: "comida",
		ingredients: [{}, {}, {}, {}, {}, {}],
	},
	{
		id: "ob-3",
		name: "Tostadas de Frijol",
		mealType: "cena",
		ingredients: [{}, {}, {}, {}, {}],
	},
];

function PreviewShell({ children }) {
	return (
		<div
			className="mb-4 -mx-1 overflow-hidden rounded-app bg-surface-2 ring-1 ring-border/60 p-3 pointer-events-none select-none"
			aria-hidden
		>
			{children}
		</div>
	);
}

/** Calendar + shopping + prep chrome from the real UI. */
export function WeekPreview() {
	return (
		<PreviewShell>
			<div className="flex justify-around items-center gap-1 mb-3 pb-2 border-b border-border">
				<span className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-brand">
					<CalendarDays className="size-5" />
					<Trans>Calendario</Trans>
				</span>
				<span className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-ink-muted">
					<ShoppingCart className="size-5" />
					<Trans>Compras</Trans>
				</span>
				<span className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-ink-muted">
					<ChefHat className="size-5" />
					<Trans>Preparar</Trans>
				</span>
			</div>
			<div className="flex gap-2 mb-3">
				{["Lun", "Mar", "Mié"].map((day, i) => (
					<div
						key={day}
						className="flex-1 min-w-0 rounded-app bg-surface border border-border p-1.5"
					>
						<p className="text-[10px] font-semibold text-ink-muted mb-1">
							{day}
						</p>
						<div
							className="h-1.5 rounded-full mb-1"
							style={{
								background:
									MEAL_TYPE_COLOR[
										["desayuno", "comida", "cena"][i]
									],
							}}
						/>
						<p className="text-[10px] text-ink truncate leading-tight">
							{SAMPLE_MEALS[i].name.split(":")[0] || SAMPLE_MEALS[i].name}
						</p>
					</div>
				))}
			</div>
			<p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted mb-1">
				<Trans>Compras</Trans>
			</p>
			<div className="rounded-app bg-surface border border-border px-2 divide-y divide-border">
				<ShoppingChecklistRow
					item={{ name: "Huevos" }}
					view={{ displayQty: "4 pzas" }}
					checked={false}
				/>
				<ShoppingChecklistRow
					item={{ name: "Aguacate" }}
					view={{ displayQty: "90g" }}
					checked
				/>
			</div>
		</PreviewShell>
	);
}

/** Meal library tiles using MealTile / MealPlate. */
export function MealsPreview() {
	return (
		<PreviewShell>
			<div className="grid grid-cols-3 gap-2">
				{SAMPLE_MEALS.map((meal) => (
					<MealTile key={meal.id} meal={meal} />
				))}
			</div>
		</PreviewShell>
	);
}

/** Import flow chrome: document → LLM → JSON (ImportJsonSheet styling). */
export function ImportPreview() {
	return (
		<PreviewShell>
			<div className="flex items-center justify-center gap-2 mb-3 text-ink-muted">
				<span className="flex flex-col items-center gap-1">
					<span className="flex size-10 items-center justify-center rounded-app bg-surface border border-border">
						<FileText className="size-5 text-brand" />
					</span>
					<span className="text-[10px] font-semibold">
						<Trans>Plan</Trans>
					</span>
				</span>
				<ChevronRight className="size-4 shrink-0" />
				<span className="flex flex-col items-center gap-1">
					<span className="flex size-10 items-center justify-center rounded-app bg-surface border border-border">
						<Sparkles className="size-5 text-[var(--color-accent-citrus)]" />
					</span>
					<span className="text-[10px] font-semibold">LLM</span>
				</span>
				<ChevronRight className="size-4 shrink-0" />
				<span className="flex flex-col items-center gap-1">
					<span className="flex size-10 items-center justify-center rounded-app bg-surface border border-border">
						<Braces className="size-5 text-[var(--color-accent-blueberry)]" />
					</span>
					<span className="text-[10px] font-semibold">JSON</span>
				</span>
			</div>
			<pre className="text-[10px] leading-snug bg-surface rounded-app p-2.5 border border-border overflow-hidden text-ink-muted font-mono">
				{`{
  "days": [{
    "name": "Día 1",
    "meals": [{ "name": "…" }]
  }]
}`}
			</pre>
		</PreviewShell>
	);
}

export const ONBOARDING_ILLUSTRATIONS = [
	null,
	WeekPreview,
	MealsPreview,
	ImportPreview,
	null,
];
