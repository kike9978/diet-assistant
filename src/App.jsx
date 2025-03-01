import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import DietPlanUploader from './components/DietPlanUploader'
import MealPlanner from './components/MealPlanner'
import ShoppingList from './components/ShoppingList'

function App() {
  const [dietPlan, setDietPlan] = useState(null)
  const [weekPlan, setWeekPlan] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600">Meal Planner</h1>
        <p className="text-center text-gray-600 mt-2">Plan your weekly meals based on your diet plan</p>
      </header>

      <main className="max-w-7xl mx-auto">
        {!dietPlan ? (
          <DietPlanUploader onUpload={setDietPlan} />
        ) : (
          <>
            <MealPlanner dietPlan={dietPlan} weekPlan={weekPlan} setWeekPlan={setWeekPlan} />
            <ShoppingList weekPlan={weekPlan} />
          </>
        )}
      </main>
    </div>
  )
}

export default App
