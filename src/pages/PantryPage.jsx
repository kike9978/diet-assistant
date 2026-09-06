import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useAppState } from "../context/AppState";
import { formatQuantity } from "../domain/quantity.js";
import { getIngredientCategory, OTHER_CATEGORY_NAME } from "../domain/ingredient.js";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import PantryFormSheet from "../features/pantry/PantryFormSheet";

export default function PantryPage() {
	const { state, addPantryItem, updatePantryItem, removePantryItem } =
		useAppState();
	const [sheetOpen, setSheetOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [deleteId, setDeleteId] = useState(null);

	const grouped = useMemo(() => {
		/** @type {Record<string, typeof state.pantry>} */
		const map = {};
		for (const item of state.pantry) {
			const cat =
				item.category || getIngredientCategory(item.name) || OTHER_CATEGORY_NAME;
			if (!map[cat]) map[cat] = [];
			map[cat].push(item);
		}
		return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
	}, [state.pantry]);

	const openCreate = () => {
		setEditing(null);
		setSheetOpen(true);
	};

	const openEdit = (item) => {
		setEditing(item);
		setSheetOpen(true);
	};

	const handleSubmit = (payload) => {
		if (editing) {
			updatePantryItem(editing.id, payload);
		} else {
			addPantryItem(payload);
		}
	};

	if (state.pantry.length === 0) {
		return (
			<>
				<EmptyState
					title={<Trans>Despensa vacía</Trans>}
					description={
						<Trans>
							Guarda lo que ya tienes en casa. La lista de compras lo restará
							automáticamente.
						</Trans>
					}
					actionLabel={<Trans>Añadir item</Trans>}
					onAction={openCreate}
				/>
				<PantryFormSheet
					open={sheetOpen}
					onClose={() => setSheetOpen(false)}
					onSubmit={handleSubmit}
					initial={editing}
				/>
			</>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3 flex-wrap">
				<div>
					<h1 className="font-display text-2xl text-ink">
						<Trans>Despensa</Trans>
					</h1>
					<p className="text-sm text-ink-muted mt-0.5">
						<Trans>
							Lo que ya tienes se resta de la lista de compras.
						</Trans>
					</p>
				</div>
				<Button onClick={openCreate}>
					<Trans>Añadir</Trans>
				</Button>
			</div>

			{grouped.map(([category, items]) => (
				<section key={category}>
					<h2 className="text-sm font-semibold text-[var(--color-accent-pantry)] mb-2">
						{category}{" "}
						<span className="text-ink-muted font-normal">({items.length})</span>
					</h2>
					<ul className="border border-border rounded-app bg-surface divide-y divide-border overflow-hidden">
						{items.map((item) => (
							<li
								key={item.id}
								className="flex items-center justify-between gap-3 px-4 py-3 min-h-11"
							>
								<button
									type="button"
									className="text-left min-w-0 flex-1"
									onClick={() => openEdit(item)}
								>
									<p className="font-semibold text-ink truncate">{item.name}</p>
									<p className="text-sm text-ink-muted">
										{formatQuantity(item.quantity)}
									</p>
								</button>
								<Button
									variant="ghost"
									className="!px-2 shrink-0"
									aria-label={t`Eliminar ${item.name}`}
									onClick={() => setDeleteId(item.id)}
								>
									<X className="size-4" aria-hidden />
								</Button>
							</li>
						))}
					</ul>
				</section>
			))}

			<PantryFormSheet
				open={sheetOpen}
				onClose={() => setSheetOpen(false)}
				onSubmit={handleSubmit}
				initial={editing}
			/>

			<ConfirmDialog
				open={Boolean(deleteId)}
				danger
				title={<Trans>Quitar de la despensa</Trans>}
				description={
					<Trans>¿Eliminar este item del inventario?</Trans>
				}
				confirmLabel={<Trans>Eliminar</Trans>}
				onConfirm={() => {
					if (deleteId) removePantryItem(deleteId);
					setDeleteId(null);
				}}
				onCancel={() => setDeleteId(null)}
			/>
		</div>
	);
}
