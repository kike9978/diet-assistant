import { useEffect, useState } from "react";
import {
	getIngredientCategory,
	INGREDIENT_EQUIVALENTS,
	WEEK_DAYS_SPANISH,
} from "../utils/ingredientUtils";

function ToolsSidebar({
	isOpen,
	onClose,
	onAddIngredient,
	onSubstituteIngredient,
	categories,
	otherCategoryName,
	weekPlan,
}) {
	const [showEquivalents, setShowEquivalents] = useState(false);
	const [showAddForm, setShowAddForm] = useState(false);
	const [showSubstituteForm, setShowSubstituteForm] = useState(false);
	const [newIngredient, setNewIngredient] = useState({
		name: "",
		quantity: "",
		category: "Verduras",
	});
	const [substitution, setSubstitution] = useState({
		day: "monday",
		mealIndex: 0,
		ingredientIndex: 0,
		replacement: "",
	});
	const [selectedIngredientCategory, setSelectedIngredientCategory] =
		useState("");

	// Obtener todos los ingredientes del plan semanal agrupados por categoría
	const getGroupedIngredients = () => {
		const grouped = {};

		// Inicializar categorías
		Object.keys(INGREDIENT_EQUIVALENTS).forEach((category) => {
			grouped[category] = [];
		});
		grouped[otherCategoryName] = [];

		if (!weekPlan) return grouped;

		Object.entries(weekPlan).forEach(([day, meals]) => {
			meals.forEach((meal, mealIndex) => {
				meal.ingredients.forEach((ingredient, ingredientIndex) => {
					const category = getIngredientCategory(ingredient.name);

					grouped[category].push({
						day,
						mealIndex,
						ingredientIndex,
						name: ingredient.name,
						quantity: ingredient.quantity,
						mealName: meal.name,
						dayName: WEEK_DAYS_SPANISH.find((d) => d.id === day)?.name || "Día",
					});
				});
			});
		});

		// Eliminar categorías vacías
		Object.keys(grouped).forEach((category) => {
			if (grouped[category].length === 0) {
				delete grouped[category];
			}
		});

		return grouped;
	};

	const handleAddIngredient = (e) => {
		e.preventDefault();

		if (!newIngredient.name.trim() || !newIngredient.quantity.trim()) {
			return;
		}

		onAddIngredient(newIngredient);

		// Reset form
		setNewIngredient({
			name: "",
			quantity: "",
			category: newIngredient.category,
		});
	};

	const handleSubstituteIngredient = (e) => {
		e.preventDefault();

		if (!substitution.replacement.trim()) {
			return;
		}

		onSubstituteIngredient(substitution);

		// Reset form
		setSubstitution({
			...substitution,
			replacement: "",
		});
	};

	// Manejar cambio de ingrediente seleccionado
	const handleIngredientSelection = (value) => {
		const [day, mealIndex, ingredientIndex] = value
			.split("|")
			.map((v, i) => (i === 0 ? v : parseInt(v)));

		// Buscar el ingrediente seleccionado
		let selectedIngredient = null;
		const groupedIngredients = getGroupedIngredients();

		for (const category of Object.keys(groupedIngredients)) {
			const found = groupedIngredients[category].find(
				(ing) =>
					ing.day === day &&
					ing.mealIndex === mealIndex &&
					ing.ingredientIndex === ingredientIndex,
			);

			if (found) {
				selectedIngredient = found;
				setSelectedIngredientCategory(category);
				break;
			}
		}

		if (selectedIngredient) {
			setSubstitution({
				day,
				mealIndex,
				ingredientIndex,
				replacement: "",
			});
		}
	};

	return (
		<>
			{/* Barra lateral a nivel de viewport */}
			<div
				className={`fixed inset-y-0 right-0 z-10 w-80 max-w-full bg-white shadow-xl transform transition-transform duration-300 ${
					isOpen ? "translate-x-0" : "translate-x-full"
				} overflow-y-auto`}
			>
				<div className="p-4">
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-lg font-medium">Herramientas</h3>
						<button
							onClick={onClose}
							className="text-gray-500 hover:text-gray-700"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
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

					{/* Add ingredient form */}
					<div className="mb-6">
						<div className="flex justify-between items-center mb-3">
							<h4 className="font-medium">Agregar ingrediente</h4>
							<button
								onClick={() => setShowAddForm(!showAddForm)}
								className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
							>
								{showAddForm ? "Ocultar" : "Mostrar"}
								<svg
									className={`ml-1 w-4 h-4 transition-transform ${showAddForm ? "transform rotate-180" : ""}`}
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
						</div>

						{showAddForm && (
							<form
								onSubmit={handleAddIngredient}
								className="bg-gray-50 p-3 rounded-md"
							>
								<div className="space-y-3">
									<div>
										<label
											htmlFor="ingredient-name"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Ingrediente
										</label>
										<input
											type="text"
											id="ingredient-name"
											value={newIngredient.name}
											onChange={(e) =>
												setNewIngredient({
													...newIngredient,
													name: e.target.value,
												})
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
											placeholder="Ej: Manzana"
											required
										/>
									</div>

									<div>
										<label
											htmlFor="ingredient-quantity"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Cantidad
										</label>
										<input
											type="text"
											id="ingredient-quantity"
											value={newIngredient.quantity}
											onChange={(e) =>
												setNewIngredient({
													...newIngredient,
													quantity: e.target.value,
												})
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
											placeholder="Ej: 2 pzas, 1/2 tza, 250 g"
											required
										/>
									</div>

									<div>
										<label
											htmlFor="ingredient-category"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Categoría
										</label>
										<select
											id="ingredient-category"
											value={newIngredient.category}
											onChange={(e) =>
												setNewIngredient({
													...newIngredient,
													category: e.target.value,
												})
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
										>
											{Object.keys(categories).map((category) => (
												<option key={category} value={category}>
													{category}
												</option>
											))}
											<option value={otherCategoryName}>
												{otherCategoryName}
											</option>
										</select>
									</div>
								</div>

								<div className="mt-4">
									<button
										type="submit"
										className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
									>
										Agregar ingrediente
									</button>
								</div>
							</form>
						)}
					</div>

					{/* Substitute ingredient form */}
					<div className="mb-6">
						<div className="flex justify-between items-center mb-3">
							<h4 className="font-medium">Sustituir ingrediente</h4>
							<button
								onClick={() => setShowSubstituteForm(!showSubstituteForm)}
								className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
							>
								{showSubstituteForm ? "Ocultar" : "Mostrar"}
								<svg
									className={`ml-1 w-4 h-4 transition-transform ${showSubstituteForm ? "transform rotate-180" : ""}`}
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
						</div>

						{showSubstituteForm &&
						weekPlan &&
						Object.keys(weekPlan).length > 0 ? (
							<form
								onSubmit={handleSubstituteIngredient}
								className="bg-gray-50 p-3 rounded-md"
							>
								<div className="space-y-3">
									<div>
										<label
											htmlFor="substitute-ingredient"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Ingrediente a sustituir
										</label>
										<select
											id="substitute-ingredient"
											onChange={(e) =>
												handleIngredientSelection(e.target.value)
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
										>
											<option value="">Selecciona un ingrediente</option>
											{Object.entries(getGroupedIngredients()).map(
												([category, ingredients]) => (
													<optgroup key={category} label={category}>
														{ingredients.map((ingredient, idx) => (
															<option
																key={`${ingredient.day}-${ingredient.mealIndex}-${ingredient.ingredientIndex}`}
																value={`${ingredient.day}|${ingredient.mealIndex}|${ingredient.ingredientIndex}`}
															>
																{ingredient.name} ({ingredient.quantity}) -{" "}
																{ingredient.dayName}, {ingredient.mealName}
															</option>
														))}
													</optgroup>
												),
											)}
										</select>
									</div>

									{substitution.day && (
										<div>
											<label
												htmlFor="substitute-replacement"
												className="block text-sm font-medium text-gray-700 mb-1"
											>
												Reemplazar con
											</label>
											<select
												id="substitute-replacement"
												value={substitution.replacement}
												onChange={(e) =>
													setSubstitution({
														...substitution,
														replacement: e.target.value,
													})
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
												required
											>
												<option value="">Selecciona un equivalente</option>
												{selectedIngredientCategory &&
												INGREDIENT_EQUIVALENTS[selectedIngredientCategory]
													? INGREDIENT_EQUIVALENTS[
															selectedIngredientCategory
														].map((equivalent) => (
															<option key={equivalent} value={equivalent}>
																{equivalent}
															</option>
														))
													: // Si no se puede determinar la categoría, mostrar todas las opciones
														Object.entries(INGREDIENT_EQUIVALENTS).map(
															([category, equivalents]) => (
																<optgroup key={category} label={category}>
																	{equivalents.map((equivalent) => (
																		<option
																			key={`${category}-${equivalent}`}
																			value={equivalent}
																		>
																			{equivalent}
																		</option>
																	))}
																</optgroup>
															),
														)}
											</select>
										</div>
									)}
								</div>

								<div className="mt-4">
									<button
										type="submit"
										disabled={!substitution.day || !substitution.replacement}
										className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Sustituir ingrediente
									</button>
								</div>
							</form>
						) : showSubstituteForm &&
							(!weekPlan || Object.keys(weekPlan).length === 0) ? (
							<div className="bg-gray-50 p-3 rounded-md text-center text-gray-500">
								No hay plan de comidas disponible para realizar sustituciones.
							</div>
						) : null}
					</div>

					{/* Equivalents section */}
					<div>
						<div className="flex justify-between items-center mb-3">
							<h4 className="font-medium">Equivalencias comunes</h4>
							<button
								onClick={() => setShowEquivalents(!showEquivalents)}
								className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
							>
								{showEquivalents ? "Ocultar" : "Mostrar"}
								<svg
									className={`ml-1 w-4 h-4 transition-transform ${showEquivalents ? "transform rotate-180" : ""}`}
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
						</div>

						{showEquivalents && (
							<div className="bg-gray-50 p-3 rounded-md">
								<div className="space-y-4">
									{Object.entries(INGREDIENT_EQUIVALENTS).map(
										([category, items]) => (
											<div key={category}>
												<h5 className="font-medium text-sm text-indigo-700 mb-2">
													{category}
												</h5>
												<ul className="text-sm space-y-1">
													{items.map((item) => (
														<li key={item}>{item}</li>
													))}
												</ul>
											</div>
										),
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Fondo oscuro cuando la barra lateral está abierta */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black opacity-30 z-0"
					onClick={onClose}
				></div>
			)}
		</>
	);
}

export default ToolsSidebar;
