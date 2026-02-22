import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import I18nTranslationClient from "@/components/modules/i18n-translation-client";

export default function ModuleI18nTranslationPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>i18n & Translation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Translate content, manage locales, and support global users.</p>
          <I18nTranslationClient />
        </CardContent>
      </Card>
    </main>
  );
}
