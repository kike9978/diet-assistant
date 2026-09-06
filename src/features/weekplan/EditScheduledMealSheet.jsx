import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useMemo, useState } from "react";
import { useAppState } from "../../context/AppState";
import Sheet from "../../components/ui/Sheet";
import MealForm from "../meals/MealForm";
import { MEAL_TYPE_MSG } from "../meals/mealTypeLabels.js";
import { formatQuantity } from "../../domain/quantity.js";
import MealSaveDispositionDialog from "./MealSaveDispositionDialog";

/**
 * Edit a scheduled calendar meal with optional library disposition.
 */
export default function EditScheduledMealSheet({
	open,
	onClose,
	instanceId,
	meal,
}) {
	const { applyMealSaveDisposition } = useAppState();
	const { _ } = useLingui();
	const [pendingPayload, setPendingPayload] = useState(null);

	const initialMeal = useMemo(() => {
		if (!meal) return null;
		return {
			name: meal.name,
			mealType: meal.mealType,
			servings: 1,
			ingredients: (meal.ingredients || []).map((ing) => ({
				...ing,
				quantity:
					typeof ing.quantity === "string"
						? ing.quantity
						: formatQuantity(ing.quantity),
			})),
		};
	}, [meal]);

	if (!meal || !instanceId) return null;

	const handleSubmit = (payload) => {
		if (meal.mealId) {
			setPendingPayload(payload);
			return;
		}
		applyMealSaveDisposition({
			instanceId,
			payload,
			disposition: "once",
		});
		onClose();
	};

	const handleDisposition = (disposition) => {
		if (!pendingPayload) return;
		applyMealSaveDisposition({
			instanceId,
			payload: pendingPayload,
			disposition,
		});
		setPendingPayload(null);
		onClose();
	};

	return (
		<>
			<Sheet
				open={open && !pendingPayload}
				onClose={onClose}
				title={<Trans>Editar comida</Trans>}
			>
				<p className="text-xs text-ink-muted mb-3">
					{_(MEAL_TYPE_MSG[meal.mealType] || MEAL_TYPE_MSG.otro)}
				</p>
				<MealForm
					key={instanceId}
					initialMeal={initialMeal}
					submitLabel={<Trans>Guardar</Trans>}
					onSubmit={handleSubmit}
					onCancel={onClose}
				/>
			</Sheet>

			<MealSaveDispositionDialog
				open={Boolean(pendingPayload)}
				mealName={meal.name}
				onChoose={handleDisposition}
				onCancel={() => setPendingPayload(null)}
			/>
		</>
	);
}

/**
 * Edit a draft meal inside the week builder.
 */
export function EditDraftMealSheet({ open, onClose, meal, onSave }) {
	const { _ } = useLingui();
	const [pendingPayload, setPendingPayload] = useState(null);

	const initialMeal = useMemo(() => {
		if (!meal) return null;
		return {
			name: meal.name,
			mealType: meal.mealType,
			servings: 1,
			ingredients: (meal.ingredients || []).map((ing) => ({
				...ing,
				quantity:
					typeof ing.quantity === "string"
						? ing.quantity
						: formatQuantity(ing.quantity),
			})),
		};
	}, [meal]);

	if (!meal) return null;

	const handleSubmit = (payload) => {
		if (meal.mealId) {
			setPendingPayload(payload);
			return;
		}
		onSave(payload, "once");
		onClose();
	};

	const handleDisposition = (disposition) => {
		if (!pendingPayload) return;
		onSave(pendingPayload, disposition);
		setPendingPayload(null);
		onClose();
	};

	return (
		<>
			<Sheet
				open={open && !pendingPayload}
				onClose={onClose}
				title={<Trans>Editar comida</Trans>}
			>
				<p className="text-xs text-ink-muted mb-3">
					{_(MEAL_TYPE_MSG[meal.mealType] || MEAL_TYPE_MSG.otro)}
				</p>
				<MealForm
					key={meal.tempId}
					initialMeal={initialMeal}
					submitLabel={<Trans>Guardar</Trans>}
					onSubmit={handleSubmit}
					onCancel={onClose}
				/>
			</Sheet>

			<MealSaveDispositionDialog
				open={Boolean(pendingPayload)}
				mealName={meal.name}
				onChoose={handleDisposition}
				onCancel={() => setPendingPayload(null)}
			/>
		</>
	);
}
