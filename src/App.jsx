import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import DietPlanUploader from './components/DietPlanUploader'
import MealPlanner from './components/MealPlanner'
import ShoppingList from './components/ShoppingList'
import PinnedPlanCard from './components/PinnedPlanCard'
import { ToastProvider } from './components/Toast'

function App() {
  const [dietPlan, setDietPlan] = useState(null)
  const [weekPlan, setWeekPlan] = useState({})
  const [showLanding, setShowLanding] = useState(true)
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
        setShowLanding(false)
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
    setShowLanding(false)

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
    setShowLanding(false);

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
    setShowLanding(true)
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
      <div className="min-h-screen bg-gray-100">
        <header className="bg-indigo-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Plan Alimenticio</h1>

            {!showLanding && (
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

              {/* Pinned Plans Section */}
              {pinnedPlans.length > 0 && (
                <div className="bg-white p-8 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-6">Planes Guardados</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pinnedPlans.map((plan) => (
                      <PinnedPlanCard
                        key={plan.id}
                        plan={plan}
                        onLoad={handleLoadPinnedPlan}
                        onRemove={handleRemovePinnedPlan}
                        onRename={handleRenamePinnedPlan}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
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



        {/* Modal de confirmación para reiniciar el plan */}
        {showResetConfirmation && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Reiniciar plan
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          ¿Estás seguro de que quieres reiniciar el plan? Esta acción eliminará todos tus datos actuales y no se puede deshacer.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={confirmReset}
                  >
                    Reiniciar
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={cancelReset}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  )
}

export default App
