import { Trans } from "@lingui/react/macro";
import { useParams, Link } from "react-router-dom";
import { useAppState } from "../context/AppState";
import { formatQuantity } from "../domain/quantity.js";

export default function MealDetailPage() {
	const { id } = useParams();
	const { state } = useAppState();
	const meal = state.mealLibrary.find((m) => m.id === id);

	if (!meal) {
		return (
			<p className="text-ink-muted">
				<Trans>Comida no encontrada.</Trans>{" "}
				<Link to="/meals" className="text-brand underline">
					<Trans>Volver</Trans>
				</Link>
			</p>
		);
	}

	return (
		<div className="max-w-lg">
			<p className="text-xs uppercase tracking-wide text-ink-muted mb-1">
				{meal.mealType}
			</p>
			<h1 className="font-display text-2xl mb-4">{meal.name}</h1>
			<ul className="space-y-2 border border-border rounded-app bg-surface p-4">
				{meal.ingredients.map((ing) => (
					<li key={ing.id} className="flex justify-between gap-3 text-sm">
						<span>{ing.name}</span>
						<span className="text-ink-muted">
							{formatQuantity(ing.quantity)}
						</span>
					</li>
				))}
			</ul>
			<p className="mt-4 text-sm text-ink-muted">
				<Trans>
					El editor completo llega en la siguiente fase. Por ahora puedes crear
					más comidas desde
				</Trans>{" "}
				<Link to="/meals/new" className="text-brand underline">
					<Trans>Nueva comida</Trans>
				</Link>
				.
			</p>
		</div>
	);
}
