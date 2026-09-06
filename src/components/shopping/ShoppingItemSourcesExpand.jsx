import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useState } from "react";
import { DAY_LABEL_MSG } from "../../i18n/weekDayLabels";

/**
 * Resolve display sources for a shopping line (built-in sources or weekPlan scan).
 * @param {object} item
 * @param {Record<string, object[]> | null | undefined} weekPlan
 * @param {(descriptor: import("@lingui/core").MessageDescriptor) => string} _
 */
export function resolveShoppingItemSources(item, weekPlan, _) {
	if (item?.isFused) return [];

	const builtIns = Array.isArray(item?.sources) ? item.sources : [];
	if (builtIns.length) {
		return builtIns.map((source) => ({
			day: _(DAY_LABEL_MSG[source.dayKey] || DAY_LABEL_MSG.sunday),
			meal: source.mealName,
			quantity: source.quantity || "",
		}));
	}

	const sources = [];
	if (!weekPlan) return sources;

	const normalizedName = item.name.toLowerCase();

	Object.entries(weekPlan).forEach(([day, meals]) => {
		const dayName = _(DAY_LABEL_MSG[day] || DAY_LABEL_MSG.sunday);

		(meals || []).forEach((meal) => {
			const matchingIngredients = (meal.ingredients || []).filter(
				(ing) =>
					ing.name.toLowerCase() === normalizedName ||
					item.variations?.includes(ing.name.toLowerCase()),
			);

			if (matchingIngredients.length > 0) {
				sources.push({
					day: dayName,
					meal: meal.name,
					quantity: matchingIngredients
						.map((ing) => ing.quantity)
						.filter(Boolean)
						.join(", "),
				});
			}
		});
	});

	return sources;
}

/**
 * Expand/collapse meal sources under a shopping row when global “Mostrar fuentes” is on.
 */
export default function ShoppingItemSourcesExpand({ item, weekPlan }) {
	const { _ } = useLingui();
	const [expanded, setExpanded] = useState(false);
	const sources = resolveShoppingItemSources(item, weekPlan, _);
	if (!sources.length) return null;

	return (
		<div className="pb-1">
			<button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setExpanded((v) => !v);
				}}
				className="text-xs text-brand hover:opacity-80 inline-flex items-center gap-1 leading-none py-0.5"
			>
				<svg
					className={`size-3 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 5l7 7-7 7"
					/>
				</svg>
				{expanded ? (
					<Trans>Ocultar detalles ({sources.length})</Trans>
				) : (
					<Trans>Mostrar detalles ({sources.length})</Trans>
				)}
			</button>

			{expanded ? (
				<ul className="mt-1 space-y-0.5 pl-2.5 border-l-2 border-border text-xs text-ink-muted leading-snug">
					{sources.map((source, index) => (
						<li key={index}>
							<span className="font-medium text-ink">{source.day}</span>
							{" · "}
							{source.meal}
							{source.quantity ? ` · ${source.quantity}` : null}
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
