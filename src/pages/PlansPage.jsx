import { Trans } from "@lingui/react/macro";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import DietPlanUploader from "../components/DietPlanUploader";
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

	return (
		<div className="space-y-8 max-w-2xl">
			<div>
				<h1 className="font-display text-2xl mb-2">
					<Trans>Planes</Trans>
				</h1>
				<p className="text-sm text-ink-muted mb-4">
					<Trans>
						Importa un JSON como planes de día de la semana visible. Luego
						asígnalos a Mon–Dom en la vista Semana.
					</Trans>
				</p>
				<div className="bg-surface border border-border rounded-app p-6 shadow-soft space-y-4">
					<DietPlanUploader onUpload={handleUploadToWeek} />
					<p className="text-sm text-center">
						<button
							type="button"
							className="text-brand font-semibold underline"
							onClick={() =>
								navigate(
									`/plan/week?week=${encodeURIComponent(weekStartISO)}`,
								)
							}
						>
							<Trans>Editar plan de esta semana</Trans>
						</button>
					</p>
				</div>
			</div>
		</div>
	);
}
