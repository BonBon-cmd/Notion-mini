import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardNotePage({
  params,
}: {
  params: Promise<{ id: string }>  // ← đổi type thành Promise
}) {
  const { id } = await params       // ← await ở đây

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
    .eq('author_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Loi tai ghi chu dashboard:', JSON.stringify(error))  // ← JSON.stringify để thấy lỗi đầy đủ
  }

  if (!note) {
    notFound()
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
        >
          ← Quay lại dashboard
        </Link>
      </div>
      <article className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-amber-100/70 backdrop-blur">
        <header className="mb-6">
          {note.cover_image_url && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-lg shadow-amber-100/70 backdrop-blur">
              <img
                src={note.cover_image_url}
                alt={note.title}
                className="h-64 w-full object-cover"
              />
            </div>
          )}
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-700/80">Ghi chú của bạn</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">{note.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>Tạo ngày: {new Date(note.created_at).toLocaleDateString('vi-VN')}</span>
            <span>•</span>
            <span>{note.is_public ? 'Công khai' : 'Riêng tư'}</span>
          </div>
        </header>

        <div className="prose prose-lg max-w-none">
          {note.content?.split('\n').map((paragraph: string, index: number) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  )
}