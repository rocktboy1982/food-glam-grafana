import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ExternalContentClient from "@/components/modules/external-content-client";

export default function ExternalContentPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>External Content Links</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Embed and manage external media links for recipes, videos, and images.</p>
          <ExternalContentClient />
        </CardContent>
      </Card>
    </main>
  );
}
