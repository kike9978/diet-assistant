import { useState, useEffect } from 'react'
import { ToastProvider } from './components/Toast'
import LandingPage from './components/LandingPage'
import ResetConfirmationModal from './components/ui/base/ResetConfirmationModal'
import MealPlannerPage from './components/MealPlannerPage'
import MealPrepPage from './components/MealPrepPage'

function App() {
  const [dietPlan, setDietPlan] = useState(null)
  const [weekPlan, setWeekPlan] = useState({})
  const [pageContent, setPageContent] = useState('landing')
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const [pinnedPlans, setPinnedPlans] = useState(() => {
    // Try to load pinned plans from localStorage
    const savedPinnedPlans = localStorage.getItem('pinnedPlans')
    return savedPinnedPlans ? JSON.parse(savedPinnedPlans) : []
  })
  const [planId, setPlanId] = useState(() => {
    // Intentar recuperar el ID del plan actual del localStorage
    return localStorage.getItem('currentPlanId') || null;
  })



  // Load saved data from localStorage on initial render
  useEffect(() => {
    const savedDietPlan = localStorage.getItem('dietPlan')
    const savedWeekPlan = localStorage.getItem('weekPlan')
    const savedPlanId = localStorage.getItem('currentPlanId')

    if (savedDietPlan && savedWeekPlan && savedPlanId) {
      try {
        setDietPlan(JSON.parse(savedDietPlan))
        setWeekPlan(JSON.parse(savedWeekPlan))
        setPlanId(savedPlanId)
        setPageContent('plan')
      } catch (error) {
        console.error('Error loading saved data:', error)
        // Clear potentially corrupted data
        localStorage.removeItem('dietPlan')
        localStorage.removeItem('weekPlan')
        localStorage.removeItem('currentPlanId')
        localStorage.removeItem('checkedItems')
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

  // Guardar el ID del plan actual en localStorage
  useEffect(() => {
    if (planId) {
      localStorage.setItem('currentPlanId', planId)
    }
  }, [planId])

  // Save pinned plans to localStorage whenever they change
  useEffect(() => {
    if (pinnedPlans.length > 0) {
      localStorage.setItem('pinnedPlans', JSON.stringify(pinnedPlans))
    }
  }, [pinnedPlans])

  const handleDietPlanUpload = (plan) => {
    // Generar un nuevo ID único para este plan
    const newPlanId = `plan_${Date.now()}`

    // Actualizar el estado
    setDietPlan(plan)
    setWeekPlan({})
    setPlanId(newPlanId)
    setPageContent('plan')

    // Guardar inmediatamente en localStorage
    localStorage.setItem('dietPlan', JSON.stringify(plan))
    localStorage.setItem('weekPlan', JSON.stringify({}))
    localStorage.setItem('currentPlanId', newPlanId)

    // Limpiar los elementos marcados del plan anterior
    localStorage.removeItem('checkedItems')
  }

  const handlePinCurrentPlan = () => {
    if (!dietPlan || !planId) return;

    // Create a new pinned plan object
    const newPinnedPlan = {
      id: `pinned_${Date.now()}`,
      name: `Plan ${pinnedPlans.length + 1}`,
      planId: planId,
      dietPlan: dietPlan,
      weekPlan: weekPlan,
      createdAt: new Date().toISOString()
    };

    // Add to pinned plans
    setPinnedPlans([...pinnedPlans, newPinnedPlan]);
  };

  const handleRemovePinnedPlan = (pinnedPlanId) => {
    setPinnedPlans(pinnedPlans.filter(plan => plan.id !== pinnedPlanId));
  };

  const handleLoadPinnedPlan = (pinnedPlan) => {
    // Load the diet plan data
    setDietPlan(pinnedPlan.dietPlan);

    // Create a clean week plan with empty arrays for each day
    const cleanWeekPlan = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };

    // Set the clean week plan
    setWeekPlan(cleanWeekPlan);
    setPlanId(pinnedPlan.planId);
    setPageContent('plan')

    // Save to localStorage
    localStorage.setItem('dietPlan', JSON.stringify(pinnedPlan.dietPlan));
    localStorage.setItem('weekPlan', JSON.stringify(cleanWeekPlan));
    localStorage.setItem('currentPlanId', pinnedPlan.planId);

    // Clear checked items from shopping list
    localStorage.removeItem('checkedItems');
  };

  const handleRenamePinnedPlan = (pinnedPlanId, newName) => {
    setPinnedPlans(pinnedPlans.map(plan =>
      plan.id === pinnedPlanId ? { ...plan, name: newName } : plan
    ));
  };

  const handleClearAndReset = () => {
    setShowResetConfirmation(true)
  }

  const confirmReset = () => {
    // Clear localStorage
    localStorage.removeItem('dietPlan')
    localStorage.removeItem('weekPlan')
    localStorage.removeItem('currentPlanId')
    localStorage.removeItem('checkedItems')

    // Reset state
    setDietPlan(null)
    setWeekPlan({})
    setPlanId(null)
    setPageContent('landing')
    setShowResetConfirmation(false)
  }

  const cancelReset = () => {
    setShowResetConfirmation(false)
  }

  const updateDietPlan = (updatedPlan) => {
    setDietPlan(updatedPlan)
  }

  return (
    <ToastProvider>
      <div className="h-screen max-h-screen bg-gray-100 flex flex-col overflow-hidden">
        <header className="bg-indigo-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Plan Alimenticio</h1>

            {pageContent !== 'landing' && (
              <div className="flex space-x-2">
                <button
                  onClick={handlePinCurrentPlan}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                >
                  Guardar Plan
                </button>
                <button
                  onClick={handleClearAndReset}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                >
                  Reiniciar Plan
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="container mx-auto py-8 px-4 flex-1 overflow-y-auto">
          {pageContent === 'landing' ? (
            <LandingPage
              handleDietPlanUpload={handleDietPlanUpload}
              handleRemovePinnedPlan={handleRemovePinnedPlan}
              pinnedPlans={pinnedPlans}
              handleLoadPinnedPlan={handleLoadPinnedPlan}
              handleRenamePinnedPlan={handleRenamePinnedPlan} />

          ) : pageContent === 'plan' ? (
            <MealPlannerPage
              dietPlan={dietPlan}
              weekPlan={weekPlan}
              setWeekPlan={setWeekPlan}
              updateDietPlan={updateDietPlan} />
          ) : pageContent === 'mealPrep' ? (
            <MealPrepPage weekPlan={weekPlan} />
          ) : null}
        </main>

        {pageContent !== 'landing' &&

          <footer className='bg-indigo-600 text-white p-4 shadow-md'>
            <ul className='flex justify-between items-center'>
              <li><button className='cursor-pointer' onClick={handleClearAndReset}>Home</button></li>
              <li><button className='cursor-pointer' onClick={() => setPageContent('plan')}>Meal Planning</button></li>
              <li><button className='cursor-pointer' onClick={() => setPageContent('mealPrep')}>Meal Prep</button></li>
            </ul>
          </footer>
        }



        {/* Modal de confirmación para reiniciar el plan */}
        {showResetConfirmation && (
          <ResetConfirmationModal confirmReset={confirmReset} cancelReset={cancelReset} />
        )}
      </div>
    </ToastProvider>
  )
}

export default App
