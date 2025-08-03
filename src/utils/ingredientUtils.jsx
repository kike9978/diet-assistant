// Normalize ingredient names for grouping
export const normalizeIngredientName = (name) => {
    const lowerName = name.toLowerCase().trim();

    // Special cases
    if (lowerName.startsWith('queso panela')) return 'queso panela';
    if (lowerName.startsWith('queso mozzarella') || lowerName === 'mozzarella') return 'queso mozzarella';

    // Similar ingredients mapping
    const similarIngredients = {
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
        'queso': ['queso', 'queso fresco', 'queso oaxaca', 'queso manchego'],
        "nopal": ["nopal", "nopales"],
        "aceite": ["aceite", "aceite de oliva", "aceite vegetal"],
        "palomitas": ["palomitas", "palomitas de maíz"]
    };

    // Check for exact matches
    for (const [mainIngredient, variations] of Object.entries(similarIngredients)) {
        if (variations.includes(lowerName)) return mainIngredient;
    }

    // Check for partial matches
    for (const [mainIngredient, variations] of Object.entries(similarIngredients)) {
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

