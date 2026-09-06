import { Trans } from "@lingui/react/macro";

const variants = {
	primary:
		"bg-brand text-white hover:bg-[var(--color-brand-strong)] focus-visible:ring-[var(--color-brand)]",
	secondary:
		"bg-surface text-ink border border-border hover:bg-surface-2 focus-visible:ring-[var(--color-brand)]",
	danger:
		"bg-[var(--color-danger)] text-white hover:opacity-90 focus-visible:ring-[var(--color-danger)]",
	ghost: "bg-transparent text-ink hover:bg-surface-2 focus-visible:ring-[var(--color-brand)]",
};

export default function Button({
	variant = "primary",
	className = "",
	type = "button",
	children,
	...props
}) {
	return (
		<button
			type={type}
			className={`inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-app text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}

export function ButtonLabel({ id, fallback }) {
	return <Trans id={id}>{fallback}</Trans>;
}
