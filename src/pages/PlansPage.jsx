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
	const { importDietPlan, state, saveCurrentAsTemplate } = useAppState();
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

	const handleUploadAsTemplate = (plan) => {
		importDietPlan(plan, `Plan ${state.dietTemplates.length + 1}`);
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

			{state.dietTemplates.length > 0 ? (
				<div>
					<div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
						<h2 className="font-display text-lg">
							<Trans>Plantillas guardadas</Trans>
						</h2>
						<Button variant="secondary" onClick={() => saveCurrentAsTemplate()}>
							<Trans>Duplicar plantilla activa</Trans>
						</Button>
					</div>
					<ul className="space-y-2">
						{state.dietTemplates.map((tmpl) => (
							<li
								key={tmpl.id}
								className="bg-surface border border-border rounded-app px-4 py-3 flex justify-between gap-3"
							>
								<div>
									<p className="font-semibold">{tmpl.name}</p>
									<p className="text-xs text-ink-muted">
										{tmpl.dayTemplateIds.length} <Trans>días</Trans>
									</p>
								</div>
							</li>
						))}
					</ul>
				</div>
			) : null}

			<div className="border border-dashed border-border rounded-app p-4">
				<p className="text-sm text-ink-muted mb-3">
					<Trans>
						¿Solo quieres plantillas en la biblioteca sin un plan de semana?
					</Trans>
				</p>
				<details className="text-sm">
					<summary className="cursor-pointer text-brand font-semibold">
						<Trans>Importar solo como plantilla</Trans>
					</summary>
					<div className="mt-3">
						<DietPlanUploader onUpload={handleUploadAsTemplate} />
					</div>
				</details>
			</div>
		</div>
	);
}
