import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { INGREDIENT_CATEGORIES } from "../../domain/ingredient.js";
import { formatQuantity } from "../../domain/quantity.js";
import Button from "../../components/ui/Button";
import Sheet from "../../components/ui/Sheet";

/**
 * Add or edit a pantry inventory row.
 */
export default function PantryFormSheet({
	open,
	onClose,
	onSubmit,
	initial = null,
}) {
	const [name, setName] = useState("");
	const [quantity, setQuantity] = useState("");
	const [category, setCategory] = useState("Verduras");
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!open) return;
		if (initial) {
			setName(initial.name || "");
			setQuantity(
				typeof initial.quantity === "string"
					? initial.quantity
					: formatQuantity(initial.quantity),
			);
			setCategory(initial.category || "Verduras");
		} else {
			setName("");
			setQuantity("");
			setCategory("Verduras");
		}
		setError(null);
	}, [open, initial]);

	const handleSubmit = (e) => {
		e.preventDefault();
		const trimmed = name.trim();
		const qty = quantity.trim();
		if (!trimmed || !qty) {
			setError(t`Nombre y cantidad son obligatorios.`);
			return;
		}
		onSubmit({ name: trimmed, quantity: qty, category });
		onClose();
	};

	return (
		<Sheet
			open={open}
			onClose={onClose}
			title={
				initial ? (
					<Trans>Editar en despensa</Trans>
				) : (
					<Trans>Añadir a la despensa</Trans>
				)
			}
			footer={
				<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>
						<Trans>Cancelar</Trans>
					</Button>
					<Button type="submit" form="pantry-form">
						{initial ? <Trans>Guardar</Trans> : <Trans>Añadir</Trans>}
					</Button>
				</div>
			}
		>
			<form id="pantry-form" onSubmit={handleSubmit} className="space-y-3">
				<label className="block">
					<span className="text-sm font-semibold">
						<Trans>Nombre</Trans>
					</span>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="mt-1 w-full min-h-11 px-3 rounded-app border border-border bg-surface"
						placeholder={t`Ej. Arroz`}
						autoFocus
					/>
				</label>
				<label className="block">
					<span className="text-sm font-semibold">
						<Trans>Cantidad</Trans>
					</span>
					<input
						value={quantity}
						onChange={(e) => setQuantity(e.target.value)}
						className="mt-1 w-full min-h-11 px-3 rounded-app border border-border bg-surface"
						placeholder={t`Ej. 2 tza`}
					/>
				</label>
				<label className="block">
					<span className="text-sm font-semibold">
						<Trans>Categoría</Trans>
					</span>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className="mt-1 w-full min-h-11 px-3 rounded-app border border-border bg-surface"
					>
						{Object.keys(INGREDIENT_CATEGORIES).map((cat) => (
							<option key={cat} value={cat}>
								{cat}
							</option>
						))}
					</select>
				</label>
				{error ? (
					<p className="text-sm text-[var(--color-danger)]">{error}</p>
				) : null}
			</form>
		</Sheet>
	);
}
