import { Trans } from "@lingui/react/macro";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import MealLibraryBrowser from "../features/meals/MealLibraryBrowser.jsx";

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
			<MealLibraryBrowser
				meals={meals}
				onSelect={(meal) => navigate(`/meals/${meal.id}`)}
			/>
		</div>
	);
}
