import { useState } from 'react';

function DietPlanUploader({ onUpload }) {
  const [error, setError] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const plan = JSON.parse(e.target.result);
        if (validateDietPlan(plan)) {
          onUpload(plan);
          setError(null);
        } else {
          setError('Invalid diet plan format. Please check the JSON structure.');
        }
      } catch (error) {
        setError('Failed to parse JSON file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const validateDietPlan = (plan) => {
    // Check if plan has days property with 4 days
    if (!plan.days || !Array.isArray(plan.days) || plan.days.length !== 4) {
      return false;
    }

    // Check if each day has meals
    for (const day of plan.days) {
      if (!day.meals || !Array.isArray(day.meals) || day.meals.length === 0) {
        return false;
      }

      // Check if each meal has name and ingredients
      for (const meal of day.meals) {
        if (!meal.name || !meal.ingredients || !Array.isArray(meal.ingredients)) {
          return false;
        }

        // Check if each ingredient has name and quantity
        for (const ingredient of meal.ingredients) {
          if (!ingredient.name || !ingredient.quantity) {
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSampleData = () => {
    const sampleData = {
      days: [
        {
          id: "day1",
          name: "Day 1",
          meals: [
            {
              id: "meal1",
              name: "Breakfast: Oatmeal with Fruits",
              ingredients: [
                { name: "Oats", quantity: "1 cup" },
                { name: "Banana", quantity: "1" },
                { name: "Berries", quantity: "1/2 cup" },
                { name: "Honey", quantity: "1 tbsp" }
              ]
            },
            {
              id: "meal2",
              name: "Lunch: Chicken Salad",
              ingredients: [
                { name: "Chicken breast", quantity: "200g" },
                { name: "Mixed greens", quantity: "2 cups" },
                { name: "Cherry tomatoes", quantity: "1/2 cup" },
                { name: "Olive oil", quantity: "1 tbsp" }
              ]
            },
            {
              id: "meal3",
              name: "Dinner: Salmon with Vegetables",
              ingredients: [
                { name: "Salmon fillet", quantity: "150g" },
                { name: "Broccoli", quantity: "1 cup" },
                { name: "Carrots", quantity: "1/2 cup" },
                { name: "Lemon", quantity: "1/2" }
              ]
            }
          ]
        },
        {
          id: "day2",
          name: "Day 2",
          meals: [
            {
              id: "meal4",
              name: "Breakfast: Smoothie Bowl",
              ingredients: [
                { name: "Frozen banana", quantity: "1" },
                { name: "Spinach", quantity: "1 cup" },
                { name: "Almond milk", quantity: "1 cup" },
                { name: "Chia seeds", quantity: "1 tbsp" }
              ]
            },
            {
              id: "meal5",
              name: "Lunch: Quinoa Bowl",
              ingredients: [
                { name: "Quinoa", quantity: "1 cup" },
                { name: "Black beans", quantity: "1/2 cup" },
                { name: "Avocado", quantity: "1/2" },
                { name: "Lime", quantity: "1" }
              ]
            },
            {
              id: "meal6",
              name: "Dinner: Turkey Meatballs",
              ingredients: [
                { name: "Ground turkey", quantity: "200g" },
                { name: "Zucchini noodles", quantity: "2 cups" },
                { name: "Tomato sauce", quantity: "1/2 cup" },
                { name: "Parmesan cheese", quantity: "2 tbsp" }
              ]
            }
          ]
        },
        {
          id: "day3",
          name: "Day 3",
          meals: [
            {
              id: "meal7",
              name: "Breakfast: Veggie Omelette",
              ingredients: [
                { name: "Eggs", quantity: "3" },
                { name: "Bell pepper", quantity: "1/2" },
                { name: "Spinach", quantity: "1 cup" },
                { name: "Feta cheese", quantity: "2 tbsp" }
              ]
            },
            {
              id: "meal8",
              name: "Lunch: Lentil Soup",
              ingredients: [
                { name: "Lentils", quantity: "1 cup" },
                { name: "Carrots", quantity: "1" },
                { name: "Celery", quantity: "2 stalks" },
                { name: "Vegetable broth", quantity: "4 cups" }
              ]
            },
            {
              id: "meal9",
              name: "Dinner: Baked Cod",
              ingredients: [
                { name: "Cod fillet", quantity: "150g" },
                { name: "Sweet potato", quantity: "1" },
                { name: "Asparagus", quantity: "1 cup" },
                { name: "Olive oil", quantity: "1 tbsp" }
              ]
            }
          ]
        },
        {
          id: "day4",
          name: "Day 4",
          meals: [
            {
              id: "meal10",
              name: "Breakfast: Greek Yogurt Parfait",
              ingredients: [
                { name: "Greek yogurt", quantity: "1 cup" },
                { name: "Granola", quantity: "1/4 cup" },
                { name: "Honey", quantity: "1 tbsp" },
                { name: "Mixed berries", quantity: "1/2 cup" }
              ]
            },
            {
              id: "meal11",
              name: "Lunch: Mediterranean Wrap",
              ingredients: [
                { name: "Whole wheat wrap", quantity: "1" },
                { name: "Hummus", quantity: "2 tbsp" },
                { name: "Cucumber", quantity: "1/2" },
                { name: "Tomato", quantity: "1" },
                { name: "Feta cheese", quantity: "2 tbsp" }
              ]
            },
            {
              id: "meal12",
              name: "Dinner: Stir-Fry Tofu",
              ingredients: [
                { name: "Tofu", quantity: "200g" },
                { name: "Brown rice", quantity: "1 cup" },
                { name: "Mixed vegetables", quantity: "2 cups" },
                { name: "Soy sauce", quantity: "2 tbsp" }
              ]
            }
          ]
        }
      ]
    };
    onUpload(sampleData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Upload Your Diet Plan</h2>
      <p className="text-gray-600 mb-4">
        Please upload a JSON file containing your diet plan. The plan should include meals for 4 days.
      </p>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Diet Plan JSON File
        </label>
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex justify-between">
        <button
          onClick={handleSampleData}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Use Sample Data
        </button>
      </div>
    </div>
  );
}

export default DietPlanUploader; 