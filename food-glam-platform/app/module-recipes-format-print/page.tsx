import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import RecipesFormatPrintClient from "@/components/modules/recipes-format-print-client";

export default function ModuleRecipesFormatPrintPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Recipes: Format & Print</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Format, print, and share recipes in various layouts.</p>
          <RecipesFormatPrintClient />
        </CardContent>
      </Card>
    </main>
  );
}
