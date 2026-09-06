import { t } from "@lingui/core/macro";
import { Trans, Plural } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { Link } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAppState } from "../context/AppState";
import { useToast } from "./Toast";
import { parseDateISO } from "../features/calendar/dateUtils.js";
import {
	expandFusedShoppingItem,
	shoppingItemChecklistKey,
} from "../features/shopping/applyShoppingFusions.js";
import { useBudget, estimatePrice } from "../features/shopping/useBudget.js";
import { usePdfExport } from "../features/shopping/usePdfExport.js";
import { useShoppingList } from "../features/shopping/useShoppingList.js";
import ShoppingMemberPicker from "../features/shopping/ShoppingMemberPicker";
import { quantityForPantryStock } from "../features/pantry/pantryActions.js";
import {
	boughtQuantity,
	shoppingLineView,
} from "../features/shopping/shoppingProgress.js";
import { formatQuantity } from "../domain/quantity.js";
import Button from "./ui/Button";
import ConfirmDialog from "./ui/ConfirmDialog";
import ShoppingListItem from "./ui/ShoppingListItem";
import AddExtrasSheet from "./shopping/AddExtrasSheet";
import ShoppingChecklistRow from "./shopping/ShoppingChecklistRow";
import ShoppingItemSheet from "./shopping/ShoppingItemSheet";

function itemKeyFor(item) {
	return shoppingItemChecklistKey(item);
}

function rowPrice(item, view) {
	const priced = {
		...item,
		quantities: view.displayQty ? [view.displayQty] : item.quantities,
	};
	return estimatePrice(priced).price;
}

function ChecklistCategoryBlocks({
	categories,
	progress,
	fuseSelectMode,
	fuseSelectedKeys,
	showSources,
	weekPlan,
	onToggle,
	onToggleFuseSelect,
	onOpen,
}) {
	return categories.map(({ category, items }) => (
		<div key={category} className="mb-6">
			<h3 className="text-lg font-medium text-brand mb-3 border-b border-border pb-2">
				{category}{" "}
				<span className="text-ink-muted text-sm">({items.length})</span>
			</h3>
			<ul className="space-y-1.5">
				{items.map((item) => {
					const key = itemKeyFor(item);
					const view = shoppingLineView(item, progress);
					const fuseSelected = Boolean(fuseSelectedKeys?.[key]);
					const canFuseSelect = fuseSelectMode && !item.isFused;
					return (
						<li
							key={key}
							className={`px-3 rounded-app ${
								canFuseSelect && fuseSelected
									? "bg-[var(--color-accent-shopping)]/15 ring-2 ring-[var(--color-accent-shopping)]"
									: view.checkState === "checked"
										? "bg-[var(--color-accent-leaf)]/10"
										: "bg-surface-2"
							}`}
						>
							<ShoppingChecklistRow
								item={item}
								view={view}
								price={rowPrice(item, view)}
								fuseSelectMode={fuseSelectMode}
								fuseSelected={fuseSelected}
								checked={view.checkState === "checked"}
								showSources={showSources}
								weekPlan={weekPlan}
								onToggle={() => onToggle(item)}
								onToggleFuseSelect={() => onToggleFuseSelect?.(key)}
								onOpen={() => onOpen(item)}
							/>
						</li>
					);
				})}
			</ul>
		</div>
	));
}

