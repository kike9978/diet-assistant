import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useRef, useState } from "react";
import { useAppState } from "../context/AppState";
import { parseDateISO } from "../features/calendar/dateUtils.js";
import {
	extraChecklistKey,
	ingredientChecklistKey,
} from "../features/shopping/checklistKeys.js";
import { useBudget, estimatePrice } from "../features/shopping/useBudget.js";
import { usePdfExport } from "../features/shopping/usePdfExport.js";
import { useShoppingList } from "../features/shopping/useShoppingList.js";
import Button from "./ui/Button";
import ShoppingListItem from "./ui/ShoppingListItem";
import AddExtrasSheet from "./shopping/AddExtrasSheet";

function formatItemQuantity(item) {
	if (!item.quantities?.length) return "";
	return item.quantities.filter(Boolean).join(", ");
}

function itemKeyFor(item) {
	if (item.isExtra && item.extraId) return extraChecklistKey(item.extraId);
	return ingredientChecklistKey(item.normalizedName || item.name);
}

function ShoppingList() {
	const {
		weekPlan,
		state,
		visibleWeekDates,
		setCheckedItems,
		addShoppingExtra,
	} = useAppState();
	const { i18n } = useLingui();
	const checkedItems = state.checkedItems || {};
	const { shoppingList, groupedShoppingList } = useShoppingList(
		weekPlan,
		state.shoppingExtras,
	);
	const totalBudget = useBudget(groupedShoppingList);
	const { pdfState, exportToPDF } = usePdfExport();
	const pdfContentRef = useRef(null);
	const locale = i18n.locale === "en" ? "en-US" : "es-MX";
	const weekLabel =
		visibleWeekDates?.length >= 7
			? `${parseDateISO(visibleWeekDates[0]).toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${parseDateISO(visibleWeekDates[6]).toLocaleDateString(locale, { day: "numeric", month: "short" })}`
			: "";

	const [showFullScreenChecklist, setShowFullScreenChecklist] = useState(false);
	const [showSources, setShowSources] = useState(false);
	const [extrasOpen, setExtrasOpen] = useState(false);

	const handleAddExtras = (items) => {
		for (const item of items) {
			addShoppingExtra(item);
		}
	};

	const handleCheckAll = () => {
		const all = {};
		Object.values(groupedShoppingList).forEach((items) => {
			items.forEach((item) => {
				all[itemKeyFor(item)] = true;
			});
		});
		setCheckedItems(all);
	};

	const handleUncheckAll = () => setCheckedItems({});

	const toggleItem = (key) => {
		setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	return (
		<div className="flex flex-col gap-6 relative">
			<div className="bg-surface p-6 rounded-app shadow-soft border border-border flex flex-col overflow-hidden max-h-[90dvh]">
				<div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
					<div>
						<h2 className="font-display text-2xl text-ink">
							<Trans>Lista de Compras</Trans>
						</h2>
						{weekLabel ? (
							<p className="text-sm text-ink-muted mt-0.5">
								<Trans>Basada en la semana</Trans> {weekLabel}
							</p>
						) : null}
						{totalBudget > 0 ? (
							<p className="text-sm text-ink-muted mt-0.5">
								<Trans>Presupuesto est. ~{totalBudget} MXN</Trans>
							</p>
						) : null}
					</div>
					<Button variant="secondary" onClick={() => setExtrasOpen(true)}>
						<Trans>Agregar extras</Trans>
					</Button>
				</div>

				{Object.keys(shoppingList).length === 0 ? (
					<div className="text-center py-8">
						<p className="text-ink-muted mb-2">
							<Trans>No hay ingredientes en tu lista de compras.</Trans>
						</p>
						<p className="text-ink-muted text-sm mb-4">
							<Trans>
								Agrega comidas a tu plan semanal o extras a la lista.
							</Trans>
						</p>
						<Button onClick={() => setExtrasOpen(true)}>
							<Trans>Agregar extras</Trans>
						</Button>
					</div>
				) : (
					<>
						<div className="flex flex-wrap gap-2 mb-3">
							<button
								type="button"
								onClick={() => setShowFullScreenChecklist(true)}
								className="min-h-11 px-4 rounded-app bg-brand text-white font-semibold"
							>
								<Trans>Ver como checklist</Trans>
							</button>
							<button
								type="button"
								onClick={() => setShowSources(!showSources)}
								className="min-h-11 px-4 rounded-app border border-border bg-surface text-ink font-semibold"
							>
								{showSources ? (
									<Trans>Ocultar fuentes</Trans>
								) : (
									<Trans>Mostrar fuentes</Trans>
								)}
							</button>
						</div>

						<div className="overflow-y-auto pr-2" ref={pdfContentRef}>
							{Object.entries(groupedShoppingList).map(([category, items]) => (
								<div key={category} className="mb-6">
									<h3 className="text-lg font-medium text-brand mb-3 border-b border-border pb-2">
										{category}{" "}
										<span className="text-ink-muted text-sm">
											({items.length})
										</span>
									</h3>
									<ul className="space-y-2">
										{items.map((item) => {
											const key = itemKeyFor(item);
											return (
												<li key={key}>
													<ShoppingListItem
														item={item}
														priceEstimate={estimatePrice(item)}
														formatQuantity={formatItemQuantity}
														weekPlan={weekPlan}
														showSources={showSources}
													/>
												</li>
											);
										})}
									</ul>
								</div>
							))}
						</div>

						<button
							type="button"
							onClick={() => exportToPDF(pdfContentRef.current)}
							disabled={pdfState.isGenerating}
							className="w-full min-h-11 mt-3 rounded-app bg-brand text-white font-semibold disabled:opacity-50"
						>
							{pdfState.isGenerating ? (
								<Trans>Generando PDF…</Trans>
							) : (
								<Trans>Exportar a PDF</Trans>
							)}
						</button>
						{pdfState.error ? (
							<p className="text-sm text-[var(--color-danger)] mt-2">
								{pdfState.error}
							</p>
						) : null}
						{pdfState.success ? (
							<p className="text-sm text-brand mt-2">
								<Trans>¡PDF generado exitosamente!</Trans>
							</p>
						) : null}
					</>
				)}
			</div>

			<AddExtrasSheet
				open={extrasOpen}
				onClose={() => setExtrasOpen(false)}
				onSubmit={handleAddExtras}
			/>

			{showFullScreenChecklist && (
				<div className="fixed inset-0 z-50 bg-surface overflow-y-auto p-4">
					<div className="max-w-4xl mx-auto">
						<div className="flex justify-between items-center mb-6">
							<h2 className="font-display text-2xl">
								<Trans>Lista de Compras — Checklist</Trans>
							</h2>
							<button
								type="button"
								onClick={() => setShowFullScreenChecklist(false)}
								className="min-h-11 min-w-11 rounded-full hover:bg-surface-2"
								aria-label={t`Cerrar`}
							>
								✕
							</button>
						</div>
						<div className="flex flex-wrap gap-2 mb-4">
							<button
								type="button"
								onClick={handleCheckAll}
								className="min-h-11 px-3 rounded-app bg-[var(--color-accent-leaf)]/20 text-brand font-semibold"
							>
								<Trans>Marcar todos</Trans>
							</button>
							<button
								type="button"
								onClick={handleUncheckAll}
								className="min-h-11 px-3 rounded-app bg-[var(--color-danger-soft)] text-[var(--color-danger)] font-semibold"
							>
								<Trans>Desmarcar todo</Trans>
							</button>
						</div>
						{Object.entries(groupedShoppingList).map(([category, items]) => (
							<div key={category} className="mb-6">
								<h3 className="text-lg font-medium text-brand mb-3 border-b border-border pb-2">
									{category}
								</h3>
								<ul className="space-y-2">
									{items.map((item) => {
										const key = itemKeyFor(item);
										const isChecked = Boolean(checkedItems[key]);
										return (
											<li
												key={key}
												className={`py-2 px-3 rounded-app ${isChecked ? "bg-[var(--color-accent-leaf)]/10" : "bg-surface-2"}`}
											>
												<label className="flex items-start gap-3 cursor-pointer">
													<input
														type="checkbox"
														checked={isChecked}
														onChange={() => toggleItem(key)}
														className="mt-1 h-5 w-5 accent-[var(--color-brand)]"
													/>
													<span className="flex-1">
														<span
															className={`font-medium ${isChecked ? "line-through text-ink-muted" : ""}`}
														>
															{item.name}
														</span>
														<div className="text-sm text-ink-muted">
															{formatItemQuantity(item)}
														</div>
													</span>
												</label>
											</li>
										);
									})}
								</ul>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default ShoppingList;
