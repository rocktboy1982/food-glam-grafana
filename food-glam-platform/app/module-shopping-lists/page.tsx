import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ShoppingListsRemoteClient from "@/components/modules/shopping-lists-remote-client";

export default function ModuleShoppingListsPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Shopping Lists</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Create, manage, and share shopping lists for your recipes.</p>
          <ShoppingListsRemoteClient />
        </CardContent>
      </Card>
    </main>
  );
}
