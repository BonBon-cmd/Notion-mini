import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

type HomePageProps = {
  searchParams?: { tag?: string }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient()
  const selectedTag = searchParams?.tag ?? ''

  const { data: tags } = await supabase
    .from('tags')
    .select('id, name, color')
    .order('name')

  let notes = [] as Array<{
    id: string
    title: string
    content: string
    is_public: boolean
    cover_image_url?: string | null
    created_at: string
    profiles?: { display_name: string | null; avatar_url: string | null } | null
  }>
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
          .select(
            `
            *,
            profiles (
              display_name,
              avatar_url
            )
            `,
          )
          .eq('is_public', true)
          .in('id', noteIds)
          .order('created_at', { ascending: false })

        notes = filteredNotes ?? []
        error = notesError
      }
    }
  } else {
    const { data: allNotes, error: notesError } = await supabase
      .from('notes')
      .select(
        `
        *,
        profiles (
          display_name,
          avatar_url
        )
        `,
      )
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    notes = allNotes ?? []
    error = notesError
  }

  if (error) {
    console.error('Error fetching notes:', error)
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-700/80">Public Notes</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900">Ghi chú mới nhất</h1>
          <p className="mt-2 text-sm text-slate-500">Khám phá các ghi chú vừa được chia sẻ.</p>
        </div>
        <div className="text-sm text-slate-500">
          {notes?.length ? `${notes.length} ghi chú` : 'Chưa có ghi chú'}
        </div>
      </div>
      {tags && tags.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center gap-2">
          <Link
            href="/"
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
              href={`/?tag=${tag.id}`}
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
        <div className="grid gap-6 lg:grid-cols-2">
          {notes.map((note) => (
            <article
              key={note.id}
              className="group overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-lg shadow-amber-100/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl"
            >
              {note.cover_image_url && (
                <div className="overflow-hidden">
                  <img
                    src={note.cover_image_url}
                    alt={note.title}
                    className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-emerald-50 text-sm font-semibold text-emerald-700">
                    {note.profiles?.avatar_url ? (
                      <img
                        src={note.profiles.avatar_url}
                        alt={note.profiles.display_name || 'Ảnh đại diện'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (note.profiles?.display_name || 'A').charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="font-medium text-slate-700">
                    {note.profiles?.display_name || 'Ẩn danh'}
                  </span>
                  <span>•</span>
                  <span>{new Date(note.created_at).toLocaleDateString('vi-VN')}</span>
                </div>

                <Link href={`/notes/${note.id}`}>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-900 transition-colors group-hover:text-emerald-700">
                    {note.title}
                  </h2>
                </Link>

                {note.content && (
                  <p className="mt-3 text-slate-600">
                    {note.content.slice(0, 170)}
                    {note.content.length > 170 ? '...' : ''}
                  </p>
                )}

                <Link
                  href={`/notes/${note.id}`}
                  className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-600"
                >
                  Đọc tiếp →
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl border border-white/70 bg-white/70 shadow-lg shadow-amber-100/70 backdrop-blur">
          <p className="text-slate-600">Chưa có ghi chú nào.</p>
        </div>
      )}
    </main>
  )
}