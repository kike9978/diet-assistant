import html2pdf from "html2pdf.js";
import { useEffect, useRef, useState } from "react";
import ingredientPrices from "../data/ingredientPrices";
import {
	getIngredientCategory,
	INGREDIENT_CATEGORIES,
	OTHER_CATEGORY_NAME,
	normalizeIngredientName as utilNormalizeIngredientName,
} from "../utils/ingredientUtils";
import ShoppingListItem from "./ui/ShoppingListItem";

function ShoppingList({ weekPlan }) {
	const [shoppingList, setShoppingList] = useState({});
	const [groupedShoppingList, setGroupedShoppingList] = useState({});
	const [pdfState, setPdfState] = useState({
		isGenerating: false,
		error: null,
		success: false,
	});
	const [showFullScreenChecklist, setShowFullScreenChecklist] = useState(false);
	const [checkedItems, setCheckedItems] = useState({});
	const [totalBudget, setTotalBudget] = useState(0);
	const [showPrices, setShowPrices] = useState(false);

	// Create a ref for the PDF content
	const pdfContentRef = useRef(null);

	// Add these new state variables at the top of the component
	const [newIngredient, setNewIngredient] = useState({
		name: "",
		quantity: "",
		category: "Verduras",
	});

	// Add a new state variable for source visibility
	const [showSources, setShowSources] = useState(false);

	// Load checked items from localStorage on initial render
	useEffect(() => {
		const savedCheckedItems = localStorage.getItem("checkedItems");
		if (savedCheckedItems) {
			try {
				setCheckedItems(JSON.parse(savedCheckedItems));
			} catch (error) {
				console.error("Error loading checked items:", error);
				localStorage.removeItem("checkedItems");
			}
		}
	}, []);

	// Save checked items to localStorage whenever they change
	useEffect(() => {
		if (Object.keys(checkedItems).length > 0) {
			localStorage.setItem("checkedItems", JSON.stringify(checkedItems));
		}
	}, [checkedItems]);

	// Generate shopping list from week plan
	useEffect(() => {
		if (!weekPlan) return;

		const newShoppingList = {};
		let totalEstimatedBudget = 0;

		// Process each day's meals
		Object.values(weekPlan).forEach((meals) => {
			meals.forEach((meal) => {
				meal.ingredients.forEach((ingredient) => {
					const normalizedName = utilNormalizeIngredientName(
						ingredient.name.toLowerCase(),
					);

					if (!newShoppingList[normalizedName]) {
						newShoppingList[normalizedName] = {
							name: ingredient.name,
							normalizedName,
							quantities: [ingredient.quantity],
							totalQuantity: parseQuantity(ingredient.quantity),
							variations: [ingredient.name.toLowerCase()],
						};
					} else {
						// Add quantity
						newShoppingList[normalizedName].quantities.push(
							ingredient.quantity,
						);
						newShoppingList[normalizedName].totalQuantity += parseQuantity(
							ingredient.quantity,
						);

						// Add variation if it's a new one
						if (
							!newShoppingList[normalizedName].variations.includes(
								ingredient.name.toLowerCase(),
							)
						) {
							newShoppingList[normalizedName].variations.push(
								ingredient.name.toLowerCase(),
							);
						}
					}
				});
			});
		});

		// Group by category and calculate budget
		const grouped = groupIngredientsByCategory(newShoppingList);

		// Calculate budget
		Object.values(newShoppingList).forEach((item) => {
			const priceEstimate = estimatePrice(item);
			if (priceEstimate && priceEstimate.price) {
				totalEstimatedBudget += priceEstimate.price;
			}
		});

		setShoppingList(newShoppingList);
		setGroupedShoppingList(grouped);
		setTotalBudget(Math.round(totalEstimatedBudget));
	}, [weekPlan]);

	// This is the key fix - preserve checked items when shopping list changes
	useEffect(() => {
		if (Object.keys(shoppingList).length === 0) return;

		// Get all current item keys in the shopping list
		const currentItemKeys = new Set();
		Object.entries(groupedShoppingList).forEach(([category, items]) => {
			items.forEach((item) => {
				// Generate consistent keys for items using normalizedName instead of name
				const itemKey = generateItemKey(
					category,
					item.normalizedName || item.name.toLowerCase(),
				);
				currentItemKeys.add(itemKey);
			});
		});

		// Check if we need to update the checked items
		let needsUpdate = false;
		const updatedCheckedItems = { ...checkedItems };

		// First, remove any checked items that no longer exist
		Object.keys(updatedCheckedItems).forEach((key) => {
			if (!currentItemKeys.has(key)) {
				delete updatedCheckedItems[key];
				needsUpdate = true;
			}
		});

		// Only update if there are differences to avoid infinite loops
		if (needsUpdate) {
			setCheckedItems(updatedCheckedItems);
			localStorage.setItem("checkedItems", JSON.stringify(updatedCheckedItems));
		}
	}, [groupedShoppingList]);

	// Función para normalizar cantidades especiales
	const normalizeSpecialQuantities = (quantity) => {
		// Normalizar "c.s.", "c.s" y variantes similares
		if (
			quantity.toLowerCase().includes("c.s") ||
			quantity.toLowerCase().includes("cs") ||
			quantity.toLowerCase().includes("cucharada sopera")
		) {
			return "c.s.";
		}

		// Normalizar "c.c.", "c.c" y variantes similares (cucharada cafetera)
		if (
			quantity.toLowerCase().includes("c.c") ||
			quantity.toLowerCase().includes("cc") ||
			quantity.toLowerCase().includes("cucharada cafetera")
		) {
			return "c.c.";
		}

		// Normalizar "al gusto" y variantes
		if (
			quantity.toLowerCase().includes("gusto") ||
			quantity.toLowerCase() === "g" ||
			quantity.toLowerCase() === "al g."
		) {
			return "al gusto";
		}

		return quantity;
	};

	// Modificar la función que procesa los ingredientes para usar la normalización de cantidades especiales
	const processIngredients = () => {
		const processedList = {};

		// Iterate through each day in the week plan
		Object.values(weekPlan).forEach((dayMeals) => {
			// Iterate through each meal in the day
			dayMeals.forEach((meal) => {
				// Iterate through each ingredient in the meal
				meal.ingredients.forEach((ingredient) => {
					const normalizedName = utilNormalizeIngredientName(ingredient.name);
					const normalizedQuantity = normalizeSpecialQuantities(
						ingredient.quantity,
					);

					if (!processedList[normalizedName]) {
						processedList[normalizedName] = {
							name: normalizedName,
							quantities: [normalizedQuantity],
							variations: [ingredient.name],
						};
					} else {
						// Add the quantity if it's not already in the list
						if (
							!processedList[normalizedName].quantities.includes(
								normalizedQuantity,
							)
						) {
							processedList[normalizedName].quantities.push(normalizedQuantity);
						}

						// Add the variation if it's not already in the list
						if (
							!processedList[normalizedName].variations.includes(
								ingredient.name,
							)
						) {
							processedList[normalizedName].variations.push(ingredient.name);
						}
					}
				});
			});
		});

		return processedList;
	};

	// Improved parseFraction function to better handle mixed units
	const parseFraction = (fractionStr) => {
		// Handle special cases and non-numeric values
		if (
			!fractionStr ||
			fractionStr.toLowerCase().includes("gusto") ||
			fractionStr.toLowerCase() === "c.s." ||
			fractionStr.toLowerCase() === "c.c." ||
			fractionStr.toLowerCase() === "nan"
		) {
			return null;
		}

		// Try to extract numeric part if mixed with text
		const numericMatch = fractionStr.match(
			/(\d+\/\d+|\d+\s\d+\/\d+|\d+(\.\d+)?)/,
		);
		if (!numericMatch) return null;

		const numericPart = numericMatch[0];

		// Handle whole numbers
		if (!numericPart.includes("/")) {
			return parseFloat(numericPart);
		}

		// Handle mixed numbers (e.g., "1 1/2")
		if (numericPart.includes(" ")) {
			const [whole, fraction] = numericPart.split(" ");
			const [numerator, denominator] = fraction.split("/");
			return (
				parseFloat(whole) + parseFloat(numerator) / parseFloat(denominator)
			);
		}

		// Handle simple fractions (e.g., "1/2")
		const [numerator, denominator] = numericPart.split("/");
		return parseFloat(numerator) / parseFloat(denominator);
	};

	// Function to convert decimal back to fraction string
	const decimalToFraction = (decimal) => {
		if (decimal === 0) return "0";
		if (Number.isInteger(decimal)) return decimal.toString();

		// Handle common fractions
		const tolerance = 0.001;
		const fractions = [
			{ decimal: 0.25, fraction: "1/4" },
			{ decimal: 0.5, fraction: "1/2" },
			{ decimal: 0.75, fraction: "3/4" },
			{ decimal: 0.33, fraction: "1/3" },
			{ decimal: 0.67, fraction: "2/3" },
			{ decimal: 0.2, fraction: "1/5" },
			{ decimal: 0.4, fraction: "2/5" },
			{ decimal: 0.6, fraction: "3/5" },
			{ decimal: 0.8, fraction: "4/5" },
		];

		// Check for common fractions
		for (const f of fractions) {
			if (Math.abs(decimal - f.decimal) < tolerance) {
				return f.fraction;
			}
		}

		// Handle mixed numbers
		const wholePart = Math.floor(decimal);
		const fractionalPart = decimal - wholePart;

		if (fractionalPart > 0) {
			// Try to find a close match for the fractional part
			for (const f of fractions) {
				if (Math.abs(fractionalPart - f.decimal) < tolerance) {
					return wholePart > 0 ? `${wholePart} ${f.fraction}` : f.fraction;
				}
			}

			// If no close match, use a simple approximation
			const gcd = (a, b) => (b ? gcd(b, a % b) : a);
			const denominator = 16; // Use a reasonable denominator
			const numerator = Math.round(fractionalPart * denominator);
			const divisor = gcd(numerator, denominator);

			const simplifiedNumerator = numerator / divisor;
			const simplifiedDenominator = denominator / divisor;

			const fractionStr = `${simplifiedNumerator}/${simplifiedDenominator}`;
			return wholePart > 0 ? `${wholePart} ${fractionStr}` : fractionStr;
		}

		return wholePart.toString();
	};

	// Add this function to convert fractions to decimals with specified precision
	const fractionToDecimal = (value, precision = 2) => {
		if (value === null || isNaN(value)) return "";
		return Number(value).toFixed(precision).replace(/\.0+$/, "");
	};

	// Update the formatQuantity function to use decimals instead of fractions
	const formatQuantity = (item) => {
		if (!item.quantities || item.quantities.length === 0) {
			return item.quantity || "";
		}

		// Group quantities by unit and handle special cases
		const quantitiesByUnit = {};
		const specialValues = new Set();
		const priceUnits = new Set(["MXN", "MXN/kg"]);

		item.quantities.forEach((q) => {
			// Skip empty quantities
			if (!q || q.trim() === "") return;

			// Handle special values
			if (
				q.toLowerCase().includes("gusto") ||
				q.toLowerCase() === "c.s." ||
				q.toLowerCase() === "c.c." ||
				q.toLowerCase() === "nan"
			) {
				specialValues.add(q);
				return;
			}

			// Skip price information
			if (priceUnits.has(q) || q.includes("MXN")) {
				return;
			}

			// Try to extract numeric part and unit
			const numericMatch = q.match(/(\d+\/\d+|\d+\s\d+\/\d+|\d+(\.\d+)?)/);

			if (!numericMatch) {
				// If no numeric part, treat as special value
				specialValues.add(q);
				return;
			}

			const numericPart = numericMatch[0];
			const unitPart = q.replace(numericPart, "").trim();

			// Determine the unit - use the text after the number or a default
			const unit = unitPart || "";

			// Parse the quantity
			const parsedQuantity = parseFraction(numericPart);
			if (parsedQuantity === null) {
				specialValues.add(q);
				return;
			}

			// Initialize the unit if it doesn't exist
			if (!quantitiesByUnit[unit]) {
				quantitiesByUnit[unit] = 0;
			}

			// Add the parsed quantity
			quantitiesByUnit[unit] += parsedQuantity;
		});

		// Format the combined quantities using decimals instead of fractions
		const formattedQuantities = Object.entries(quantitiesByUnit)
			.map(([unit, total]) => {
				if (isNaN(total)) return "";

				// Use decimal format instead of fraction
				const formattedTotal = fractionToDecimal(total);
				return unit ? `${formattedTotal} ${unit}` : formattedTotal;
			})
			.filter((q) => q); // Remove empty strings

		// Add special values (but only once per unique value)
		const uniqueSpecialValues = Array.from(specialValues);

		// Combine all values
		return [...formattedQuantities, ...uniqueSpecialValues].join(", ");
	};

	useEffect(() => {
		generateShoppingList();
	}, [weekPlan]);

	useEffect(() => {
		// Only run this effect when the shopping list is populated
		if (Object.keys(shoppingList).length > 0) {
			groupIngredientsByCategory(shoppingList);
		}
	}, [shoppingList]);

	const generateShoppingList = () => {
		const ingredients = {};

		// Iterate through all days and meals
		Object.values(weekPlan).forEach((dayMeals) => {
			dayMeals.forEach((meal) => {
				meal.ingredients.forEach((ingredient) => {
					const originalName = ingredient.name;
					const lowerName = originalName.toLowerCase().trim();

					// Use our improved normalization function
					const normalizedName = utilNormalizeIngredientName(lowerName);

					// Use the normalized name as the key, but keep the original name for display
					if (!ingredients[normalizedName]) {
						ingredients[normalizedName] = {
							name: originalName, // Keep the original name for display
							normalizedName: normalizedName, // Store the normalized name for grouping
							quantities: [ingredient.quantity],
							totalQuantity: parseQuantity(ingredient.quantity),
							variations: [originalName], // Track all variations of this ingredient
						};
					} else {
						ingredients[normalizedName].quantities.push(ingredient.quantity);

						// Add this variation if it's not already in the list
						if (
							!ingredients[normalizedName].variations.includes(originalName)
						) {
							ingredients[normalizedName].variations.push(originalName);
						}

						// Try to add to the total quantity if possible
						const parsedQuantity = parseQuantity(ingredient.quantity);
						if (parsedQuantity && ingredients[normalizedName].totalQuantity) {
							// Normalize units for comparison
							const normalizedCurrentUnit = normalizeUnit(
								ingredients[normalizedName].totalQuantity.unit,
							);
							const normalizedNewUnit = normalizeUnit(parsedQuantity.unit);

							// Only add if normalized units match or both are unitless
							if (normalizedCurrentUnit === normalizedNewUnit) {
								ingredients[normalizedName].totalQuantity.value +=
									parsedQuantity.value;
								// Keep the original unit format from the first occurrence
							} else {
								// Units don't match, can't sum
								ingredients[normalizedName].totalQuantity = null;
							}
						}
					}
				});
			});
		});

		setShoppingList(ingredients);
	};

	const groupIngredientsByCategory = (ingredientsList = {}) => {
		const grouped = {};

		// Initialize categories
		Object.keys(INGREDIENT_CATEGORIES).forEach((category) => {
			grouped[category] = [];
		});
		grouped[OTHER_CATEGORY_NAME] = [];

		// Categorize each ingredient
		Object.values(ingredientsList).forEach((item) => {
			// Use the shared categorization function
			const category = getIngredientCategory(item.name);
			grouped[category].push(item);
		});

		// Sort ingredients alphabetically within each category
		Object.keys(grouped).forEach((category) => {
			grouped[category].sort((a, b) => a.name.localeCompare(b.name));
		});

		// Remove empty categories
		const filteredGrouped = {};
		Object.entries(grouped).forEach(([category, items]) => {
			if (items.length > 0) {
				filteredGrouped[category] = items;
			}
		});

		setGroupedShoppingList(filteredGrouped);
		return filteredGrouped; // Return the result for use in other functions
	};

	// Helper function to normalize units for comparison
	const normalizeUnit = (unit) => {
		if (!unit) return "";

		const unitLower = unit.toLowerCase().trim();

		// Handle Spanish abbreviations and variations
		if (
			unitLower === "cda" ||
			unitLower === "cdas" ||
			unitLower === "cucharada" ||
			unitLower === "cucharadas"
		) {
			return "cda";
		}
		if (
			unitLower === "cdta" ||
			unitLower === "cdtas" ||
			unitLower === "cucharadita" ||
			unitLower === "cucharaditas"
		) {
			return "cdta";
		}
		if (
			unitLower === "tza" ||
			unitLower === "tzas" ||
			unitLower === "taza" ||
			unitLower === "tazas"
		) {
			return "tza";
		}
		if (
			unitLower === "pza" ||
			unitLower === "pzas" ||
			unitLower === "pieza" ||
			unitLower === "piezas"
		) {
			return "pza";
		}
		if (
			unitLower === "gr" ||
			unitLower === "g" ||
			unitLower === "gramo" ||
			unitLower === "gramos"
		) {
			return "gr";
		}
		if (
			unitLower === "ml" ||
			unitLower === "mililitro" ||
			unitLower === "mililitros"
		) {
			return "ml";
		}
		if (unitLower === "l" || unitLower === "litro" || unitLower === "litros") {
			return "l";
		}
		if (
			unitLower === "kg" ||
			unitLower === "kilo" ||
			unitLower === "kilos" ||
			unitLower === "kilogramo" ||
			unitLower === "kilogramos"
		) {
			return "kg";
		}

		return unitLower;
	};

	// Helper function to parse quantity strings like "150g", "2 cups", "1/2 cup", "1", "1/2", "2 1/2 tzas", "1 cda", etc.
	const parseQuantity = (quantityStr) => {
		if (!quantityStr) return null;

		const quantityLower = quantityStr.toLowerCase().trim();

		// Handle fractions like "1/2"
		const fractionMatch = quantityLower.match(/^(\d+)\/(\d+)\s*(.*?)$/);
		if (fractionMatch) {
			const numerator = parseInt(fractionMatch[1], 10);
			const denominator = parseInt(fractionMatch[2], 10);
			const unit = fractionMatch[3].trim();

			return {
				value: numerator / denominator,
				unit: unit || "",
			};
		}

		// Handle mixed numbers like "1 1/2"
		const mixedMatch = quantityLower.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*?)$/);
		if (mixedMatch) {
			const whole = parseInt(mixedMatch[1], 10);
			const numerator = parseInt(mixedMatch[2], 10);
			const denominator = parseInt(mixedMatch[3], 10);
			const unit = mixedMatch[4].trim();

			return {
				value: whole + numerator / denominator,
				unit: unit || "",
			};
		}

		// Handle simple numbers like "2"
		const simpleMatch = quantityLower.match(/^(\d+(?:\.\d+)?)\s*(.*?)$/);
		if (simpleMatch) {
			const value = parseFloat(simpleMatch[1]);
			let unit = simpleMatch[2].trim();

			// Normalize "pza" and "pzas" to a single unit for comparison
			if (unit === "pza" || unit === "pzas") {
				unit = "pza";
			}

			return {
				value: value,
				unit: unit,
			};
		}

		return null;
	};

	const exportToPDF = () => {
		// Reset states
		setPdfState({
			isGenerating: true,
			error: null,
			success: false,
		});

		if (!pdfContentRef.current) {
			setPdfState({
				isGenerating: false,
				error: "Could not find content to export",
				success: false,
			});
			return;
		}

		// Create a simplified HTML structure for the PDF
		const pdfContent = document.createElement("div");
		pdfContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="color: #4F46E5; font-size: 24px; margin-bottom: 16px;">Lista de Compras</h1>
      <h2 style="font-size: 18px; margin-bottom: 12px;">Ingredientes (${Object.keys(shoppingList).length})</h2>
      
        ${Object.entries(groupedShoppingList)
					.map(
						([category, items]) => `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 16px; color: #4F46E5; margin-bottom: 8px;">${category} (${items.length})</h3>
            <ul style="list-style: none; padding: 0;">
              ${items
								.map(
									(item) => `
                <li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                  <div style="display: flex; justify-content: space-between;">
                    <div>
                      <span style="font-weight: bold;">${item.name}</span>
                      ${
												item.variations && item.variations.length > 1
													? `<div style="font-size: 11px; color: #6B7280; margin-top: 4px;">
                          Incluye: ${item.variations.join(", ")}
                        </div>`
													: ""
											}
                    </div>
                    <span style="color: #6B7280;">${formatQuantity(item)}</span>
                  </div>
                </li>
              `,
								)
								.join("")}
            </ul>
          </div>
        `,
					)
					.join("")}
      </div>
    `;

		const opt = {
			margin: 1,
			filename: "lista-de-compras.pdf",
			image: { type: "jpeg", quality: 0.98 },
			html2canvas: { scale: 2 },
			jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
		};

		html2pdf()
			.set(opt)
			.from(pdfContent)
			.save()
			.then(() => {
				setPdfState({
					isGenerating: false,
					error: null,
					success: true,
				});

				// Reset success message after 3 seconds
				setTimeout(() => {
					setPdfState((prev) => ({ ...prev, success: false }));
				}, 3000);
			})
			.catch((err) => {
				console.error("PDF generation error:", err);
				setPdfState({
					isGenerating: false,
					error: "Failed to generate PDF. Please try again.",
					success: false,
				});
			});
	};

	// Add this function to handle adding a new ingredient
	const handleAddIngredient = (e) => {
		e.preventDefault();

		if (!newIngredient.name.trim() || !newIngredient.quantity.trim()) {
			return;
		}

		// Create a new ingredient object
		const ingredient = {
			name: newIngredient.name.trim(),
			normalizedName: utilNormalizeIngredientName(
				newIngredient.name.toLowerCase().trim(),
			),
			quantities: [newIngredient.quantity.trim()],
			totalQuantity: parseQuantity(newIngredient.quantity.trim()),
			variations: [newIngredient.name.trim()],
		};

		// Add to shopping list
		setShoppingList((prev) => ({
			...prev,
			[ingredient.normalizedName]: ingredient,
		}));

		// Reset form
		setNewIngredient({
			name: "",
			quantity: "",
			category: newIngredient.category,
		});
	};

	// Función para manejar el cambio de estado de un elemento de la checklist
	const handleCheckItem = (itemName) => {
		setCheckedItems((prev) => ({
			...prev,
			[itemName]: !prev[itemName],
		}));
	};

	// Función para desmarcar todos los elementos
	const handleUncheckAll = () => {
		setCheckedItems({});
		localStorage.removeItem("checkedItems");
	};

	// Función para marcar todos los elementos
	const handleCheckAll = () => {
		const allChecked = {};
		Object.values(groupedShoppingList).forEach((items) => {
			items.forEach((item) => {
				allChecked[item.name] = true;
			});
		});
		setCheckedItems(allChecked);
	};

	// Función para estimar el precio de un ingrediente
	const estimatePrice = (item) => {
		const normalizedName = item.name.toLowerCase();

		// Ignorar ingredientes con cantidades especiales como "c.s."
		const specialCases = ["c.s.", "c.c.", "al gusto", "pizca", "pizcas"];
		if (
			item.quantities.some((q) =>
				specialCases.some((special) => q.toLowerCase().includes(special)),
			)
		) {
			return { price: null, explanation: "Cantidad no cuantificable" };
		}

		// Buscar el ingrediente en nuestra base de datos de precios
		let priceInfo = null;

		// Primero buscar coincidencia exacta
		if (ingredientPrices[normalizedName]) {
			priceInfo = ingredientPrices[normalizedName];
		} else {
			// Si no hay coincidencia exacta, buscar coincidencia parcial
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

		// Intentar extraer la cantidad numérica y la unidad de la cantidad del ingrediente
		let estimatedPrice = priceInfo.price;
		let explanation = `${priceInfo.price} MXN/${priceInfo.unit}`;

		// Intentar calcular el precio basado en la cantidad
		if (
			item.totalQuantity &&
			item.totalQuantity.value &&
			item.totalQuantity.unit
		) {
			const value = item.totalQuantity.value;
			const unit = item.totalQuantity.unit.toLowerCase();

			// Convertir unidades comunes
			if (unit === "gr" && priceInfo.unit === "kg") {
				estimatedPrice = (priceInfo.price / 1000) * value;
				explanation = `${value} gr × ${priceInfo.price} MXN/kg ÷ 1000`;
			} else if (unit === "kg" && priceInfo.unit === "kg") {
				estimatedPrice = priceInfo.price * value;
				explanation = `${value} kg × ${priceInfo.price} MXN/kg`;
			} else if (unit === "pza" && priceInfo.unit === "pieza") {
				estimatedPrice = priceInfo.price * value;
				explanation = `${value} pza × ${priceInfo.price} MXN/pieza`;
			} else if (unit === "ml" && priceInfo.unit === "litro") {
				estimatedPrice = (priceInfo.price / 1000) * value;
				explanation = `${value} ml × ${priceInfo.price} MXN/litro ÷ 1000`;
			} else if (unit === "l" && priceInfo.unit === "litro") {
				estimatedPrice = priceInfo.price * value;
				explanation = `${value} l × ${priceInfo.price} MXN/litro`;
			} else if (unit === "tza" && priceInfo.unit === "kg") {
				// Aproximadamente 1 taza = 250g para la mayoría de los ingredientes
				estimatedPrice = (priceInfo.price / 4) * value;
				explanation = `${value} tza ≈ 250g × ${priceInfo.price} MXN/kg ÷ 4`;
			} else if (
				(unit === "cdas" || unit === "cda") &&
				priceInfo.unit === "kg"
			) {
				// Aproximadamente 1 cucharada = 15g para ingredientes secos
				estimatedPrice = (priceInfo.price / 1000) * 15 * value;
				explanation = `${value} cdas × 15g × ${priceInfo.price} MXN/kg ÷ 1000`;
			} else if (
				(unit === "cdas" || unit === "cda") &&
				priceInfo.unit === "litro"
			) {
				// Aproximadamente 1 cucharada = 15ml para líquidos
				estimatedPrice = (priceInfo.price / 1000) * 15 * value;
				explanation = `${value} cdas × 15ml × ${priceInfo.price} MXN/litro ÷ 1000`;
			} else if (
				(unit === "cditas" || unit === "cdita") &&
				priceInfo.unit === "kg"
			) {
				// Aproximadamente 1 cucharadita = 5g para ingredientes secos
				estimatedPrice = (priceInfo.price / 1000) * 5 * value;
				explanation = `${value} cditas × 5g × ${priceInfo.price} MXN/kg ÷ 1000`;
			} else if (
				(unit === "cditas" || unit === "cdita") &&
				priceInfo.unit === "litro"
			) {
				// Aproximadamente 1 cucharadita = 5ml para líquidos
				estimatedPrice = (priceInfo.price / 1000) * 5 * value;
				explanation = `${value} cditas × 5ml × ${priceInfo.price} MXN/litro ÷ 1000`;
			} else if (unit === "pza" && priceInfo.unit === "kg") {
				// Convertir piezas a kg según el tipo de ingrediente
				let piezaToKg = 0;

				// Definir conversiones aproximadas para diferentes tipos de ingredientes
				if (
					normalizedName.includes("almendra") ||
					normalizedName.includes("almendras")
				) {
					// Una almendra pesa aproximadamente 1g
					piezaToKg = 0.001;
					explanation = `${value} pza × 1g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (
					normalizedName.includes("nuez") ||
					normalizedName.includes("nueces")
				) {
					// Una nuez pesa aproximadamente 5g
					piezaToKg = 0.005;
					explanation = `${value} pza × 5g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (
					normalizedName.includes("avellana") ||
					normalizedName.includes("avellanas")
				) {
					// Una avellana pesa aproximadamente 1g
					piezaToKg = 0.001;
					explanation = `${value} pza × 1g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (
					normalizedName.includes("pistacho") ||
					normalizedName.includes("pistachos")
				) {
					// Un pistacho pesa aproximadamente 0.7g
					piezaToKg = 0.0007;
					explanation = `${value} pza × 0.7g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (
					normalizedName.includes("cacahuate") ||
					normalizedName.includes("cacahuates")
				) {
					// Un cacahuate pesa aproximadamente 0.5g
					piezaToKg = 0.0005;
					explanation = `${value} pza × 0.5g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (
					normalizedName.includes("tomate") ||
					normalizedName.includes("jitomate")
				) {
					piezaToKg = 0.15; // Un tomate pesa aproximadamente 150g
					explanation = `${value} pza × 150g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (normalizedName.includes("cebolla")) {
					piezaToKg = 0.2; // Una cebolla pesa aproximadamente 200g
					explanation = `${value} pza × 200g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (
					normalizedName.includes("papa") ||
					normalizedName.includes("patata")
				) {
					piezaToKg = 0.2; // Una papa pesa aproximadamente 200g
					explanation = `${value} pza × 200g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (normalizedName.includes("zanahoria")) {
					piezaToKg = 0.1; // Una zanahoria pesa aproximadamente 100g
					explanation = `${value} pza × 100g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (normalizedName.includes("ajo")) {
					piezaToKg = 0.005; // Un diente de ajo pesa aproximadamente 5g
					explanation = `${value} pza × 5g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (normalizedName.includes("limón")) {
					piezaToKg = 0.08; // Un limón pesa aproximadamente 80g
					explanation = `${value} pza × 80g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (normalizedName.includes("manzana")) {
					piezaToKg = 0.2; // Una manzana pesa aproximadamente 200g
					explanation = `${value} pza × 200g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (
					normalizedName.includes("plátano") ||
					normalizedName.includes("banana")
				) {
					piezaToKg = 0.15; // Un plátano pesa aproximadamente 150g
					explanation = `${value} pza × 150g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (normalizedName.includes("naranja")) {
					piezaToKg = 0.2; // Una naranja pesa aproximadamente 200g
					explanation = `${value} pza × 200g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else if (
					normalizedName.includes("pimiento") ||
					normalizedName.includes("chile")
				) {
					piezaToKg = 0.15; // Un pimiento pesa aproximadamente 150g
					explanation = `${value} pza × 150g × ${priceInfo.price} MXN/kg ÷ 1000`;
				} else {
					// Valor predeterminado para otros ingredientes
					piezaToKg = 0.1; // Asumimos 100g por pieza como valor predeterminado
					explanation = `${value} pza × 100g × ${priceInfo.price} MXN/kg ÷ 1000`;
				}

				estimatedPrice = priceInfo.price * piezaToKg * value;
			}
		}

		return {
			price: Math.round(estimatedPrice * 100) / 100, // Redondear a 2 decimales
			explanation: explanation,
		};
	};

	// Calcular el presupuesto total
	const calculateTotalBudget = (items) => {
		let total = 0;

		Object.values(items).forEach((category) => {
			category.forEach((item) => {
				const priceEstimate = estimatePrice(item);
				if (priceEstimate.price) {
					total += priceEstimate.price;
				}
			});
		});

		return Math.round(total * 100) / 100; // Redondear a 2 decimales
	};

	// Actualizar el presupuesto total cuando cambie la lista de compras
	useEffect(() => {
		if (Object.keys(groupedShoppingList).length > 0) {
			const total = calculateTotalBudget(groupedShoppingList);
			setTotalBudget(total);
		}
	}, [groupedShoppingList]);



	// Add this function to generate consistent item keys
	const generateItemKey = (category, itemName) => {
		// Normalize the name to lowercase and remove extra spaces
		const normalizedName = (typeof itemName === "string" ? itemName : "")
			.toLowerCase()
			.trim();
		// Use the normalized name as the key to ensure consistency
		return `${category}:${normalizedName}`;
	};

	// Update the useEffect that handles shopping list changes
	useEffect(() => {
		// Only run this effect when the shopping list is populated
		if (Object.keys(shoppingList).length > 0) {
			groupIngredientsByCategory(shoppingList);
		}
	}, [shoppingList]);

	return (
		<div className="flex flex-col md:flex-row gap-6 relative">
			<div className="bg-white p-6 rounded-lg shadow-md relative flex flex-col overflow-hidden max-h-[90dvh]  ">
				<h2 className="text-2xl font-bold mb-6">Lista de Compras</h2>
				{/* Contenido principal de la lista de compras */}
				<div className="w-full overflow-hidden flex flex-col gap-2">
					{Object.keys(shoppingList).length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-500 mb-4">
								No hay ingredientes en tu lista de compras.
							</p>
							<p className="text-gray-500 text-sm">
								Agrega comidas a tu plan semanal para generar una lista de
								compras.
							</p>
						</div>
					) : (
						<>
							<div className="flex flex-col justify-between items-center">
								<div className="flex space-x-2">
									<button
										onClick={() => setShowFullScreenChecklist(true)}
										className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
									>
										Ver como checklist
									</button>
									<button
										onClick={() => setShowPrices(!showPrices)}
										className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
									>
										{showPrices ? "Ocultar precios" : "Mostrar precios"}
									</button>
									<button
										onClick={() => setShowSources(!showSources)}
										className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
									>
										{showSources ? "Ocultar fuentes" : "Mostrar fuentes"}
									</button>
								</div>
								{totalBudget > 0 && (
									<div className="text-right">
										<p className="text-gray-600">
											Presupuesto estimado:{" "}
											<span className="font-medium text-green-600">
												${totalBudget} MXN
											</span>
										</p>
									</div>
								)}
							</div>

							<div className="overflow-y-auto pr-2" ref={pdfContentRef}>
								{Object.entries(groupedShoppingList).map(
									([category, items]) => (
										<div key={category} className="mb-6">
											<h3 className="text-lg font-medium text-indigo-600 mb-3 border-b pb-2">
												{category}{" "}
												<span className="text-gray-500 text-sm">
													({items.length})
												</span>
											</h3>
											<ul className="space-y-2">
												{items.map((item, index) => {
													const priceEstimate = estimatePrice(item);
													return (
														<li key={index}>
															<ShoppingListItem
																item={item}
																showPrices={showPrices}
																priceEstimate={priceEstimate}
																formatQuantity={formatQuantity}
																weekPlan={weekPlan}
																showSources={showSources}
															/>
														</li>
													);
												})}
											</ul>
										</div>
									),
								)}
							</div>

							<div>
								<button
									onClick={exportToPDF}
									disabled={pdfState.isGenerating}
									className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{pdfState.isGenerating ? (
										<>
											<svg
												className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												></circle>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
											Generando PDF...
										</>
									) : (
										"Exportar a PDF"
									)}
								</button>

								{pdfState.error && (
									<div className="p-3 bg-red-100 text-red-700 rounded-md text-sm mt-3">
										Error: {pdfState.error}
									</div>
								)}

								{pdfState.success && (
									<div className="p-3 bg-green-100 text-green-700 rounded-md text-sm mt-3">
										¡PDF generado exitosamente!
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>

			{/* Modal de checklist en pantalla completa */}
			{showFullScreenChecklist && (
				<div className="fixed inset-0 z-50 bg-white overflow-y-auto p-4">
					<div className="max-w-4xl mx-auto flex flex-col max-h-full overflow-hidden">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold">
								Lista de Compras - Checklist
							</h2>
							<button
								onClick={() => setShowFullScreenChecklist(false)}
								className="p-2 rounded-full hover:bg-gray-100"
							>
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

						<div className="mb-4 flex flex-col items-start justify-between">
							<div>
								<p className="text-gray-600">
									Total de ingredientes:{" "}
									<span className="font-medium">
										{Object.keys(shoppingList).length}
									</span>
								</p>
								{totalBudget > 0 && (
									<p className="text-gray-600 mt-1">
										Presupuesto estimado:{" "}
										<span className="font-medium text-green-600">
											${totalBudget} MXN
										</span>
									</p>
								)}
							</div>
							<div className="flex space-x-2">
								<button
									onClick={() => setShowPrices(!showPrices)}
									className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
								>
									{showPrices ? "Ocultar precios" : "Mostrar precios"}
								</button>
								<button
									onClick={() => setShowSources(!showSources)}
									className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
								>
									{showSources ? "Ocultar fuentes" : "Mostrar fuentes"}
								</button>
								<button
									onClick={() => {
										// Mark all items as checked using consistent keys
										const allItems = {};
										Object.entries(groupedShoppingList).forEach(
											([category, items]) => {
												items.forEach((item) => {
													const itemKey = generateItemKey(
														category,
														item.normalizedName || item.name.toLowerCase(),
													);
													allItems[itemKey] = true;
												});
											},
										);
										setCheckedItems(allItems);
									}}
									className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
								>
									Marcar todos
								</button>
								<button
									onClick={() => {
										// Clear all checked items
										setCheckedItems({});
									}}
									className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
								>
									Desmarcar todo
								</button>
							</div>
						</div>
						<div className="flex flex-col overflow-y-auto">
							{Object.entries(groupedShoppingList).map(([category, items]) => (
								<div key={category}>
									<h3 className="text-lg font-medium text-indigo-600 mb-3 border-b pb-2">
										{category}{" "}
										<span className="text-gray-500 text-sm">
											({items.length})
										</span>
									</h3>
									<ul className="space-y-3">
										{items.map((item, index) => {
											// Use normalizedName for consistent key generation
											const itemKey = generateItemKey(
												category,
												item.normalizedName || item.name.toLowerCase(),
											);
											const isChecked = checkedItems[itemKey] || false;

											// Find sources for this item
											const findSources = () => {
												const sources = [];

												if (!weekPlan) return sources;

												// Normalize the ingredient name for comparison
												const normalizedName = item.name.toLowerCase();

												// Check each day in the week plan
												Object.entries(weekPlan).forEach(([day, meals]) => {
													// Map day IDs to readable names
													const dayName =
														day === "monday"
															? "Lunes"
															: day === "tuesday"
																? "Martes"
																: day === "wednesday"
																	? "Miércoles"
																	: day === "thursday"
																		? "Jueves"
																		: day === "friday"
																			? "Viernes"
																			: day === "saturday"
																				? "Sábado"
																				: "Domingo";

													// Check each meal in the day
													meals.forEach((meal) => {
														// Check if any ingredient in the meal matches our item
														const matchingIngredients = meal.ingredients.filter(
															(ing) =>
																ing.name.toLowerCase() === normalizedName ||
																item.variations.includes(
																	ing.name.toLowerCase(),
																),
														);

														if (matchingIngredients.length > 0) {
															sources.push({
																day: dayName,
																meal: meal.name,
																ingredients: matchingIngredients,
															});
														}
													});
												});

												return sources;
											};

											const sources = findSources();
											const hasSources = sources.length > 0;

											return (
												<li
													key={itemKey}
													className={`py-2 px-3 rounded-md ${isChecked ? "bg-green-50" : "bg-gray-50"}`}
												>
													<div className="flex items-start">
														<input
															type="checkbox"
															id={itemKey}
															checked={isChecked}
															onChange={() => {
																setCheckedItems({
																	...checkedItems,
																	[itemKey]: !isChecked,
																});
															}}
															className="mt-1 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
														/>
														<div className="ml-3 flex-grow">
															<label
																htmlFor={itemKey}
																className={`font-medium cursor-pointer ${isChecked ? "line-through text-gray-500" : ""}`}
															>
																{item.name}
															</label>
															<div className="text-sm text-gray-600 mt-1">
																{formatQuantity(item)}
															</div>

															{item.variations &&
																item.variations.length > 1 && (
																	<div className="text-xs text-gray-500 mt-1">
																		Incluye: {item.variations.join(", ")}
																	</div>
																)}

															{/* Show sources in checklist view */}
															{hasSources && showSources && (
																<div className="mt-2 text-xs text-gray-600">
																	<details className="cursor-pointer">
																		<summary className="text-indigo-600 hover:text-indigo-800">
																			Ver detalles
																		</summary>
																		<div className="mt-2 pl-3 border-l-2 border-indigo-100">
																			{sources.map((source, idx) => (
																				<div key={idx} className="mb-1">
																					<span className="font-medium">
																						{source.day}
																					</span>{" "}
																					- {source.meal}:
																					<ul className="pl-4 mt-1">
																						{source.ingredients.map(
																							(ing, ingIdx) => (
																								<li key={ingIdx}>
																									{ing.quantity} {ing.name}
																								</li>
																							),
																						)}
																					</ul>
																				</div>
																			))}
																		</div>
																	</details>
																</div>
															)}
														</div>
													</div>
												</li>
											);
										})}
									</ul>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default ShoppingList;
