// ===============================
// SHARED CONSTANTS
// ===============================

// Week days constants
export const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const WEEK_DAYS_SPANISH = [
  { id: 'sunday', name: 'Domingo' },
  { id: 'monday', name: 'Lunes' },
  { id: 'tuesday', name: 'Martes' },
  { id: 'wednesday', name: 'Miércoles' },
  { id: 'thursday', name: 'Jueves' },
  { id: 'friday', name: 'Viernes' },
  { id: 'saturday', name: 'Sábado' },
];

// Comprehensive ingredient categories (merged from all files)
export const INGREDIENT_CATEGORIES = {
  'Verduras': [
    'lechuga', 'tomate', 'cebolla', 'zanahoria', 'espinaca', 'pepino', 'pimiento', 
    'calabacín', 'calabacita', 'brócoli', 'coliflor', 'ajo', 'champiñones', 'apio', 
    'berenjena', 'alcachofa', 'espárragos', 'rábano', 'col', 'acelga', 'puerro', 
    'calabaza', 'rúcula', 'jitomate', 'chile', 'chayote', 'nopales', 'elote', 
    'ejotes', 'chícharos', 'jícama', 'betabel', 'champifión'
  ],
  'Alimentos de origen animal': [
    'pollo', 'res', 'cerdo', 'pescado', 'atún', 'salmón', 'huevo', 'camarones', 
    'leche', 'yogur', 'queso', 'requesón', 'jamón', 'pavo', 'salchicha', 'tocino', 
    'chorizo', 'sardinas', 'cabra', 'cordero', 'conejo', 'pato', 'ternera', 
    'bacalao', 'trucha', 'pulpo', 'calamar', 'langosta', 'cangrejo', 'mejillones'
  ],
  'Frutas': [
    'manzana', 'plátano', 'naranja', 'uva', 'fresa', 'fresas', 'piña', 'mango', 
    'sandía', 'melón', 'pera', 'durazno', 'kiwi', 'limón', 'lima', 'mandarina', 
    'ciruela', 'cereza', 'arándano', 'frambuesa', 'mora', 'coco', 'papaya', 
    'guayaba', 'granada', 'higo', 'maracuyá', 'lichi', 'aguacate', 'toronja', 
    'banana', 'berries', 'guanábana', 'blueberries'
  ],
  'Cereales y tubérculos': [
    'arroz', 'pasta', 'pan', 'avena', 'quinoa', 'maíz', 'trigo', 'cebada', 
    'centeno', 'amaranto', 'papa', 'camote', 'yuca', 'ñame', 'malanga', 
    'tapioca', 'harina', 'tortilla', 'cereal', 'galletas', 'bagel', 'muffin', 
    'panecillo', 'cuscús', 'bulgur', 'palomitas', 'tostada', 'granola'
  ],
  'Leguminosas': [
    'frijol', 'lenteja', 'garbanzo', 'haba', 'soya', 'edamame', 'alubia', 
    'chícharo', 'cacahuate', 'judía', 'guisante', 'frijoles', 'lentejas', 
    'garbanzos', 'habas', 'alubias', 'guisantes'
  ],
  'Aceites y grasas (sin proteína)': [
    'aceite de oliva', 'aceite vegetal', 'aceite de coco', 'aceite de girasol', 
    'aceite de canola', 'mantequilla', 'margarina', 'manteca', 'ghee', 
    'aceite de sésamo', 'aceite de aguacate', 'aceite de maíz', 'aceite de cacahuate', 
    'aceite de linaza', 'aceite de palma', 'aceite'
  ],
  'Aceites y grasas (con proteína)': [
    'almendra', 'nuez', 'cacahuate', 'avellana', 'pistacho', 'anacardo', 
    'nuez de brasil', 'nuez de macadamia', 'semilla de girasol', 'semilla de calabaza', 
    'semilla de chía', 'semilla de lino', 'tahini', 'mantequilla de maní', 
    'mantequilla de almendra', 'mantequilla de anacardo', 'crema de cacahuate'
  ],
  'Leche': [
    'leche descremada', 'yogurt bajo en grasa', 'yogurt griego', 'bebida de soya', 
    'leche de soya', 'bebida de almendra', 'leche de almendra'
  ]
};

export const OTHER_CATEGORY_NAME = 'Otros ingredientes';

// Similar ingredients mapping for normalization
export const SIMILAR_INGREDIENTS = {
  'cebolla': ['cebolla', 'cebolla picada', 'cebolla cocida', 'cebolla morada', 'cebolla blanca'],
  'tomate': ['tomate', 'tomate picado', 'tomate cherry', 'tomate roma'],
  'jitomate': ['jitomate', 'jitomate picado', 'jitomate cocido', 'jitomate asado'],
  'ajo': ['ajo', 'ajo picado', 'ajo molido', 'diente de ajo'],
  'zanahoria': ['zanahoria', 'zanahoria rallada', 'zanahoria picada'],
  'pimiento': ['pimiento', 'pimiento rojo', 'pimiento verde', 'pimiento amarillo'],
  'chile': ['chile', 'chile serrano', 'chile jalapeño', 'chile habanero'],
  'lechuga': ['lechuga', 'lechuga romana', 'lechuga iceberg', 'lechuga orejona'],
  'papa': ['papa', 'patata', 'papa cocida', 'papa hervida'],
  'pollo': ['pollo', 'pechuga de pollo', 'muslo de pollo', 'pollo desmenuzado'],
  'res': ['res', 'carne de res', 'carne molida', 'bistec'],
  'arroz': ['arroz', 'arroz blanco', 'arroz integral'],
  'frijol': ['frijol', 'frijoles', 'frijoles negros', 'frijoles pintos'],
  'queso panela': ['queso panela', 'queso panela en cubos', 'queso panela para espolvorear', 'queso panela rebanado', 'queso panela rallado'],
  'queso mozzarella': ['queso mozzarella', 'queso mozzarella rallado', 'queso mozzarella fresco', 'mozzarella'],
  'queso': ['queso', 'queso fresco', 'queso oaxaca', 'queso manchego'],
  'nopal': ['nopal', 'nopales'],
  'aceite': ['aceite', 'aceite de oliva', 'aceite vegetal'],
  'palomitas': ['palomitas', 'palomitas de maíz']
};

