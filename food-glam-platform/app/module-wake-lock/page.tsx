import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import WakeLockClient from "@/components/modules/wake-lock-client";

export default function ModuleWakeLockPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Wake Lock</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Prevent device sleep during cooking or recipe viewing.</p>
          <WakeLockClient />
        </CardContent>
      </Card>
    </main>
  );
}
