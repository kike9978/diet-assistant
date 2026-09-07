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
import { ONBOARDING_ILLUSTRATIONS } from "./OnboardingIllustrations";

const STEP_STORAGE_KEY = "malanga:onboardingStep";

const LOCALES = [
	{ value: "es", label: "Español", hint: "ES" },
	{ value: "en", label: "English", hint: "EN" },
];

const STEPS = [
	{
		kind: "locale",
		title: <Trans>Idioma / Language</Trans>,
		body: (
			<Trans>
				Elige el idioma de la app. / Choose the app language.
			</Trans>
		),
	},
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
						Si ya tienes un PDF o notas, copia las instrucciones de la app,
						pégalas en ChatGPT (u otra IA) con tu plan, y vuelve a pegar la
						respuesta en «Importar plan».
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

function readStoredStep() {
	try {
		const n = Number(sessionStorage.getItem(STEP_STORAGE_KEY));
		if (Number.isInteger(n) && n >= 0 && n < STEPS.length) return n;
	} catch {
		/* ignore */
	}
	return 0;
}

/**
 * First-run carousel: language, what Malanga is, meals, LLM import, then CTAs.
 */
export default function OnboardingModal({ open }) {
	const [step, setStep] = useState(readStoredStep);
	const navigate = useNavigate();
	const { dismissOnboarding, setLocale, state } = useAppState();
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const locale = state.settings.locale || "es";
	const weekStartISO = toDateISO(
		startOfWeek(state.ui.calendarCursorDate, weekStartsOn),
	);
	const weekPath = `/plan/week?week=${encodeURIComponent(weekStartISO)}`;

	useEffect(() => {
		if (!open) {
			try {
				sessionStorage.removeItem(STEP_STORAGE_KEY);
			} catch {
				/* ignore */
			}
			return;
		}
		try {
			sessionStorage.setItem(STEP_STORAGE_KEY, String(step));
		} catch {
			/* ignore */
		}
	}, [open, step]);

	if (!open) return null;

	const finish = (next) => {
		try {
			sessionStorage.removeItem(STEP_STORAGE_KEY);
		} catch {
			/* ignore */
		}
		dismissOnboarding();
		next?.();
	};

	const current = STEPS[step];
	const Illustration = ONBOARDING_ILLUSTRATIONS[step];
	const isLast = step === STEPS.length - 1;
	const isLocaleStep = current.kind === "locale";

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
					className="relative bg-surface rounded-app shadow-soft max-w-md w-full p-6 text-left max-h-[90dvh] overflow-y-auto"
				>
					<p className="text-xs font-semibold uppercase tracking-wider text-brand mb-2">
						<Trans>
							Paso {step + 1} de {STEPS.length}
						</Trans>
					</p>

					{Illustration ? <Illustration /> : null}

					<h2
						id="onboarding-title"
						className="font-display text-2xl text-ink mb-2"
					>
						{current.title}
					</h2>
					<div className="text-sm text-ink-muted mb-4 min-h-[3rem]">
						{current.body}
					</div>

					{isLocaleStep ? (
						<div
							className="flex flex-col gap-2 mb-5"
							role="radiogroup"
							aria-label={t`Idioma`}
						>
							{LOCALES.map((opt) => {
								const selected = locale === opt.value;
								return (
									<button
										key={opt.value}
										type="button"
										role="radio"
										aria-checked={selected}
										onClick={() => setLocale(opt.value)}
										className={`flex items-center justify-between min-h-11 px-4 rounded-app border text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${
											selected
												? "border-brand bg-brand/10 text-ink"
												: "border-border bg-surface text-ink hover:bg-surface-2"
										}`}
									>
										<span>{opt.label}</span>
										<span
											className={`text-xs tabular-nums ${
												selected ? "text-brand" : "text-ink-muted"
											}`}
										>
											{opt.hint}
										</span>
									</button>
								);
							})}
						</div>
					) : null}

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
