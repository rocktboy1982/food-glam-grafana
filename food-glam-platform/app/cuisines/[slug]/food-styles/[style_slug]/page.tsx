'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter } from 'lucide-react';
import Link from 'next/link';

interface Cookbook {
  title: string;
  author: string;
  difficulty: string;
  time: string;
  imageUrl: string;
}

interface Filters {
  difficulty: string;
  time: string;
}

export default function FoodStylePage({ params }: { params: { slug: string; style_slug: string } }) {
  const { slug, style_slug } = params;
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([
    { title: 'Classic Italian Recipes', author: 'Maria Rossi', difficulty: 'Intermediate', time: '1.5h', imageUrl: 'https://via.placeholder.com/300x200' },
    { title: 'Modern Fusion Cuisine', author: 'Luca Bianchi', difficulty: 'Advanced', time: '2h', imageUrl: 'https://via.placeholder.com/300x200' },
    { title: 'Healthy Italian Alternatives', author: 'Gianna Conti', difficulty: 'Beginner', time: '1h', imageUrl: 'https://via.placeholder.com/300x200' }
  ]);
  const [filters, setFilters] = useState<Filters>({ difficulty: '', time: '' });

  const filteredCookbooks = cookbooks.filter(cookbook => {
    if (filters.difficulty && cookbook.difficulty !== filters.difficulty) return false;
    if (filters.time && cookbook.time !== filters.time) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex gap-2 flex-wrap">
         <Link href="/">Home</Link>
         <span>{String.fromCharCode(62)}</span>
         <Link href="/module-global-cookbooks">Global Cookbooks</Link>
         <span>{String.fromCharCode(62)}</span>
         <Link href={`/cuisines/${slug}`}>{slug}</Link>
         <span>{String.fromCharCode(62)}</span>
         <span>{style_slug}</span>
       </div>
      <h1 className="text-3xl font-bold mb-6">{style_slug} Food Style</h1>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search cookbooks..."
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFilters({ ...filters, difficulty: 'Beginner' })}>
            <Filter className="mr-2" /> Beginner
          </Button>
          <Button variant="outline" onClick={() => setFilters({ ...filters, difficulty: 'Intermediate' })}>
            <Filter className="mr-2" /> Intermediate
          </Button>
          <Button variant="outline" onClick={() => setFilters({ ...filters, difficulty: 'Advanced' })}>
            <Filter className="mr-2" /> Advanced
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredCookbooks.map((cookbook) => (
          <Card key={cookbook.title} className="hover:shadow-lg transition-shadow">
            <div className="aspect-w-16 aspect-h-9">
              <img src={cookbook.imageUrl} alt={cookbook.title} className="w-full h-full object-cover" />
            </div>
            <CardHeader>
              <CardTitle>{cookbook.title}</CardTitle>
              <CardDescription>{cookbook.author}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Difficulty: {cookbook.difficulty}</span>
                <span className="text-sm text-gray-500">Time: {cookbook.time}</span>
              </div>
              <Button asChild className="mt-2 w-full">
                <Link href={`/cuisines/${slug}/food-styles/${style_slug}/cookbooks/${cookbook.title.toLowerCase().replace(/ /g, '-')}`}>View Cookbook</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}