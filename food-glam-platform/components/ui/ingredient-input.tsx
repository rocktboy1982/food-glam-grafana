'use client'

import { useRef, useState, useCallback } from 'react'

/* ── Static ingredient dictionary ───────────────────────────────────────── */
export const INGREDIENT_LIST: string[] = [
  // Flours & grains
  'all-purpose flour', 'bread flour', 'cake flour', 'whole wheat flour', 'rye flour',
  'spelt flour', 'almond flour', 'chickpea flour', 'rice flour', 'cornmeal', 'polenta',
  'semolina', 'oat flour', 'coconut flour', 'tapioca flour', 'arrowroot powder',
  // Rice & grains
  'white rice', 'brown rice', 'basmati rice', 'jasmine rice', 'arborio rice',
  'sushi rice', 'wild rice', 'black rice', 'quinoa', 'couscous', 'bulgur wheat',
  'farro', 'barley', 'millet', 'buckwheat', 'rolled oats', 'steel-cut oats',
  // Pasta & noodles
  'spaghetti', 'penne', 'rigatoni', 'fettuccine', 'tagliatelle', 'linguine',
  'lasagna sheets', 'orzo', 'farfalle', 'conchiglie', 'gnocchi', 'udon noodles',
  'soba noodles', 'rice noodles', 'glass noodles', 'egg noodles', 'ramen noodles',
  // Bread & dough
  'sourdough bread', 'white bread', 'baguette', 'pita bread', 'naan', 'tortillas',
  'breadcrumbs', 'panko breadcrumbs', 'brioche', 'croissant', 'ciabatta',
  // Proteins — meat
  'chicken breast', 'chicken thighs', 'chicken drumsticks', 'whole chicken',
  'ground chicken', 'beef steak', 'ground beef', 'beef short ribs', 'beef brisket',
  'beef chuck', 'beef tenderloin', 'veal chops', 'veal cutlets', 'lamb chops',
  'lamb shoulder', 'leg of lamb', 'ground lamb', 'pork belly', 'pork tenderloin',
  'pork chops', 'pork shoulder', 'ground pork', 'baby back ribs', 'spare ribs',
  'duck breast', 'duck legs', 'whole duck', 'turkey breast', 'turkey mince',
  'venison steak', 'rabbit legs', 'quail', 'goat meat', 'bison burger patties',
  // Proteins — seafood
  'salmon fillet', 'salmon steak', 'smoked salmon', 'cod fillet', 'sea bass',
  'sea bream', 'halibut', 'tuna steak', 'canned tuna', 'mackerel', 'sardines',
  'anchovies', 'trout', 'tilapia', 'snapper', 'mahi-mahi', 'swordfish',
  'shrimp', 'prawns', 'tiger prawns', 'scallops', 'clams', 'mussels', 'oysters',
  'squid', 'octopus', 'crab meat', 'lobster tail', 'langoustine',
  // Proteins — plant
  'firm tofu', 'silken tofu', 'smoked tofu', 'tempeh', 'seitan', 'edamame',
  'lentils', 'red lentils', 'green lentils', 'black lentils', 'chickpeas',
  'canned chickpeas', 'black beans', 'kidney beans', 'cannellini beans',
  'borlotti beans', 'pinto beans', 'navy beans', 'butter beans', 'split peas',
  'mung beans', 'adzuki beans',
  // Eggs & dairy
  'eggs', 'egg yolks', 'egg whites', 'whole milk', 'semi-skimmed milk',
  'skim milk', 'buttermilk', 'heavy cream', 'double cream', 'whipping cream',
  'sour cream', 'crème fraîche', 'yogurt', 'Greek yogurt', 'plain yogurt',
  'butter', 'unsalted butter', 'clarified butter', 'ghee', 'cream cheese',
  'ricotta', 'mascarpone', 'cottage cheese', 'mozzarella', 'fresh mozzarella',
  'burrata', 'cheddar', 'gruyère', 'parmesan', 'pecorino', 'gorgonzola',
  'brie', 'camembert', 'feta', 'halloumi', 'manchego', 'goat cheese',
  'blue cheese', 'provolone', 'fontina', 'emmental',
  // Vegetables
  'onion', 'red onion', 'spring onions', 'shallots', 'leek', 'garlic',
  'garlic cloves', 'ginger', 'fresh ginger', 'carrot', 'celery', 'potato',
  'sweet potato', 'yam', 'parsnip', 'turnip', 'beetroot', 'radish',
  'daikon', 'fennel', 'celeriac', 'Jerusalem artichoke', 'artichoke hearts',
  'broccoli', 'cauliflower', 'cabbage', 'red cabbage', 'savoy cabbage',
  'Brussels sprouts', 'kale', 'cavolo nero', 'spinach', 'baby spinach',
  'Swiss chard', 'bok choy', 'pak choi', 'napa cabbage', 'lettuce',
  'romaine lettuce', 'iceberg lettuce', 'arugula', 'rocket', 'watercress',
  'endive', 'radicchio', 'pea shoots', 'microgreens', 'asparagus',
  'green beans', 'snap peas', 'snow peas', 'peas', 'frozen peas',
  'broad beans', 'corn', 'corn on the cob', 'baby corn', 'zucchini',
  'courgette', 'yellow squash', 'butternut squash', 'acorn squash',
  'pumpkin', 'eggplant', 'aubergine', 'bell pepper', 'red pepper',
  'yellow pepper', 'green pepper', 'chili pepper', 'jalapeño', 'serrano',
  'habanero', 'bird\'s eye chili', 'poblano', 'chipotle', 'tomato',
  'cherry tomatoes', 'plum tomatoes', 'sun-dried tomatoes', 'canned tomatoes',
  'tomato paste', 'tomato purée', 'tomato sauce', 'mushrooms', 'cremini mushrooms',
  'shiitake mushrooms', 'portobello mushrooms', 'oyster mushrooms',
  'king oyster mushrooms', 'porcini mushrooms', 'chanterelles',
  'truffle', 'cucumber', 'avocado', 'olives', 'black olives', 'green olives',
  'capers', 'water chestnuts', 'bamboo shoots', 'lotus root',
  // Herbs (fresh)
  'fresh parsley', 'flat-leaf parsley', 'fresh basil', 'fresh thyme',
  'fresh rosemary', 'fresh sage', 'fresh oregano', 'fresh mint', 'fresh dill',
  'fresh cilantro', 'fresh coriander', 'fresh tarragon', 'fresh chervil',
  'fresh chives', 'bay leaves', 'lemongrass', 'kaffir lime leaves',
  'curry leaves',
  // Spices & dried herbs
  'salt', 'sea salt', 'kosher salt', 'black pepper', 'white pepper',
  'red pepper flakes', 'cayenne pepper', 'paprika', 'smoked paprika',
  'cumin', 'ground cumin', 'cumin seeds', 'coriander', 'ground coriander',
  'coriander seeds', 'turmeric', 'ground turmeric', 'cinnamon',
  'ground cinnamon', 'cinnamon sticks', 'cardamom', 'ground cardamom',
  'cardamom pods', 'cloves', 'whole cloves', 'nutmeg', 'ground nutmeg',
  'allspice', 'star anise', 'fennel seeds', 'caraway seeds', 'mustard seeds',
  'fenugreek seeds', 'nigella seeds', 'sesame seeds', 'poppy seeds',
  'saffron', 'dried thyme', 'dried rosemary', 'dried oregano', 'dried basil',
  'dried mint', 'dried dill', 'dried chili flakes', 'chili powder',
  'garam masala', 'curry powder', 'ras el hanout', 'za\'atar', 'sumac',
  'harissa', 'five-spice powder', 'Chinese five spice', 'baharat',
  'berbere', 'dukkah',
  // Oils & fats
  'olive oil', 'extra virgin olive oil', 'vegetable oil', 'sunflower oil',
  'canola oil', 'coconut oil', 'sesame oil', 'toasted sesame oil',
  'avocado oil', 'peanut oil', 'walnut oil', 'truffle oil', 'chili oil',
  'lard', 'duck fat', 'beef tallow',
  // Vinegars & acids
  'white wine vinegar', 'red wine vinegar', 'apple cider vinegar',
  'balsamic vinegar', 'rice vinegar', 'sherry vinegar', 'champagne vinegar',
  'lemon juice', 'lime juice', 'orange juice', 'lemon zest', 'lime zest',
  'orange zest',
  // Sauces & condiments
  'soy sauce', 'tamari', 'coconut aminos', 'fish sauce', 'oyster sauce',
  'hoisin sauce', 'teriyaki sauce', 'worcestershire sauce', 'hot sauce',
  'sriracha', 'gochujang', 'miso paste', 'white miso', 'red miso',
  'tahini', 'peanut butter', 'almond butter', 'Dijon mustard',
  'whole grain mustard', 'yellow mustard', 'ketchup', 'mayonnaise',
  'aioli', 'horseradish', 'caramelized onions', 'tomato ketchup',
  // Stock & broths
  'chicken stock', 'beef stock', 'vegetable stock', 'fish stock',
  'dashi', 'bone broth', 'miso broth',
  // Wine & spirits (cooking)
  'dry white wine', 'dry red wine', 'rosé wine', 'sherry', 'marsala wine',
  'port wine', 'sake', 'mirin', 'rice wine', 'brandy', 'cognac', 'rum',
  'beer', 'lager',
  // Sweeteners
  'granulated sugar', 'caster sugar', 'brown sugar', 'dark brown sugar',
  'powdered sugar', 'icing sugar', 'honey', 'maple syrup', 'agave syrup',
  'golden syrup', 'molasses', 'treacle', 'coconut sugar', 'palm sugar',
  'date syrup', 'stevia',
  // Baking
  'baking powder', 'baking soda', 'bicarbonate of soda', 'active dry yeast',
  'instant yeast', 'cream of tartar', 'vanilla extract', 'vanilla bean',
  'vanilla paste', 'cocoa powder', 'dark chocolate', 'milk chocolate',
  'white chocolate', 'chocolate chips', 'cacao nibs', 'dark rum',
  'almond extract', 'rose water', 'orange blossom water',
  'powdered gelatin', 'agar agar', 'cornstarch', 'potato starch',
  // Nuts & seeds
  'almonds', 'blanched almonds', 'almond flakes', 'walnuts', 'pecans',
  'cashews', 'pistachios', 'hazelnuts', 'pine nuts', 'macadamia nuts',
  'Brazil nuts', 'peanuts', 'chestnuts', 'sunflower seeds', 'pumpkin seeds',
  'flaxseeds', 'chia seeds', 'hemp seeds',
  // Dried fruits
  'raisins', 'sultanas', 'currants', 'dried cranberries', 'dried apricots',
  'dried figs', 'dried dates', 'dried mango', 'prunes', 'dried cherries',
  // Fresh fruits
  'lemon', 'lime', 'orange', 'blood orange', 'grapefruit', 'apple',
  'pear', 'quince', 'peach', 'nectarine', 'plum', 'apricot', 'mango',
  'papaya', 'pineapple', 'banana', 'fig', 'pomegranate', 'passion fruit',
  'kiwi', 'dragon fruit', 'lychee', 'coconut', 'coconut milk',
  'coconut cream', 'strawberries', 'raspberries', 'blueberries',
  'blackberries', 'cherries', 'grapes', 'melon', 'watermelon',
  // Canned & preserved
  'canned coconut milk', 'coconut cream', 'canned tomatoes', 'tomato passata',
  'jarred roasted peppers', 'preserved lemons', 'capers in brine',
  'canned artichoke hearts', 'canned corn', 'canned beans',
  // Seaweed & Asian pantry
  'nori', 'kombu', 'wakame', 'dried shiitake mushrooms', 'dried porcini',
  'bonito flakes', 'katsuobushi', 'rice paper', 'wonton wrappers',
  'dumpling wrappers', 'spring roll wrappers',
  // Cheese & dairy extras
  'condensed milk', 'evaporated milk', 'powdered milk', 'whey protein',
]

