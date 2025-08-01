

export default function ExpandableDayCard({ day, expandedDayId, toggleDayExpansion, handleAddDayPlan, openSubstitutionModal }) {
    return (<div key={day.id} className="mb-4 bg-white rounded-md shadow-sm overflow-hidden">
        <div
            className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleDayExpansion(day.id)}
        >
            <h4 className="font-medium text-indigo-600">{day.name}</h4>
            <div className="flex items-center">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAddDayPlan(day);
                    }}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm font-medium mr-3"
                >
                    Usar este plan
                </button>
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedDayId === day.id ? 'transform rotate-180' : ''
                        }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>

        {expandedDayId === day.id && (
            <div className="p-4 border-t border-gray-100">
                <ul className="space-y-3">
                    {day.meals.map((meal, mealIndex) => (
                        <li key={meal.id} className="border-b border-gray-100 pb-2">
                            <h5 className="font-medium">{meal.name}</h5>
                            <ul className="text-sm text-gray-600 mt-1">
                                {meal.ingredients.map((ingredient, ingredientIndex) => (
                                    <li key={ingredientIndex} className="flex justify-between items-center py-1">
                                        <span>{ingredient.name} ({ingredient.quantity})</span>
                                        <button
                                            onClick={() => openSubstitutionModal(
                                                day.id,
                                                mealIndex,
                                                ingredientIndex,
                                                ingredient.name,
                                                ingredient.quantity,
                                                meal.name
                                            )}
                                            className="text-indigo-600 hover:text-indigo-800 text-xs"
                                            title="Sustituir ingrediente"
                                        >
                                            Sustituir
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>)
}