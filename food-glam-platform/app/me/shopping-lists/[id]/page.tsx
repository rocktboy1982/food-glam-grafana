import ShoppingListDetailClient from "@/components/pages/shopping-list-detail-client"

export default async function ShoppingListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ShoppingListDetailClient listId={id} />
}
