import ingredientPrices from "../../data/ingredientPrices.js";

/**
 * Estimate price for a shopping item (Phase 1 port of ShoppingList logic).
 */
export function estimatePrice(item) {
	const normalizedName = item.name.toLowerCase();
	const specialCases = ["c.s.", "c.c.", "al gusto", "pizca", "pizcas"];
	if (
		(item.quantities || []).some((q) =>
			specialCases.some((special) => String(q).toLowerCase().includes(special)),
		)
	) {
		return { price: null, explanation: "Cantidad no cuantificable" };
	}

	let priceInfo = null;
	if (ingredientPrices[normalizedName]) {
		priceInfo = ingredientPrices[normalizedName];
	} else {
		for (const [key, value] of Object.entries(ingredientPrices)) {
			if (normalizedName.includes(key) || key.includes(normalizedName)) {
				priceInfo = value;
				break;
			}
		}
	}

	if (!priceInfo) {
		return { price: null, explanation: "Precio no disponible" };
	}

	return {
		price: priceInfo.price,
		explanation: `${priceInfo.price} MXN/${priceInfo.unit}`,
	};
}

export function calculateTotalBudget(groupedShoppingList) {
	let total = 0;
	Object.values(groupedShoppingList).forEach((items) => {
		items.forEach((item) => {
			const est = estimatePrice(item);
			if (est.price) total += est.price;
		});
	});
	return Math.round(total);
}

export function useBudget(groupedShoppingList) {
	return calculateTotalBudget(groupedShoppingList || {});
}
