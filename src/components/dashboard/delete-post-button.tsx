'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface DeleteNoteButtonProps {
  noteId: string
  noteTitle: string
}

export function DeleteNoteButton({ noteId, noteTitle }: DeleteNoteButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa ghi chú "${noteTitle}"? Hành động này không thể hoàn tác.`,
    )

    if (!confirmed) return

    setLoading(true)

    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteId)
      if (error) throw error

      router.refresh()
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa ghi chú')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-full border border-rose-200 px-3 py-1 text-sm text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
    >
      {loading ? 'Đang xóa...' : 'Xóa'}
    </button>
  )
}
