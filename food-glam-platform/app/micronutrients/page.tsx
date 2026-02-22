import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MicronutrientsClient from "@/components/modules/micronutrients-client";

export default function MicronutrientsPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Micronutrients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Track your intake of vitamins, minerals, and hydration.</p>
          <MicronutrientsClient />
        </CardContent>
      </Card>
    </main>
  );
}
