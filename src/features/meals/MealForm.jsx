import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useState } from "react";
import { formatQuantity } from "../../domain/quantity.js";
import { inferMealType } from "../../domain/mealType.js";
import Button from "../../components/ui/Button";
import { MEAL_TYPE_MSG, MEAL_TYPE_OPTIONS } from "./mealTypeLabels.js";

function rowsFromMeal(meal) {
	if (!meal?.ingredients?.length) return [{ name: "", quantity: "" }];
	return meal.ingredients.map((ing) => ({
		name: ing.name || "",
		quantity:
			typeof ing.quantity === "string"
				? ing.quantity
				: formatQuantity(ing.quantity),
	}));
}

/**
 * Fuller meal builder: name, type, servings, ingredients.
 */
export default function MealForm({
	initialMeal = null,
	submitLabel,
	onSubmit,
	onCancel,
	secondaryAction = null,
}) {
	const { _ } = useLingui();
	const [name, setName] = useState(initialMeal?.name || "");
	const [mealType, setMealType] = useState(
		initialMeal?.mealType || "otro",
	);
	const [servings, setServings] = useState(initialMeal?.servings ?? 1);
	const [rows, setRows] = useState(() => rowsFromMeal(initialMeal));
	const [error, setError] = useState(null);
	const [autoType, setAutoType] = useState(!initialMeal);

	const updateRow = (index, field, value) => {
		setRows((prev) =>
			prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
		);
	};

	const removeRow = (index) => {
		setRows((prev) =>
			prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
		);
	};

	const addRow = () => setRows((prev) => [...prev, { name: "", quantity: "" }]);

	const handleNameChange = (value) => {
		setName(value);
		if (autoType) {
			setMealType(inferMealType(value));
		}
	};

	const handleSubmit = (e, extra = {}) => {
		e.preventDefault();
		const trimmedName = name.trim();
		const ingredients = rows
			.map((r) => ({ name: r.name.trim(), quantity: r.quantity.trim() }))
			.filter((r) => r.name && r.quantity);

		if (!trimmedName) {
			setError(t`Ponle un nombre a la comida.`);
			return;
		}
		if (ingredients.length === 0) {
			setError(t`Añade al menos un ingrediente con cantidad.`);
			return;
		}

		onSubmit({
			name: trimmedName,
			mealType,
			servings: Number(servings) || 1,
			ingredients,
			...extra,
		});
	};

	return (
		<form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
			<label className="block">
				<span className="text-sm font-semibold">
					<Trans>Nombre</Trans>
				</span>
				<input
					value={name}
					onChange={(e) => handleNameChange(e.target.value)}
					className="mt-1 w-full min-h-11 px-3 rounded-app border border-border bg-surface"
					placeholder={t`Desayuno: Avena con fruta`}
					autoFocus
				/>
			</label>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<label className="block">
					<span className="text-sm font-semibold">
						<Trans>Tipo</Trans>
					</span>
					<select
						value={mealType}
						onChange={(e) => {
							setAutoType(false);
							setMealType(e.target.value);
						}}
						className="mt-1 w-full min-h-11 px-3 rounded-app border border-border bg-surface"
					>
						{MEAL_TYPE_OPTIONS.map((type) => (
							<option key={type} value={type}>
								{_(MEAL_TYPE_MSG[type])}
							</option>
						))}
					</select>
				</label>
				<label className="block">
					<span className="text-sm font-semibold">
						<Trans>Porciones</Trans>
					</span>
					<input
						type="number"
						min={1}
						step={1}
						value={servings}
						onChange={(e) => setServings(e.target.value)}
						className="mt-1 w-full min-h-11 px-3 rounded-app border border-border bg-surface"
					/>
				</label>
			</div>

			<div className="space-y-2">
				<p className="text-sm font-semibold">
					<Trans>Ingredientes</Trans>
				</p>
				{rows.map((row, index) => (
					<div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
						<input
							value={row.name}
							onChange={(e) => updateRow(index, "name", e.target.value)}
							placeholder={t`Ingrediente`}
							className="min-h-11 px-3 rounded-app border border-border bg-surface"
						/>
						<input
							value={row.quantity}
							onChange={(e) => updateRow(index, "quantity", e.target.value)}
							placeholder={t`1/2 tza`}
							className="min-h-11 px-3 rounded-app border border-border bg-surface"
						/>
						<Button
							type="button"
							variant="ghost"
							className="!px-2"
							aria-label={t`Quitar ingrediente`}
							onClick={() => removeRow(index)}
						>
							×
						</Button>
					</div>
				))}
				<Button type="button" variant="secondary" onClick={addRow}>
					<Trans>Otro ingrediente</Trans>
				</Button>
			</div>

			{error ? (
				<p className="text-sm text-[var(--color-danger)]">{error}</p>
			) : null}

			<div className="flex flex-wrap gap-2 pt-2">
				<Button type="submit">{submitLabel}</Button>
				{secondaryAction ? (
					<Button
						type="button"
						variant="secondary"
						onClick={(e) => handleSubmit(e, secondaryAction.extra || {})}
					>
						{secondaryAction.label}
					</Button>
				) : null}
				{onCancel ? (
					<Button type="button" variant="ghost" onClick={onCancel}>
						<Trans>Cancelar</Trans>
					</Button>
				) : null}
			</div>
		</form>
	);
}
