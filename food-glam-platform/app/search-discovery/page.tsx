import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SearchDiscoveryClient from "@/components/modules/search-discovery-client";

export default function SearchDiscoveryPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Search & Discovery</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Search by title, creator, tags, and ingredients. Discover similar recipes and advanced content.</p>
          <SearchDiscoveryClient />
        </CardContent>
      </Card>
    </main>
  );
}
