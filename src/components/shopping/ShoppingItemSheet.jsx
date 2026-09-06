import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { useLingui } from "@lingui/react";
import { X } from "lucide-react";
import { DAY_LABEL_MSG } from "../../i18n/weekDayLabels";
import Button from "../ui/Button";
import Sheet from "../ui/Sheet";

function emptyReplacement() {
	return { name: "", quantity: "" };
}

/**
 * Per-item shopping detail: yield, source checks, qty override, substitute.
 */
export default function ShoppingItemSheet({
	open,
	onClose,
	item,
	view,
	price,
	sourceChecks = {},
	onToggleSource,
	onSetOverride,
	onSetYieldMode,
	onSubstitute,
	onMoveToPantry,
	onUnfuse,
	onEditExtra,
	onRemoveExtra,
}) {
	const { _ } = useLingui();
	const [step, setStep] = useState("details");
	const [overrideDraft, setOverrideDraft] = useState("");
	const [replacementRows, setReplacementRows] = useState([emptyReplacement()]);
	const [updateLibrary, setUpdateLibrary] = useState(false);

	useEffect(() => {
		if (!open) return;
		setStep("details");
		setReplacementRows([emptyReplacement()]);
		setUpdateLibrary(false);
		setOverrideDraft(view?.override || view?.displayQty || view?.remainingQty || "");
	}, [open, item?.name, view?.override, view?.displayQty, view?.remainingQty]);

	if (!item) return null;

	const sources = view?.sources || [];
	const lineChecked = view?.checkState === "checked";
	const canSubstitute = !item.isExtra && !item.isFused && sources.length > 0;
	const canPantry = !item.isExtra && !item.pantryCovered;
	const yieldEntry = view?.yieldEntry;
	const yieldMode = view?.yieldMode || "rawToCooked";

	const handleClose = () => {
		setStep("details");
		onClose();
	};

	const handleConfirmSubstitute = () => {
		const replacements = replacementRows
			.map((row) => ({
				name: row.name.trim(),
				quantity: row.quantity.trim(),
			}))
			.filter((row, index) =>
				index === 0 ? row.name : row.name && row.quantity,
			);
		if (!replacements[0]?.name) return;
		onSubstitute?.({
			sources,
			replacements,
			updateLibrary,
			item,
		});
		setReplacementRows([emptyReplacement()]);
		setUpdateLibrary(false);
		handleClose();
	};

	const updateReplacementRow = (index, field, value) => {
		setReplacementRows((prev) =>
			prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
		);
	};

	if (step === "substitute") {
		const canConfirm = Boolean(replacementRows[0]?.name.trim());
		return (
			<Sheet
				open={open}
				onClose={() => setStep("details")}
				title={<Trans>Sustituir ingrediente</Trans>}
				footer={
					<div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
						<Button variant="secondary" onClick={() => setStep("details")}>
							<Trans>Cancelar</Trans>
						</Button>
						<Button onClick={handleConfirmSubstitute} disabled={!canConfirm}>
							<Trans>Confirmar</Trans>
						</Button>
					</div>
				}
			>
				<p className="text-sm text-ink-muted mb-3">
					<Trans>
						Vas a sustituir{" "}
						<span className="font-semibold text-ink">{item.name}</span> en{" "}
						<span className="font-semibold text-ink">
							{sources.length} comidas
						</span>{" "}
						de esta semana.
					</Trans>
				</p>
				<ul className="mb-4 text-sm text-ink space-y-1 max-h-32 overflow-y-auto">
					{sources.map((source) => (
						<li key={source.key} className="truncate">
							{_(DAY_LABEL_MSG[source.dayKey] || DAY_LABEL_MSG.sunday)} ·{" "}
							{source.mealName}
						</li>
					))}
				</ul>
				<div className="space-y-2 mb-4">
					<p className="text-sm font-semibold">
						<Trans>Reemplazar con</Trans>
					</p>
					<p className="text-xs text-ink-muted">
						<Trans>
							Deja la cantidad vacía para conservar la de cada comida.
						</Trans>
					</p>
					{replacementRows.map((row, index) => (
						<div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
							<input
								value={row.name}
								onChange={(e) =>
									updateReplacementRow(index, "name", e.target.value)
								}
								placeholder={t`Ingrediente`}
								className="min-h-11 px-3 rounded-app border border-border bg-surface"
							/>
							<input
								value={row.quantity}
								onChange={(e) =>
									updateReplacementRow(index, "quantity", e.target.value)
								}
								placeholder={t`1/2 tza`}
								className="min-h-11 px-3 rounded-app border border-border bg-surface"
							/>
							<Button
								type="button"
								variant="ghost"
								className="!px-2"
								aria-label={t`Quitar ingrediente`}
								onClick={() =>
									setReplacementRows((prev) =>
										prev.length <= 1
											? [emptyReplacement()]
											: prev.filter((_, i) => i !== index),
									)
								}
							>
								<X className="size-4" aria-hidden />
							</Button>
						</div>
					))}
					<Button
						type="button"
						variant="secondary"
						onClick={() =>
							setReplacementRows((prev) => [...prev, emptyReplacement()])
						}
					>
						<Trans>Otro ingrediente</Trans>
					</Button>
				</div>
				<label className="flex items-start gap-2 text-sm text-ink">
					<input
						type="checkbox"
						checked={updateLibrary}
						onChange={(e) => setUpdateLibrary(e.target.checked)}
						className="mt-1"
					/>
					<span>
						<Trans>
							También actualizar la comida en la biblioteca (si está vinculada)
						</Trans>
					</span>
				</label>
			</Sheet>
		);
	}

	return (
		<Sheet
			open={open}
			onClose={handleClose}
			title={item.name}
			footer={
				<div className="flex flex-col sm:flex-row gap-2">
					{item.isFused ? (
						<Button
							variant="secondary"
							className="w-full"
							onClick={() => {
								onUnfuse?.(item.fusionId);
								handleClose();
							}}
						>
							<Trans>Separar</Trans>
						</Button>
					) : null}
					{canSubstitute ? (
						<Button
							variant="secondary"
							className="w-full"
							onClick={() => setStep("substitute")}
						>
							<Trans>Sustituir</Trans>
						</Button>
					) : null}
					{canPantry ? (
						<Button
							variant="secondary"
							className="w-full !text-[var(--color-accent-pantry)]"
							onClick={() => {
								onMoveToPantry?.(item);
								handleClose();
							}}
						>
							<Trans>Ya lo tengo → despensa</Trans>
						</Button>
					) : null}
					{item.isExtra && item.extraId ? (
						<>
							<Button
								variant="secondary"
								className="w-full"
								onClick={() => onEditExtra?.(item)}
							>
								<Trans>Editar</Trans>
							</Button>
							<Button
								variant="danger"
								className="w-full"
								onClick={() => {
									onRemoveExtra?.(item.extraId);
									handleClose();
								}}
							>
								<Trans>Quitar</Trans>
							</Button>
						</>
					) : null}
				</div>
			}
		>
			<p className="text-sm text-ink-muted mb-4">
				{view?.displayQty || view?.remainingQty || ""}
				{price != null ? ` · ~${price} MXN` : ""}
			</p>

			{item.isFused ? (
				<p className="text-sm text-ink-muted mb-4">
					<Trans>
						Items combinados. Sepáralos para ver fuentes o sustituir.
					</Trans>
				</p>
			) : null}

			{!item.isFused && !item.isExtra ? (
				<section className="mb-5">
					<h4 className="text-sm font-semibold mb-2">
						<Trans>En el plan</Trans>
					</h4>
					<p className="text-xs text-ink-muted mb-2">
						<Trans>
							Marca los días que quieres comprar. La cantidad suma solo los
							marcados.
						</Trans>
					</p>
					{sources.length === 0 ? (
						<p className="text-sm text-ink-muted">
							<Trans>No hay comidas vinculadas esta semana.</Trans>
						</p>
					) : (
						<ul className="space-y-1">
							{sources.map((source) => {
								const on = lineChecked || Boolean(sourceChecks[source.key]);
								return (
									<li key={source.key}>
										<label className="flex items-center gap-2 min-h-11 text-sm">
											<input
												type="checkbox"
												checked={on}
												onChange={() => onToggleSource?.(source.key)}
												className="h-5 w-5 accent-[var(--color-brand)] shrink-0"
											/>
											<span className="min-w-0 flex-1 truncate">
												{_(
													DAY_LABEL_MSG[source.dayKey] ||
														DAY_LABEL_MSG.sunday,
												)}{" "}
												· {source.mealName}
											</span>
											<span className="text-ink-muted shrink-0 tabular-nums">
												{source.quantity}
											</span>
										</label>
									</li>
								);
							})}
						</ul>
					)}
				</section>
			) : null}

			{yieldEntry && view?.remainingQty ? (
				<section className="mb-5">
					<h4 className="text-sm font-semibold mb-1">
						<Trans>¿Esta cantidad es cruda o cocida?</Trans>
					</h4>
					<p className="text-xs text-ink-muted mb-2">
						<Trans>
							Se asume cruda. Cambia a cocida si el plan está en porción ya
							cocinada. No se modifican las comidas.
						</Trans>
					</p>
					<div
						className="inline-flex rounded-app border border-border bg-bg p-1 mb-2"
						role="tablist"
						aria-label={t`Estado de la cantidad`}
					>
						<button
							type="button"
							role="tab"
							aria-selected={yieldMode === "rawToCooked"}
							onClick={() => onSetYieldMode?.("rawToCooked")}
							className={`min-h-11 px-3 text-sm font-semibold rounded-[calc(var(--radius-md)-2px)] ${
								yieldMode === "rawToCooked"
									? "bg-brand text-white"
									: "text-ink-muted"
							}`}
						>
							<Trans>Cruda</Trans>
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={yieldMode === "cookedToRaw"}
							onClick={() => onSetYieldMode?.("cookedToRaw")}
							className={`min-h-11 px-3 text-sm font-semibold rounded-[calc(var(--radius-md)-2px)] ${
								yieldMode === "cookedToRaw"
									? "bg-brand text-white"
									: "text-ink-muted"
							}`}
						>
							<Trans>Cocida</Trans>
						</button>
					</div>
					{yieldMode === "cookedToRaw" && view.convertedQty ? (
						<p className="text-sm text-ink-muted mb-2">
							<Trans>
								{view.planRemainingQty || view.remainingQty} cocida →{" "}
								{view.convertedQty} cruda para comprar.
							</Trans>
						</p>
					) : null}
					{yieldMode === "rawToCooked" && view.convertedQty ? (
						<p className="text-sm text-ink-muted mb-2">
							<Trans>
								{view.planRemainingQty || view.remainingQty} cruda rinde{" "}
								{view.convertedQty} cocida. Compras la cantidad del plan.
							</Trans>
						</p>
					) : null}
				</section>
			) : null}

			<section>
				<h4 className="text-sm font-semibold mb-2">
					<Trans>Cantidad a comprar</Trans>
				</h4>
				<div className="flex gap-2">
					<input
						value={overrideDraft}
						onChange={(e) => setOverrideDraft(e.target.value)}
						className="flex-1 min-h-11 px-3 rounded-app border border-border bg-bg"
						aria-label={t`Cantidad a comprar`}
					/>
					<Button
						variant="secondary"
						onClick={() => onSetOverride?.(overrideDraft)}
					>
						<Trans>Guardar</Trans>
					</Button>
				</div>
				{view?.override ? (
					<button
						type="button"
						onClick={() => {
							setOverrideDraft(view.displayQty || view.remainingQty);
							onSetOverride?.("");
						}}
						className="mt-2 text-xs font-medium text-ink-muted underline underline-offset-2"
					>
						<Trans>Quitar ajuste</Trans>
					</button>
				) : null}
			</section>
		</Sheet>
	);
}
