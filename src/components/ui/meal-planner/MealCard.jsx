export default function MealCard({ index, meal }) {
    return (
        <li key={index} className="bg-white p-4 rounded-md shadow-sm">
            <h4 className="font-medium text-indigo-600 mb-2">{meal.name}</h4>
            <p className="text-sm text-gray-600 mb-2">Ingredientes:</p>
            <ul className="text-sm text-gray-600 list-disc list-inside">
                {meal.ingredients.map((ingredient, idx) => (
                    <li key={idx}>
                        {ingredient.name} ({ingredient.quantity})
                    </li>
                ))}
            </ul>
        </li>
    )
}