import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SupabaseSchemaClient from "@/components/modules/supabase-schema-client";

export default function SupabaseSchemaPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">View, edit, and manage Supabase schema for platform modules.</p>
          <SupabaseSchemaClient />
        </CardContent>
      </Card>
    </main>
  );
}
