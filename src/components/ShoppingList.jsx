import { t } from "@lingui/core/macro";
import { Trans, Plural } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { Link } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import { useAppState } from "../context/AppState";
import { useToast } from "./Toast";
import { parseDateISO } from "../features/calendar/dateUtils.js";
import {
	expandFusedShoppingItem,
	shoppingItemChecklistKey,
} from "../features/shopping/applyShoppingFusions.js";
import { useBudget, estimatePrice } from "../features/shopping/useBudget.js";
import { usePdfExport } from "../features/shopping/usePdfExport.js";
import { formatShoppingQuantities } from "../features/shopping/applyPantry.js";
import { useShoppingList } from "../features/shopping/useShoppingList.js";
import ShoppingMemberPicker from "../features/shopping/ShoppingMemberPicker";
import { quantityForPantryStock } from "../features/pantry/pantryActions.js";
import { formatQuantity } from "../domain/quantity.js";
import Button from "./ui/Button";
import ConfirmDialog from "./ui/ConfirmDialog";
import ShoppingListItem from "./ui/ShoppingListItem";
import AddExtrasSheet from "./shopping/AddExtrasSheet";

function formatItemQuantity(item) {
	if (item.pantryCovered) return "";
	return formatShoppingQuantities(item.quantities);
}

function itemKeyFor(item) {
	return shoppingItemChecklistKey(item);
}

