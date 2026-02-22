import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import RedditIntegrationClient from "@/components/modules/reddit-integration-client";

export default function ModuleRedditIntegrationPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Reddit Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Connect your account and share recipes/posts to Reddit.</p>
          <RedditIntegrationClient />
        </CardContent>
      </Card>
    </main>
  );
}
