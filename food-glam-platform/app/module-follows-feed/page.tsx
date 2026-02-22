import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import FollowsFeedRemoteClient from "@/components/modules/follows-feed-remote-client";

export default function ModuleFollowsFeedPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Follows & Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Follow users, view personalized feeds, and discover new content.</p>
          {/* remote client will try Supabase and fallback to local dev storage */}
          <FollowsFeedRemoteClient />
        </CardContent>
      </Card>
    </main>
  );
}
