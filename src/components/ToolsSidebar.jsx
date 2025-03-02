import { useState, useEffect } from 'react';

function ToolsSidebar({ isOpen, onClose, onAddIngredient, onSubstituteIngredient, categories, otherCategoryName, weekPlan }) {
  const [showEquivalents, setShowEquivalents] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSubstituteForm, setShowSubstituteForm] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '', category: 'Verduras' });
  const [substitution, setSubstitution] = useState({
    day: 'monday',
    mealIndex: 0,
    ingredientIndex: 0,
    replacement: ''
  });
  const [selectedIngredientCategory, setSelectedIngredientCategory] = useState('');

  // Mapa de equivalencias por categoría
  const equivalentsByCategory = {
    "Verduras": [
      "1 1/2 tza de apio", "1/4 tza de betabel", "1 tza de brócoli", "1 pza de calabacita",
      "1/2 tza de cebolla", "1/2 tza de champifión", "1/2 pza de chayote", "1/4 tza de chicharos",
      "2 tzas de coliflor", "2 tzas de espinacas", "1/2 tza de jícama", "1 pza de jitomate",
      "2 pzas de nopal", "1 tza de pepino", "1 tza de pimiento", "1 tza de rábano",
      "1/2 tza de zanahoria", "4 pzas de mini zanahorias", "2 tzas de lechuga",
      "3 pzas de col de bruselas", "6 pzas de espárragos"
    ],
    "Alimentos de origen animal": [
      "30 gr de carne de res", "35 gr de salmón", "30 gr de atún fresco", "1/3 lata de atún en conserva",
      "1/2 pza de chuleta", "2 pzas de clara de huevo", "75 gr de pescado fileteado", "35 gr de pollo sin piel",
      "2 reb de jamón de pavo", "50 gr de queso cottage", "40 gr de queso panela", "1 pza de huevo entera"
    ],
    "Frutas": [
      "1/2 tza de arándano", "7 pzas de ciruela pasa", "2 pzas de durazno", "1 tza de fresas",
      "3 pzas de guayaba", "2 pzas de mandarina", "1 pza de mango", "1 pza de manzana",
      "1/2 pza de pera", "1 pza de toronja", "18 pzas de uvas", "1 reb de piña",
      "1 tza de sandía", "1/4 tza de blueberries", "2 pzas de kiwi"
    ],
    "Cereales y tubérculos": [
      "1/4 tza de arroz cocido", "1/2 tza de avena", "1/3 pza de camote", "1/3 tza de pasta cocida",
      "1 paq de galletas horneadas \"Salmas\"", "2 1/2 tza de palomitas naturales", "3 cdas de granola baja en grasa",
      "20 gr de quinoa", "1 reb de pan integral", "1/2 pza de papa", "2 pzas de tortilla de nopal"
    ],
    "Leguminosas": [
      "1/2 tza de frijol cocido", "1/2 tza de garbanzo cocido", "1/2 tza de lenteja cocida",
      "1/3 tza de soya cocida", "5 cdas de hummus"
    ],
    "Leche": [
      "1 tza de leche descremada", "1 tza de yogurt bajo en grasa sin azúcar",
      "1/4 tza de yogurt griego sin azúcar", "1 tza de bebida de soya (leche de soya)"
    ],
    "Aceites y grasas (sin proteína)": [
      "1 cda de aceite", "1 cda de aceite de oliva", "1/3 pza de aguacate", "3 cdas de aderezo",
      "1 cda de crema", "1 cda de mantequilla", "1/4 cda de vinagreta"
    ],
    "Aceites y grasas (con proteína)": [
      "10 pzas de almendras", "14 pzas de cacahuate", "18 pzas de pistache", "3 pzas de nuez",
      "8 pzas de avellana", "2 cdas de mantequilla de maní", "1 tza de bebida de almendra (leche de almendra)"
    ]
  };

  // Función para determinar la categoría de un ingrediente
  const getIngredientCategory = (ingredientName) => {
    const lowerName = ingredientName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
        return category;
      }
    }
    
    return otherCategoryName;
  };

  // Obtener todos los ingredientes del plan semanal agrupados por categoría
  const getGroupedIngredients = () => {
    const grouped = {};
    
    // Inicializar categorías
    Object.keys(equivalentsByCategory).forEach(category => {
      grouped[category] = [];
    });
    grouped[otherCategoryName] = [];
    
    if (!weekPlan) return grouped;
    
    Object.entries(weekPlan).forEach(([day, meals]) => {
      meals.forEach((meal, mealIndex) => {
        meal.ingredients.forEach((ingredient, ingredientIndex) => {
          const category = getIngredientCategory(ingredient.name);
          
          grouped[category].push({
            day,
            mealIndex,
            ingredientIndex,
            name: ingredient.name,
            quantity: ingredient.quantity,
            mealName: meal.name,
            dayName: day === 'monday' ? 'Lunes' : 
                     day === 'tuesday' ? 'Martes' : 
                     day === 'wednesday' ? 'Miércoles' : 
                     day === 'thursday' ? 'Jueves' : 
                     day === 'friday' ? 'Viernes' : 
                     day === 'saturday' ? 'Sábado' : 'Domingo'
          });
        });
      });
    });
    
    // Eliminar categorías vacías
    Object.keys(grouped).forEach(category => {
      if (grouped[category].length === 0) {
        delete grouped[category];
      }
    });
    
    return grouped;
  };

  const handleAddIngredient = (e) => {
    e.preventDefault();
    
    if (!newIngredient.name.trim() || !newIngredient.quantity.trim()) {
      return;
    }
    
    onAddIngredient(newIngredient);
    
    // Reset form
    setNewIngredient({ name: '', quantity: '', category: newIngredient.category });
  };

  const handleSubstituteIngredient = (e) => {
    e.preventDefault();
    
    if (!substitution.replacement.trim()) {
      return;
    }
    
    onSubstituteIngredient(substitution);
    
    // Reset form
    setSubstitution({
      ...substitution,
      replacement: ''
    });
  };

  // Manejar cambio de ingrediente seleccionado
  const handleIngredientSelection = (value) => {
    const [day, mealIndex, ingredientIndex] = value.split('|').map((v, i) => i === 0 ? v : parseInt(v));
    
    // Buscar el ingrediente seleccionado
    let selectedIngredient = null;
    const groupedIngredients = getGroupedIngredients();
    
    for (const category of Object.keys(groupedIngredients)) {
      const found = groupedIngredients[category].find(
        ing => ing.day === day && ing.mealIndex === mealIndex && ing.ingredientIndex === ingredientIndex
      );
      
      if (found) {
        selectedIngredient = found;
        setSelectedIngredientCategory(category);
        break;
      }
    }
    
    if (selectedIngredient) {
      setSubstitution({
        day,
        mealIndex,
        ingredientIndex,
        replacement: ''
      });
    }
  };

  return (
    <>
      {/* Barra lateral a nivel de viewport */}
      <div 
        className={`fixed inset-y-0 right-0 z-10 w-80 max-w-full bg-white shadow-xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Herramientas</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Add ingredient form */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Agregar ingrediente</h4>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
              >
                {showAddForm ? 'Ocultar' : 'Mostrar'}
                <svg 
                  className={`ml-1 w-4 h-4 transition-transform ${showAddForm ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {showAddForm && (
              <form onSubmit={handleAddIngredient} className="bg-gray-50 p-3 rounded-md">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="ingredient-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Ingrediente
                    </label>
                    <input
                      type="text"
                      id="ingredient-name"
                      value={newIngredient.name}
                      onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ej: Manzana"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="ingredient-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="text"
                      id="ingredient-quantity"
                      value={newIngredient.quantity}
                      onChange={(e) => setNewIngredient({...newIngredient, quantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ej: 2 pzas, 1/2 tza, 250 g"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="ingredient-category" className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      id="ingredient-category"
                      value={newIngredient.category}
                      onChange={(e) => setNewIngredient({...newIngredient, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {Object.keys(categories).map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value={otherCategoryName}>{otherCategoryName}</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Agregar ingrediente
                  </button>
                </div>
              </form>
            )}
          </div>
          
          {/* Substitute ingredient form */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Sustituir ingrediente</h4>
              <button
                onClick={() => setShowSubstituteForm(!showSubstituteForm)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
              >
                {showSubstituteForm ? 'Ocultar' : 'Mostrar'}
                <svg 
                  className={`ml-1 w-4 h-4 transition-transform ${showSubstituteForm ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {showSubstituteForm && weekPlan && Object.keys(weekPlan).length > 0 ? (
              <form onSubmit={handleSubstituteIngredient} className="bg-gray-50 p-3 rounded-md">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="substitute-ingredient" className="block text-sm font-medium text-gray-700 mb-1">
                      Ingrediente a sustituir
                    </label>
                    <select
                      id="substitute-ingredient"
                      onChange={(e) => handleIngredientSelection(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Selecciona un ingrediente</option>
                      {Object.entries(getGroupedIngredients()).map(([category, ingredients]) => (
                        <optgroup key={category} label={category}>
                          {ingredients.map((ingredient, idx) => (
                            <option 
                              key={`${ingredient.day}-${ingredient.mealIndex}-${ingredient.ingredientIndex}`} 
                              value={`${ingredient.day}|${ingredient.mealIndex}|${ingredient.ingredientIndex}`}
                            >
                              {ingredient.name} ({ingredient.quantity}) - {ingredient.dayName}, {ingredient.mealName}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  
                  {substitution.day && (
                    <div>
                      <label htmlFor="substitute-replacement" className="block text-sm font-medium text-gray-700 mb-1">
                        Reemplazar con
                      </label>
                      <select
                        id="substitute-replacement"
                        value={substitution.replacement}
                        onChange={(e) => setSubstitution({...substitution, replacement: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Selecciona un equivalente</option>
                        {selectedIngredientCategory && equivalentsByCategory[selectedIngredientCategory] ? (
                          equivalentsByCategory[selectedIngredientCategory].map((equivalent, index) => (
                            <option key={index} value={equivalent}>
                              {equivalent}
                            </option>
                          ))
                        ) : (
                          // Si no se puede determinar la categoría, mostrar todas las opciones
                          Object.entries(equivalentsByCategory).map(([category, equivalents]) => (
                            <optgroup key={category} label={category}>
                              {equivalents.map((equivalent, index) => (
                                <option key={`${category}-${index}`} value={equivalent}>
                                  {equivalent}
                                </option>
                              ))}
                            </optgroup>
                          ))
                        )}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={!substitution.day || !substitution.replacement}
                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sustituir ingrediente
                  </button>
                </div>
              </form>
            ) : showSubstituteForm && (!weekPlan || Object.keys(weekPlan).length === 0) ? (
              <div className="bg-gray-50 p-3 rounded-md text-center text-gray-500">
                No hay plan de comidas disponible para realizar sustituciones.
              </div>
            ) : null}
          </div>
          
          {/* Equivalents section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Equivalencias comunes</h4>
              <button
                onClick={() => setShowEquivalents(!showEquivalents)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
              >
                {showEquivalents ? 'Ocultar' : 'Mostrar'}
                <svg 
                  className={`ml-1 w-4 h-4 transition-transform ${showEquivalents ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {showEquivalents && (
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="space-y-4">
                  {Object.entries(equivalentsByCategory).map(([category, items]) => (
                    <div key={category}>
                      <h5 className="font-medium text-sm text-indigo-700 mb-2">{category}</h5>
                      <ul className="text-sm space-y-1">
                        {items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Fondo oscuro cuando la barra lateral está abierta */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-30 z-0"
          onClick={onClose}
        ></div>
      )}
    </>
  );
}

export default ToolsSidebar; 