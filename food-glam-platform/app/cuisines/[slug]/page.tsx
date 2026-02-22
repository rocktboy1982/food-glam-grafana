'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FoodStyle {
  name: string;
  recipeCount: number;
}

interface Cuisine {
  name: string;
  description: string;
  foodStyles: FoodStyle[];
}

export default function CuisinePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [cuisine, setCuisine] = useState<Cuisine>({
    name: '',
    description: '',
    foodStyles: []
  });

  useEffect(() => {
    // TODO: Replace with Supabase query once DB migrations are applied
    // Example:
    // const { data, error } = await supabase
    //   .from('cuisines')
    //   .select('*')
    //   .eq('slug', slug);
    
    // setCuisine(data[0] || {});
    
    // For now, use hardcoded data
    setCuisine({
      name: 'Italian',
      description: 'Italian cuisine is known for its rich flavors and variety of ingredients.',
      foodStyles: [
        { name: 'Italian', recipeCount: 120 },
        { name: 'Fusion Italian', recipeCount: 30 }
      ]
    });
  }, [slug]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex gap-2">
         <Link href="/">Home</Link>
         <span>{String.fromCharCode(62)}</span>
         <Link href="/module-global-cookbooks">Global Cookbooks</Link>
         <span>{String.fromCharCode(62)}</span>
         <span>{cuisine.name}</span>
       </div>
      <h1 className="text-3xl font-bold mb-6">{cuisine.name} Cuisine</h1>
      <Card>
        <CardHeader>
          <CardTitle>{cuisine.name}</CardTitle>
          <CardDescription>{cuisine.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Food Styles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cuisine.foodStyles.map((style) => (
              <Card key={style.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{style.name}</CardTitle>
                  <CardDescription>{style.recipeCount} recipes</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={`/cuisines/${slug}/food-styles/${style.name.toLowerCase()}`}>View Style</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}