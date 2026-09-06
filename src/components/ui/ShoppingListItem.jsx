import { Trans } from "@lingui/react/macro";
import ShoppingItemSourcesExpand from "../shopping/ShoppingItemSourcesExpand";

function displayNames(item) {
	if (item?.isFused && Array.isArray(item.fusedMembers) && item.fusedMembers.length) {
		return item.fusedMembers.map((member) => member.name).filter(Boolean);
	}
	return item?.name ? [item.name] : [];
}

function quantityParts(formatted) {
	if (!formatted) return [];
	return formatted
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);
}

function ShoppingListItem({
	item,
	priceEstimate,
	formatQuantity,
	weekPlan,
	showSources,
	checked = false,
}) {
	const names = displayNames(item);
	const parts = quantityParts(formatQuantity(item));
	const priceLabel =
		priceEstimate?.price != null ? `~${priceEstimate.price} MXN` : "";
	const nameClass = `font-semibold leading-snug break-words ${
		checked ? "line-through text-ink-muted" : "text-ink"
	}`;

	return (
		<div className="min-w-0">
			<div className="flex items-start gap-2">
				<div
					className={`min-w-0 flex-1 ${
						item.isFused
							? "border-l-2 border-[var(--color-accent-shopping)] pl-2"
							: ""
					}`}
				>
					{names.length > 1 ? (
						<ul className="space-y-0.5">
							{names.map((name, index) => (
								<li key={`${name}-${index}`} className={nameClass}>
									{name}
								</li>
							))}
						</ul>
					) : (
						<p className={nameClass}>{names[0] || item.name}</p>
					)}
					{item.variations && item.variations.length > 1 && !item.isFused && (
						<p className="text-xs text-ink-muted mt-0.5">
							<Trans>Incluye:</Trans> {item.variations.join(", ")}
						</p>
					)}
					{item.isFused || parts.length > 0 ? (
						<p className="text-sm text-ink-muted leading-snug break-words mt-0.5">
							{item.isFused ? (
								<>
									<span className="text-[11px] font-medium uppercase tracking-wide">
										<Trans>Items combinados</Trans>
									</span>
									{parts.length > 0 ? " · " : null}
								</>
							) : null}
							{parts.join(" · ")}
						</p>
					) : null}
				</div>
				{priceLabel ? (
					<p className="shrink-0 text-xs text-ink-muted tabular-nums pt-1">
						{priceLabel}
					</p>
				) : null}
			</div>

			{showSources ? (
				<ShoppingItemSourcesExpand item={item} weekPlan={weekPlan} />
			) : null}
		</div>
	);
}

export default ShoppingListItem;
