import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import Button from "./ui/Button";

const STEPS = [
	{
		title: <Trans>Crea tu primera comida</Trans>,
		body: (
			<Trans>
				Sin pegar JSON: escribe un nombre y unos ingredientes. La verás en tu
				semana al instante.
			</Trans>
		),
	},
	{
		title: <Trans>Arma tu semana</Trans>,
		body: (
			<Trans>
				Desde Calendario asigna plantillas o añade comidas de la biblioteca a
				cada día.
			</Trans>
		),
	},
	{
		title: <Trans>Compra y prepara</Trans>,
		body: (
			<Trans>
				Compras genera la lista de la semana visible. Prep vive ahí mismo —
				nunca pierdes el rumbo con un Home que borra todo.
			</Trans>
		),
	},
];

export default function FirstRun({ onDismiss }) {
	const [step, setStep] = useState(0);
	const navigate = useNavigate();
	const { dismissOnboarding } = useAppState();

	const finish = (goCreate) => {
		dismissOnboarding();
		onDismiss?.();
		if (goCreate) navigate("/meals/new");
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
						<Trans>Crear comida</Trans>
					</Button>
				)}
				<Button variant="ghost" onClick={() => finish(false)}>
					<Trans>Omitir</Trans>
				</Button>
			</div>
		</section>
	);
}
