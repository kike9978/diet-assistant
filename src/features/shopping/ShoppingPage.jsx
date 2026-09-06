import ShoppingList from "../../components/ShoppingList";

/**
 * Compras page: shopping list for the visible week.
 * Fills the shell main area so only the list card scrolls.
 */
export default function ShoppingPage() {
	return (
		<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
			<ShoppingList />
		</div>
	);
}
