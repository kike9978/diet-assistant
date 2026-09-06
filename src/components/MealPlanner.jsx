import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { useId, useState } from "react";
import {
	getIngredientCategory,
	INGREDIENT_CATEGORIES,
	INGREDIENT_EQUIVALENTS,
	OTHER_CATEGORY_NAME,
	WEEK_DAYS,
} from "../utils/ingredientUtils";
import { DAY_LABEL_MSG, WEEK_DAY_IDS } from "../i18n/weekDayLabels";
import { useToast } from "./Toast";
import ToolsSidebar from "./ToolsSidebar";
import Modal from "./ui/base/Modal";
import Tab from "./ui/base/Tab";
import ExpandableDayCard from "./ui/meal-planner/ExpandableDayCard";
import MealCard from "./ui/meal-planner/MealCard";

const now = new Date();

function MealPlanner({ dietPlan, weekPlan, setWeekPlan }) {
	const toast = useToast();
	const { _ } = useLingui();
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

	const dayTabs = WEEK_DAY_IDS.map((id) => ({
		id,
		name: _(DAY_LABEL_MSG[id]),
	}));

	const ensureWeekPlanStructure = () => {
		const initializedWeekPlan = { ...weekPlan };
		WEEK_DAYS.forEach((day) => {
			if (!initializedWeekPlan[day]) {
				initializedWeekPlan[day] = [];
			}
		});
		return initializedWeekPlan;
	};

	const structuredWeekPlan = ensureWeekPlanStructure();

	const handleAddDayPlan = (dayPlan) => {
		const updatedWeekPlan = { ...structuredWeekPlan };
		updatedWeekPlan[selectedDay] = dayPlan.meals;
		setWeekPlan(updatedWeekPlan);
	};

	const handleClearDay = (dayId) => {
		const updatedWeekPlan = { ...structuredWeekPlan };
		updatedWeekPlan[dayId] = [];
		setWeekPlan(updatedWeekPlan);
	};

	const toggleDayExpansion = (dayId) => {
		setExpandedDayId(expandedDayId === dayId ? null : dayId);
	};

	const handleAddIngredient = (newIngredient) => {
		if (
			!structuredWeekPlan[selectedDay] ||
			structuredWeekPlan[selectedDay].length === 0
		) {
			const updatedWeekPlan = { ...structuredWeekPlan };
			updatedWeekPlan[selectedDay] = [
				{
					id: `custom-meal-${Date.now()}`,
					name: t`Comida personalizada`,
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
			const updatedWeekPlan = { ...structuredWeekPlan };
			updatedWeekPlan[selectedDay][0].ingredients.push({
				name: newIngredient.name,
				quantity: newIngredient.quantity,
			});
			setWeekPlan(updatedWeekPlan);
		}
	};

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

	const handleSubstituteIngredient = (substitution) => {
		const { mealIndex, ingredientIndex, replacement } = substitution;
		const parts = replacement.split(" de ");
		const quantity = parts[0];
		const name = parts.slice(1).join(" de ");

		const updatedWeekPlan = JSON.parse(JSON.stringify(structuredWeekPlan));

		Object.keys(updatedWeekPlan).forEach((weekDay) => {
			if (
				updatedWeekPlan[weekDay]?.[mealIndex]?.ingredients?.[ingredientIndex]
			) {
				const currentIngredient =
					updatedWeekPlan[weekDay][mealIndex].ingredients[ingredientIndex];

				if (
					currentIngredient.name === substitutionModal.ingredientName &&
					currentIngredient.quantity === substitutionModal.ingredientQuantity
				) {
					updatedWeekPlan[weekDay][mealIndex].ingredients[ingredientIndex] = {
						name,
						quantity,
					};
				}
			}
		});

		setWeekPlan(updatedWeekPlan);
		closeSubstitutionModal();
		toast.success(
			t`Ingrediente sustituido: ${substitutionModal.ingredientName} por ${name}`,
		);
	};

	const selectedDayLabel =
		_(DAY_LABEL_MSG[selectedDay]) || t`Día seleccionado`;

	return (
		<div className="h-full flex flex-col">
			<div className="mb-6 overflow-x-auto">
				<div className="flex space-x-1 min-w-max">
					{dayTabs.map((day) => (
						<Tab
							key={day.id}
							day={day}
							selectedDay={selectedDay}
							setSelectedDay={setSelectedDay}
						/>
					))}
				</div>
			</div>

			<div className="md:grid grid-cols-1 md:grid-cols-2 flex flex-col gap-6 flex-grow">
				<section className="flex flex-col">
					<button
						type="button"
						className="flex items-center justify-between w-full cursor-pointer bg-transparent border-none p-0 text-left"
						onClick={() => setArePlansColapsed(!arePlansColapsed)}
						aria-expanded={!arePlansColapsed}
						aria-label={t`Mostrar u ocultar planes de comida disponibles`}
					>
						<h3 className="text-lg font-medium mb-3">
							<Trans>Planes de Comida Disponibles:</Trans>
						</h3>
						<svg
							className={`w-5 h-5 text-gray-500 transition-transform ${
								arePlansColapsed ? "transform rotate-180" : ""
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
								const days =
									dietPlan?.days || (Array.isArray(dietPlan) ? dietPlan : null);

								if (!days?.length) {
									return (
										<div className="text-center py-10">
											<p className="text-gray-500">
												<Trans>No hay planes de comida disponibles.</Trans>
											</p>
										</div>
									);
								}

								return days.map((day) => (
									<ExpandableDayCard
										key={day.id}
										day={day}
										expandedDayId={expandedDayId}
										toggleDayExpansion={toggleDayExpansion}
										handleAddDayPlan={handleAddDayPlan}
										openSubstitutionModal={openSubstitutionModal}
									/>
								));
							})()}
						</ul>
					)}
				</section>

				<div className="flex flex-col p-2">
					<div className="flex justify-between items-center mb-3 cursor-pointer bg-gray-100 hover:bg-gray-50 p-2 rounded-md -mx-2">
						<div className="flex items-center">
							<h3 className="text-lg font-medium mr-2">
								<Trans>Plan para {selectedDayLabel}:</Trans>
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
									<Trans>Limpiar día</Trans>
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
									<Trans>No hay plan de comidas para este día.</Trans>
								</p>
								<p className="text-gray-500 text-sm">
									<Trans>
										Selecciona un plan de comida de la lista de disponibles.
									</Trans>
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{substitutionModal.isOpen && (
				<Modal
					closeSubstitutionModal={closeSubstitutionModal}
					substitutionModal={substitutionModal}
					handleSubstituteIngredient={handleSubstituteIngredient}
					heading={t`Sustituir ingrediente`}
				>
					<p className="text-sm text-gray-500 mb-4">
						<Trans>
							Estás sustituyendo{" "}
							<span className="font-medium">
								{substitutionModal.ingredientName} (
								{substitutionModal.ingredientQuantity})
							</span>{" "}
							de la comida{" "}
							<span className="font-medium">{substitutionModal.mealName}</span>
							.
						</Trans>
					</p>

					<div className="mb-4">
						<label
							htmlFor={selectId}
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							<Trans>Reemplazar con</Trans>
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
							<option value="">{t`Selecciona un equivalente`}</option>
							{(() => {
								const category = getIngredientCategory(
									substitutionModal.ingredientName,
								);

								if (INGREDIENT_EQUIVALENTS[category]) {
									return INGREDIENT_EQUIVALENTS[category].map((equivalent) => (
										<option key={equivalent} value={equivalent}>
											{equivalent}
										</option>
									));
								}
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
							})()}
						</select>
					</div>
				</Modal>
			)}

			<div className="mt-4">
				<button
					type="button"
					onClick={() => setSidebarOpen(true)}
					className="min-h-11 px-4 rounded-app bg-brand text-white font-semibold"
				>
					<Trans>Abrir herramientas</Trans>
				</button>
			</div>

			<ToolsSidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				onAddIngredient={handleAddIngredient}
				onSubstituteIngredient={handleSubstituteIngredient}
				categories={INGREDIENT_CATEGORIES}
				otherCategoryName={OTHER_CATEGORY_NAME}
				weekPlan={structuredWeekPlan}
			/>
		</div>
	);
}

export default MealPlanner;
