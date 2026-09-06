import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Carrot } from "lucide-react";
import MealPlate from "./MealPlate.jsx";
import { MEAL_TYPE_MSG } from "./mealTypeLabels.js";

/**
 * Inventory-style meal tile. The whole card selects the meal.
 */
export default function MealTile({ meal, onSelect }) {
	const { _ } = useLingui();
	const typeLabel = _(MEAL_TYPE_MSG[meal.mealType] || MEAL_TYPE_MSG.otro);
	const ribbon = typeLabel.slice(0, 3);
	const count = meal.ingredients?.length || 0;

	return (
		<button
			type="button"
			onClick={() => onSelect?.(meal)}
			className="flex h-full w-full min-w-0 flex-col items-center text-center rounded-app px-0.5 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
		>
			<MealPlate meal={meal} size="md" ribbon={ribbon} />
			<span className="mt-1.5 flex w-full min-w-0 flex-col items-center gap-0.5">
				<span className="w-full line-clamp-2 text-xs font-semibold text-ink leading-snug">
					{meal.name}
				</span>
				<span
					className="inline-flex min-h-6 items-center justify-center gap-0.5 rounded-full bg-surface px-1.5 text-[11px] font-bold tabular-nums text-[var(--color-accent-tomato)] shadow-soft"
					aria-label={
						count === 1 ? t`1 ingrediente` : t`${count} ingredientes`
					}
				>
					<Carrot className="size-3" aria-hidden />
					{count}
				</span>
			</span>
		</button>
	);
}