/* ── Match logic ─────────────────────────────────────────────────────────── */
function getSuggestion(value: string): string {
  if (!value.trim()) return ''
  const lower = value.toLowerCase()
  const match = INGREDIENT_LIST.find(item =>
    item.toLowerCase().startsWith(lower) && item.toLowerCase() !== lower
  )
  return match ?? ''
}

/* ── Component ───────────────────────────────────────────────────────────── */
interface IngredientInputProps {
  value: string
  onChange: (val: string) => void
  className?: string
  placeholder?: string
}

export function IngredientInput({ value, onChange, className = '', placeholder }: IngredientInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  const suggestion = focused ? getSuggestion(value) : ''
  // The ghost suffix = everything after what the user already typed
  const ghostSuffix = suggestion ? suggestion.slice(value.length) : ''

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && ghostSuffix) {
      e.preventDefault()
      onChange(suggestion)
    }
  }, [ghostSuffix, suggestion, onChange])

  return (
    <div className="relative flex-1">
      {/* Ghost text layer — sits behind the real input */}
      {ghostSuffix && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center px-3 text-sm overflow-hidden whitespace-pre"
        >
          <span className="invisible">{value}</span>
          <span className="text-muted-foreground/40">{ghostSuffix}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full bg-transparent ${className}`}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  )
}
