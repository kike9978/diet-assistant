import { useState } from 'react';
import { PlusIcon } from './Icons';

function MealPlanner({ dietPlan, weekPlan, setWeekPlan }) {
  const [availableMeals, setAvailableMeals] = useState(() => {
    // Transform diet plan days into a flat list of meals with unique IDs
    return dietPlan.days.flatMap(day => 
      day.meals.map(meal => ({
        ...meal,
        dayId: day.id,
        dayName: day.name
      }))
    );
  });

  const addMealToDay = (meal, dayId) => {
    const mealToAdd = { 
      ...meal, 
      id: `${meal.id}-${Date.now()}` 
    };
    
    setWeekPlan(prev => ({
      ...prev,
      [dayId]: [...prev[dayId], mealToAdd]
    }));
  };

  const duplicateMeal = (meal) => {
    const duplicatedMeal = {
      ...meal,
      id: `${meal.id}-${Date.now()}`
    };
    setAvailableMeals(prev => [...prev, duplicatedMeal]);
  };

  const removeMealFromDay = (day, index) => {
    const newWeekPlan = { ...weekPlan };
    newWeekPlan[day].splice(index, 1);
    setWeekPlan(newWeekPlan);
  };

  const days = [
    { id: 'monday', name: 'Monday' },
    { id: 'tuesday', name: 'Tuesday' },
    { id: 'wednesday', name: 'Wednesday' },
    { id: 'thursday', name: 'Thursday' },
    { id: 'friday', name: 'Friday' },
    { id: 'saturday', name: 'Saturday' },
    { id: 'sunday', name: 'Sunday' },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Meal Planner</h2>
      <p className="mb-4 text-gray-600">
        Select meals from the available meals to plan your week. You can duplicate meals if needed.
      </p>
      
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Available Meals */}
        <div className="lg:w-1/4 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Available Meals</h3>
          <div className="min-h-[200px]">
            {availableMeals.map((meal) => (
              <div
                key={meal.id}
                className="bg-indigo-50 p-3 mb-2 rounded border border-indigo-100 group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{meal.name}</p>
                    <p className="text-xs text-gray-500">{meal.dayName}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => duplicateMeal(meal)}
                      className="text-gray-400 hover:text-indigo-600 p-1"
                      title="Duplicate meal"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {days.map(day => (
                    <button
                      key={day.id}
                      onClick={() => addMealToDay(meal, day.id)}
                      className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-2 py-1 rounded"
                    >
                      {day.name.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Week Plan */}
        <div className="lg:w-3/4 overflow-x-auto">
          <div className="flex space-x-4 min-w-max">
            {days.map(day => (
              <div key={day.id} className="w-64 flex-shrink-0">
                <h3 className="text-lg font-semibold mb-2 bg-indigo-600 text-white p-2 rounded-t-lg">
                  {day.name}
                </h3>
                <div className="bg-white p-3 rounded-b-lg shadow min-h-[400px]">
                  {weekPlan[day.id].map((meal, index) => (
                    <div
                      key={meal.id}
                      className="bg-white p-3 mb-2 rounded border border-gray-200 shadow-sm hover:shadow group"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{meal.name}</p>
                        <button
                          onClick={() => removeMealFromDay(day.id, index)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Remove meal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MealPlanner; 