import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import ShoppingItemSourcesExpand from "./ShoppingItemSourcesExpand";

function Chip({ chip }) {
	if (!chip) return null;
	let label = null;
	if (chip.type === "ajustada") label = <Trans>Ajustada</Trans>;
	else if (chip.type === "crudo") label = <Trans>Crudo</Trans>;
	else if (chip.type === "cocido") label = <Trans>Cocido</Trans>;
	else if (chip.type === "remaining") {
		label = `${chip.remaining}/${chip.total}`;
	}
	if (!label) return null;
	return (
		<span className="inline-flex items-center shrink-0 text-[11px] font-medium leading-none text-ink-muted bg-surface border border-border px-1.5 py-0.5 rounded">
			{label}
		</span>
	);
}

/**
 * Single-line aisle row. Checkbox checks; the rest of the row opens the item sheet.
 * When showSources is on, a Mostrar detalles expander appears under the row.
 */
export default function ShoppingChecklistRow({
	item,
	view,
	price,
	showCheckbox = true,
	fuseSelectMode = false,
	fuseSelected = false,
	checked = false,
	showSources = false,
	weekPlan,
	onToggle,
	onToggleFuseSelect,
	onOpen,
}) {
	const checkboxRef = useRef(null);
	const mixed = view?.checkState === "mixed";
	const fullyChecked = Boolean(checked || view?.checkState === "checked");
	const sourcesVisible = showSources && !fuseSelectMode;

	useEffect(() => {
		if (checkboxRef.current) {
			checkboxRef.current.indeterminate = mixed && !fuseSelectMode;
		}
	}, [mixed, fuseSelectMode]);

	const canFuseSelect = fuseSelectMode && !item.isFused;
	const displayQty = item.pantryCovered ? "" : view?.displayQty || "";

	return (
		<div>
			<div className="flex items-center gap-2 min-h-11">
				{showCheckbox ? (
					<input
						ref={checkboxRef}
						type="checkbox"
						checked={
							fuseSelectMode
								? item.isFused
									? false
									: fuseSelected
								: fullyChecked
						}
						disabled={fuseSelectMode && item.isFused}
						onChange={() => {
							if (fuseSelectMode) onToggleFuseSelect?.();
							else onToggle?.();
						}}
						onClick={(e) => e.stopPropagation()}
						className={`h-5 w-5 shrink-0 ${
							fuseSelectMode
								? "accent-[var(--color-accent-shopping)]"
								: "accent-[var(--color-brand)]"
						}`}
						aria-label={
							fuseSelectMode
								? t`Seleccionar ${item.name} para combinar`
								: item.name
						}
					/>
				) : null}
				<button
					type="button"
					onClick={onOpen}
					className="flex-1 min-w-0 flex items-center gap-2 text-left min-h-11"
				>
					<span
						className={`min-w-0 flex-1 line-clamp-2 font-semibold leading-snug ${
							fullyChecked && !fuseSelectMode
								? "line-through text-ink-muted"
								: "text-ink"
						}`}
					>
						{item.name}
					</span>
					<div className="shrink-0 text-right">
						{displayQty ? (
							<p className="text-sm text-ink-muted tabular-nums leading-tight">
								{displayQty}
							</p>
						) : null}
						{price != null ? (
							<p className="text-[11px] text-ink-muted tabular-nums leading-tight">
								~{price}
							</p>
						) : null}
					</div>
					<Chip chip={view?.chip} />
					<ChevronRight
						className="size-4 text-ink-muted shrink-0"
						aria-hidden
					/>
				</button>
			</div>
			{sourcesVisible ? (
				<div className={showCheckbox ? "pl-7" : undefined}>
					<ShoppingItemSourcesExpand item={item} weekPlan={weekPlan} />
				</div>
			) : null}
		</div>
	);
}
