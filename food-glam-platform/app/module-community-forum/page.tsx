import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import CommunityForumClient from "@/components/modules/community-forum-client";

export default function ModuleCommunityForumPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Community & Forum</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Join discussions, ask questions, and connect with the community.</p>
          <CommunityForumClient />
        </CardContent>
      </Card>
    </main>
  );
}
