import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import Button from "./ui/Button";
import {
	startOfWeek,
	toDateISO,
} from "../features/calendar/dateUtils.js";

const STEPS = [
	{
		title: <Trans>Edita el plan de una semana</Trans>,
		body: (
			<Trans>
				En el mes, cada fila es una semana. Usa «Editar plan de semana» para
				armar planes de día con comidas de la biblioteca o un JSON.
			</Trans>
		),
	},
	{
		title: <Trans>Asigna en la vista Semana</Trans>,
		body: (
			<Trans>
				Ahí eliges qué plan de día va en cada weekday y lo aplicas al
				calendario. Luego puedes ajustar comidas día a día.
			</Trans>
		),
	},
	{
		title: <Trans>Compra y prepara</Trans>,
		body: (
			<Trans>
				Compras usa la semana visible del calendario. Prep vive en la misma
				sección.
			</Trans>
		),
	},
];

export default function FirstRun({ onDismiss }) {
	const [step, setStep] = useState(0);
	const navigate = useNavigate();
	const { dismissOnboarding, state } = useAppState();
	const weekStartsOn = state.settings.weekStartsOn ?? 1;
	const weekStartISO = toDateISO(
		startOfWeek(state.ui.calendarCursorDate, weekStartsOn),
	);

	const finish = (goEdit) => {
		dismissOnboarding();
		onDismiss?.();
		if (goEdit) {
			navigate(`/plan/week?week=${encodeURIComponent(weekStartISO)}`);
		}
	};

	const current = STEPS[step];
	const isLast = step === STEPS.length - 1;

	return (
		<section className="relative overflow-hidden rounded-app bg-gradient-to-br from-[var(--color-accent-citrus)]/25 via-surface to-[var(--color-accent-leaf)]/20 border border-border p-6 sm:p-8 shadow-soft mb-6">
			<p className="text-xs font-semibold uppercase tracking-wider text-brand mb-2">
				<Trans>
					Paso {step + 1} de {STEPS.length}
				</Trans>
			</p>
			<h2 className="font-display text-2xl sm:text-3xl text-ink mb-2">
				{current.title}
			</h2>
			<p className="text-ink-muted text-sm sm:text-base max-w-prose mb-6">
				{current.body}
			</p>
			<div className="flex flex-wrap gap-2">
				{!isLast ? (
					<Button onClick={() => setStep((s) => s + 1)}>
						<Trans>Siguiente</Trans>
					</Button>
				) : (
					<Button onClick={() => finish(true)}>
						<Trans>Editar plan de esta semana</Trans>
					</Button>
				)}
				<Button variant="ghost" onClick={() => finish(false)}>
					<Trans>Omitir</Trans>
				</Button>
			</div>
		</section>
	);
}
