import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Sheet from "../../components/ui/Sheet";
import { useToast } from "../../components/Toast";
import { DIET_PLAN_IMPORT_PROMPT } from "./dietPlanImportPrompt";
import { QUICK_START_DIET_PLAN } from "./quickStartDietPlan";

function validateDietPlan(plan) {
	if (!plan.days || !Array.isArray(plan.days) || plan.days.length === 0) {
		return false;
	}
	for (const day of plan.days) {
		if (!day.meals || !Array.isArray(day.meals)) return false;
		for (const meal of day.meals) {
			if (!meal.name || !meal.ingredients || !Array.isArray(meal.ingredients)) {
				return false;
			}
			for (const ingredient of meal.ingredients) {
				if (!ingredient.name || ingredient.quantity == null) return false;
			}
		}
	}
	return true;
}

/**
 * Sheet that parses diet JSON and returns the plan via onImport(plan, mode).
 * mode is "replace" | "append".
 */
export default function ImportJsonSheet({
	open,
	onClose,
	onImport,
	hasExistingDayPlans = false,
}) {
	const toast = useToast();
	const [jsonInput, setJsonInput] = useState("");
	const [error, setError] = useState(null);
	const [showExample, setShowExample] = useState(false);
	const [promptHelpOpen, setPromptHelpOpen] = useState(false);
	/** @type {[object | null, function]} */
	const [pendingPlan, setPendingPlan] = useState(null);

	useEffect(() => {
		if (!open) {
			setPendingPlan(null);
			setError(null);
			setPromptHelpOpen(false);
		}
	}, [open]);

	const finishImport = (mode) => {
		if (!pendingPlan) return;
		onImport(pendingPlan, mode);
		setPendingPlan(null);
		setJsonInput("");
		setError(null);
		onClose();
	};

	const handleSubmit = () => {
		try {
			const plan = JSON.parse(jsonInput);
			if (!validateDietPlan(plan)) {
				setError(
					t`Formato de plan inválido. Revisa el ejemplo para el formato correcto.`,
				);
				return;
			}
			setError(null);
			if (!hasExistingDayPlans) {
				onImport(plan, "replace");
				setJsonInput("");
				onClose();
				return;
			}
			setPendingPlan(plan);
		} catch {
			setError(t`No se pudo leer el plan. Revisa que lo hayas pegado completo.`);
		}
	};

	const handleCopyPrompt = async () => {
		try {
			await navigator.clipboard.writeText(DIET_PLAN_IMPORT_PROMPT);
			setPromptHelpOpen(false);
			toast.success(t`Instrucciones copiadas. Pégalas en ChatGPT con tu plan.`);
		} catch {
			toast.error(t`No se pudo copiar el prompt.`);
		}
	};

	const handleClose = () => {
		setPendingPlan(null);
		setPromptHelpOpen(false);
		onClose();
	};

	return (
		<>
		<Sheet
			open={open}
			onClose={handleClose}
			title={
				pendingPlan ? (
					<Trans>¿Cómo cargar el plan?</Trans>
				) : (
					<Trans>Importar plan</Trans>
				)
			}
			footer={
				pendingPlan ? (
					<div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:flex-wrap">
						<Button
							variant="ghost"
							onClick={() => setPendingPlan(null)}
						>
							<Trans>Volver</Trans>
						</Button>
						<Button
							variant="secondary"
							onClick={() => finishImport("append")}
						>
							<Trans>Añadir al plan</Trans>
						</Button>
						<Button onClick={() => finishImport("replace")}>
							<Trans>Reemplazar plan</Trans>
						</Button>
					</div>
				) : (
					<div className="flex flex-wrap gap-2 justify-between">
						<div className="flex flex-wrap gap-2">
							<Button
								variant="secondary"
								onClick={() => {
									setJsonInput(
										JSON.stringify(QUICK_START_DIET_PLAN, null, 2),
									);
									setError(null);
								}}
							>
								<Trans>Usar ejemplo</Trans>
							</Button>
							<Button
								variant="ghost"
								onClick={() => setPromptHelpOpen(true)}
							>
								<Trans>Copiar prompt</Trans>
							</Button>
						</div>
						<Button onClick={handleSubmit}>
							<Trans>Cargar plan</Trans>
						</Button>
					</div>
				)
			}
		>
			{pendingPlan ? (
				<div className="space-y-3">
					<p className="text-sm text-ink-muted">
						<Trans>
							Ya hay planes de día. ¿Quieres reemplazarlos con este plan, o
							añadir los días importados al final?
						</Trans>
					</p>
				</div>
			) : (
				<>
					<p className="text-sm text-ink-muted mb-3">
						<Trans>
							Pega aquí tu plan de comidas. Si lo tienes en PDF o notas, copia
							las instrucciones, pégalas en ChatGPT (u otra IA) junto con tu
							plan, y vuelve a pegar la respuesta aquí.
						</Trans>
					</p>
					<button
						type="button"
						className="text-sm text-brand font-semibold mb-2"
						onClick={() => setShowExample((v) => !v)}
					>
						{showExample ? (
							<Trans>Ocultar ejemplo</Trans>
						) : (
							<Trans>Mostrar ejemplo</Trans>
						)}
					</button>
					{showExample ? (
						<pre className="text-xs bg-surface-2 rounded-app p-3 mb-3 overflow-auto max-h-40">
							{`{
  "days": [
    {
      "name": "Día 1",
      "meals": [
        {
          "name": "Desayuno: Avena",
          "flavorText": "Cocer la avena y servir con fruta.",
          "ingredients": [
            { "name": "Avena", "quantity": "1/2 taza" }
          ]
        }
      ]
    }
  ]
}`}
						</pre>
					) : null}
					<textarea
						value={jsonInput}
						onChange={(e) => setJsonInput(e.target.value)}
						className="w-full h-48 p-3 border border-border rounded-app bg-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
						placeholder={t`Pega aquí el plan que te devolvió la IA…`}
					/>
					{error ? (
						<p className="text-sm text-[var(--color-danger)] mt-2">{error}</p>
					) : null}
				</>
			)}
		</Sheet>

		{promptHelpOpen ? (
			<div className="fixed inset-0 z-[60] overflow-y-auto">
				<div className="flex items-center justify-center min-h-screen p-4 text-center">
					<button
						type="button"
						className="fixed inset-0 bg-ink/40"
						aria-label={t`Cerrar`}
						onClick={() => setPromptHelpOpen(false)}
					/>
					<div
						role="dialog"
						aria-modal="true"
						className="relative bg-surface rounded-app shadow-soft max-w-md w-full p-6 text-left"
					>
						<h3 className="font-display text-xl text-ink mb-2">
							<Trans>Cómo preparar tu plan</Trans>
						</h3>
						<p className="text-sm text-ink-muted mb-4">
							<Trans>
								Usa ChatGPT, Claude u otra IA para convertir tu PDF o notas al
								formato que Malanga entiende. Si el plan trae notas de
								preparación, pueden incluirse como descripción de cada comida.
							</Trans>
						</p>
						<ol className="list-decimal list-inside space-y-3 text-sm text-ink mb-6">
							<li>
								<Trans>
									Copia las instrucciones con el botón de abajo.
								</Trans>
							</li>
							<li>
								<Trans>
									Ábrelo en la IA y pega las instrucciones. En el mismo
									mensaje, adjunta tu PDF o imagen del plan (o pega el texto).
								</Trans>
							</li>
							<li>
								<Trans>
									Pide que responda solo con el plan en el formato pedido.
								</Trans>
							</li>
							<li>
								<Trans>
									Vuelve aquí, pega la respuesta en el cuadro de texto y pulsa
									“Cargar plan”.
								</Trans>
							</li>
						</ol>
						<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
							<Button
								variant="secondary"
								onClick={() => setPromptHelpOpen(false)}
							>
								<Trans>Cancelar</Trans>
							</Button>
							<Button onClick={handleCopyPrompt}>
								<Trans>Copiar prompt y continuar</Trans>
							</Button>
						</div>
					</div>
				</div>
			</div>
		) : null}
		</>
	);
}
