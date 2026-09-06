import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { ChevronRight } from "lucide-react";
import { MEAL_TYPE_MSG } from "../features/meals/mealTypeLabels.js";
import { MEAL_TYPE_COLOR } from "../features/calendar/mealTypeColors.js";

export default function MealsPage() {
	const { state } = useAppState();
	const navigate = useNavigate();
	const { _ } = useLingui();
	const meals = state.mealLibrary;

	if (meals.length === 0) {
		return (
			<EmptyState
				title={<Trans>Biblioteca vacía</Trans>}
				description={
					<Trans>
						Guarda comidas reutilizables aquí. Empieza con el creador o importa
						un plan.
					</Trans>
				}
				actionLabel={<Trans>Crear comida</Trans>}
				onAction={() => navigate("/meals/new")}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3 flex-wrap">
				<h1 className="font-display text-2xl">
					<Trans>Comidas</Trans>
				</h1>
				<div className="flex gap-2">
					<Button variant="secondary" onClick={() => navigate("/plans")}>
						<Trans>Importar plan</Trans>
					</Button>
					<Button onClick={() => navigate("/meals/new?library=1")}>
						<Trans>Nueva comida</Trans>
					</Button>
				</div>
			</div>
			<ul className="divide-y divide-border border border-border rounded-app bg-surface overflow-hidden">
				{meals.map((meal) => (
					<li key={meal.id}>
						<Link
							to={`/meals/${meal.id}`}
							className="flex items-center justify-between gap-3 px-4 py-3 min-h-11 hover:bg-surface-2"
						>
							<div className="flex items-center gap-3 min-w-0">
								<span
									className="w-2.5 h-2.5 rounded-full shrink-0"
									style={{
										backgroundColor:
											MEAL_TYPE_COLOR[meal.mealType] || MEAL_TYPE_COLOR.otro,
									}}
									aria-hidden
								/>
								<div className="min-w-0">
									<p className="font-semibold text-ink truncate">{meal.name}</p>
									<p className="text-xs text-ink-muted">
										{_(MEAL_TYPE_MSG[meal.mealType] || MEAL_TYPE_MSG.otro)} ·{" "}
										{meal.ingredients.length} <Trans>ingredientes</Trans>
									</p>
								</div>
							</div>
							<ChevronRight className="size-4 text-ink-muted shrink-0" aria-hidden />
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
