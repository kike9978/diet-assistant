import { Trans } from "@lingui/react/macro";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import DietPlanUploader from "../components/DietPlanUploader";
import Button from "../components/ui/Button";
import {
	startOfWeek,
	toDateISO,
} from "../features/calendar/dateUtils.js";

export default function PlansPage() {
	const { state } = useAppState();
	const navigate = useNavigate();
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const weekStartISO = toDateISO(
		startOfWeek(state.ui.calendarCursorDate, weekStartsOn),
	);

	const handleUploadToWeek = (plan) => {
		navigate(`/plan/week?week=${encodeURIComponent(weekStartISO)}`, {
			state: { dietPlan: plan },
		});
	};

	const goEditWeek = () => {
		navigate(`/plan/week?week=${encodeURIComponent(weekStartISO)}`);
	};

	return (
		<div className="space-y-8 max-w-2xl">
			<div>
				<h1 className="font-display text-2xl mb-2">
					<Trans>Planes</Trans>
				</h1>
				<p className="text-sm text-ink-muted mb-4">
					<Trans>
						Arma planes de día para la semana visible y asígnalos en la vista
						Semana. Crear comidas en la biblioteca es el camino habitual.
					</Trans>
				</p>
				<div className="bg-surface border border-border rounded-app p-6 shadow-soft space-y-4">
					<Button onClick={goEditWeek} className="w-full sm:w-auto">
						<Trans>Editar plan de esta semana</Trans>
					</Button>
					<p className="text-sm text-ink-muted">
						<button
							type="button"
							className="text-brand font-semibold underline"
							onClick={() => navigate("/meals/new")}
						>
							<Trans>Crear comida</Trans>
						</button>
						{" · "}
						<button
							type="button"
							className="underline"
							onClick={() => {
								navigate("/");
							}}
						>
							<Trans>Ir al calendario</Trans>
						</button>
					</p>
				</div>
			</div>

			<div>
				<h2 className="font-display text-xl mb-2">
					<Trans>Avanzado</Trans>
				</h2>
				<p className="text-sm text-ink-muted mb-4">
					<Trans>
						Importa un JSON como planes de día de la semana visible. Luego
						asígnalos a Mon–Dom en la vista Semana.
					</Trans>
				</p>
				<div className="bg-surface border border-border rounded-app p-6 shadow-soft">
					<DietPlanUploader onUpload={handleUploadToWeek} />
				</div>
			</div>
		</div>
	);
}
