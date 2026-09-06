import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useState } from "react";
import { DAY_LABEL_MSG } from "../../i18n/weekDayLabels";

function ShoppingListItem({
	item,
	priceEstimate,
	formatQuantity,
	weekPlan,
	showSources,
	checked = false,
}) {
	const { _ } = useLingui();
	const [expandedSources, setExpandedSources] = useState(false);

	const findSources = () => {
		const sources = [];
		if (!weekPlan || item?.isFused) return sources;

		const normalizedName = item.name.toLowerCase();

		Object.entries(weekPlan).forEach(([day, meals]) => {
			const dayName = _(DAY_LABEL_MSG[day] || DAY_LABEL_MSG.sunday);

			meals.forEach((meal) => {
				const matchingIngredients = meal.ingredients.filter(
					(ing) =>
						ing.name.toLowerCase() === normalizedName ||
						item.variations?.includes(ing.name.toLowerCase()),
				);

				if (matchingIngredients.length > 0) {
					sources.push({
						day: dayName,
						meal: meal.name,
						ingredients: matchingIngredients,
					});
				}
			});
		});

		return sources;
	};

	const sources = findSources();
	const hasSources = sources.length > 0;

	return (
		<div>
			<div className="flex justify-between gap-2">
				<div className="min-w-0">
					<span
						className={`font-medium ${checked ? "line-through text-ink-muted" : ""}`}
					>
						{item.name}
					</span>
					{item.isFused ? (
						<span className="inline-flex items-center mt-1.5 text-[11px] leading-none text-ink-muted bg-surface border border-border px-2 py-1 rounded">
							<Trans>Items combinados</Trans>
						</span>
					) : null}
					{item.variations && item.variations.length > 1 && !item.isFused && (
						<div className="text-xs text-gray-500 mt-1">
							<Trans>Incluye:</Trans> {item.variations.join(", ")}
						</div>
					)}
				</div>
				<div className="text-right shrink-0">
					<span className="text-gray-600">{formatQuantity(item)}</span>
					{priceEstimate?.price != null ? (
						<div className="text-xs text-gray-500">
							~{priceEstimate.price} MXN
						</div>
					) : null}
				</div>
			</div>

			{hasSources && showSources && (
				<div className="mt-1">
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setExpandedSources(!expandedSources);
						}}
						className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
					>
						<svg
							className={`w-3 h-3 mr-1 transition-transform ${expandedSources ? "transform rotate-90" : ""}`}
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
						{expandedSources ? (
							<Trans>Ocultar detalles</Trans>
						) : (
							<Trans>Mostrar detalles</Trans>
						)}
					</button>

					{expandedSources && (
						<div className="mt-2 pl-3 border-l-2 border-indigo-100 text-xs text-gray-600">
							{sources.map((source, index) => (
								<div key={index} className="mb-1">
									<span className="font-medium">{source.day}</span> -{" "}
									{source.meal}:
									<ul className="pl-4 mt-1">
										{source.ingredients.map((ing, idx) => (
											<li key={idx}>
												{ing.quantity} {ing.name}
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default ShoppingListItem;
