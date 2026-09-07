import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import Button from "./ui/Button";
import {
	startOfWeek,
	toDateISO,
} from "../features/calendar/dateUtils.js";
import { QUICK_START_DIET_PLAN } from "../features/weekplan/quickStartDietPlan";

const STEPS = [
	{
		title: <Trans>Tu dieta, en el día a día</Trans>,
		body: (
			<Trans>
				Malanga te ayuda a convertir un plan de comidas en una semana
				concreta: calendario, lista de compras y preparación — todo en este
				dispositivo.
			</Trans>
		),
	},
	{
		title: <Trans>Las comidas son la base</Trans>,
		body: (
			<Trans>
				Crea comidas reutilizables en la biblioteca. Con ellas armas planes
				de día y los asignas a la semana.
			</Trans>
		),
	},
	{
		title: <Trans>Importa el plan de tu nutriólogo</Trans>,
		body: (
			<>
				<p>
					<Trans>
						Si ya tienes un PDF o notas, copia el prompt de la app, pégalo en
						un LLM (ChatGPT, Claude, etc.) con tu plan, y vuelve a pegar el
						JSON en «Importar JSON».
					</Trans>
				</p>
				<p className="mt-3">
					<Trans>
						También puedes hablar con el LLM usando esas instrucciones para
						pedirle un plan semanal a tu medida.
					</Trans>
				</p>
			</>
		),
	},
	{
		title: <Trans>Elige cómo empezar</Trans>,
		body: (
			<Trans>
				Importa tu plan con un LLM, prueba el ejemplo de 5 días, o crea
				comidas a mano. Los datos viven en este dispositivo.
			</Trans>
		),
	},
];

/**
 * First-run carousel: what Malanga is, meals, LLM import, then CTAs.
 */
export default function OnboardingModal({ open }) {
	const [step, setStep] = useState(0);
	const navigate = useNavigate();
	const { dismissOnboarding, state } = useAppState();
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const weekStartISO = toDateISO(
		startOfWeek(state.ui.calendarCursorDate, weekStartsOn),
	);
	const weekPath = `/plan/week?week=${encodeURIComponent(weekStartISO)}`;

	useEffect(() => {
		if (open) setStep(0);
	}, [open]);

	if (!open) return null;

	const finish = (next) => {
		dismissOnboarding();
		next?.();
	};

	const current = STEPS[step];
	const isLast = step === STEPS.length - 1;

	return (
		<div className="fixed inset-0 z-[70] overflow-y-auto">
			<div className="flex items-center justify-center min-h-screen p-4 text-center">
				<button
					type="button"
					className="fixed inset-0 bg-ink/40"
					aria-label={t`Cerrar`}
					onClick={() => finish()}
				/>
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="onboarding-title"
					className="relative bg-surface rounded-app shadow-soft max-w-md w-full p-6 text-left"
				>
					<p className="text-xs font-semibold uppercase tracking-wider text-brand mb-2">
						<Trans>
							Paso {step + 1} de {STEPS.length}
						</Trans>
					</p>
					<h2
						id="onboarding-title"
						className="font-display text-2xl text-ink mb-3"
					>
						{current.title}
					</h2>
					<div className="text-sm text-ink-muted mb-6 min-h-[5.5rem]">
						{current.body}
					</div>

					<div
						className="flex justify-center gap-1.5 mb-5"
						aria-hidden
					>
						{STEPS.map((_, i) => (
							<span
								key={i}
								className={`size-1.5 rounded-full transition-colors ${
									i === step ? "bg-brand" : "bg-border"
								}`}
							/>
						))}
					</div>

					{isLast ? (
						<div className="flex flex-col gap-2">
							<Button
								onClick={() =>
									finish(() =>
										navigate(weekPath, { state: { openImport: true } }),
									)
								}
							>
								<Trans>Importar plan con LLM</Trans>
							</Button>
							<Button
								variant="secondary"
								onClick={() =>
									finish(() =>
										navigate(weekPath, {
											state: { dietPlan: QUICK_START_DIET_PLAN },
										}),
									)
								}
							>
								<Trans>Empezar con plan de ejemplo</Trans>
							</Button>
							<Button
								variant="ghost"
								onClick={() => finish(() => navigate("/meals/new"))}
							>
								<Trans>Crear comidas</Trans>
							</Button>
							<Button variant="ghost" onClick={() => finish()}>
								<Trans>Omitir</Trans>
							</Button>
						</div>
					) : (
						<div className="flex flex-wrap gap-2 justify-between">
							<Button variant="ghost" onClick={() => finish()}>
								<Trans>Omitir</Trans>
							</Button>
							<div className="flex flex-wrap gap-2">
								{step > 0 ? (
									<Button
										variant="secondary"
										onClick={() => setStep((s) => s - 1)}
									>
										<Trans>Atrás</Trans>
									</Button>
								) : null}
								<Button onClick={() => setStep((s) => s + 1)}>
									<Trans>Siguiente</Trans>
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
