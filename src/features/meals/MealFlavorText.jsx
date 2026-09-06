/**
 * Recipe copy on a meal. Renders nothing when empty.
 *
 * @param {{
 *   text?: string | null,
 *   variant?: "full" | "snippet",
 *   className?: string,
 * }} props
 */
export default function MealFlavorText({
	text,
	variant = "full",
	className = "",
}) {
	const value = typeof text === "string" ? text.trim() : "";
	if (!value) return null;

	if (variant === "snippet") {
		return (
			<p
				className={`text-xs text-ink-muted line-clamp-2 whitespace-pre-wrap ${className}`.trim()}
			>
				{value}
			</p>
		);
	}

	return (
		<p
			className={`text-sm text-ink whitespace-pre-wrap ${className}`.trim()}
		>
			{value}
		</p>
	);
}
