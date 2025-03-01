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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Lista de Compras</h2>
      
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
          
          <div className="mb-6 max-h-96 overflow-y-auto pr-2" ref={pdfContentRef}>
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
  );
}

export default ShoppingList;