import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';

function ShoppingList({ weekPlan }) {
  const [shoppingList, setShoppingList] = useState({});
  const [groupedShoppingList, setGroupedShoppingList] = useState({});
  const [pdfState, setPdfState] = useState({
    isGenerating: false,
    error: null,
    success: false
  });
  
  // Create a ref for the PDF content
  const pdfContentRef = useRef(null);

  // Add these new state variables at the top of the component
  const [showEquivalents, setShowEquivalents] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '', category: 'Verduras' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Modificar el estado de la barra lateral para que esté cerrada por defecto
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define food categories
  const categories = {
    'Verduras': ['lechuga', 'tomate', 'cebolla', 'zanahoria', 'espinaca', 'pepino', 'pimiento', 'calabacín', 'calabacita', 'brócoli', 'coliflor', 'ajo', 'champiñones', 'apio', 'berenjena', 'alcachofa', 'espárragos', 'rábano', 'col', 'acelga', 'puerro', 'calabaza', 'rúcula', 'jitomate', 'chile', 'chayote', 'nopales', 'elote', 'ejotes', 'chícharos', 'jícama'],
    
    'Alimentos de origen animal': ['pollo', 'res', 'cerdo', 'pescado', 'atún', 'salmón', 'camarones', 'huevo', 'leche', 'yogur', 'queso', 'requesón', 'jamón', 'pavo', 'salchicha', 'tocino', 'chorizo', 'sardinas', 'cabra', 'cordero', 'conejo', 'pato', 'ternera', 'bacalao', 'trucha', 'pulpo', 'calamar', 'langosta', 'cangrejo', 'mejillones'],
    
    'Frutas': ['manzana', 'plátano', 'naranja', 'uva', 'fresa', 'piña', 'mango', 'sandía', 'melón', 'pera', 'durazno', 'kiwi', 'limón', 'lima', 'mandarina', 'ciruela', 'cereza', 'arándano', 'frambuesa', 'mora', 'coco', 'papaya', 'guayaba', 'granada', 'higo', 'maracuyá', 'lichi', 'aguacate', 'toronja', 'banana', 'berries', 'guanábana'],
    
    'Aceites y grasas (sin proteína)': ['aceite de oliva', 'aceite vegetal', 'aceite de coco', 'aceite de girasol', 'aceite de canola', 'mantequilla', 'margarina', 'manteca', 'ghee', 'aceite de sésamo', 'aceite de aguacate', 'aceite de maíz', 'aceite de cacahuate', 'aceite de linaza', 'aceite de palma'],
    
    'Cereales y tubérculos': ['arroz', 'pasta', 'pan', 'avena', 'quinoa', 'maíz', 'trigo', 'cebada', 'centeno', 'amaranto', 'papa', 'camote', 'yuca', 'ñame', 'malanga', 'tapioca', 'harina', 'tortilla', 'cereal', 'galletas', 'bagel', 'muffin', 'panecillo', 'cuscús', 'bulgur', 'palomitas', 'tostada', 'granola'],
    
    'Leguminosas': ['frijol', 'lenteja', 'garbanzo', 'haba', 'soya', 'edamame', 'alubia', 'chícharo', 'cacahuate', 'judía', 'guisante', 'frijoles', 'lentejas', 'garbanzos', 'habas', 'alubias', 'guisantes'],
    
    'Aceites y grasas con proteína': ['almendra', 'nuez', 'cacahuate', 'avellana', 'pistacho', 'anacardo', 'nuez de brasil', 'nuez de macadamia', 'semilla de girasol', 'semilla de calabaza', 'semilla de chía', 'semilla de lino', 'tahini', 'mantequilla de maní', 'mantequilla de almendra', 'mantequilla de anacardo', 'crema de cacahuate']
  };
  
  // Add a catch-all category
  const otherCategoryName = 'Otros ingredientes';

  // Define similar ingredients for normalization
  const similarIngredients = {
    // Map of similar ingredients that should be grouped together
    'cebolla': ['cebolla', 'cebolla picada', 'cebolla cocida', 'cebolla morada', 'cebolla blanca'],
    'tomate': ['tomate', 'tomate picado', 'tomate cherry', 'tomate roma'],
    'jitomate': ['jitomate', 'jitomate picado', 'jitomate cocido', 'jitomate asado'],
    'ajo': ['ajo', 'ajo picado', 'ajo molido', 'diente de ajo'],
    'zanahoria': ['zanahoria', 'zanahoria rallada', 'zanahoria picada'],
    'pimiento': ['pimiento', 'pimiento rojo', 'pimiento verde', 'pimiento amarillo'],
    'chile': ['chile', 'chile serrano', 'chile jalapeño', 'chile poblano', 'chile habanero'],
    'lechuga': ['lechuga', 'lechuga romana', 'lechuga iceberg', 'lechuga orejona'],
    'papa': ['papa', 'patata', 'papa cocida', 'papa hervida'],
    'pollo': ['pollo', 'pechuga de pollo', 'muslo de pollo', 'pollo desmenuzado'],
    'res': ['res', 'carne de res', 'carne molida', 'bistec'],
    'arroz': ['arroz', 'arroz blanco', 'arroz integral'],
    'frijol': ['frijol', 'frijoles', 'frijoles negros', 'frijoles pintos'],
    'queso panela': ['queso panela', 'queso panela en cubos', 'queso panela para espolvorear', 'queso panela rebanado', 'queso panela rallado'],
    'queso': ['queso', 'queso fresco', 'queso oaxaca', 'queso manchego']
  };

  // Create a more sophisticated normalization function
  const normalizeIngredientName = (name) => {
    const lowerName = name.toLowerCase().trim();
    
    // Special case for queso panela
    if (lowerName.startsWith('queso panela')) {
      return 'queso panela';
    }
    
    // First, check for exact matches in our similar ingredients map
    for (const [mainIngredient, variations] of Object.entries(similarIngredients)) {
      if (variations.includes(lowerName)) {
        return mainIngredient;
      }
    }
    
    // Next, check if the ingredient name starts with any of our main ingredients
    // This helps with cases like "jitomate picado" -> "jitomate"
    for (const [mainIngredient, variations] of Object.entries(similarIngredients)) {
      // Check if the name starts with the main ingredient followed by a space
      if (lowerName.startsWith(mainIngredient + ' ')) {
        // Check if this is a preparation method we want to group
        const preparationMethods = ['picado', 'picada', 'cocido', 'cocida', 'rallado', 'rallada', 'molido', 'molida', 'rebanado', 'rebanada', 'en cubos', 'para espolvorear'];
        const remainingPart = lowerName.substring(mainIngredient.length).trim();
        
        if (preparationMethods.some(method => remainingPart === method || remainingPart.startsWith(method + ' '))) {
          return mainIngredient;
        }
      }
    }
    
    // If no match found, return the original name
    return lowerName;
  };

  useEffect(() => {
    generateShoppingList();
  }, [weekPlan]);

  useEffect(() => {
    // Group ingredients by category when shopping list changes
    groupIngredientsByCategory();
  }, [shoppingList]);

  const generateShoppingList = () => {
    const ingredients = {};
    
    // Iterate through all days and meals
    Object.values(weekPlan).forEach(dayMeals => {
      dayMeals.forEach(meal => {
        meal.ingredients.forEach(ingredient => {
          const originalName = ingredient.name;
          const lowerName = originalName.toLowerCase().trim();
          
          // Use our improved normalization function
          const normalizedName = normalizeIngredientName(lowerName);
          
          // Use the normalized name as the key, but keep the original name for display
          if (!ingredients[normalizedName]) {
            ingredients[normalizedName] = {
              name: originalName, // Keep the original name for display
              normalizedName: normalizedName, // Store the normalized name for grouping
              quantities: [ingredient.quantity],
              totalQuantity: parseQuantity(ingredient.quantity),
              variations: [originalName] // Track all variations of this ingredient
            };
          } else {
            ingredients[normalizedName].quantities.push(ingredient.quantity);
            
            // Add this variation if it's not already in the list
            if (!ingredients[normalizedName].variations.includes(originalName)) {
              ingredients[normalizedName].variations.push(originalName);
            }
            
            // Try to add to the total quantity if possible
            const parsedQuantity = parseQuantity(ingredient.quantity);
            if (parsedQuantity && ingredients[normalizedName].totalQuantity) {
              // Normalize units for comparison
              const normalizedCurrentUnit = normalizeUnit(ingredients[normalizedName].totalQuantity.unit);
              const normalizedNewUnit = normalizeUnit(parsedQuantity.unit);
              
              // Only add if normalized units match or both are unitless
              if (normalizedCurrentUnit === normalizedNewUnit) {
                ingredients[normalizedName].totalQuantity.value += parsedQuantity.value;
                // Keep the original unit format from the first occurrence
              } else {
                // Units don't match, can't sum
                ingredients[normalizedName].totalQuantity = null;
              }
            }
          }
        });
      });
    });
    
    setShoppingList(ingredients);
  };

  const groupIngredientsByCategory = () => {
    const grouped = {};
    
    // Initialize categories
    Object.keys(categories).forEach(category => {
      grouped[category] = [];
    });
    grouped[otherCategoryName] = [];
    
    // Categorize each ingredient
    Object.values(shoppingList).forEach(item => {
      let assigned = false;
      
      // Check each category's keywords
      for (const [category, keywords] of Object.entries(categories)) {
        // Check if the ingredient name contains any of the category keywords
        const itemNameLower = item.name.toLowerCase();
        if (keywords.some(keyword => itemNameLower.includes(keyword))) {
          grouped[category].push(item);
          assigned = true;
          break;
        }
      }
      
      // If not assigned to any category, put in "Other"
      if (!assigned) {
        grouped[otherCategoryName].push(item);
      }
    });
    
    // Sort ingredients alphabetically within each category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    // Remove empty categories
    const filteredGrouped = {};
    Object.entries(grouped).forEach(([category, items]) => {
      if (items.length > 0) {
        filteredGrouped[category] = items;
      }
    });
    
    setGroupedShoppingList(filteredGrouped);
  };

  // Helper function to normalize units for comparison
  const normalizeUnit = (unit) => {
    if (!unit) return '';
    
    const unitLower = unit.toLowerCase().trim();
    
    // Handle Spanish abbreviations and variations
    if (unitLower === 'cda' || unitLower === 'cdas' || unitLower === 'cucharada' || unitLower === 'cucharadas') {
      return 'cda';
    }
    if (unitLower === 'cdta' || unitLower === 'cdtas' || unitLower === 'cucharadita' || unitLower === 'cucharaditas') {
      return 'cdta';
    }
    if (unitLower === 'tza' || unitLower === 'tzas' || unitLower === 'taza' || unitLower === 'tazas') {
      return 'tza';
    }
    
    // Handle English units
    if (unitLower === 'tbsp' || unitLower === 'tablespoon' || unitLower === 'tablespoons') {
      return 'tbsp';
    }
    if (unitLower === 'tsp' || unitLower === 'teaspoon' || unitLower === 'teaspoons') {
      return 'tsp';
    }
    if (unitLower === 'cup' || unitLower === 'cups') {
      return 'cup';
    }
    
    // Return the original unit if no normalization is needed
    return unitLower;
  };

  // Helper function to parse quantity strings like "150g", "2 cups", "1/2 cup", "1", "1/2", "2 1/2 tzas", "1 cda", etc.
  const parseQuantity = (quantityStr) => {
    // Trim the input
    const trimmed = quantityStr.trim();
    
    // Handle simple numeric values (e.g., "1", "2")
    if (/^\d+$/.test(trimmed)) {
      return { value: parseInt(trimmed), unit: '' };
    }
    
    // Handle simple fractions without units (e.g., "1/2")
    const simpleFractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
    if (simpleFractionMatch) {
      const numerator = parseInt(simpleFractionMatch[1]);
      const denominator = parseInt(simpleFractionMatch[2]);
      
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return { value: numerator / denominator, unit: '' };
      }
    }
    
    // Handle mixed numbers with units (e.g., "2 1/2 tzas")
    const mixedNumberWithUnitMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)\s+(.+)$/);
    if (mixedNumberWithUnitMatch) {
      const whole = parseInt(mixedNumberWithUnitMatch[1]);
      const numerator = parseInt(mixedNumberWithUnitMatch[2]);
      const denominator = parseInt(mixedNumberWithUnitMatch[3]);
      const unit = mixedNumberWithUnitMatch[4];
      
      if (!isNaN(whole) && !isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return { value: whole + (numerator / denominator), unit };
      }
    }
    
    // Handle fractions with units (e.g., "1/2 cup")
    const fractionWithUnitMatch = trimmed.match(/^(\d+)\/(\d+)\s+(.+)$/);
    if (fractionWithUnitMatch) {
      const numerator = parseInt(fractionWithUnitMatch[1]);
      const denominator = parseInt(fractionWithUnitMatch[2]);
      const unit = fractionWithUnitMatch[3];
      
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return { value: numerator / denominator, unit };
      }
    }
    
    // Handle number with units (e.g., "150g", "1.5 cups", "2 tzas", "1 cda")
    const numberWithUnitMatch = trimmed.match(/^([\d.]+)\s*(.+)$/);
    if (numberWithUnitMatch) {
      const value = parseFloat(numberWithUnitMatch[1]);
      const unit = numberWithUnitMatch[2];
      
      if (!isNaN(value)) {
        return { value, unit };
      }
    }
    
    return null;
  };

  // Format the quantity for display
  const formatQuantity = (item) => {
    // If we have a valid total quantity, format it
    if (item.totalQuantity) {
      const { value, unit } = item.totalQuantity;
      
      // Format based on unit type
      if (!unit) {
        // For unitless values (e.g., "2", "1.5")
        // Handle common fractions
        const whole = Math.floor(value);
        const fraction = value - whole;
        
        if (whole === 0) {
          // Just a fraction
          if (Math.abs(fraction - 0.5) < 0.01) {
            return "1/2";
          } else if (Math.abs(fraction - 0.25) < 0.01) {
            return "1/4";
          } else if (Math.abs(fraction - 0.75) < 0.01) {
            return "3/4";
          }
        } else if (Math.abs(fraction) < 0.01) {
          // Just a whole number
          return whole.toString();
        } else {
          // Mixed number
          if (Math.abs(fraction - 0.5) < 0.01) {
            return `${whole} 1/2`;
          } else if (Math.abs(fraction - 0.25) < 0.01) {
            return `${whole} 1/4`;
          } else if (Math.abs(fraction - 0.75) < 0.01) {
            return `${whole} 3/4`;
          }
        }
        // For other values, use decimal or whole number
        return value % 1 === 0 ? Math.round(value).toString() : value.toFixed(2);
      } else {
        // For units like "tzas", "cup", etc.
        // Handle common fractions and mixed numbers
        const whole = Math.floor(value);
        const fraction = value - whole;
        
        if (whole === 0) {
          // Just a fraction
          if (Math.abs(fraction - 0.5) < 0.01) return `1/2 ${unit}`;
          if (Math.abs(fraction - 0.25) < 0.01) return `1/4 ${unit}`;
          if (Math.abs(fraction - 0.75) < 0.01) return `3/4 ${unit}`;
        } else if (Math.abs(fraction) < 0.01) {
          // Just a whole number
          return `${whole} ${unit}`;
        } else {
          // Mixed number
          if (Math.abs(fraction - 0.5) < 0.01) return `${whole} 1/2 ${unit}`;
          if (Math.abs(fraction - 0.25) < 0.01) return `${whole} 1/4 ${unit}`;
          if (Math.abs(fraction - 0.75) < 0.01) return `${whole} 3/4 ${unit}`;
        }
        
        // For other values, use decimal
        return `${value % 1 === 0 ? whole : value.toFixed(2)} ${unit}`;
      }
    }
    
    // Fall back to the original quantities if we couldn't parse and sum them
    return item.quantities.join(', ');
  };

  const exportToPDF = () => {
    // Reset states
    setPdfState({
      isGenerating: true,
      error: null,
      success: false
    });
    
    if (!pdfContentRef.current) {
      setPdfState({
        isGenerating: false,
        error: "Could not find content to export",
        success: false
      });
      return;
    }
    
    // Create a simplified HTML structure for the PDF
    const pdfContent = document.createElement('div');
    pdfContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #4F46E5; font-size: 24px; margin-bottom: 16px;">Lista de Compras</h1>
        <h2 style="font-size: 18px; margin-bottom: 12px;">Ingredientes (${Object.keys(shoppingList).length})</h2>
        
        ${Object.entries(groupedShoppingList).map(([category, items]) => `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 16px; color: #4F46E5; margin-bottom: 8px;">${category} (${items.length})</h3>
            <ul style="list-style: none; padding: 0;">
              ${items.map(item => `
                <li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                  <div style="display: flex; justify-content: space-between;">
                    <div>
                      <span style="font-weight: bold;">${item.name}</span>
                      ${item.variations && item.variations.length > 1 ? 
                        `<div style="font-size: 11px; color: #6B7280; margin-top: 4px;">
                          Incluye: ${item.variations.join(', ')}
                        </div>` : ''}
                    </div>
                    <span style="color: #6B7280;">${formatQuantity(item)}</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    `;

    const opt = {
      margin: 1,
      filename: 'lista-de-compras.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(pdfContent).save()
      .then(() => {
        setPdfState({
          isGenerating: false,
          error: null,
          success: true
        });
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setPdfState(prev => ({...prev, success: false}));
        }, 3000);
      })
      .catch(err => {
        console.error("PDF generation error:", err);
        setPdfState({
          isGenerating: false,
          error: "Failed to generate PDF. Please try again.",
          success: false
        });
      });
  };

  // Add this function to handle adding a new ingredient
  const handleAddIngredient = (e) => {
    e.preventDefault();
    
    if (!newIngredient.name.trim() || !newIngredient.quantity.trim()) {
      return;
    }
    
    // Create a new ingredient object
    const ingredient = {
      name: newIngredient.name.trim(),
      normalizedName: normalizeIngredientName(newIngredient.name.toLowerCase().trim()),
      quantities: [newIngredient.quantity.trim()],
      totalQuantity: parseQuantity(newIngredient.quantity.trim()),
      variations: [newIngredient.name.trim()]
    };
    
    // Add to shopping list
    setShoppingList(prev => ({
      ...prev,
      [ingredient.normalizedName]: ingredient
    }));
    
    // Reset form
    setNewIngredient({ name: '', quantity: '', category: newIngredient.category });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md relative">
      <h2 className="text-2xl font-bold mb-6">Lista de Compras</h2>
      
      {/* Botón flotante para abrir/cerrar la barra lateral */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 right-6 z-20 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Toggle tools sidebar"
      >
        {sidebarOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
      
      {/* Barra lateral a nivel de viewport */}
      <div 
        className={`fixed inset-y-0 right-0 z-10 w-80 max-w-full bg-white shadow-xl transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Herramientas</h3>
            <button
              onClick={() => setSidebarOpen(false)}
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
                  <div>
                    <h5 className="font-medium text-sm text-indigo-700 mb-2">Verduras</h5>
                    <ul className="text-sm space-y-1">
                      <li>1 1/2 tza de apio</li>
                      <li>1/4 tza de betabel</li>
                      <li>1 tza de brócoli</li>
                      <li>1 pza de calabacita</li>
                      <li>1/2 tza de cebolla</li>
                      <li>1/2 tza de champifión</li>
                      <li>1/2 pza de chayote</li>
                      <li>1/4 tza de chicharos</li>
                      <li>2 tzas de coliflor</li>
                      <li>2 tzas de espinacas</li>
                      <li>1/2 tza de jícama</li>
                      <li>1 pza de jitomate</li>
                      <li>2 pzas de nopal</li>
                      <li>1 tza de pepino</li>
                      <li>1 tza de pimiento</li>
                      <li>1 tza de rábano</li>
                      <li>1/2 tza de zanahoria</li>
                      <li>4 pzas de mini zanahorias</li>
                      <li>2 tzas de lechuga</li>
                      <li>3 pzas de col de bruselas</li>
                      <li>6 pzas de espárragos</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-indigo-700 mb-2">Alimentos de origen animal</h5>
                    <ul className="text-sm space-y-1">
                      <li>30 gr de carne de res</li>
                      <li>35 gr de salmón</li>
                      <li>30 gr de atún fresco</li>
                      <li>1/3 lata de atún en conserva</li>
                      <li>1/2 pza de chuleta</li>
                      <li>2 pzas de clara de huevo</li>
                      <li>75 gr de pescado fileteado</li>
                      <li>35 gr de pollo sin piel</li>
                      <li>2 reb de jamón de pavo</li>
                      <li>50 gr de queso cottage</li>
                      <li>40 gr de queso panela</li>
                      <li>1 pza de huevo entera</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-indigo-700 mb-2">Frutas</h5>
                    <ul className="text-sm space-y-1">
                      <li>1/2 tza de arándano</li>
                      <li>7 pzas de ciruela pasa</li>
                      <li>2 pzas de durazno</li>
                      <li>1 tza de fresas</li>
                      <li>3 pzas de guayaba</li>
                      <li>2 pzas de mandarina</li>
                      <li>1 pza de mango</li>
                      <li>1 pza de manzana</li>
                      <li>1/2 pza de pera</li>
                      <li>1 pza de toronja</li>
                      <li>18 pzas de uvas</li>
                      <li>1 reb de piña</li>
                      <li>1 tza de sandía</li>
                      <li>1/4 tza de blueberries</li>
                      <li>2 pzas de kiwi</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-indigo-700 mb-2">Cereales y tubérculos</h5>
                    <ul className="text-sm space-y-1">
                      <li>1/4 tza de arroz cocido</li>
                      <li>1/2 tza de avena</li>
                      <li>1/3 pza de camote</li>
                      <li>1/3 tza de pasta cocida</li>
                      <li>1 paq de galletas horneadas "Salmas"</li>
                      <li>2 1/2 tza de palomitas naturales</li>
                      <li>3 cdas de granola baja en grasa</li>
                      <li>20 gr de quinoa</li>
                      <li>1 reb de pan integral</li>
                      <li>1/2 pza de papa</li>
                      <li>2 pzas de tortilla de nopal</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-indigo-700 mb-2">Leguminosas</h5>
                    <ul className="text-sm space-y-1">
                      <li>1/2 tza de frijol cocido</li>
                      <li>1/2 tza de garbanzo cocido</li>
                      <li>1/2 tza de lenteja cocida</li>
                      <li>1/3 tza de soya cocida</li>
                      <li>5 cdas de hummus</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-indigo-700 mb-2">Leche</h5>
                    <ul className="text-sm space-y-1">
                      <li>1 tza de leche descremada</li>
                      <li>1 tza de yogurt bajo en grasa sin azúcar</li>
                      <li>1/4 tza de yogurt griego sin azúcar</li>
                      <li>1 tza de bebida de soya (leche de soya)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-indigo-700 mb-2">Aceites y grasas (sin proteína)</h5>
                    <ul className="text-sm space-y-1">
                      <li>1 cda de aceite</li>
                      <li>1 cda de aceite de oliva</li>
                      <li>1/3 pza de aguacate</li>
                      <li>3 cdas de aderezo</li>
                      <li>1 cda de crema</li>
                      <li>1 cda de mantequilla</li>
                      <li>1/4 cda de vinagreta</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-indigo-700 mb-2">Aceites y grasas (con proteína)</h5>
                    <ul className="text-sm space-y-1">
                      <li>10 pzas de almendras</li>
                      <li>14 pzas de cacahuate</li>
                      <li>18 pzas de pistache</li>
                      <li>3 pzas de nuez</li>
                      <li>8 pzas de avellana</li>
                      <li>2 cdas de mantequilla de maní</li>
                      <li>1 tza de bebida de almendra (leche de almendra)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Fondo oscuro cuando la barra lateral está abierta en móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Contenido principal de la lista de compras */}
      <div className="w-full">
        {Object.keys(shoppingList).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No hay ingredientes en tu lista de compras.</p>
            <p className="text-gray-500 text-sm">Agrega comidas a tu plan semanal para generar una lista de compras.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Total de ingredientes: <span className="font-medium">{Object.keys(shoppingList).length}</span>
              </p>
            </div>
            
            <div className="mb-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2" ref={pdfContentRef}>
              {Object.entries(groupedShoppingList).map(([category, items]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-medium text-indigo-600 mb-3 border-b pb-2">
                    {category} <span className="text-gray-500 text-sm">({items.length})</span>
                  </h3>
                  <ul className="space-y-1">
                    {items.map((item, index) => (
                      <li key={index} className="py-3">
                        <div className="flex justify-between">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.variations && item.variations.length > 1 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Incluye: {item.variations.join(', ')}
                              </div>
                            )}
                          </div>
                          <span className="text-gray-600">
                            {formatQuantity(item)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <button
                onClick={exportToPDF}
                disabled={pdfState.isGenerating}
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfState.isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando PDF...
                  </>
                ) : 'Exportar a PDF'}
              </button>
              
              {pdfState.error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm mt-3">
                  Error: {pdfState.error}
                </div>
              )}
              
              {pdfState.success && (
                <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm mt-3">
                  ¡PDF generado exitosamente!
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ShoppingList;