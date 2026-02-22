import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import NutritionEngineClient from "@/components/modules/nutrition-engine-client";

export default function NutritionEnginePage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Engine</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Compute nutrition per recipe, scale servings, and compare macros.</p>
          <NutritionEngineClient />
        </CardContent>
      </Card>
    </main>
  );
}
