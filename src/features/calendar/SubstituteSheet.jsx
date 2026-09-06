import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import { useAppState } from "../../context/AppState";
import {
	getIngredientCategory,
	INGREDIENT_EQUIVALENTS,
	OTHER_CATEGORY_NAME,
} from "../../domain/ingredient.js";
import Button from "../../components/ui/Button";
import Sheet from "../../components/ui/Sheet";
import { quantityLabel } from "./calendarActions.js";

/**
 * Substitute an ingredient on a scheduled instance (+ optional library update).
 */
export default function SubstituteSheet({
	open,
	onClose,
	instanceId,
	ingredient,
	mealName,
}) {
	const { substituteIngredient } = useAppState();
	const [replacement, setReplacement] = useState("");
	const [updateLibrary, setUpdateLibrary] = useState(false);

	if (!ingredient) return null;

	const category = getIngredientCategory(ingredient.name);
	const equivalents =
		INGREDIENT_EQUIVALENTS[category] ||
		Object.values(INGREDIENT_EQUIVALENTS).flat();
	const hasCategoryList = Boolean(INGREDIENT_EQUIVALENTS[category]);

	const handleConfirm = () => {
		if (!replacement.trim()) return;
		substituteIngredient({
			instanceId,
			ingredientId: ingredient.id,
			replacementLine: replacement,
			updateLibrary,
		});
		setReplacement("");
		setUpdateLibrary(false);
		onClose();
	};

	return (
		<Sheet
			open={open}
			onClose={onClose}
			title={<Trans>Sustituir ingrediente</Trans>}
			footer={
				<div className="flex gap-2 justify-end">
					<Button variant="secondary" onClick={onClose}>
						<Trans>Cancelar</Trans>
					</Button>
					<Button onClick={handleConfirm} disabled={!replacement}>
						<Trans>Confirmar</Trans>
					</Button>
				</div>
			}
		>
			<p className="text-sm text-ink-muted mb-4">
				<Trans>
					Estás sustituyendo{" "}
					<span className="font-semibold text-ink">
						{ingredient.name}
						{quantityLabel(ingredient.quantity)
							? ` (${quantityLabel(ingredient.quantity)})`
							: ""}
					</span>{" "}
					en <span className="font-semibold text-ink">{mealName}</span>.
				</Trans>
			</p>

			{equivalents.length === 0 ? (
				<p className="text-sm text-[var(--color-danger)]">
					<Trans>
						No hay equivalentes sugeridos para este ingrediente. Prueba otra
						categoría o edita la comida en la biblioteca.
					</Trans>
				</p>
			) : (
				<label className="block space-y-1 mb-4">
					<span className="text-sm font-semibold">
						<Trans>Reemplazar con</Trans>
					</span>
					<select
						value={replacement}
						onChange={(e) => setReplacement(e.target.value)}
						className="w-full min-h-11 px-3 rounded-app border border-border bg-surface"
					>
						<option value="">{t`Selecciona un equivalente`}</option>
						{hasCategoryList
							? equivalents.map((eq) => (
									<option key={eq} value={eq}>
										{eq}
									</option>
								))
							: Object.entries(INGREDIENT_EQUIVALENTS).map(
									([catName, list]) => (
										<optgroup
											key={catName}
											label={
												catName === OTHER_CATEGORY_NAME
													? catName
													: catName
											}
										>
											{list.map((eq) => (
												<option key={`${catName}-${eq}`} value={eq}>
													{eq}
												</option>
											))}
										</optgroup>
									),
								)}
					</select>
				</label>
			)}

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
