import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import VideoPopupEmbedsClient from "@/components/modules/video-popup-embeds-client";

export default function ModuleVideoPopupEmbedsPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Video Popups & Embeds</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Add video popups and embed content in your recipes and posts.</p>
          <VideoPopupEmbedsClient />
        </CardContent>
      </Card>
    </main>
  );
}
 
