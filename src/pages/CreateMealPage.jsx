import { Trans } from "@lingui/react/macro";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "../context/AppState";
import { todayISO } from "../features/calendar/dateUtils.js";
import MealForm from "../features/meals/MealForm";

export default function CreateMealPage() {
	const { createMealAndSchedule, createMeal } = useAppState();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const scheduleDate =
		searchParams.get("date") && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.get("date"))
			? searchParams.get("date")
			: todayISO();
	const libraryOnly = searchParams.get("library") === "1";
	const schedulingToday = scheduleDate === todayISO();

	const handleSubmit = (payload) => {
		if (libraryOnly || payload.libraryOnly) {
			createMeal(payload);
			navigate("/meals");
			return;
		}
		createMealAndSchedule({
			...payload,
			dateISO: scheduleDate,
		});
		navigate("/");
	};

	return (
		<div className="max-w-lg mx-auto">
			<h1 className="font-display text-2xl mb-2">
				<Trans>Crear comida</Trans>
			</h1>
			<p className="text-sm text-ink-muted mb-6">
				{libraryOnly ? (
					<Trans>
						Se guarda en la biblioteca sin agendarla en el calendario.
					</Trans>
				) : schedulingToday ? (
					<Trans>
						Nombre, tipo e ingredientes. Se guarda en la biblioteca y se agenda
						para hoy.
					</Trans>
				) : (
					<Trans>
						Nombre, tipo e ingredientes. Se guarda en la biblioteca y se agenda
						para el día seleccionado.
					</Trans>
				)}
			</p>

			<MealForm
				submitLabel={
					libraryOnly ? (
						<Trans>Guardar en biblioteca</Trans>
					) : (
						<Trans>Guardar y ver en la semana</Trans>
					)
				}
				secondaryAction={
					libraryOnly
						? null
						: {
								label: <Trans>Solo biblioteca</Trans>,
								extra: { libraryOnly: true },
							}
				}
				onSubmit={handleSubmit}
				onCancel={() => navigate(-1)}
			/>
		</div>
	);
}
