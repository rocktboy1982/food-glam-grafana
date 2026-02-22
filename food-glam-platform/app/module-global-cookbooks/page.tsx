'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface Cuisine {
  name: string;
  flag: string;
  description: string;
  recipeCount: number;
}

export default function GlobalCookbooksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);

  useEffect(() => {
    // TODO: Replace with Supabase query once DB migrations are applied
    // Example:
    // const { data, error } = await supabase
    //   .from('cuisines')
    //   .select('*');
    
    // setCuisines(data || []);
    
    // For now, use hardcoded data
    setCuisines([
      { name: 'Italy', flag: '🇮🇹', description: 'Italian cuisine is known for its rich flavors and variety of ingredients.', recipeCount: 120 },
      { name: 'France', flag: '🇫🇷', description: 'French cuisine is renowned for its refined techniques and elegant presentation.', recipeCount: 95 },
      { name: 'Thailand', flag: '🇹🇭', description: 'Thai cuisine is famous for its bold flavors and use of aromatic herbs and spices.', recipeCount: 85 },
      { name: 'USA', flag: '🇺🇸', description: 'American cuisine is a diverse blend of influences from many cultures.', recipeCount: 200 },
      { name: 'Mexico', flag: '🇲🇽', description: 'Mexican cuisine is rich in flavor and history, with a focus on fresh ingredients.', recipeCount: 150 },
      { name: 'Japan', flag: '🇯🇵', description: 'Japanese cuisine emphasizes seasonality, freshness, and simplicity.', recipeCount: 130 },
      { name: 'India', flag: '🇮🇳', description: 'Indian cuisine is known for its diverse regional flavors and use of spices.', recipeCount: 180 },
      { name: 'Spain', flag: '🇪🇸', description: 'Spanish cuisine is characterized by its use of olive oil, seafood, and bold flavors.', recipeCount: 110 },
      { name: 'Greece', flag: '🇬🇷', description: 'Greek cuisine is known for its use of olive oil, fresh vegetables, and seafood.', recipeCount: 90 },
      { name: 'Turkey', flag: '🇹🇷', description: 'Turkish cuisine is a blend of Middle Eastern, Mediterranean, and Central Asian influences.', recipeCount: 100 },
      { name: 'Lebanon', flag: '🇱🇧', description: 'Lebanese cuisine is known for its fresh ingredients and rich flavors.', recipeCount: 80 },
      { name: 'Morocco', flag: '🇲🇦', description: 'Moroccan cuisine is a blend of Arab, Berber, and French influences.', recipeCount: 75 },
      { name: 'Brazil', flag: '🇧🇷', description: 'Brazilian cuisine is a fusion of indigenous, African, and European influences.', recipeCount: 140 },
      { name: 'Peru', flag: '🇵🇪', description: 'Peruvian cuisine is known for its use of indigenous ingredients and fusion of flavors.', recipeCount: 90 },
      { name: 'Korea', flag: '🇰🇷', description: 'Korean cuisine is known for its balance of flavors and use of fermented foods.', recipeCount: 120 },
      { name: 'Vietnam', flag: '🇻🇳', description: 'Vietnamese cuisine is known for its fresh ingredients and balance of flavors.', recipeCount: 110 },
      { name: 'China', flag: '🇨🇳', description: 'Chinese cuisine is diverse, with regional variations and a focus on balance and harmony.', recipeCount: 220 },
      { name: 'Germany', flag: '🇩🇪', description: 'German cuisine is known for its hearty dishes and use of bread and meat.', recipeCount: 100 },
      { name: 'Sweden', flag: '🇸🇪', description: 'Swedish cuisine is known for its use of fish, meat, and root vegetables.', recipeCount: 85 },
      { name: 'Australia', flag: '🇦🇺', description: 'Australian cuisine is a blend of indigenous, European, and Asian influences.', recipeCount: 130 },
    ]);
  }, []);

  const filteredCuisines = cuisines.filter(cuisine =>
    cuisine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Global Cookbooks</h1>
      <div className="mb-6 flex items-center">
        <Search className="mr-2" />
        <input
          type="text"
          placeholder="Search cuisines..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredCuisines.map((cuisine) => (
          <Card key={cuisine.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                {cuisine.flag} {cuisine.name}
              </CardTitle>
              <CardDescription>{cuisine.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{cuisine.recipeCount} recipes</p>
              <Button asChild className="mt-2 w-full">
                <Link href={`/cuisines/${cuisine.name.toLowerCase()}`}>View Cuisine</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}