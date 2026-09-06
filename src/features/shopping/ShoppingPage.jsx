import { Trans } from "@lingui/react/macro";
import { Link } from "react-router-dom";
import { useAppState } from "../../context/AppState";
import MealPrepPage from "../../components/MealPrepPage";
import ShoppingList from "../../components/ShoppingList";

/**
 * Compras page with Lista | Prep segmented control.
 * Prep mode via ?mode=prep or in-page tabs.
 */
export default function ShoppingPage({ mode = "lista" }) {
	const { weekPlan } = useAppState();
	const isPrep = mode === "prep";

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3 flex-wrap">
				<h1 className="font-display text-2xl text-ink">
					<Trans>Compras</Trans>
				</h1>
				<div
					className="inline-flex rounded-app border border-border bg-surface p-1"
					role="tablist"
					aria-label="Modo compras"
				>
					<Link
						to="/shopping"
						role="tab"
						aria-selected={!isPrep}
						className={`min-h-11 px-4 py-2 text-sm font-semibold rounded-[calc(var(--radius-md)-2px)] ${
							!isPrep ? "bg-brand text-white" : "text-ink-muted"
						}`}
					>
						<Trans>Lista</Trans>
					</Link>
					<Link
						to="/shopping?mode=prep"
						role="tab"
						aria-selected={isPrep}
						className={`min-h-11 px-4 py-2 text-sm font-semibold rounded-[calc(var(--radius-md)-2px)] ${
							isPrep ? "bg-brand text-white" : "text-ink-muted"
						}`}
					>
						<Trans>Prep</Trans>
					</Link>
				</div>
			</div>

			{isPrep ? <MealPrepPage weekPlan={weekPlan} /> : <ShoppingList />}
		</div>
	);
}
