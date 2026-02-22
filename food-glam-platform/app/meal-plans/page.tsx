import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MealPlansClient from "@/components/modules/meal-plans-client";

export default function MealPlansPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Meal Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Plan your week with recipes, calorie targets, macros, and fasting patterns.</p>
          <MealPlansClient />
        </CardContent>
      </Card>
    </main>
  );
}
