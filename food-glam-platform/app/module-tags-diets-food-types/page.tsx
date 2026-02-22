import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import TagsDietsFoodTypesClient from "@/components/modules/tags-diets-food-types-client";

export default function ModuleTagsDietsFoodTypesPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Tags, Diets & Food Types</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Tag recipes, set diet types, and organize food categories.</p>
          <TagsDietsFoodTypesClient />
        </CardContent>
      </Card>
    </main>
  );
}
