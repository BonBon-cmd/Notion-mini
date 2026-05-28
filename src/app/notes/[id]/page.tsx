import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// ── generateMetadata ──────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params  // ← await

  const supabase = await createClient()

  const { data: note } = await supabase
    .from('notes')
    .select('title, content')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  return {
    title: note?.title || 'Ghi chú',
    description: note?.content?.slice(0, 120) || '',
  }
}

// ── NotePage ──────────────────────────────────────────────
export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params  // ← await

  const supabase = await createClient()

  const { data: note, error } = await supabase
    .from('notes')
    .select(`
      *,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (error || !note) {
    notFound()
  }

  let relatedNotes: Array<{
    id: string
    title: string
    created_at: string
    cover_image_url?: string | null
    profiles?: { display_name: string | null; avatar_url: string | null } | null
  }> = []

  const { data: sameAuthorNotes } = await supabase
    .from('notes')
    .select(
      `
      id,
      title,
      created_at,
      cover_image_url,
      profiles (
        display_name,
        avatar_url
      )
    `,
    )
    .eq('is_public', true)
    .eq('author_id', note.author_id)
    .neq('id', id)
    .order('created_at', { ascending: false })
    .limit(3)

  relatedNotes = sameAuthorNotes ?? []

  if (relatedNotes.length === 0) {
    const { data: fallbackNotes } = await supabase
      .from('notes')
      .select(
        `
        id,
        title,
        created_at,
        cover_image_url,
        profiles (
          display_name,
          avatar_url
        )
      `,
      )
      .eq('is_public', true)
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(3)

    relatedNotes = fallbackNotes ?? []
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
        >
          ← Quay lại trang chủ
        </Link>
        <span className="text-xs uppercase tracking-[0.3em] text-emerald-700/80">Notion Mini</span>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-amber-100/70 backdrop-blur">
          <header className="mb-8">
            {note.cover_image_url && (
              <div className="mb-6 overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-lg shadow-amber-100/70 backdrop-blur">
                <img
                  src={note.cover_image_url}
                  alt={note.title}
                  className="h-72 w-full object-cover"
                />
              </div>
            )}
            <h1 className="text-4xl font-bold mb-4 text-slate-900">{note.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-emerald-50 text-sm font-semibold text-emerald-700">
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
              </div>
              <span>•</span>
              <time>{new Date(note.created_at).toLocaleDateString('vi-VN')}</time>
            </div>
          </header>

          <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700">
            {note.content?.split('\n').map((paragraph: string, index: number) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg shadow-amber-100/70 backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700/80">
              Bài liên quan
            </h2>
            <p className="mt-2 text-sm text-slate-500">Khám phá thêm các ghi chú tương tự.</p>
          </div>

          {relatedNotes.map((related) => (
            <Link
              key={related.id}
              href={`/notes/${related.id}`}
              className="group block rounded-3xl border border-white/70 bg-white/85 p-4 shadow-lg shadow-amber-100/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-emerald-50 text-xs font-semibold text-emerald-700">
                  {related.profiles?.avatar_url ? (
                    <img
                      src={related.profiles.avatar_url}
                      alt={related.profiles.display_name || 'Ảnh đại diện'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (related.profiles?.display_name || 'A').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 transition group-hover:text-emerald-700">
                    {related.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {related.profiles?.display_name || 'Ẩn danh'} •{' '}
                    {new Date(related.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </aside>
      </div>
    </main>
  )
}