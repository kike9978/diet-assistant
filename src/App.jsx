import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import DietPlanUploader from './components/DietPlanUploader'
import MealPlanner from './components/MealPlanner'
import ShoppingList from './components/ShoppingList'

function App() {
  const [dietPlan, setDietPlan] = useState(null)
  const [weekPlan, setWeekPlan] = useState({})
  const [showLanding, setShowLanding] = useState(true)

  // Load saved data from localStorage on initial render
  useEffect(() => {
    const savedDietPlan = localStorage.getItem('dietPlan')
    const savedWeekPlan = localStorage.getItem('weekPlan')
    
    if (savedDietPlan && savedWeekPlan) {
      try {
        setDietPlan(JSON.parse(savedDietPlan))
        setWeekPlan(JSON.parse(savedWeekPlan))
        setShowLanding(false)
      } catch (error) {
        console.error('Error loading saved data:', error)
        // Clear potentially corrupted data
        localStorage.removeItem('dietPlan')
        localStorage.removeItem('weekPlan')
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (dietPlan) {
      localStorage.setItem('dietPlan', JSON.stringify(dietPlan))
    }
  }, [dietPlan])

  useEffect(() => {
    if (Object.keys(weekPlan).length > 0) {
      localStorage.setItem('weekPlan', JSON.stringify(weekPlan))
    }
  }, [weekPlan])

  const handleDietPlanUpload = (plan) => {
    setDietPlan(plan)
    setShowLanding(false)
  }

  const handleClearAndReset = () => {
    // Clear localStorage
    localStorage.removeItem('dietPlan')
    localStorage.removeItem('weekPlan')
    
    // Reset state
    setDietPlan(null)
    setWeekPlan({})
    setShowLanding(true)
  }

  const updateDietPlan = (updatedPlan) => {
    setDietPlan(updatedPlan)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Plan Alimenticio</h1>
          
          {!showLanding && (
            <button
              onClick={handleClearAndReset}
              className="px-4 py-2 bg-white text-indigo-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              Reiniciar Plan
            </button>
          )}
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        {showLanding ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Bienvenido a tu Planificador de Comidas</h2>
              <p className="text-gray-600 mb-8 text-center">
                Sube tu plan alimenticio en formato JSON para comenzar a planificar tus comidas semanales.
              </p>
              
              <DietPlanUploader onUpload={handleDietPlanUpload} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <MealPlanner 
                dietPlan={dietPlan} 
                weekPlan={weekPlan} 
                setWeekPlan={setWeekPlan} 
                setDietPlan={updateDietPlan} 
              />
            </div>
            
            <div>
              <ShoppingList weekPlan={weekPlan} />
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-800 text-white p-4 mt-auto">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} Plan Alimenticio. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
