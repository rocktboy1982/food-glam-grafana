import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PrivacyClient from "@/components/modules/privacy-client";

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Export & Delete Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Export your data (meal plans, shopping lists, logs, pantry) or delete your account.</p>
          <PrivacyClient />
        </CardContent>
      </Card>
    </main>
  );
}
