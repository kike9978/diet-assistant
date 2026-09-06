import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Sheet from "../../components/ui/Sheet";
import { useToast } from "../../components/Toast";
import { DIET_PLAN_IMPORT_PROMPT } from "./dietPlanImportPrompt";

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

const SAMPLE = {
	days: [
		{
			id: "day1",
			name: "Día 1",
			meals: [
				{
					id: "meal1",
					name: "Desayuno: Avena con frutas",
					ingredients: [
						{ name: "Avena", quantity: "1/2 taza" },
						{ name: "Plátano", quantity: "1 pza" },
						{ name: "Berries", quantity: "1/2 taza" },
					],
				},
				{
					id: "meal2",
					name: "Comida: Ensalada de pollo",
					ingredients: [
						{ name: "Pechuga de pollo", quantity: "150g" },
						{ name: "Lechuga", quantity: "2 tazas" },
						{ name: "Aceite de oliva", quantity: "1 cdita" },
					],
				},
				{
					id: "meal3",
					name: "Cena: Salmón con verduras",
					ingredients: [
						{ name: "Salmón", quantity: "150g" },
						{ name: "Brócoli", quantity: "1 taza" },
						{ name: "Arroz integral", quantity: "1/2 taza" },
					],
				},
			],
		},
		{
			id: "day2",
			name: "Día 2",
			meals: [
				{
					id: "meal4",
					name: "Desayuno: Pan con aguacate",
					ingredients: [
						{ name: "Pan integral", quantity: "2 rebanadas" },
						{ name: "Aguacate", quantity: "1 pza" },
						{ name: "Huevo", quantity: "2 pzas" },
					],
				},
				{
					id: "meal5",
					name: "Comida: Bowl de quinoa",
					ingredients: [
						{ name: "Quinoa", quantity: "1/2 taza" },
						{ name: "Frijoles negros", quantity: "1/2 taza" },
						{ name: "Elote", quantity: "1/4 taza" },
					],
				},
			],
		},
	],
};

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
			setError(t`JSON inválido. Revisa la sintaxis.`);
		}
	};

	const handleCopyPrompt = async () => {
		try {
			await navigator.clipboard.writeText(DIET_PLAN_IMPORT_PROMPT);
			setPromptHelpOpen(false);
			toast.success(t`Prompt copiado. Pégalo en un LLM con tu plan.`);
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
					<Trans>¿Cómo cargar el JSON?</Trans>
				) : (
					<Trans>Importar JSON</Trans>
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
									setJsonInput(JSON.stringify(SAMPLE, null, 2));
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
							<Trans>Cargar al borrador</Trans>
						</Button>
					</div>
				)
			}
		>
			{pendingPlan ? (
				<div className="space-y-3">
					<p className="text-sm text-ink-muted">
						<Trans>
							Ya hay planes de día en el borrador. ¿Quieres reemplazarlos con
							este JSON, o añadir los días importados al final?
						</Trans>
					</p>
				</div>
			) : (
				<>
					<p className="text-sm text-ink-muted mb-3">
						<Trans>
							Pega un plan con días y comidas. Copia el prompt, úsalo en un LLM
							externo con tu PDF o notas, y pega aquí el JSON generado.
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
						placeholder={t`Pega aquí el JSON de tu plan…`}
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
							<Trans>Cómo generar el JSON</Trans>
						</h3>
						<p className="text-sm text-ink-muted mb-4">
							<Trans>
								Usa un LLM externo (ChatGPT, Claude, etc.) para convertir tu
								plan en el formato que esta app entiende.
							</Trans>
						</p>
						<ol className="list-decimal list-inside space-y-3 text-sm text-ink mb-6">
							<li>
								<Trans>
									Copia el prompt con el botón de abajo.
								</Trans>
							</li>
							<li>
								<Trans>
									Ábrelo en el LLM y pega el prompt. En el mismo mensaje,
									adjunta tu PDF o imagen del plan de comidas (o pega el texto
									del plan).
								</Trans>
							</li>
							<li>
								<Trans>
									Pide al LLM que responda solo con el JSON del plan.
								</Trans>
							</li>
							<li>
								<Trans>
									Vuelve aquí, pega ese JSON en el cuadro de texto y pulsa
									“Cargar al borrador”.
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
