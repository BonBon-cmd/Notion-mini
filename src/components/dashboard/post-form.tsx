'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Note } from '@/types/database'

interface NoteFormProps {
  note?: Note
}

interface TagItem {
  id: string
  name: string
  color: string | null
}

export function NoteForm({ note }: NoteFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = Boolean(note)

  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [isPublic, setIsPublic] = useState(note?.is_public ?? false)
  const [imageUrl, setImageUrl] = useState(note?.cover_image_url ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [tags, setTags] = useState<TagItem[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isActive = true

    const loadTags = async () => {
      setIsLoadingTags(true)

      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { data: tagRows } = await supabase
          .from('tags')
          .select('id, name, color')
          .eq('author_id', userData.user.id)
          .order('name')

        if (!isActive) return

        setTags(tagRows ?? [])

        if (note) {
          const { data: noteTags } = await supabase
            .from('note_tags')
            .select('tag_id')
            .eq('note_id', note.id)

          if (!isActive) return
          setSelectedTagIds(noteTags?.map((row) => row.tag_id) ?? [])
        }
      } finally {
        if (isActive) setIsLoadingTags(false)
      }
    }

    loadTags()

    return () => {
      isActive = false
    }
  }, [note, supabase])

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setRemoveImage(false)
    setImageUrl(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImageUrl('')
    setRemoveImage(true)
  }

  const uploadNoteImage = async (file: File, userId: string) => {
    const fileExtension = file.name.split('.').pop() || 'png'
    const fileName = `${crypto.randomUUID()}.${fileExtension}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('note-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('note-images').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        setError('Bạn cần đăng nhập để thực hiện thao tác này')
        return
      }

      let coverImageUrl: string | null = removeImage ? null : imageUrl || null

      if (imageFile) {
        coverImageUrl = await uploadNoteImage(imageFile, data.user.id)
      }

      const noteData = {
        title,
        content: content || '',
        is_public: isPublic,
        author_id: data.user.id,
        cover_image_url: coverImageUrl,
      }

      let noteId = note?.id ?? ''

      if (isEditing && note) {
        const { error } = await supabase.from('notes').update(noteData).eq('id', note.id)
        if (error) throw error
      } else {
        const { data: insertedNote, error } = await supabase
          .from('notes')
          .insert(noteData)
          .select('id')
          .single()
        if (error) throw error
        noteId = insertedNote.id
      }

      if (!noteId) {
        throw new Error('Không thể lưu chủ đề cho ghi chú.')
      }

      const { error: deleteTagsError } = await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', noteId)

      if (deleteTagsError) throw deleteTagsError

      if (selectedTagIds.length > 0) {
        const { error: insertTagsError } = await supabase.from('note_tags').insert(
          selectedTagIds.map((tagId) => ({
            note_id: noteId,
            tag_id: tagId,
          })),
        )

        if (insertTagsError) throw insertTagsError
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-amber-100/70 backdrop-blur">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">
              Tiêu đề <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200/60"
              placeholder="Nhập tiêu đề ghi chú"
            />
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-amber-100/70 backdrop-blur">
            <label htmlFor="content" className="block text-sm font-medium text-slate-700">
              Nội dung
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200/60 font-mono"
              placeholder="Viết nội dung ghi chú của bạn..."
            />
            <p className="mt-2 text-xs text-slate-500">Hỗ trợ Markdown</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-amber-100/70 backdrop-blur">
            <label htmlFor="coverImage" className="block text-sm font-medium text-slate-700">
              Ảnh bìa
            </label>
            <div className="mt-3 space-y-3">
              {imageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
                  <img
                    src={imageUrl}
                    alt="Ảnh bìa"
                    className="h-48 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
                  Chưa có ảnh bìa
                </div>
              )}

              <div className="flex flex-col gap-3">
                <input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">Khuyến nghị ảnh ngang, tối đa 5MB.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-amber-100/70 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Chủ đề</p>
                <p className="mt-1 text-xs text-slate-500">Chọn tối đa 5 chủ đề phù hợp.</p>
              </div>
              <span className="text-xs text-slate-400">{selectedTagIds.length}/5</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {isLoadingTags && (
                <span className="text-xs text-slate-500">Đang tải chủ đề...</span>
              )}
              {!isLoadingTags && tags.length === 0 && (
                <span className="text-xs text-slate-500">Chưa có chủ đề. Hãy tạo trong Supabase.</span>
              )}
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id)
                const isDisabled = !isSelected && selectedTagIds.length >= 5
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    disabled={isDisabled}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color || '#10B981' }}
                    />
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-amber-100/70 backdrop-blur">
            <label htmlFor="visibility" className="block text-sm font-medium text-slate-700">
              Hiển thị
            </label>
            <select
              id="visibility"
              value={isPublic ? 'public' : 'private'}
              onChange={(e) => setIsPublic(e.target.value === 'public')}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200/60"
            >
              <option value="private">Riêng tư</option>
              <option value="public">Công khai</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-800"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-200/70 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo ghi chú'}
        </button>
      </div>
    </form>
  )
}
