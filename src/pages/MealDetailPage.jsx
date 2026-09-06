import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppState } from "../context/AppState";
import { formatQuantity } from "../domain/quantity.js";
import MealForm from "../features/meals/MealForm";
import { MEAL_TYPE_MSG } from "../features/meals/mealTypeLabels.js";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";

export default function MealDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { state, updateMeal, deleteMeal } = useAppState();
	const { _ } = useLingui();
	const meal = state.mealLibrary.find((m) => m.id === id);
	const [editing, setEditing] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

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

	const inUse = Object.values(state.calendars || {}).some((days) =>
		Object.values(days || {}).some((meals) =>
			(meals || []).some((m) => m.mealId === meal.id),
		),
	);

	if (editing) {
		return (
			<div className="max-w-lg">
				<h1 className="font-display text-2xl mb-4">
					<Trans>Editar comida</Trans>
				</h1>
				<MealForm
					initialMeal={meal}
					submitLabel={<Trans>Guardar cambios</Trans>}
					onSubmit={(payload) => {
						updateMeal(meal.id, payload);
						setEditing(false);
					}}
					onCancel={() => setEditing(false)}
				/>
			</div>
		);
	}

	return (
		<div className="max-w-lg space-y-4">
			<div>
				<p className="text-xs uppercase tracking-wide text-ink-muted mb-1">
					{_(MEAL_TYPE_MSG[meal.mealType] || MEAL_TYPE_MSG.otro)}
				</p>
				<h1 className="font-display text-2xl mb-1">{meal.name}</h1>
				<p className="text-sm text-ink-muted">
					{meal.servings === 1 ? (
						<Trans>1 porción</Trans>
					) : (
						<Trans>{meal.servings} porciones</Trans>
					)}
				</p>
			</div>

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

			<div className="flex flex-wrap gap-2">
				<Button variant="secondary" onClick={() => setEditing(true)}>
					<Trans>Editar</Trans>
				</Button>
				<Button variant="danger" onClick={() => setConfirmDelete(true)}>
					<Trans>Eliminar</Trans>
				</Button>
			</div>

			<p className="text-sm text-ink-muted">
				<Trans>
					Para poner comidas en el calendario, arma un plan de día y asígnalo a
					una fecha.
				</Trans>{" "}
				<Link to="/" className="text-brand underline font-semibold">
					<Trans>Ir al calendario</Trans>
				</Link>
			</p>

			<Link to="/meals" className="text-sm text-brand underline font-semibold">
				<Trans>Volver a comidas</Trans>
			</Link>

			<ConfirmDialog
				open={confirmDelete}
				danger
				title={<Trans>Eliminar comida</Trans>}
				description={
					inUse ? (
						<Trans>
							Esta comida está en el calendario. Se quitará de la biblioteca;
							las instancias agendadas se quedan como snapshot.
						</Trans>
					) : (
						<Trans>¿Eliminar esta comida de la biblioteca?</Trans>
					)
				}
				confirmLabel={<Trans>Eliminar</Trans>}
				onConfirm={() => {
					deleteMeal(meal.id);
					setConfirmDelete(false);
					navigate("/meals");
				}}
				onCancel={() => setConfirmDelete(false)}
			/>
		</div>
	);
}
