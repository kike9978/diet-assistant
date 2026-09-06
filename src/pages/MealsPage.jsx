import { Trans } from "@lingui/react/macro";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";

export default function MealsPage() {
	const { state } = useAppState();
	const navigate = useNavigate();
	const meals = state.mealLibrary;

	if (meals.length === 0) {
		return (
			<EmptyState
				title={<Trans>Biblioteca vacía</Trans>}
				description={
					<Trans>
						Guarda comidas reutilizables aquí. Empieza con el creador mínimo.
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
				<Button onClick={() => navigate("/meals/new")}>
					<Trans>Nueva comida</Trans>
				</Button>
			</div>
			<ul className="divide-y divide-border border border-border rounded-app bg-surface overflow-hidden">
				{meals.map((meal) => (
					<li key={meal.id}>
						<Link
							to={`/meals/${meal.id}`}
							className="flex items-center justify-between gap-3 px-4 py-3 min-h-11 hover:bg-surface-2"
						>
							<div>
								<p className="font-semibold text-ink">{meal.name}</p>
								<p className="text-xs text-ink-muted capitalize">
									{meal.mealType} · {meal.ingredients.length}{" "}
									<Trans>ingredientes</Trans>
								</p>
							</div>
							<span className="text-ink-muted">→</span>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
