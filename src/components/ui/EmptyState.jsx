import { Trans } from "@lingui/react/macro";
import Button from "./Button";

/**
 * Empty state: illustration slot + one sentence + one primary CTA.
 */
export default function EmptyState({
	title,
	description,
	actionLabel,
	onAction,
	illustration,
}) {
	return (
		<div className="flex flex-col items-center justify-center text-center gap-4 py-12 px-6">
			{illustration ? (
				<div className="w-24 h-24 rounded-full bg-surface-2 flex items-center justify-center text-4xl text-brand" aria-hidden>
					{illustration}
				</div>
			) : (
				<div
					className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-accent-citrus)]/30 to-[var(--color-accent-leaf)]/40"
					aria-hidden
				/>
			)}
			<div className="max-w-sm space-y-2">
				<h2 className="font-display text-2xl text-ink">{title}</h2>
				{description ? (
					<p className="text-ink-muted text-sm leading-relaxed">{description}</p>
				) : null}
			</div>
			{actionLabel && onAction ? (
				<Button onClick={onAction}>{actionLabel}</Button>
			) : null}
		</div>
	);
}

export function DefaultEmptyCopy() {
	return (
		<>
			<Trans>Aún no hay comidas</Trans>
		</>
	);
}
