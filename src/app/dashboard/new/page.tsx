import { NoteForm } from '@/components/dashboard/post-form'

export default function NewNotePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tạo ghi chú mới</h1>
      <NoteForm />
    </main>
  )
}
