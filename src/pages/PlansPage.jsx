import { Trans } from "@lingui/react/macro";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import DietPlanUploader from "../components/DietPlanUploader";
import Button from "../components/ui/Button";

export default function PlansPage() {
	const { importDietPlan, state, saveCurrentAsTemplate } = useAppState();
	const navigate = useNavigate();

	const handleUpload = (plan) => {
		importDietPlan(plan, `Plan ${state.dietTemplates.length + 1}`);
		navigate("/");
	};

	return (
		<div className="space-y-8 max-w-2xl">
			<div>
				<h1 className="font-display text-2xl mb-2">
					<Trans>Planes</Trans>
				</h1>
				<p className="text-sm text-ink-muted mb-4">
					<Trans>
						Importa un plan JSON o guarda la plantilla actual. Las plantillas no
						se borran al reiniciar el plan semanal.
					</Trans>
				</p>
				<div className="bg-surface border border-border rounded-app p-6 shadow-soft">
					<DietPlanUploader onUpload={handleUpload} />
				</div>
			</div>

			{state.dietTemplates.length > 0 ? (
				<div>
					<div className="flex items-center justify-between mb-3">
						<h2 className="font-display text-lg">
							<Trans>Plantillas guardadas</Trans>
						</h2>
						<Button variant="secondary" onClick={() => saveCurrentAsTemplate()}>
							<Trans>Duplicar plantilla activa</Trans>
						</Button>
					</div>
					<ul className="space-y-2">
						{state.dietTemplates.map((t) => (
							<li
								key={t.id}
								className="bg-surface border border-border rounded-app px-4 py-3 flex justify-between gap-3"
							>
								<div>
									<p className="font-semibold">{t.name}</p>
									<p className="text-xs text-ink-muted">
										{t.dayTemplateIds.length} <Trans>días</Trans>
									</p>
								</div>
							</li>
						))}
					</ul>
				</div>
			) : null}
		</div>
	);
}
