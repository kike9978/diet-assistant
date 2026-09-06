import { Trans } from "@lingui/react/macro";
import Button from "../../components/ui/Button";
import Sheet from "../../components/ui/Sheet";
import { MEAL_ICON_CATALOG, normalizeMealIcon } from "./mealIconCatalog.js";
import { resolveMealIcon } from "./mealGlyph.js";
import MealPlate from "./MealPlate.jsx";

/**
 * Pick a catalog icon for a library meal, or reset to the automatic suggestion.
 */
export default function MealIconPicker({ open, meal, onClose, onPick }) {
	if (!meal) return null;

	const stored = normalizeMealIcon(meal.icon);
	const current = resolveMealIcon(meal);
	const suggested = resolveMealIcon({ ...meal, icon: null });

	return (
		<Sheet
			open={open}
			onClose={onClose}
			title={<Trans>Elegir icono</Trans>}
		>
			<div className="flex items-center gap-3 mb-4">
				<MealPlate meal={meal} iconKey={current} size="lg" />
				<p className="min-w-0 text-sm text-ink-muted truncate">{meal.name}</p>
			</div>
			<ul className="grid grid-cols-4 sm:grid-cols-5 gap-3">
				{MEAL_ICON_CATALOG.map(({ key }) => {
					const selected = stored ? stored === key : suggested === key;
					return (
						<li key={key}>
							<button
								type="button"
								onClick={() => onPick(key)}
								className={`flex w-full items-center justify-center rounded-app p-1 transition ${selected
										? "ring-2 ring-[var(--color-accent-citrus)] bg-surface-2"
										: "hover:bg-surface-2"
									}`}
								aria-pressed={selected}
							>
								<MealPlate meal={meal} iconKey={key} size="sm" />
							</button>
						</li>
					);
				})}
			</ul>
			<div className="mt-4">
				<Button
					variant={stored ? "secondary" : "primary"}
					className="w-full"
					onClick={() => onPick(null)}
				>
					<Trans>Automático</Trans>
				</Button>
			</div>
		</Sheet>
	);
}
