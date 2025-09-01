import { useId, useState } from "react";
import {
	getIngredientCategory,
	INGREDIENT_CATEGORIES,
	INGREDIENT_EQUIVALENTS,
	OTHER_CATEGORY_NAME,
	WEEK_DAYS,
	WEEK_DAYS_SPANISH,
} from "../utils/ingredientUtils";
import { useToast } from "./Toast";
import ToolsSidebar from "./ToolsSidebar";
import Modal from "./ui/base/Modal";
import Tab from "./ui/base/Tab";
import ExpandableDayCard from "./ui/meal-planner/ExpandableDayCard";
import MealCard from "./ui/meal-planner/MealCard";

const now = new Date();

function MealPlanner({ dietPlan, weekPlan, setWeekPlan }) {
	const toast = useToast();
	const selectId = useId();
	const [selectedDay, setSelectedDay] = useState(WEEK_DAYS[now.getDay()]);
	const [expandedDayId, setExpandedDayId] = useState(null);
	const [arePlansColapsed, setArePlansColapsed] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [substitutionModal, setSubstitutionModal] = useState({
		isOpen: false,
		day: "",
		mealIndex: 0,
		ingredientIndex: 0,
		ingredientName: "",
		ingredientQuantity: "",
		mealName: "",
		dayPlanId: "",
		selectedReplacement: "",
	});

	// Initialize weekPlan with empty arrays for each day if not already set
	const ensureWeekPlanStructure = () => {
		const initializedWeekPlan = { ...weekPlan };

		WEEK_DAYS.forEach((day) => {
			if (!initializedWeekPlan[day]) {
				initializedWeekPlan[day] = [];
			}
		});

		return initializedWeekPlan;
	};

	// Make sure weekPlan has the proper structure
	const structuredWeekPlan = ensureWeekPlanStructure();

	const handleAddDayPlan = (dayPlan) => {
		// Check if dayPlan has meals or if we need to use a different structure
		let mealsToAdd = [];

		if (dayPlan.meals && dayPlan.meals.length > 0) {
			// Use the meals array directly
			mealsToAdd = dayPlan.meals;
		} else if (dayPlan.ingredients && dayPlan.ingredients.length > 0) {
			// If it has ingredients but no meals, create a meal from the ingredients
			mealsToAdd = [{
				id: `meal_${Date.now()}`,
				name: dayPlan.name || 'Comida personalizada',
				ingredients: dayPlan.ingredients
			}];
		} else {
			// If no meals or ingredients, show error
			toast.error('Este plan no tiene comidas disponibles');
			return;
		}

		// Replace the selected day's meals with the selected day plan
		const updatedWeekPlan = { ...structuredWeekPlan };
		updatedWeekPlan[selectedDay] = mealsToAdd;
		setWeekPlan(updatedWeekPlan);

		// Show success message
		toast.success(`Plan "${dayPlan.name}" agregado a ${WEEK_DAYS_SPANISH.find(day => day.id === selectedDay)?.name}`);
	};

	const handleClearDay = (dayId) => {
		const updatedWeekPlan = { ...structuredWeekPlan };
		updatedWeekPlan[dayId] = [];
		setWeekPlan(updatedWeekPlan);
	};

	const toggleDayExpansion = (dayId) => {
		setExpandedDayId(expandedDayId === dayId ? null : dayId);
	};

	// Función para manejar la adición de un nuevo ingrediente
	const handleAddIngredient = (newIngredient) => {
		if (
			!structuredWeekPlan[selectedDay] ||
			structuredWeekPlan[selectedDay].length === 0
		) {
			// Si no hay comidas en el día seleccionado, crear una nueva comida
			const updatedWeekPlan = { ...structuredWeekPlan };
			updatedWeekPlan[selectedDay] = [
				{
					id: `custom-meal-${Date.now()}`,
					name: "Comida personalizada",
					ingredients: [
						{
							name: newIngredient.name,
							quantity: newIngredient.quantity,
						},
					],
				},
			];
			setWeekPlan(updatedWeekPlan);
		} else {
			// Agregar el ingrediente a la primera comida del día
			const updatedWeekPlan = { ...structuredWeekPlan };
			updatedWeekPlan[selectedDay][0].ingredients.push({
				name: newIngredient.name,
				quantity: newIngredient.quantity,
			});
			setWeekPlan(updatedWeekPlan);
		}
	};

	// Función para abrir el modal de sustitución
	const openSubstitutionModal = (
		dayPlanId,
		mealIndex,
		ingredientIndex,
		ingredientName,
		ingredientQuantity,
		mealName,
	) => {
		setSubstitutionModal({
			isOpen: true,
			dayPlanId,
			mealIndex,
			ingredientIndex,
			ingredientName,
			ingredientQuantity,
			mealName,
			selectedReplacement: "",
		});
	};

	// Función para cerrar el modal de sustitución
	const closeSubstitutionModal = () => {
		setSubstitutionModal({
			isOpen: false,
			day: "",
			mealIndex: 0,
			ingredientIndex: 0,
			ingredientName: "",
			ingredientQuantity: "",
			mealName: "",
			dayPlanId: "",
			selectedReplacement: "",
		});
	};

	// Función para manejar la sustitución de un ingrediente
	const handleSubstituteIngredient = (substitution) => {
		const { mealIndex, ingredientIndex, replacement } = substitution;

		// Extraer el nombre y la cantidad del ingrediente del texto de reemplazo
		const parts = replacement.split(" de ");
		const quantity = parts[0];
		const name = parts.slice(1).join(" de "); // Por si hay más de un "de" en el nombre

		// Actualizar el weekPlan directamente
		const updatedWeekPlan = JSON.parse(JSON.stringify(structuredWeekPlan));

		// Buscar si algún día del weekPlan está usando el plan que estamos modificando
		Object.keys(updatedWeekPlan).forEach((weekDay) => {
			// Si el día tiene comidas y la comida que estamos modificando existe
			if (
				updatedWeekPlan[weekDay]?.[mealIndex]?.ingredients?.[ingredientIndex]
			) {
				// Verificar si este día está usando el plan que estamos modificando
				// Comparamos el nombre del ingrediente y la cantidad para identificarlo
				const currentIngredient =
					updatedWeekPlan[weekDay][mealIndex].ingredients[ingredientIndex];

				if (
					currentIngredient.name === substitutionModal.ingredientName &&
					currentIngredient.quantity === substitutionModal.ingredientQuantity
				) {
					// Actualizar el ingrediente en el weekPlan
					updatedWeekPlan[weekDay][mealIndex].ingredients[ingredientIndex] = {
						name: name,
						quantity: quantity,
					};
				}
			}
		});

		// Actualizar el estado del weekPlan
		setWeekPlan(updatedWeekPlan);

		// Cerrar el modal
		closeSubstitutionModal();

		// Mostrar un mensaje de éxito
		toast.success(
			`Ingrediente sustituido: ${substitutionModal.ingredientName} por ${name}`,
		);
	};

	return (
		<div className="h-full flex flex-col">
			{/* Day selection tabs */}
			<div className="mb-6 overflow-x-auto">
				<div className="flex space-x-1 min-w-max">
					{WEEK_DAYS_SPANISH.map((day) => (
						<Tab
							key={day.id}
							day={day}
							selectedDay={selectedDay}
							setSelectedDay={setSelectedDay}
						/>
					))}
				</div>
			</div>

			{/* Meal selection */}
			<div className="md:grid grid-cols-1 md:grid-cols-2 flex flex-col gap-6 flex-grow">
				{/* Available day plans */}
				<section className="flex flex-col">
					<button
						type="button"
						className="flex items-center justify-between w-full cursor-pointer bg-transparent border-none p-0 text-left"
						onClick={() => setArePlansColapsed(!arePlansColapsed)}
						aria-expanded={!arePlansColapsed}
						aria-label="Toggle available meal plans"
					>
						<h3 className="text-lg font-medium mb-3">
							Planes de Comida Disponibles:
						</h3>
						<svg
							className={`w-5 h-5 text-gray-500 transition-transform ${arePlansColapsed ? "transform rotate-180" : ""
								}`}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
					{!arePlansColapsed && (
						<ul className="bg-gray-50 p-4 rounded-md overflow-y-auto flex-grow list-none">
							{(() => {
								// Get the days array - handle both dietPlan.days and direct array
								const days =
									dietPlan?.days || (Array.isArray(dietPlan) ? dietPlan : null);

								console.log('🔍 Available days:', days);

								if (!days?.length) {
									return (
										<div className="text-center py-10">
											<p className="text-gray-500">
												No hay planes de comida disponibles.
											</p>
										</div>
									);
								}

								return days.map((day) => {
									console.log('🔍 Rendering day:', day);
									return (
										<ExpandableDayCard
											key={day.id}
											day={day}
											expandedDayId={expandedDayId}
											toggleDayExpansion={toggleDayExpansion}
											handleAddDayPlan={handleAddDayPlan}
											openSubstitutionModal={openSubstitutionModal}
										/>
									);
								});
							})()}
						</ul>
					)}
				</section>

				{/* Selected day's meals */}
				<div className="flex flex-col p-2">
					<div className="flex justify-between items-center mb-3 cursor-pointer bg-gray-100 hover:bg-gray-50 p-2 rounded-md -mx-2  ">
						<div className="flex items-center">
							<h3 className="text-lg font-medium mr-2">
								Plan para{" "}
								{WEEK_DAYS_SPANISH.find((day) => day.id === selectedDay)
									?.name || "Día seleccionado"}
								:
							</h3>
						</div>
						{structuredWeekPlan[selectedDay] &&
							structuredWeekPlan[selectedDay].length > 0 && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										handleClearDay(selectedDay);
									}}
									className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
								>
									Limpiar día
								</button>
							)}
					</div>

					<div className="bg-gray-50 p-4 rounded-md overflow-y-auto flex-grow">
						{structuredWeekPlan[selectedDay] &&
							structuredWeekPlan[selectedDay].length > 0 ? (
							<ul className="space-y-4">
								{structuredWeekPlan[selectedDay].map((meal, index) => (
									<MealCard
										key={meal.id || `meal-${index}`}
										index={index}
										meal={meal}
									/>
								))}
							</ul>
						) : (
							<div className="text-center py-10">
								<p className="text-gray-500 mb-4">
									No hay plan de comidas para este día.
								</p>
								<p className="text-gray-500 text-sm">
									Selecciona un plan de comida de la lista de disponibles.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Modal de sustitución */}
			{substitutionModal.isOpen && (
				<Modal
					closeSubstitutionModal={closeSubstitutionModal}
					substitutionModal={substitutionModal}
					handleSubstituteIngredient={handleSubstituteIngredient}
					heading={"Sustituir ingrediente"}
				>
					<p className="text-sm text-gray-500 mb-4">
						Estás sustituyendo{" "}
						<span className="font-medium">
							{substitutionModal.ingredientName} (
							{substitutionModal.ingredientQuantity})
						</span>{" "}
						de la comida{" "}
						<span className="font-medium">{substitutionModal.mealName}</span>.
					</p>

					<div className="mb-4">
						<label
							htmlFor={selectId}
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Reemplazar con
						</label>
						<select
							id={selectId}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
							value={substitutionModal.selectedReplacement}
							onChange={(e) =>
								setSubstitutionModal({
									...substitutionModal,
									selectedReplacement: e.target.value,
								})
							}
						>
							<option value="">Selecciona un equivalente</option>
							{(() => {
								// Determinar la categoría del ingrediente
								const category = getIngredientCategory(
									substitutionModal.ingredientName,
								);

								// Si tenemos equivalentes para esta categoría, mostrarlos
								if (INGREDIENT_EQUIVALENTS[category]) {
									return INGREDIENT_EQUIVALENTS[category].map((equivalent) => (
										<option key={equivalent} value={equivalent}>
											{equivalent}
										</option>
									));
								} else {
									// Si no hay equivalentes específicos, mostrar todas las opciones
									return Object.entries(INGREDIENT_EQUIVALENTS).map(
										([catName, equivalents]) => (
											<optgroup key={catName} label={catName}>
												{equivalents.map((equivalent) => (
													<option
														key={`${catName}-${equivalent}`}
														value={equivalent}
													>
														{equivalent}
													</option>
												))}
											</optgroup>
										),
									);
								}
							})()}
						</select>
					</div>
				</Modal>
			)}

			{/* Barra lateral de herramientas */}
			<ToolsSidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				onAddIngredient={handleAddIngredient}
				onSubstituteIngredient={handleSubstituteIngredient}
				categories={INGREDIENT_CATEGORIES}
				otherCategoryName={OTHER_CATEGORY_NAME}
				weekPlan={structuredWeekPlan}
			/>

			{/* Botón flotante para abrir la barra lateral */}
			{/* <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-6 right-6 z-20 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Abrir herramientas"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button> */}
		</div>
	);
}

export default MealPlanner;
