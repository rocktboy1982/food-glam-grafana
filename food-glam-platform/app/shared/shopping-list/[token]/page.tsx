import React from 'react'
import { notFound } from 'next/navigation'
import SharedShoppingListClient from '@/components/pages/shared-shopping-list-client'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function SharedPage({ params }: { params: { token: string } }) {
  const { token } = params
  const supabase = createServerSupabaseClient()

  // Find share record
  const { data: share, error: shareErr } = await supabase
    .from('shopping_list_shares')
    .select('shopping_list_id, token, can_edit, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (shareErr || !share) {
    return notFound()
  }

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <div className="py-16">
          <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
          <p className="text-muted-foreground">This shared shopping list link is no longer valid.</p>
        </div>
      </main>
    )
  }

  // Fetch list metadata
  const { data: list } = await supabase
    .from('shopping_lists')
    .select('id, name, created_at')
    .eq('id', share.shopping_list_id)
    .single()

  // Fetch items from shopping_list_items
  const { data: items } = await supabase
    .from('shopping_list_items')
    .select('id, name, amount, unit, notes, checked, created_at')
    .eq('shopping_list_id', share.shopping_list_id)
    .order('created_at', { ascending: true })

  return (
    <SharedShoppingListClient
      token={token}
      shoppingListId={String(share.shopping_list_id)}
      listName={list?.name || 'Shopping List'}
      initialItems={items || []}
      canEdit={share.can_edit || false}
    />
  )
}
