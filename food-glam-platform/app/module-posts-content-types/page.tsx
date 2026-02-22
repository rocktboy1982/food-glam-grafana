import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PostsContentTypesClient from "@/components/modules/posts-content-types-client";

export default function ModulePostsContentTypesPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Posts & Content Types</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Create, manage, and moderate posts and content types.</p>
          <PostsContentTypesClient />
        </CardContent>
      </Card>
    </main>
  );
}
