import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import TonightRecommendationsClient from "@/components/modules/tonight-recommendations-client";

export default function TonightRecommendationsPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Tonight Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Get fast, personalized picks for tonight based on your saves, votes, and preferences.</p>
          <TonightRecommendationsClient />
        </CardContent>
      </Card>
    </main>
  );
}
