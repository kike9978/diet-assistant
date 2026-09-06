import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppState";
import { todayISO } from "../features/calendar/dateUtils.js";
import Button from "../components/ui/Button";

export default function CreateMealPage() {
	const { createMealAndSchedule } = useAppState();
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [rows, setRows] = useState([{ name: "", quantity: "" }]);
	const [error, setError] = useState(null);

	const updateRow = (index, field, value) => {
		setRows((prev) =>
			prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
		);
	};

	const addRow = () => setRows((prev) => [...prev, { name: "", quantity: "" }]);

	const handleSubmit = (e) => {
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

		createMealAndSchedule({
			name: trimmedName,
			ingredients,
			dateISO: todayISO(),
		});
		navigate("/");
	};

	return (
		<div className="max-w-lg mx-auto">
			<h1 className="font-display text-2xl mb-2">
				<Trans>Crear comida</Trans>
			</h1>
			<p className="text-sm text-ink-muted mb-6">
				<Trans>
					Mínimo: nombre + ingredientes. Se guarda en la biblioteca y se agenda
					para hoy.
				</Trans>
			</p>

			<form onSubmit={handleSubmit} className="space-y-4">
				<label className="block">
					<span className="text-sm font-semibold">
						<Trans>Nombre</Trans>
					</span>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="mt-1 w-full min-h-11 px-3 rounded-app border border-border bg-surface"
						placeholder={t`Desayuno: Avena con fruta`}
						autoFocus
					/>
				</label>

				<div className="space-y-2">
					<p className="text-sm font-semibold">
						<Trans>Ingredientes</Trans>
					</p>
					{rows.map((row, index) => (
						<div key={index} className="grid grid-cols-2 gap-2">
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
						</div>
					))}
					<Button type="button" variant="secondary" onClick={addRow}>
						<Trans>Otro ingrediente</Trans>
					</Button>
				</div>

				{error ? (
					<p className="text-sm text-[var(--color-danger)]">{error}</p>
				) : null}

				<div className="flex gap-2 pt-2">
					<Button type="submit">
						<Trans>Guardar y ver en la semana</Trans>
					</Button>
					<Button type="button" variant="ghost" onClick={() => navigate(-1)}>
						<Trans>Cancelar</Trans>
					</Button>
				</div>
			</form>
		</div>
	);
}
