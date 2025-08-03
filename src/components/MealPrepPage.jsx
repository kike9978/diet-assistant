import { useState } from "react"


function MealCard({ meal, hasAnySelection, isSelected, onToggleSelect, isUnselectedVisible }) {

    return (
        <div
            className={`bg-gray-100 rounded-2xl flex flex-col p-4 
            ${hasAnySelection && !isSelected ? "opacity-40" : "o"} ${isUnselectedVisible && !isSelected ? "hidden" : ""} `}>
            <h3 className="text-lg font-semibold">{meal.name}</h3>
            {
                meal.ingredients.map(ingredient => {
                    return (
                        <div
                            key={ingredient.name}
                            onClick={onToggleSelect}
                            className="flex justify-between gap-2">
                            <p>{ingredient.name}</p>
                            <p className="text-right">{ingredient.quantity}</p>
                        </div>
                    )
                })
            }
        </div >
    )
}


export default function MealPrepPage({ weekPlan }) {
    // console.log(weekPlan)
    // console.log(Object.entries(weekPlan))
    // Object.entries(weekPlan).forEach((hola) => {
    //     console.log(hola[0])
    //     hola[1].forEach((adios) => console.log(adios))
    // })
    const [selectedMeals, setSelectedMeals] = useState(new Set([]))
    const [isUnselectedVisible, setIsUnselectedVisible] = useState(false)


    function toggleMealSelection(mealName) {
        setSelectedMeals(prev => {
            const newSet = new Set(prev)

            if (newSet.has(mealName)) {
                newSet.delete(mealName)
            } else {
                newSet.add(mealName)
            }

            return newSet
        })

    }

    const hasAnySelection = selectedMeals.size > 0

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                <button
                    className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                    onClick={() => setIsUnselectedVisible(!isUnselectedVisible)}>{isUnselectedVisible ? "Mostrar no seleccionados" : "Ocultar no seleccionados"}</button>
            </div>
            <div className="flex flex-col gap-4">
                {Object.entries(weekPlan).map(day => {
                    const [dayName, meals] = day
                    if (meals.length === 0) return
                    return (
                        <div key={dayName} className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-2">
                            <h2 className="text-xl">{dayName}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                                {meals.map(meal => {
                                    const mealDayName = meal.name + dayName

                                    return (
                                        <MealCard
                                            isUnselectedVisible={isUnselectedVisible}
                                            meal={meal}
                                            key={meal.name}
                                            isSelected={selectedMeals.has(mealDayName)}
                                            hasAnySelection={hasAnySelection}
                                            onToggleSelect={() => toggleMealSelection(mealDayName)}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}