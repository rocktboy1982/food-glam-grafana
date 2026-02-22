import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import OllamaAgentsClient from "@/components/modules/ollama-agents-client";

export default function OllamaAgentsPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Development with Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Use agentic coding tools for rapid, modular development based on platform specs.</p>
          <OllamaAgentsClient />
        </CardContent>
      </Card>
    </main>
  );
}
