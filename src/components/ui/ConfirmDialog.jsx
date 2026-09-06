import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import Button from "./Button";

export default function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	cancelLabel,
	onConfirm,
	onCancel,
	danger = false,
}) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex items-center justify-center min-h-screen p-4 text-center">
				<button
					type="button"
					className="fixed inset-0 bg-ink/40"
					aria-label={t`Cerrar`}
					onClick={onCancel}
				/>
				<div
					role="dialog"
					aria-modal="true"
					className="relative bg-surface rounded-app shadow-soft max-w-md w-full p-6 text-left"
				>
					<h3 className="font-display text-xl text-ink mb-2">{title}</h3>
					<p className="text-sm text-ink-muted mb-6">{description}</p>
					<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
						<Button variant="secondary" onClick={onCancel}>
							{cancelLabel || <Trans>Cancelar</Trans>}
						</Button>
						<Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
							{confirmLabel || <Trans>Confirmar</Trans>}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
