import type { Metadata } from 'next'
import GroceryMatchClient from '@/components/pages/grocery-match-client'

export const metadata: Metadata = {
  title: 'Match Products | Food Glam',
}

export default async function GroceryMatchPage({ params }: { params: Promise<{ list_id: string }> }) {
  const { list_id } = await params
  return <GroceryMatchClient listId={list_id} />
}
