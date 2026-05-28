import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NoteList } from '@/components/dashboard/post-list'
import { ProfileCard } from '@/components/dashboard/profile-card'
import type { Note } from '@/types/database'

type DashboardPageProps = {
  searchParams?: { tag?: string }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient()
  const selectedTag = searchParams?.tag ?? ''

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: tags } = await supabase
    .from('tags')
    .select('id, name, color')
    .eq('author_id', user.id)
    .order('name')

  let notes: Note[] = []
  let error: unknown = null

  if (selectedTag) {
    const { data: noteTagRows, error: noteTagError } = await supabase
      .from('note_tags')
      .select('note_id')
      .eq('tag_id', selectedTag)

    if (noteTagError) {
      error = noteTagError
    } else {
      const noteIds = noteTagRows?.map((row) => row.note_id) ?? []
      if (noteIds.length > 0) {
        const { data: filteredNotes, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('author_id', user.id)
          .in('id', noteIds)
          .order('created_at', { ascending: false })

        notes = filteredNotes ?? []
        error = notesError
      }
    }
  } else {
    const { data: allNotes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })

    notes = allNotes ?? []
    error = notesError
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching notes:', error)
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <ProfileCard
          userId={user.id}
          displayName={profile?.display_name ?? (user.user_metadata?.display_name as string | undefined)}
          avatarUrl={profile?.avatar_url}
        />
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-700/80">Workspace</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900">Ghi chú của tôi</h1>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200/70 transition hover:bg-emerald-700"
        >
          + Tạo ghi chú mới
        </Link>
      </div>
      {tags && tags.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard"
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition hover:border-emerald-300 hover:text-emerald-700 ${
              selectedTag
                ? 'border-slate-200 text-slate-600'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            Tất cả
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/dashboard?tag=${tag.id}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition hover:border-emerald-300 hover:text-emerald-700 ${
                selectedTag === tag.id
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <span
                className="mr-2 inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color || '#10B981' }}
              />
              {tag.name}
            </Link>
          ))}
        </div>
      )}
      {notes && notes.length > 0 ? (
        <NoteList notes={notes} />
      ) : (
        <div className="text-center py-16 rounded-3xl border border-white/70 bg-white/70 shadow-lg shadow-amber-100/70 backdrop-blur">
          <p className="text-slate-600 mb-4">
            {selectedTag ? 'Chưa có ghi chú nào theo chủ đề này.' : 'Bạn chưa có ghi chú nào.'}
          </p>
          <Link href="/dashboard/new" className="text-emerald-700 hover:text-emerald-600">
            Tạo ghi chú đầu tiên →
          </Link>
        </div>
      )}
    </main>
  )
}
