'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function voteOnPost(postId: string, value: number) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id, value')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (existingVote) {
    if (existingVote.value === value) {
      // Remove vote if same value
      await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id)
    } else {
      // Update vote
      await supabase
        .from('votes')
        .update({ value })
        .eq('id', existingVote.id)
    }
  } else {
    // Insert new vote
    await supabase
      .from('votes')
      .insert({
        post_id: postId,
        user_id: user.id,
        value
      })
  }

  revalidatePath(`/recipes/${postId}`)
}