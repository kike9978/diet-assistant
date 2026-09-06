import { Trans } from "@lingui/react/macro";
import Button from "../../components/ui/Button";

/**
 * Prompt when editing a meal linked to the library.
 * disposition: "update" | "duplicate" | "once"
 */
export default function MealSaveDispositionDialog({
	open,
	mealName,
	onChoose,
	onCancel,
}) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[60] overflow-y-auto">
			<div className="flex items-center justify-center min-h-screen p-4 text-center">
				<button
					type="button"
					className="fixed inset-0 bg-ink/40"
					aria-label="Cerrar"
					onClick={onCancel}
				/>
				<div
					role="dialog"
					aria-modal="true"
					className="relative bg-surface rounded-app shadow-soft max-w-md w-full p-6 text-left"
				>
					<h3 className="font-display text-xl text-ink mb-2">
						<Trans>¿Cómo guardar los cambios?</Trans>
					</h3>
					<p className="text-sm text-ink-muted mb-6">
						<Trans>
							Editaste{" "}
							<span className="font-semibold text-ink">{mealName}</span>, que
							está en tu biblioteca.
						</Trans>
					</p>
					<div className="flex flex-col gap-2">
						<Button onClick={() => onChoose("update")}>
							<Trans>Actualizar biblioteca</Trans>
						</Button>
						<Button variant="secondary" onClick={() => onChoose("duplicate")}>
							<Trans>Guardar como nueva</Trans>
						</Button>
						<Button variant="secondary" onClick={() => onChoose("once")}>
							<Trans>Solo este día</Trans>
						</Button>
						<Button variant="ghost" onClick={onCancel}>
							<Trans>Cancelar</Trans>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
