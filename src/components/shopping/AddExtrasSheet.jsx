import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { INGREDIENT_CATEGORIES } from "../../domain/ingredient.js";
import Button from "../ui/Button";
import Sheet from "../ui/Sheet";

const DEFAULT_CATEGORY = "Verduras";

function emptyRow() {
	return { name: "", quantity: "", category: DEFAULT_CATEGORY };
}

/**
 * Modal to add one or more shopping extras before submitting.
 */
export default function AddExtrasSheet({ open, onClose, onSubmit }) {
	const [rows, setRows] = useState([emptyRow()]);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (open) {
			setRows([emptyRow()]);
			setError(null);
		}
	}, [open]);

	const updateRow = (index, field, value) => {
		setRows((prev) =>
			prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
		);
	};

	const addRow = () => setRows((prev) => [...prev, emptyRow()]);

	const removeRow = (index) => {
		setRows((prev) =>
			prev.length <= 1 ? [emptyRow()] : prev.filter((_, i) => i !== index),
		);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const items = rows
			.map((row) => ({
				name: row.name.trim(),
				quantity: row.quantity.trim(),
				category: row.category,
			}))
			.filter((row) => row.name && row.quantity);

		if (items.length === 0) {
			setError(t`Añade al menos un extra con nombre y cantidad.`);
			return;
		}

		onSubmit(items);
		onClose();
	};

	return (
		<Sheet
			open={open}
			onClose={onClose}
			title={<Trans>Agregar extras</Trans>}
			footer={
				<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>
						<Trans>Cancelar</Trans>
					</Button>
					<Button type="submit" form="add-extras-form">
						<Trans>Agregar a la lista</Trans>
					</Button>
				</div>
			}
		>
			<p className="text-sm text-ink-muted mb-4">
				<Trans>
					Puedes cargar varios items y guardarlos juntos. Los extras no se
					borran al regenerar la lista.
				</Trans>
			</p>

			<form id="add-extras-form" onSubmit={handleSubmit} className="space-y-3">
				{rows.map((row, index) => (
					<div
						key={index}
						className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-start border border-border rounded-app p-3 bg-bg"
					>
						<input
							type="text"
							placeholder={t`Ingrediente`}
							value={row.name}
							onChange={(e) => updateRow(index, "name", e.target.value)}
							className="min-h-11 px-3 rounded-app border border-border bg-surface"
							autoFocus={index === 0}
						/>
						<input
							type="text"
							placeholder={t`Cantidad`}
							value={row.quantity}
							onChange={(e) => updateRow(index, "quantity", e.target.value)}
							className="min-h-11 px-3 rounded-app border border-border bg-surface"
						/>
						<select
							value={row.category}
							onChange={(e) => updateRow(index, "category", e.target.value)}
							className="min-h-11 px-3 rounded-app border border-border bg-surface"
							aria-label={t`Categoría`}
						>
							{Object.keys(INGREDIENT_CATEGORIES).map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
						</select>
						<Button
							type="button"
							variant="ghost"
							className="!px-2"
							aria-label={t`Quitar fila`}
							onClick={() => removeRow(index)}
						>
							×
						</Button>
					</div>
				))}

				<Button type="button" variant="secondary" onClick={addRow}>
					<Trans>Otro item</Trans>
				</Button>

				{error ? (
					<p className="text-sm text-[var(--color-danger)]">{error}</p>
				) : null}
			</form>
		</Sheet>
	);
}
