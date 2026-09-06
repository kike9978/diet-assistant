import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useMemo, useState } from "react";
import { YIELD_CONVERSIONS } from "../data/yieldConversions.js";
import { convertYield } from "../features/tools/yieldConvert.js";

const UNITS = ["g", "kg", "tza", "pza"];

export default function ToolsPage() {
	const { i18n } = useLingui();
	const isEn = i18n.locale === "en";
	const [foodId, setFoodId] = useState(YIELD_CONVERSIONS[0].id);
	const [amount, setAmount] = useState("100");
	const [unit, setUnit] = useState("g");
	const [direction, setDirection] = useState("rawToCooked");

	const food = useMemo(
		() => YIELD_CONVERSIONS.find((y) => y.id === foodId) || YIELD_CONVERSIONS[0],
		[foodId],
	);

	const numericAmount = Number.parseFloat(String(amount).replace(",", "."));
	const result = convertYield(
		Number.isFinite(numericAmount) ? numericAmount : NaN,
		food.rawToCooked,
		direction,
	);

	const foodLabel = (y) => (isEn ? y.nameEn : y.nameEs);

	return (
		<div className="space-y-5">
			<div>
				<h1 className="font-display text-2xl text-ink">
					<Trans>Herramientas</Trans>
				</h1>
				<p className="text-sm text-ink-muted mt-0.5">
					<Trans>
						Convierte pesos crudo ↔ cocido para comprar y porcionar con menos
						adivinanzas.
					</Trans>
				</p>
			</div>

			<section className="border border-border rounded-app bg-surface p-4 sm:p-5 space-y-4">
				<h2 className="font-display text-xl text-ink">
					<Trans>Convertidor de rendimiento</Trans>
				</h2>

				<label className="block">
					<span className="text-sm font-semibold">
						<Trans>Alimento</Trans>
					</span>
					<select
						value={foodId}
						onChange={(e) => setFoodId(e.target.value)}
						className="mt-1 w-full min-h-11 px-3 rounded-app border border-border bg-bg"
					>
						{YIELD_CONVERSIONS.map((y) => (
							<option key={y.id} value={y.id}>
								{foodLabel(y)}
							</option>
						))}
					</select>
				</label>

				<div
					className="inline-flex rounded-app border border-border bg-bg p-1"
					role="tablist"
					aria-label={t`Dirección`}
				>
					<button
						type="button"
						role="tab"
						aria-selected={direction === "rawToCooked"}
						onClick={() => setDirection("rawToCooked")}
						className={`min-h-11 px-3 text-sm font-semibold rounded-[calc(var(--radius-md)-2px)] ${direction === "rawToCooked"
								? "bg-brand text-white"
								: "text-ink-muted"
							}`}
					>
						<Trans>Crudo → cocido</Trans>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={direction === "cookedToRaw"}
						onClick={() => setDirection("cookedToRaw")}
						className={`min-h-11 px-3 text-sm font-semibold rounded-[calc(var(--radius-md)-2px)] ${direction === "cookedToRaw"
								? "bg-brand text-white"
								: "text-ink-muted"
							}`}
					>
						<Trans>Cocido → crudo</Trans>
					</button>
				</div>

				<div className="grid grid-cols-[1fr_auto] gap-2">
					<label className="block">
						<span className="text-sm font-semibold">
							{direction === "rawToCooked" ? (
								<Trans>Cantidad cruda</Trans>
							) : (
								<Trans>Cantidad cocida</Trans>
							)}
						</span>
						<input
							type="text"
							inputMode="decimal"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							className="mt-1 w-full min-h-11 px-3 rounded-app border border-border bg-bg"
						/>
					</label>
					<label className="block">
						<span className="text-sm font-semibold">
							<Trans>Unidad</Trans>
						</span>
						<select
							value={unit}
							onChange={(e) => setUnit(e.target.value)}
							className="mt-1 min-h-11 px-3 rounded-app border border-border bg-bg"
						>
							{UNITS.map((u) => (
								<option key={u} value={u}>
									{u}
								</option>
							))}
						</select>
					</label>
				</div>

				<div className="rounded-app bg-surface-2 border border-border px-4 py-3">
					<p className="text-xs uppercase tracking-wide text-ink-muted font-semibold">
						{direction === "rawToCooked" ? (
							<Trans>Resultado cocido</Trans>
						) : (
							<Trans>Resultado crudo</Trans>
						)}
					</p>
					<p className="font-display text-3xl text-ink mt-1">
						{result == null ? "—" : `${result} ${unit}`}
					</p>
					<p className="text-sm text-ink-muted mt-1">
						<Trans>Factor</Trans> ×{food.rawToCooked}
						{food.notesEs && !isEn ? ` · ${food.notesEs}` : null}
					</p>
				</div>

				<p className="text-xs text-ink-muted">
					<Trans>
						Los factores son promedios de cocina; ajusta según tu método.
					</Trans>
				</p>
			</section>

			<section className="space-y-2">
				<h2 className="text-sm font-semibold text-ink-muted">
					<Trans>Tabla rápida</Trans>
				</h2>
				<ul className="border border-border rounded-app bg-surface divide-y divide-border overflow-hidden">
					{YIELD_CONVERSIONS.map((y) => (
						<li key={y.id}>
							<button
								type="button"
								onClick={() => setFoodId(y.id)}
								className={`w-full text-left px-4 py-3 min-h-11 flex justify-between gap-3 hover:bg-surface-2 ${y.id === foodId ? "bg-surface-2" : ""
									}`}
							>
								<span className="font-medium text-ink">{foodLabel(y)}</span>
								<span className="text-sm text-ink-muted shrink-0">
									×{y.rawToCooked}
								</span>
							</button>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
