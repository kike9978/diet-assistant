export default function MealPrepPage({ weekPlan }) {
    // console.log(weekPlan)
    // console.log(Object.entries(weekPlan))
    // Object.entries(weekPlan).forEach((hola) => {
    //     console.log(hola[0])
    //     hola[1].forEach((adios) => console.log(adios))
    // })
    return (
        <div className="flex flex-col gap-4">
            {Object.entries(weekPlan).map(day => {
                if (day[1].length === 0) return

                return (
                    <div key={day[0]} className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-2">


                        <h2 className="text-xl">{day[0]}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                            {day[1].map(meal => {
                                return (
                                    <div key={meal.name} className="bg-gray-100 rounded-2xl flex flex-col p-4">
                                        <h3 className="text-lg font-semibold">{meal.name}</h3>
                                        {meal.ingredients.map(ingredient => {
                                            return (
                                                <div key={ingredient.name} className="flex justify-between gap-2">
                                                    <p>{ingredient.name}</p>
                                                    <p className="text-right">{ingredient.quantity}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}