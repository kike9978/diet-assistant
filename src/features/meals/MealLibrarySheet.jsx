import { Trans } from "@lingui/react/macro";
import Button from "../../components/ui/Button";
import Sheet from "../../components/ui/Sheet";
import MealLibraryBrowser from "./MealLibraryBrowser.jsx";

/**
 * Inventory-chrome sheet for picking a library meal.
 */
export default function MealLibrarySheet({
	open,
	onClose,
	title,
	meals,
	onSelect,
}) {
	return (
		<Sheet
			open={open}
			onClose={onClose}
			size="lg"
			padded={false}
			showHeader={false}
		>
			<div className="flex min-h-0 flex-1 flex-col">
				<MealLibraryBrowser
					key={open ? "open" : "closed"}
					meals={meals}
					chrome="inventory"
					heading={title}
					onSelect={(meal) => {
						onSelect(meal);
					}}
				/>
				<div className="bg-[var(--color-brand-strong)] p-3">
					<Button className="w-full" onClick={onClose}>
						<Trans>Cerrar</Trans>
					</Button>
				</div>
			</div>
		</Sheet>
	);
}
