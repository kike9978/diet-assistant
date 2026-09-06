import { Trans } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Sheet from "../../components/ui/Sheet";
import { formatQuantity } from "../../domain/quantity.js";
import { uniqueDraftMealsForSave } from "./weekDraft.js";

/**
 * Checklist to save imported/created draft meals into the library.
 */
export default function SaveImportedMealsSheet({
	open,
	onClose,
	draft,
	onConfirm,
}) {
	const groups = uniqueDraftMealsForSave(draft);
	const [selected, setSelected] = useState(() => new Set());
	const [saveAsTemplate, setSaveAsTemplate] = useState(false);

	useEffect(() => {
		if (!open) return;
		setSelected(new Set(groups.flatMap((g) => g.tempIds)));
		setSaveAsTemplate(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- reset when sheet opens
	}, [open, draft]);

	const toggleGroup = (tempIds) => {
		setSelected((prev) => {
			const next = new Set(prev);
			const allOn = tempIds.every((id) => next.has(id));
			if (allOn) {
				for (const id of tempIds) next.delete(id);
			} else {
				for (const id of tempIds) next.add(id);
			}
			return next;
		});
	};

	const selectAll = () => {
		setSelected(new Set(groups.flatMap((g) => g.tempIds)));
	};

	const selectNone = () => setSelected(new Set());

	return (
		<Sheet
			open={open}
			onClose={onClose}
			title={<Trans>Guardar en biblioteca</Trans>}
			footer={
				<div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
					<Button
						variant="secondary"
						onClick={() =>
							onConfirm({ selectedTempIds: [], saveAsTemplate: false })
						}
					>
						<Trans>No guardar ninguna</Trans>
					</Button>
					<Button
						onClick={() =>
							onConfirm({
								selectedTempIds: [...selected],
								saveAsTemplate,
							})
						}
					>
						<Trans>Guardar seleccionadas</Trans>
					</Button>
				</div>
			}
		>
			<p className="text-sm text-ink-muted mb-4">
				<Trans>
					Elige qué comidas nuevas quieres guardar en tu lista. Puedes editarlas
					después en Comidas.
				</Trans>
			</p>

			<div className="flex gap-2 mb-3">
				<Button variant="ghost" className="!min-h-9 !px-2 text-xs" onClick={selectAll}>
					<Trans>Todas</Trans>
				</Button>
				<Button variant="ghost" className="!min-h-9 !px-2 text-xs" onClick={selectNone}>
					<Trans>Ninguna</Trans>
				</Button>
			</div>

			{groups.length === 0 ? (
				<p className="text-sm text-ink-muted">
					<Trans>No hay comidas nuevas que guardar.</Trans>
				</p>
			) : (
				<ul className="space-y-2 max-h-72 overflow-y-auto mb-4">
					{groups.map((group) => {
						const checked = group.tempIds.every((id) => selected.has(id));
						const qtyPreview = (group.meal.ingredients || [])
							.slice(0, 3)
							.map((ing) => {
								const q =
									typeof ing.quantity === "string"
										? ing.quantity
										: formatQuantity(ing.quantity);
								return q ? `${ing.name} (${q})` : ing.name;
							})
							.join(", ");
						return (
							<li key={group.fingerprint}>
								<label className="flex items-start gap-3 border border-border rounded-app px-3 py-3 cursor-pointer hover:bg-surface-2">
									<input
										type="checkbox"
										checked={checked}
										onChange={() => toggleGroup(group.tempIds)}
										className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
									/>
									<span className="min-w-0">
										<span className="font-semibold text-ink block">
											{group.meal.name}
										</span>
										<span className="text-xs text-ink-muted block">
											{group.tempIds.length > 1 ? (
												<Trans>
													Aparece {group.tempIds.length} veces esta semana
												</Trans>
											) : (
												qtyPreview || <Trans>Sin ingredientes</Trans>
											)}
										</span>
									</span>
								</label>
							</li>
						);
					})}
				</ul>
			)}

			<label className="flex items-center gap-2 text-sm text-ink">
				<input
					type="checkbox"
					checked={saveAsTemplate}
					onChange={(e) => setSaveAsTemplate(e.target.checked)}
					className="h-4 w-4 accent-[var(--color-brand)]"
				/>
				<Trans>Guardar también como plantilla</Trans>
			</label>
		</Sheet>
	);
}
