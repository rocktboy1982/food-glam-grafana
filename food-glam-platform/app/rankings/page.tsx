import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import VotesRankingsClient from "@/components/modules/votes-rankings-client";

export default function RankingsPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Rankings & Leaderboards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Vote on recipes, rank content, and view leaderboards.</p>
          <VotesRankingsClient />
        </CardContent>
      </Card>
    </main>
  );
}
