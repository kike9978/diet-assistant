import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { X } from "lucide-react";
import {
	DEFAULT_QUANTITY_UNIT,
	isUnitOnlyQuantity,
} from "../../domain/quantity.js";
import Button from "../../components/ui/Button";
import { unitLabel, unitsForSelect } from "./quantityUnitLabels.js";

export function emptyIngredientQuantityRow() {
	return { name: "", amount: "", unit: DEFAULT_QUANTITY_UNIT };
}

/**
 * Name + amount + unit + remove — shared by meal form and substitute flows.
 */
export default function IngredientQuantityRow({ row, onChange, onRemove }) {
	const { _ } = useLingui();
	const unitOnly = isUnitOnlyQuantity(row.unit);

	return (
		<div className="grid grid-cols-[minmax(0,1fr)_4.25rem_5.75rem_auto] gap-2">
			<input
				value={row.name}
				onChange={(e) => onChange("name", e.target.value)}
				placeholder={t`Ingrediente`}
				className="min-h-11 min-w-0 px-3 rounded-app border border-border bg-surface"
			/>
			<input
				value={unitOnly ? "" : row.amount}
				onChange={(e) => onChange("amount", e.target.value)}
				placeholder={unitOnly ? "—" : t`1/2`}
				inputMode="decimal"
				disabled={unitOnly}
				aria-label={t`Cantidad`}
				className="min-h-11 min-w-0 px-2 rounded-app border border-border bg-surface disabled:text-ink-muted disabled:opacity-60"
			/>
			<select
				value={row.unit}
				onChange={(e) => onChange("unit", e.target.value)}
				aria-label={t`Unidad`}
				className="min-h-11 min-w-0 px-2 rounded-app border border-border bg-surface"
			>
				{unitsForSelect(row.unit).map((unit) => (
					<option key={unit} value={unit}>
						{unitLabel(unit, _)}
					</option>
				))}
			</select>
			<Button
				type="button"
				variant="ghost"
				className="!px-2"
				aria-label={t`Quitar ingrediente`}
				onClick={onRemove}
			>
				<X className="size-4" aria-hidden />
			</Button>
		</div>
	);
}
