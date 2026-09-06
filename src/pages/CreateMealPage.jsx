import { Trans } from "@lingui/react/macro";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "../context/AppState";
import MealForm from "../features/meals/MealForm";

/**
 * Create a library meal. Scheduling onto the calendar is done by assigning a
 * whole day plan — never by attaching a single meal to a date.
 */
export default function CreateMealPage() {
	const { createMeal } = useAppState();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const returnToPlan = searchParams.get("plan");

	const handleSubmit = (payload) => {
		createMeal(payload);
		if (returnToPlan) {
			navigate(`/plan/week?week=${encodeURIComponent(returnToPlan)}`);
			return;
		}
		navigate("/meals");
	};

	return (
		<div className="max-w-lg mx-auto">
			<h1 className="font-display text-2xl mb-2">
				<Trans>Crear comida</Trans>
			</h1>
			<p className="text-sm text-ink-muted mb-6">
				<Trans>
					Se guarda en la biblioteca sin agendarla en el calendario.
				</Trans>
			</p>

			<MealForm
				submitLabel={<Trans>Guardar en biblioteca</Trans>}
				onSubmit={handleSubmit}
				onCancel={() => navigate(-1)}
			/>
		</div>
	);
}
