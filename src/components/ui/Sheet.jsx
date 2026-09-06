import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import Button from "./Button";

/**
 * Bottom / center sheet for pickers and forms.
 */
export default function Sheet({
	open,
	title,
	onClose,
	children,
	footer,
	size = "md",
	padded = true,
	showHeader = true,
}) {
	if (!open) return null;

	const width = size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg";

	return (
		<div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-ink/40"
				aria-label={t`Cerrar`}
				onClick={onClose}
			/>
			<div
				role="dialog"
				aria-modal="true"
				className={`relative w-full ${width} max-h-[90dvh] bg-surface rounded-t-app sm:rounded-app shadow-soft sm:m-4 ${padded
						? "overflow-y-auto p-5"
						: "flex h-[90dvh] sm:h-[min(40rem,85dvh)] flex-col overflow-hidden"
					}`}
			>
				{showHeader ? (
					<div className="flex items-start justify-between gap-3 mb-4">
						<h3 className="font-display text-xl text-ink">{title}</h3>
						<Button variant="ghost" className="!min-h-9 !px-2" onClick={onClose}>
							<Trans>Cerrar</Trans>
						</Button>
					</div>
				) : null}
				{children}
				{footer ? (
					<div className="mt-5 pt-4 border-t border-border">{footer}</div>
				) : null}
			</div>
		</div>
	);
}
