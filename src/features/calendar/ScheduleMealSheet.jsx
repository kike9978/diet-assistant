import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLingui } from "@lingui/react";
import { useAppState } from "../../context/AppState";
import Sheet from "../../components/ui/Sheet";
import {
	MEAL_TYPE_MSG,
	MEAL_TYPE_OPTIONS,
} from "../meals/mealTypeLabels.js";
import { MEAL_TYPE_COLOR } from "./mealTypeColors.js";

/**
 * Pick a library meal to schedule or replace onto a date.
 */
export default function ScheduleMealSheet({
	open,
	onClose,
	dateISO,
	replaceInstanceId = null,
}) {
	const { state, scheduleMeal, replaceMeal } = useAppState();
	const { _ } = useLingui();
	const [query, setQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState("all");

	const meals = useMemo(() => {
		const q = query.trim().toLowerCase();
		return state.mealLibrary.filter((m) => {
			if (typeFilter !== "all" && m.mealType !== typeFilter) return false;
			if (!q) return true;
			return m.name.toLowerCase().includes(q);
		});
	}, [state.mealLibrary, query, typeFilter]);

	const handlePick = (mealId) => {
		if (replaceInstanceId) {
			replaceMeal(replaceInstanceId, mealId);
		} else {
			scheduleMeal(mealId, dateISO);
		}
		onClose();
	};

	return (
		<Sheet
			open={open}
			onClose={onClose}
			title={
				replaceInstanceId ? (
					<Trans>Reemplazar comida</Trans>
				) : (
					<Trans>Agregar de la biblioteca</Trans>
				)
			}
		>
			<div className="space-y-3 mb-4">
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={t`Buscar comida…`}
					className="w-full min-h-11 px-3 rounded-app border border-border bg-surface"
				/>
				<select
					value={typeFilter}
					onChange={(e) => setTypeFilter(e.target.value)}
					className="w-full min-h-11 px-3 rounded-app border border-border bg-surface"
				>
					<option value="all">
						{t`Todos los tipos`}
					</option>
					{MEAL_TYPE_OPTIONS.map((type) => (
						<option key={type} value={type}>
							{_(MEAL_TYPE_MSG[type])}
						</option>
					))}
				</select>
			</div>

			{meals.length === 0 ? (
				<p className="text-sm text-ink-muted">
					<Trans>
						No hay comidas.{" "}
						<Link
							to={`/meals/new?date=${encodeURIComponent(dateISO)}`}
							className="text-brand underline font-semibold"
							onClick={onClose}
						>
							Crea una
						</Link>
						.
					</Trans>
				</p>
			) : (
				<ul className="space-y-2 max-h-72 overflow-y-auto">
					{meals.map((meal) => (
						<li key={meal.id}>
							<button
								type="button"
								onClick={() => handlePick(meal.id)}
								className="w-full flex items-center gap-3 text-left border border-border rounded-app px-3 py-3 min-h-11 hover:bg-surface-2"
							>
								<span
									className="w-2.5 h-2.5 rounded-full shrink-0"
									style={{
										backgroundColor:
											MEAL_TYPE_COLOR[meal.mealType] || MEAL_TYPE_COLOR.otro,
									}}
									aria-hidden
								/>
								<span className="min-w-0">
									<span className="font-semibold text-ink block truncate">
										{meal.name}
									</span>
									<span className="text-xs text-ink-muted">
										{_(MEAL_TYPE_MSG[meal.mealType] || MEAL_TYPE_MSG.otro)} ·{" "}
										{meal.ingredients.length}{" "}
										<Trans>ingredientes</Trans>
									</span>
								</span>
							</button>
						</li>
					))}
				</ul>
			)}

			<div className="mt-4">
				<Link
					to={`/meals/new?date=${encodeURIComponent(dateISO)}`}
					onClick={onClose}
					className="inline-flex w-full items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-app text-sm font-semibold border border-border bg-surface text-ink hover:bg-surface-2"
				>
					<Trans>Crear comida nueva</Trans>
				</Link>
			</div>
		</Sheet>
	);
}
