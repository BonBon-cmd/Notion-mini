import Link from 'next/link'
import { Note } from '@/types/database'
import { DeleteNoteButton } from './delete-post-button'

interface NoteListProps {
  notes: Note[]
}

export function NoteList({ notes }: NoteListProps) {
  return (
    <div className="space-y-5">
      {notes.map((note) => (
        <div
          key={note.id}
          className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-amber-100/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-1 flex-col gap-4 md:flex-row">
              {note.cover_image_url && (
                <div className="w-full md:w-44">
                  <img
                    src={note.cover_image_url}
                    alt={note.title}
                    className="h-28 w-full rounded-2xl object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">{note.title}</h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      note.is_public
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {note.is_public ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>
                {note.content && (
                  <p className="mt-2 text-sm text-slate-600">
                    {note.content.slice(0, 140)}
                    {note.content.length > 140 ? '...' : ''}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>Tạo ngày: {new Date(note.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/notes/${note.id}`}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                Xem
              </Link>
              <Link
                href={`/dashboard/edit/${note.id}`}
                className="rounded-full border border-emerald-200 px-4 py-1.5 text-sm font-medium text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
              >
                Sửa
              </Link>
              <DeleteNoteButton noteId={note.id} noteTitle={note.title} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