function ChecklistCategoryBlocks({
	categories,
	isChecked,
	shoppingWeekPlan,
	showSources,
	onToggle,
	onMoveToPantry,
	fuseSelectMode,
	fuseSelectedKeys,
	onToggleFuseSelect,
	onUnfuse,
}) {
	return categories.map(({ category, items }) => (
		<div key={category} className="mb-6">
			<h3 className="text-lg font-medium text-brand mb-3 border-b border-border pb-2">
				{category}{" "}
				<span className="text-ink-muted text-sm">({items.length})</span>
			</h3>
			<ul className="space-y-2">
				{items.map((item) => {
					const key = itemKeyFor(item);
					const fuseSelected = Boolean(fuseSelectedKeys?.[key]);
					const canFuseSelect = fuseSelectMode && !item.isFused;
					return (
						<li
							key={key}
							className={`py-2 px-3 rounded-app ${
								canFuseSelect && fuseSelected
									? "bg-[var(--color-accent-shopping)]/15 ring-2 ring-[var(--color-accent-shopping)]"
									: isChecked
										? "bg-[var(--color-accent-leaf)]/10"
										: "bg-surface-2"
							}`}
						>
							<div className="flex items-start gap-3">
								{fuseSelectMode ? (
									<input
										type="checkbox"
										checked={item.isFused ? false : fuseSelected}
										disabled={item.isFused}
										onChange={() => onToggleFuseSelect?.(key)}
										className="mt-1 h-5 w-5 accent-[var(--color-accent-shopping)] shrink-0"
										aria-label={t`Seleccionar ${item.name} para combinar`}
									/>
								) : (
									<input
										type="checkbox"
										checked={isChecked}
										onChange={() => onToggle(key)}
										className="mt-1 h-5 w-5 accent-[var(--color-brand)] shrink-0"
										aria-label={item.name}
									/>
								)}
								<div className="flex-1 min-w-0">
									<ShoppingListItem
										item={item}
										priceEstimate={estimatePrice(item)}
										formatQuantity={formatItemQuantity}
										weekPlan={shoppingWeekPlan}
										showSources={showSources}
										checked={!fuseSelectMode && isChecked}
									/>
									{!fuseSelectMode &&
									(item.isFused ||
										(!item.isExtra && !item.pantryCovered)) ? (
										<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
											{item.isFused ? (
												<button
													type="button"
													onClick={() => onUnfuse?.(item.fusionId)}
													className="text-xs font-medium text-ink underline underline-offset-2 decoration-border hover:text-ink-muted"
												>
													<Trans>Separar</Trans>
												</button>
											) : null}
											{!item.isExtra && !item.pantryCovered ? (
												<button
													type="button"
													onClick={() => onMoveToPantry(item)}
													className="text-xs font-medium text-[var(--color-accent-pantry)] hover:opacity-80"
												>
													<Trans>Ya lo tengo → despensa</Trans>
												</button>
											) : null}
										</div>
									) : null}
								</div>
							</div>
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
		setCheckedItems,
		fuseShoppingItems,
		unfuseShoppingItem,
		addShoppingExtra,
		updateShoppingExtra,
		removeShoppingExtra,
		moveToPantryFromShopping,
		finishShoppingToPantry,
	} = useAppState();
	const toast = useToast();
	const { i18n } = useLingui();
	const checkedItems = state.checkedItems || {};
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

	const checkedShoppingItems = useMemo(() => {
		return Object.values(shoppingList).filter((item) => {
			if (item.pantryCovered) return false;
			return Boolean(checkedItems[itemKeyFor(item)]);
		});
	}, [shoppingList, checkedItems]);

	/** Checklist: split categories into unchecked vs checked (like pre-refactor UX). */
	const { uncheckedCategories, checkedCategories } = useMemo(() => {
		const unchecked = [];
		const checked = [];
		Object.entries(groupedShoppingList).forEach(([category, items]) => {
			const uncheckedItems = [];
			const checkedItemsList = [];
			items.forEach((item) => {
				const key = itemKeyFor(item);
				if (checkedItems[key]) checkedItemsList.push(item);
				else uncheckedItems.push(item);
			});
			if (uncheckedItems.length > 0) {
				unchecked.push({ category, items: uncheckedItems });
			}
			if (checkedItemsList.length > 0) {
				checked.push({ category, items: checkedItemsList });
			}
		});
		return { uncheckedCategories: unchecked, checkedCategories: checked };
	}, [groupedShoppingList, checkedItems]);

	const fuseSelectedCount = useMemo(
		() => Object.values(fuseSelectedKeys).filter(Boolean).length,
		[fuseSelectedKeys],
	);

	const handleAddExtras = (items) => {
		for (const item of items) {
			addShoppingExtra(item);
		}
	};

	const handleEditExtraSubmit = (items) => {
		const item = items[0];
		if (!editingExtra || !item) return;
		updateShoppingExtra(editingExtra.id, item);
		setEditingExtra(null);
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
		const members = expandFusedShoppingItem(item);
		for (const member of members) {
			if (member.pantryCovered) continue;
			moveToPantryFromShopping({
				name: member.name,
				quantity: quantityForPantryStock(member),
				category: member.category,
			});
		}
		if (item.isFused && item.fusionId) {
			unfuseShoppingItem(item.fusionId);
		} else {
			const key = itemKeyFor(item);
			setCheckedItems((prev) => ({ ...prev, [key]: true }));
		}
		toast?.success?.(t`Guardado en despensa`);
	};

	const handleFinishShopping = () => {
		const count = checkedShoppingItems.length;
		finishShoppingToPantry(checkedShoppingItems);
		setFinishConfirmOpen(false);
		setShowFullScreenChecklist(false);
		exitFuseSelectMode();
		if (count > 0) {
			toast?.success?.(t`${count} items guardados en despensa`);
		}
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

	const extras = state.shoppingExtras || [];

	return (
		<div className="flex flex-col gap-6 relative">
			<ShoppingMemberPicker />

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
								onClick={() => setShowSources(!showSources)}
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
									<ul className="space-y-2">
										{items.map((item) => {
											const key = itemKeyFor(item);
											return (
												<li key={key} className="group">
													<div className="flex items-start gap-2">
														<div className="flex-1 min-w-0">
															<ShoppingListItem
																item={item}
																priceEstimate={estimatePrice(item)}
																formatQuantity={formatItemQuantity}
																weekPlan={shoppingWeekPlan}
																showSources={showSources}
															/>
															{item.inPantry && !item.pantryCovered ? (
																<p className="text-xs text-[var(--color-accent-pantry)] mt-0.5">
																	{item.pantrySubtracted ? (
																		<Trans>
																			Despensa cubre {item.pantrySubtracted}
																		</Trans>
																	) : item.pantryNote ? (
																		<Trans>
																			También en despensa ({item.pantryNote})
																		</Trans>
																	) : null}
																</p>
															) : null}
															{item.pantryCovered ? (
																<p className="text-xs text-[var(--color-accent-leaf)] mt-0.5">
																	<Trans>Cubierto por despensa</Trans>
																</p>
															) : null}
															{item.isExtra ? (
																<p className="text-xs text-[var(--color-accent-shopping)] mt-0.5">
																	<Trans>Extra</Trans>
																	{item.extraId
																		? extras.find((e) => e.id === item.extraId)
																				?.note
																			? ` · ${extras.find((e) => e.id === item.extraId).note}`
																			: ""
																		: null}
																</p>
															) : null}
															{item.isFused ? (
																<button
																	type="button"
																	onClick={() => handleUnfuse(item.fusionId)}
																	className="text-xs font-medium text-ink underline underline-offset-2 decoration-border hover:text-ink-muted mt-1.5"
																>
																	<Trans>Separar</Trans>
																</button>
															) : null}
														</div>
														{!item.isExtra && !item.pantryCovered ? (
															<button
																type="button"
																onClick={() => handleMoveToPantry(item)}
																className="text-xs font-semibold text-[var(--color-accent-pantry)] min-h-11 px-2 shrink-0 opacity-80 hover:opacity-100"
															>
																<Trans>Ya lo tengo</Trans>
															</button>
														) : null}
														{item.isExtra && item.extraId ? (
															<div className="flex flex-col gap-1 shrink-0">
																<button
																	type="button"
																	className="text-xs font-semibold text-ink-muted min-h-9 px-2"
																	onClick={() => {
																		const extra = extras.find(
																			(e) => e.id === item.extraId,
																		);
																		if (extra) setEditingExtra(extra);
																	}}
																>
																	<Trans>Editar</Trans>
																</button>
																<button
																	type="button"
																	className="text-xs font-semibold text-[var(--color-danger)] min-h-9 px-2"
																	onClick={() =>
																		removeShoppingExtra(item.extraId)
																	}
																>
																	<Trans>Quitar</Trans>
																</button>
															</div>
														) : null}
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
									×
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

			{showFullScreenChecklist && (
				<div className="fixed inset-0 z-50 bg-surface overflow-y-auto pb-28">
					<div className="max-w-4xl mx-auto">
						<div
							className={
								fuseSelectMode
									? "sticky top-0 z-10 px-4 pt-4 pb-3 mb-4 bg-surface/95 backdrop-blur border-b border-border"
									: "px-4 pt-4"
							}
						>
							<div
								className={`flex justify-between items-center ${fuseSelectMode ? "mb-3" : "mb-6"}`}
							>
								<h2 className="font-display text-2xl">
									<Trans>Lista de Compras — Checklist</Trans>
								</h2>
								<button
									type="button"
									onClick={() => {
										exitFuseSelectMode();
										setShowFullScreenChecklist(false);
									}}
									className="min-h-11 min-w-11 rounded-full hover:bg-surface-2"
									aria-label={t`Cerrar`}
								>
									✕
								</button>
							</div>
							<div
								className={`flex flex-wrap gap-2 ${fuseSelectMode ? "" : "mb-4"}`}
							>
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
											onClick={() => {
												setFuseSelectMode(true);
												setFuseSelectedKeys({});
											}}
											className="min-h-11 px-3 rounded-app border border-border bg-surface text-ink font-semibold"
										>
											<Trans>Combinar items</Trans>
										</button>
										<button
											type="button"
											onClick={() => setShowSources(!showSources)}
											className="min-h-11 px-3 rounded-app border border-border bg-surface text-ink font-semibold"
										>
											{showSources ? (
												<Trans>Ocultar fuentes</Trans>
											) : (
												<Trans>Mostrar fuentes</Trans>
											)}
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
									isChecked={false}
									shoppingWeekPlan={shoppingWeekPlan}
									showSources={showSources}
									onToggle={toggleItem}
									onMoveToPantry={handleMoveToPantry}
									fuseSelectMode={fuseSelectMode}
									fuseSelectedKeys={fuseSelectedKeys}
									onToggleFuseSelect={toggleFuseSelect}
									onUnfuse={handleUnfuse}
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
									isChecked={true}
									shoppingWeekPlan={shoppingWeekPlan}
									showSources={showSources}
									onToggle={toggleItem}
									onMoveToPantry={handleMoveToPantry}
									fuseSelectMode={fuseSelectMode}
									fuseSelectedKeys={fuseSelectedKeys}
									onToggleFuseSelect={toggleFuseSelect}
									onUnfuse={handleUnfuse}
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
			)}
		</div>
	);
}

export default ShoppingList;
