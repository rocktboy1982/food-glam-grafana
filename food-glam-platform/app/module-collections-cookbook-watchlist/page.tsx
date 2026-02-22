import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import CollectionsClient from "@/components/modules/collections-client";

export default function ModuleCollectionsCookbookWatchlistPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Collections, Cookbook & Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Organize recipes, create collections, and manage your watchlist.</p>
          <CollectionsClient />
        </CardContent>
      </Card>
    </main>
  );
}
