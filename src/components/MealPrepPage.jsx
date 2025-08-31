// src/pages/MealPrepPage.js
import { useEffect, useMemo, useState } from "react";
import { formatQuantities, sumIngredients } from "../utils/ingredientUtils";

function MealCard({
	meal,
	hasAnySelection,
	isSelected,
	onToggleSelect,
	isUnselectedVisible,
}) {
	const [showIngredients, setShowIngredients] = useState(false);

	return (
		<div
			className={`bg-gray-100 cursor-pointer rounded-2xl flex flex-col p-4 ${
				hasAnySelection && !isSelected ? "opacity-40" : ""
			} ${isUnselectedVisible && !isSelected ? "hidden" : ""}`}
			onClick={onToggleSelect}
		>
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-semibold">{meal.name}</h3>
				<button
					onClick={(e) => {
						e.stopPropagation();
						setShowIngredients(!showIngredients);
					}}
					className="text-indigo-600 hover:text-indigo-800 text-sm px-2 py-1 rounded"
				>
					{showIngredients ? "Ocultar" : "Mostrar"}
				</button>
			</div>

			{showIngredients && (
				<div className="mt-2">
					{meal.ingredients.map((ingredient) => (
						<div
							key={ingredient.name}
							onClick={onToggleSelect}
							className="flex justify-between gap-2 py-1 hover:bg-gray-200 rounded px-2 cursor-pointer"
						>
							<p>{ingredient.name}</p>
							<p className="text-right">{ingredient.quantity}</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

// Utility function to clear meal prep localStorage
const clearMealPrepLocalStorage = () => {
	try {
		localStorage.removeItem("mealPrepSelectedMeals");
		localStorage.removeItem("mealPrepUnselectedVisible");
	} catch (error) {
		console.error("Error clearing meal prep localStorage:", error);
	}
};

function MealPrepPage({ weekPlan }) {
	// Initialize selectedMeals from localStorage
	const [selectedMeals, setSelectedMeals] = useState(() => {
		try {
			const savedSelectedMeals = localStorage.getItem("mealPrepSelectedMeals");
			if (savedSelectedMeals) {
				const mealArray = JSON.parse(savedSelectedMeals);
				return new Set(mealArray);
			}
		} catch (error) {
			console.error("Error loading saved meal prep selections:", error);
		}
		return new Set([]);
	});

	// Initialize isUnselectedVisible from localStorage
	const [isUnselectedVisible, setIsUnselectedVisible] = useState(() => {
		try {
			const savedVisibility = localStorage.getItem("mealPrepUnselectedVisible");
			return savedVisibility ? JSON.parse(savedVisibility) : false;
		} catch (error) {
			console.error("Error loading saved visibility state:", error);
			return false;
		}
	});

	// Debug: Log weekPlan structure

	// Get all selected meals
	const selectedMealObjects = useMemo(() => {
		const meals = [];
		Object.entries(weekPlan).forEach(([dayName, dayMeals]) => {
			dayMeals.forEach((meal) => {
				const mealKey = `${meal.name}${dayName}`;
				if (selectedMeals.has(mealKey)) {
					meals.push({ ...meal, day: dayName });
				}
			});
		});

		console.log("Selected meals:", meals);
		return meals;
	}, [selectedMeals, weekPlan]);

	// Aggregate ingredients for selected meals
	const aggregatedIngredients = useMemo(() => {
		const allIngredients = [];
		selectedMealObjects.forEach((meal) => {
			meal.ingredients.forEach((ingredient) => {
				allIngredients.push({
					...ingredient,
					mealName: meal.name,
					day: meal.day,
				});
			});
		});
		return sumIngredients(allIngredients);
	}, [selectedMealObjects]);

	// Save selectedMeals to localStorage whenever it changes
	useEffect(() => {
		try {
			// Convert Set to Array for JSON serialization
			const mealArray = Array.from(selectedMeals);
			localStorage.setItem("mealPrepSelectedMeals", JSON.stringify(mealArray));
		} catch (error) {
			console.error(
				"Error saving meal prep selections to localStorage:",
				error,
			);
		}
	}, [selectedMeals]);

	// Save isUnselectedVisible to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem(
				"mealPrepUnselectedVisible",
				JSON.stringify(isUnselectedVisible),
			);
		} catch (error) {
			console.error("Error saving visibility state to localStorage:", error);
		}
	}, [isUnselectedVisible]);

	// Clear stale meal selections when weekPlan changes significantly
	useEffect(() => {
		if (!weekPlan || Object.keys(weekPlan).length === 0) {
			// If weekPlan is empty, clear all selections
			setSelectedMeals(new Set([]));
			return;
		}

		// Check if any selected meals no longer exist in the current weekPlan
		const currentMealKeys = new Set();
		Object.entries(weekPlan).forEach(([dayName, dayMeals]) => {
			dayMeals.forEach((meal) => {
				const mealKey = `${meal.name}${dayName}`;
				currentMealKeys.add(mealKey);
			});
		});

		// Remove selections for meals that no longer exist
		setSelectedMeals((prev) => {
			const validSelections = new Set();
			prev.forEach((mealKey) => {
				if (currentMealKeys.has(mealKey)) {
					validSelections.add(mealKey);
				}
			});
			return validSelections;
		});
	}, [weekPlan]);

	// Debug: Log when selection changes
	useEffect(() => {
		console.log("Selected meal keys:", Array.from(selectedMeals));
		console.log("Has any selection:", selectedMeals.size > 0);
	}, [selectedMeals]);

	// Toggle meal selection
	const toggleMealSelection = (mealKey) => {
		setSelectedMeals((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(mealKey)) {
				newSet.delete(mealKey);
			} else {
				newSet.add(mealKey);
			}
			return newSet;
		});
	};

	const hasAnySelection = selectedMeals.size > 0;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<button
					className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
					onClick={() => setIsUnselectedVisible(!isUnselectedVisible)}
				>
					{isUnselectedVisible
						? "Mostrar no seleccionados"
						: "Ocultar no seleccionados"}
				</button>
			</div>

			<div className="flex flex-col gap-4">
				{Object.entries(weekPlan).map(([dayName, meals]) => {
					if (meals.length === 0) return null;
					return (
						<div
							key={dayName}
							className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-2"
						>
							<h2 className="text-xl">{dayName}</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
								{meals.map((meal) => {
									const mealKey = meal.name + dayName;
									return (
										<MealCard
											key={meal.name}
											meal={meal}
											isSelected={selectedMeals.has(mealKey)}
											hasAnySelection={hasAnySelection}
											isUnselectedVisible={isUnselectedVisible}
											onToggleSelect={() => toggleMealSelection(mealKey)}
										/>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>

			{/* Aggregated Ingredients Section */}
			{hasAnySelection && (
				<div className="bg-white p-4 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">Ingredientes Totales</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
						{aggregatedIngredients.map((ingredient, index) => (
							<div
								key={index}
								className="bg-gray-50 p-3 rounded-lg border group"
							>
								<div className="flex justify-between items-start">
									<div>
										<h3 className="font-semibold text-gray-800">
											{ingredient.name}
										</h3>
										<p className="text-gray-600 mt-1">
											{formatQuantities(ingredient.quantities)}
										</p>
									</div>

									{/* Collapse button */}
									{ingredient.sources.length > 0 && (
										<button
											className="text-indigo-600 hover:text-indigo-800 text-sm"
											onClick={(e) => {
												e.preventDefault();
												const details =
													e.currentTarget.parentElement.nextElementSibling;
												details.classList.toggle("hidden");
											}}
										>
											Detalles
										</button>
									)}
								</div>

								{/* Sources collapsible section */}
								{ingredient.sources.length > 0 && (
									<div className="hidden mt-2 text-sm text-gray-600 border-t pt-2">
										<details>
											<summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">
												Fuentes ({ingredient.sources.length})
											</summary>
											<div className="mt-2 pl-3 border-l-2 border-indigo-100">
												{ingredient.sources.map((source, idx) => (
													<div key={idx} className="mb-1">
														<span className="font-medium">{source.day}</span> -{" "}
														{source.meal}:
														<p className="text-xs text-gray-500">
															{source.quantity}
														</p>
													</div>
												))}
											</div>
										</details>

										{ingredient.variations.length > 1 && (
											<div className="mt-2 text-xs text-gray-500">
												<span className="font-medium">Variaciones:</span>{" "}
												{ingredient.variations.join(", ")}
											</div>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default MealPrepPage;
export { clearMealPrepLocalStorage };
