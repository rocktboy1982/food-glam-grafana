import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PortionLeftoversClient from "@/components/modules/portion-leftovers-client";

export default function PortionLeftoversPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Portion Control & Leftovers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Track portions and leftovers to improve real-world accuracy in meal planning.</p>
          <PortionLeftoversClient />
        </CardContent>
      </Card>
    </main>
  );
}