function ShoppingList() {
	const {
		shoppingWeekPlan,
		state,
		visibleWeekDates,
		toggleShoppingLine,
		toggleShoppingSource,
		setShoppingQtyOverride,
		setShoppingYieldMode,
		checkAllShoppingItems,
		uncheckAllShoppingItems,
		fuseShoppingItems,
		unfuseShoppingItem,
		addShoppingExtra,
		updateShoppingExtra,
		removeShoppingExtra,
		moveToPantryFromShopping,
		finishShoppingToPantry,
		substituteShoppingItem,
	} = useAppState();
	const toast = useToast();
	const { i18n } = useLingui();
	const progress = useMemo(
		() => ({
			checkedItems: state.checkedItems || {},
			sourceChecks: state.shoppingSourceChecks || {},
			overrides: state.shoppingQtyOverrides || {},
			yieldModes: state.shoppingYieldMode || {},
		}),
		[
			state.checkedItems,
			state.shoppingSourceChecks,
			state.shoppingQtyOverrides,
			state.shoppingYieldMode,
		],
	);
	const sourceChecks = progress.sourceChecks;
	const shoppingFusions = state.shoppingFusions || [];
	const [hidePantryCovered, setHidePantryCovered] = useState(true);
	const { shoppingList, groupedShoppingList } = useShoppingList(
		shoppingWeekPlan,
		state.shoppingExtras,
		state.pantry,
		{ hidePantryCovered, shoppingFusions },
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
	const [editingExtra, setEditingExtra] = useState(null);
	const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
	const [fuseSelectMode, setFuseSelectMode] = useState(false);
	const [fuseSelectedKeys, setFuseSelectedKeys] = useState({});
	const [openLineKey, setOpenLineKey] = useState(null);

	const openItem = useMemo(
		() =>
			Object.values(shoppingList).find(
				(item) => itemKeyFor(item) === openLineKey,
			) || null,
		[shoppingList, openLineKey],
	);
	const openView = openItem ? shoppingLineView(openItem, progress) : null;

	const checkedShoppingItems = useMemo(() => {
		return Object.values(shoppingList).filter((item) => {
			if (item.pantryCovered) return false;
			return shoppingLineView(item, progress).checkState === "checked";
		});
	}, [shoppingList, progress]);

	const { uncheckedCategories, checkedCategories } = useMemo(() => {
		const unchecked = [];
		const checked = [];
		Object.entries(groupedShoppingList).forEach(([category, items]) => {
			const uncheckedItems = [];
			const checkedItemsList = [];
			items.forEach((item) => {
				if (shoppingLineView(item, progress).checkState === "checked") {
					checkedItemsList.push(item);
				} else {
					uncheckedItems.push(item);
				}
			});
			if (uncheckedItems.length > 0) {
				unchecked.push({ category, items: uncheckedItems });
			}
			if (checkedItemsList.length > 0) {
				checked.push({ category, items: checkedItemsList });
			}
		});
		return { uncheckedCategories: unchecked, checkedCategories: checked };
	}, [groupedShoppingList, progress]);

	const fuseSelectedCount = useMemo(
		() => Object.values(fuseSelectedKeys).filter(Boolean).length,
		[fuseSelectedKeys],
	);

	const handleAddExtras = (items) => {
		for (const extra of items) addShoppingExtra(extra);
	};

	const handleEditExtraSubmit = (items) => {
		const extra = items[0];
		if (!editingExtra || !extra) return;
		updateShoppingExtra(editingExtra.id, extra);
		setEditingExtra(null);
	};

	const allVisibleItems = useMemo(
		() => Object.values(groupedShoppingList).flat(),
		[groupedShoppingList],
	);

	const handleCheckAll = () => checkAllShoppingItems(allVisibleItems);
	const handleUncheckAll = () => uncheckAllShoppingItems();

	const toggleFuseSelect = (key) => {
		setFuseSelectedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const exitFuseSelectMode = () => {
		setFuseSelectMode(false);
		setFuseSelectedKeys({});
	};

	const handleFuseSelected = () => {
		const keys = Object.entries(fuseSelectedKeys)
			.filter(([, on]) => on)
			.map(([k]) => k);
		if (keys.length < 2) return;
		fuseShoppingItems(keys);
		exitFuseSelectMode();
		toast?.success?.(t`Items combinados`);
	};

	const handleUnfuse = (fusionId) => {
		unfuseShoppingItem(fusionId);
		toast?.success?.(t`Items separados`);
	};

	const handleMoveToPantry = (item) => {
		const view = shoppingLineView(item, progress);
		const members = expandFusedShoppingItem(item);
		for (const member of members) {
			if (member.pantryCovered) continue;
			const qty =
				members.length === 1
					? view.remainingQty || quantityForPantryStock(member)
					: quantityForPantryStock(member);
			moveToPantryFromShopping({
				name: member.name,
				quantity: qty,
				category: member.category,
			});
		}
		if (item.isFused && item.fusionId) {
			unfuseShoppingItem(item.fusionId);
		} else if (view.checkState !== "checked") {
			toggleShoppingLine(item);
		}
		toast?.success?.(t`Guardado en despensa`);
	};

	const handleFinishShopping = () => {
		const count = checkedShoppingItems.length;
		finishShoppingToPantry(
			checkedShoppingItems.map((item) => {
				const bought = boughtQuantity(item, progress);
				return {
					...item,
					quantities: bought ? [bought] : item.quantities,
				};
			}),
		);
		setFinishConfirmOpen(false);
		setShowFullScreenChecklist(false);
		exitFuseSelectMode();
		if (count > 0) {
			toast?.success?.(t`${count} items guardados en despensa`);
		}
	};

	const extras = state.shoppingExtras || [];
	const handleEditExtraFromItem = (row) => {
		setOpenLineKey(null);
		const extra = extras.find((e) => e.id === row.extraId);
		if (extra) setEditingExtra(extra);
	};

	const finishButton =
		checkedShoppingItems.length > 0 ? (
			<Button
				onClick={() => setFinishConfirmOpen(true)}
				className="w-full sm:w-auto"
			>
				<Trans>Terminar compra</Trans>
				<span className="opacity-80"> ({checkedShoppingItems.length})</span>
			</Button>
		) : null;

	return (
		<div className="flex flex-col gap-6 relative">
			<ShoppingMemberPicker />

			<div className="bg-surface p-4 sm:p-6 rounded-app shadow-soft border border-border flex flex-col overflow-hidden max-h-[90dvh]">
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
					<div className="flex flex-wrap gap-2">
						<Button variant="secondary" onClick={() => setExtrasOpen(true)}>
							<Trans>Agregar extras</Trans>
						</Button>
						<Link
							to="/pantry"
							className="inline-flex items-center justify-center min-h-11 px-4 rounded-app border border-border bg-surface text-sm font-semibold hover:bg-surface-2"
						>
							<Trans>Despensa</Trans>
						</Link>
					</div>
				</div>

				{state.pantry.length > 0 ? (
					<label className="flex items-center gap-2 text-sm text-ink-muted mb-3 cursor-pointer">
						<input
							type="checkbox"
							checked={hidePantryCovered}
							onChange={(e) => setHidePantryCovered(e.target.checked)}
							className="h-4 w-4 accent-[var(--color-brand)]"
						/>
						<Trans>Ocultar lo que ya está en despensa</Trans>
					</label>
				) : null}

				{Object.keys(shoppingList).length === 0 ? (
					<div className="text-center py-8">
						<p className="text-ink-muted mb-2">
							<Trans>No hay ingredientes en tu lista de compras.</Trans>
						</p>
						<p className="text-ink-muted text-sm mb-4">
							<Trans>
								Planear la semana agrega comidas; también puedes sumar extras.
							</Trans>
						</p>
						<div className="flex flex-wrap gap-2 justify-center">
							<Link
								to="/plan/week"
								className="inline-flex items-center justify-center min-h-11 px-4 rounded-app bg-brand text-white font-semibold"
							>
								<Trans>Planear esta semana</Trans>
							</Link>
							<Button variant="secondary" onClick={() => setExtrasOpen(true)}>
								<Trans>Agregar extras</Trans>
							</Button>
						</div>
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
								onClick={() => setShowSources((v) => !v)}
								className="min-h-11 px-4 rounded-app border border-border bg-surface text-ink font-semibold"
							>
								{showSources ? (
									<Trans>Ocultar fuentes</Trans>
								) : (
									<Trans>Mostrar fuentes</Trans>
								)}
							</button>
							{finishButton}
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
									<ul className="divide-y divide-border">
										{items.map((item) => {
											const key = itemKeyFor(item);
											const view = shoppingLineView(item, progress);
											const price = rowPrice(item, view);
											return (
												<li key={key} className="py-2.5 first:pt-0">
													<div
														role="button"
														tabIndex={0}
														onClick={() => setOpenLineKey(key)}
														onKeyDown={(e) => {
															if (e.key === "Enter" || e.key === " ") {
																e.preventDefault();
																setOpenLineKey(key);
															}
														}}
														className="w-full text-left cursor-pointer rounded-app focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
													>
														<ShoppingListItem
															item={item}
															priceEstimate={
																price != null ? { price } : null
															}
															formatQuantity={() =>
																view.displayQty || ""
															}
															weekPlan={shoppingWeekPlan}
															showSources={showSources}
														/>
													</div>
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

			{extras.length > 0 ? (
				<section className="border border-border rounded-app bg-surface p-4 space-y-3">
					<div className="flex items-center justify-between gap-2">
						<h3 className="font-display text-lg text-ink">
							<Trans>Extras persistentes</Trans>
						</h3>
						<Button variant="secondary" onClick={() => setExtrasOpen(true)}>
							<Trans>Agregar</Trans>
						</Button>
					</div>
					<p className="text-sm text-ink-muted">
						<Trans>
							Estos items no se borran al regenerar la lista desde el
							calendario.
						</Trans>
					</p>
					<ul className="divide-y divide-border border border-border rounded-app overflow-hidden">
						{extras.map((extra) => (
							<li
								key={extra.id}
								className="flex items-center justify-between gap-3 px-3 py-2.5 bg-bg"
							>
								<button
									type="button"
									className="text-left min-w-0 flex-1"
									onClick={() => setEditingExtra(extra)}
								>
									<p className="font-semibold text-ink truncate">
										{extra.name}
									</p>
									<p className="text-sm text-ink-muted">
										{formatQuantity(extra.quantity)}
										{extra.category ? ` · ${extra.category}` : ""}
									</p>
								</button>
								<Button
									variant="ghost"
									className="!px-2"
									aria-label={t`Quitar ${extra.name}`}
									onClick={() => removeShoppingExtra(extra.id)}
								>
									<X className="size-4" aria-hidden />
								</Button>
							</li>
						))}
					</ul>
				</section>
			) : null}

			<AddExtrasSheet
				open={extrasOpen}
				onClose={() => setExtrasOpen(false)}
				onSubmit={handleAddExtras}
			/>

			<AddExtrasSheet
				key={editingExtra ? `edit-${editingExtra.id}` : "add"}
				open={Boolean(editingExtra)}
				onClose={() => setEditingExtra(null)}
				onSubmit={handleEditExtraSubmit}
				initialRows={
					editingExtra
						? [
							{
								name: editingExtra.name,
								quantity: formatQuantity(editingExtra.quantity),
								category: editingExtra.category || "Verduras",
							},
						]
						: undefined
				}
				single
				title={<Trans>Editar extra</Trans>}
			/>

			<ShoppingItemSheet
				open={Boolean(openItem)}
				onClose={() => setOpenLineKey(null)}
				item={openItem}
				view={openView}
				price={openItem && openView ? rowPrice(openItem, openView) : null}
				sourceChecks={sourceChecks}
				onToggleSource={(sourceKey) =>
					openItem && toggleShoppingSource(openItem, sourceKey)
				}
				onSetOverride={(value) =>
					openView && setShoppingQtyOverride(openView.lineKey, value)
				}
				onSetYieldMode={(mode) =>
					openView && setShoppingYieldMode(openView.lineKey, mode)
				}
				onSubstitute={(payload) => {
					substituteShoppingItem(payload);
					setOpenLineKey(null);
					toast?.success?.(
						t`${payload.item?.name || ""} sustituida en ${payload.sources?.length || 0} comidas de esta semana.`,
					);
				}}
				onMoveToPantry={handleMoveToPantry}
				onUnfuse={handleUnfuse}
				onEditExtra={handleEditExtraFromItem}
				onRemoveExtra={removeShoppingExtra}
			/>

			<ConfirmDialog
				open={finishConfirmOpen}
				title={<Trans>Terminar compra</Trans>}
				description={
					<>
						<Plural
							value={checkedShoppingItems.length}
							one="Se guardará # item marcado en la despensa."
							other="Se guardarán # items marcados en la despensa."
						/>{" "}
						<Trans>
							Así la próxima lista restará lo que acabas de comprar. Los extras
							marcados se quitan de la lista persistente.
						</Trans>
					</>
				}
				confirmLabel={<Trans>Guardar en despensa</Trans>}
				onConfirm={handleFinishShopping}
				onCancel={() => setFinishConfirmOpen(false)}
			/>

			{showFullScreenChecklist ? (
				<div className="fixed inset-0 z-50 bg-surface overflow-y-auto pb-28">
					<div className="max-w-4xl mx-auto">
						<div className="sticky top-0 z-10 px-4 pt-4 pb-3 mb-4 bg-surface/95 backdrop-blur border-b border-border">
							<div className="flex justify-between items-center mb-3">
								<h2 className="font-display text-2xl">
									<Trans>Lista de Compras — Checklist</Trans>
								</h2>
								<button
									type="button"
									onClick={() => {
										exitFuseSelectMode();
										setShowFullScreenChecklist(false);
									}}
									className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-full hover:bg-surface-2"
									aria-label={t`Cerrar`}
								>
									<X className="size-5" aria-hidden />
								</button>
							</div>
							<div className="flex flex-wrap gap-2">
								{!fuseSelectMode ? (
									<>
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
										<button
											type="button"
											onClick={() => setShowSources((v) => !v)}
											className="min-h-11 px-3 rounded-app border border-border bg-surface text-ink font-semibold"
										>
											{showSources ? (
												<Trans>Ocultar fuentes</Trans>
											) : (
												<Trans>Mostrar fuentes</Trans>
											)}
										</button>
										<button
											type="button"
											onClick={() => {
												setFuseSelectMode(true);
												setFuseSelectedKeys({});
											}}
											className="min-h-11 px-3 rounded-app border border-border bg-surface text-ink font-semibold"
										>
											<Trans>Combinar items</Trans>
										</button>
									</>
								) : (
									<>
										<p className="text-sm text-ink-muted self-center">
											<Trans>
												Elige 2 o más items para combinarlos en uno.
											</Trans>
										</p>
										<button
											type="button"
											onClick={exitFuseSelectMode}
											className="min-h-11 px-3 rounded-app border border-border bg-surface text-ink font-semibold"
										>
											<Trans>Cancelar</Trans>
										</button>
									</>
								)}
							</div>
						</div>
						<div className="px-4">
							{uncheckedCategories.length > 0 ? (
								<section className="mb-2">
									<h2 className="font-display text-xl text-ink mb-4">
										<Trans>Artículos</Trans>
									</h2>
									<ChecklistCategoryBlocks
										categories={uncheckedCategories}
										progress={progress}
										fuseSelectMode={fuseSelectMode}
										fuseSelectedKeys={fuseSelectedKeys}
										showSources={showSources}
										weekPlan={shoppingWeekPlan}
										onToggle={toggleShoppingLine}
										onToggleFuseSelect={toggleFuseSelect}
										onOpen={(item) => setOpenLineKey(itemKeyFor(item))}
									/>
								</section>
							) : null}
							{checkedCategories.length > 0 ? (
								<section className="mt-8">
									<h2 className="font-display text-xl text-ink mb-4">
										<Trans>Marcados</Trans>
									</h2>
									<ChecklistCategoryBlocks
										categories={checkedCategories}
										progress={progress}
										fuseSelectMode={fuseSelectMode}
										fuseSelectedKeys={fuseSelectedKeys}
										showSources={showSources}
										weekPlan={shoppingWeekPlan}
										onToggle={toggleShoppingLine}
										onToggleFuseSelect={toggleFuseSelect}
										onOpen={(item) => setOpenLineKey(itemKeyFor(item))}
									/>
								</section>
							) : null}
						</div>
					</div>

					{fuseSelectMode && fuseSelectedCount >= 2 ? (
						<div className="fixed bottom-0 inset-x-0 z-[60] border-t border-border bg-surface/95 backdrop-blur px-4 py-3">
							<div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
								<p className="text-sm text-ink-muted">
									<Plural
										value={fuseSelectedCount}
										one="# item seleccionado"
										other="# items seleccionados"
									/>
								</p>
								<Button onClick={handleFuseSelected} className="w-full sm:w-auto">
									<Trans>Combinar</Trans>
								</Button>
							</div>
						</div>
					) : null}

					{!fuseSelectMode && checkedShoppingItems.length > 0 ? (
						<div className="fixed bottom-0 inset-x-0 z-[60] border-t border-border bg-surface/95 backdrop-blur px-4 py-3">
							<div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
								<p className="text-sm text-ink-muted">
									<Plural
										value={checkedShoppingItems.length}
										one="# item marcado"
										other="# items marcados"
									/>
								</p>
								<Button
									onClick={() => setFinishConfirmOpen(true)}
									className="w-full sm:w-auto"
								>
									<Trans>Terminar compra</Trans>
								</Button>
							</div>
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}

export default ShoppingList;
