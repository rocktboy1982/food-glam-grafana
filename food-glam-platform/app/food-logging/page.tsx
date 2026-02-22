import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import FoodLoggingClient from "@/components/modules/food-logging-client";

export default function FoodLoggingPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Food Logging & Adherence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Log what you ate, compare against your plan, and see daily adherence scores.</p>
          <FoodLoggingClient />
        </CardContent>
      </Card>
    </main>
  );
}
