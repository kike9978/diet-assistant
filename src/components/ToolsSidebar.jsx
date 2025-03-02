import { useState } from 'react';

function ToolsSidebar({ isOpen, onClose, onAddIngredient, categories, otherCategoryName }) {
  const [showEquivalents, setShowEquivalents] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '', category: 'Verduras' });

  const handleAddIngredient = (e) => {
    e.preventDefault();
    
    if (!newIngredient.name.trim() || !newIngredient.quantity.trim()) {
      return;
    }
    
    onAddIngredient(newIngredient);
    
    // Reset form
    setNewIngredient({ name: '', quantity: '', category: newIngredient.category });
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
      
      {/* Fondo oscuro cuando la barra lateral está abierta */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={onClose}
        ></div>
      )}
    </>
  );
}

export default ToolsSidebar; 