import MealPlanner from "./MealPlanner"
import ShoppingList from "./ShoppingList"

export default function MealPlannerPage({
    dietPlan,
    weekPlan,
    setWeekPlan,
    updateDietPlan, }) {

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
                <MealPlanner
                    dietPlan={dietPlan}
                    weekPlan={weekPlan}
                    setWeekPlan={setWeekPlan}
                />
            </div>

            <div>
                <ShoppingList weekPlan={weekPlan} />
            </div>
        </div>
    )

}