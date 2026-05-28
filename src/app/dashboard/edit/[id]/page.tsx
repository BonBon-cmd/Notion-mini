import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { NoteForm } from '@/components/dashboard/post-form'

export const dynamic = 'force-dynamic'

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>  // ← đổi type
}) {
  const { id } = await params       // ← await

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: note, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)                   // ← dùng id đã await
    .eq('author_id', user.id)       // ← thêm để đảm bảo chỉ edit note của mình
    .single()

  if (error || !note) {
    console.error('Error fetching note for edit:', JSON.stringify(error))
    notFound()
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Chỉnh sửa ghi chú</h1>
      <NoteForm note={note} />
    </main>
  )
}