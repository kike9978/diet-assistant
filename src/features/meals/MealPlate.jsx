import { mealIconComponent } from "./mealIconCatalog.js";
import { resolveMealIcon } from "./mealGlyph.js";
import { MEAL_TYPE_COLOR } from "../calendar/mealTypeColors.js";

const SIZES = {
	sm: "size-12",
	md: "size-16",
	lg: "size-[4.5rem]",
};

const ICON_SIZES = {
	sm: "size-6",
	md: "size-7",
	lg: "size-8",
};

/**
 * Circular meal glyph with an optional type ribbon.
 */
export default function MealPlate({
	meal,
	iconKey,
	size = "md",
	ribbon,
	className = "",
}) {
	const key = iconKey || resolveMealIcon(meal);
	const Icon = mealIconComponent(key);
	const color =
		MEAL_TYPE_COLOR[meal?.mealType] || MEAL_TYPE_COLOR.otro;

	return (
		<span
			className={`relative inline-flex items-center justify-center rounded-full bg-surface ${SIZES[size] || SIZES.md} ${className}`}
			style={{
				boxShadow: `0 0 0 3px ${color}, 0 6px 16px rgb(31 42 36 / 0.1)`,
			}}
		>
			<Icon
				className={`${ICON_SIZES[size] || ICON_SIZES.md} text-ink`}
				strokeWidth={1.75}
				aria-hidden
			/>
			{ribbon ? (
				<span
					className="absolute -bottom-0.5 -right-1 max-w-[2.75rem] truncate rounded-sm bg-[var(--color-accent-tomato)] px-1 py-px text-[9px] font-bold uppercase leading-tight text-white shadow-soft -rotate-[8deg]"
				>
					{ribbon}
				</span>
			) : null}
		</span>
	);
}