// Ingredient equivalents for substitution
export const INGREDIENT_EQUIVALENTS = {
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

// ===============================
// UTILITY FUNCTIONS
// ===============================

// Get ingredient category
export const getIngredientCategory = (ingredientName) => {
  const lowerName = ingredientName.toLowerCase();

  for (const [category, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (keywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return OTHER_CATEGORY_NAME;
};

// Normalize ingredient names for grouping
export const normalizeIngredientName = (name) => {
    const lowerName = name.toLowerCase().trim();

    // Special cases
    if (lowerName.startsWith('queso panela')) return 'queso panela';
    if (lowerName.startsWith('queso mozzarella') || lowerName === 'mozzarella') return 'queso mozzarella';

    // Check for exact matches
    for (const [mainIngredient, variations] of Object.entries(SIMILAR_INGREDIENTS)) {
        if (variations.includes(lowerName)) return mainIngredient;
    }

    // Check for partial matches
    for (const [mainIngredient, variations] of Object.entries(SIMILAR_INGREDIENTS)) {
        if (lowerName.startsWith(mainIngredient + ' ')) {
            const prepMethods = ['picado', 'cocido', 'rallado', 'molido'];
            const remaining = lowerName.substring(mainIngredient.length).trim();

            if (prepMethods.some(method => remaining === method)) {
                return mainIngredient;
            }
        }
    }

    return lowerName;
};

// Parse quantity strings into numeric values
export const parseQuantity = (quantityStr) => {
    if (!quantityStr) return null;

    const quantity = quantityStr.toLowerCase().trim();
    const fractionMatch = quantity.match(/^(\d+)\/(\d+)\s*(.*?)$/);
    const mixedMatch = quantity.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*?)$/);
    const simpleMatch = quantity.match(/^(\d+(?:\.\d+)?)\s*(.*?)$/);
    const specialCases = {
        'c.s.': 'al gusto',
        'c.s': 'al gusto',
        'al gusto': 'al gusto',
        'c.c.': 'cucharadita',
        'c.c': 'cucharadita'
    };

    // Handle special cases
    if (specialCases[quantity]) {
        return {
            value: 0,
            unit: specialCases[quantity],
            original: quantity
        };
    }

    if (fractionMatch) {
        return {
            value: parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]),
            unit: fractionMatch[3] || '',
            original: quantity
        };
    }

    if (mixedMatch) {
        return {
            value: parseInt(mixedMatch[1]) + (parseInt(mixedMatch[2]) / parseInt(mixedMatch[3])),
            unit: mixedMatch[4] || '',
            original: quantity
        };
    }

    if (simpleMatch) {
        return {
            value: parseFloat(simpleMatch[1]),
            unit: simpleMatch[2] || '',
            original: quantity
        };
    }

    return {
        value: 0,
        unit: quantity,
        original: quantity
    };
};

// Sum quantities for the same ingredient
export const sumIngredients = (ingredients) => {
    const summed = {};

    ingredients.forEach(ingredient => {
        const normalizedName = normalizeIngredientName(ingredient.name);
        const parsed = parseQuantity(ingredient.quantity);

        if (!summed[normalizedName]) {
            summed[normalizedName] = {
                name: ingredient.name,
                normalizedName,
                quantities: [parsed],
                variations: [ingredient.name],
                sources: [{
                    meal: ingredient.mealName,
                    day: ingredient.day,
                    quantity: ingredient.quantity
                }]
            };
        } else {
            summed[normalizedName].quantities.push(parsed);
            if (!summed[normalizedName].variations.includes(ingredient.name)) {
                summed[normalizedName].variations.push(ingredient.name);
            }

            // Add source if it's unique
            const isNewSource = !summed[normalizedName].sources.some(s =>
                s.meal === ingredient.mealName &&
                s.day === ingredient.day
            );

            if (isNewSource) {
                summed[normalizedName].sources.push({
                    meal: ingredient.mealName,
                    day: ingredient.day,
                    quantity: ingredient.quantity
                });
            }
        }
    });

    return Object.values(summed);
};

// Format quantities for display
export const formatQuantities = (quantities) => {
    const grouped = {};

    quantities.forEach(q => {
        const unit = q.unit || 'unidad';
        if (!grouped[unit]) {
            grouped[unit] = q.value;
        } else {
            grouped[unit] += q.value;
        }
    });

    return Object.entries(grouped)
        .filter(([unit, value]) => value > 0)
        .map(([unit, value]) => {
            if (unit === 'al gusto') return 'al gusto';

            // Format fractions
            if (value % 1 !== 0) {
                const whole = Math.floor(value);
                const fraction = value - whole;
                let fractionStr = '';

                if (fraction === 0.25) fractionStr = '1/4';
                else if (fraction === 0.5) fractionStr = '1/2';
                else if (fraction === 0.75) fractionStr = '3/4';
                else if (fraction === 0.33) fractionStr = '1/3';
                else if (fraction === 0.67) fractionStr = '2/3';

                if (fractionStr) {
                    return whole > 0 ? `${whole} ${fractionStr} ${unit}` : `${fractionStr} ${unit}`;
                }
            }

            return `${value} ${unit}`;
        })
        .join(', ');
};

