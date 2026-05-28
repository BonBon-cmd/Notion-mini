'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/utils/supabase/client'

interface ProfileCardProps {
  userId: string
  displayName?: string | null
  avatarUrl?: string | null
}

const AVATAR_SIZE = 512

const formatUploadError = (message?: string) => {
  if (!message) return 'Không thể tải ảnh lên. Vui lòng thử lại.'
  if (message.toLowerCase().includes('bucket not found')) {
    return "Chưa tạo bucket 'avatars' trên Supabase Storage. Hãy tạo bucket và thử lại."
  }
  return message
}

const loadImageFromUrl = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = (error) => reject(error)
    image.src = url
  })

const cropImageToSquare = async (file: File, zoom: number) => {
  const previewUrl = URL.createObjectURL(file)
  try {
    const image = await loadImageFromUrl(previewUrl)
    const baseSize = Math.min(image.width, image.height)
    const cropSize = baseSize / zoom
    const offsetX = (image.width - cropSize) / 2
    const offsetY = (image.height - cropSize) / 2

    const canvas = document.createElement('canvas')
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Không thể xử lý ảnh.')

    context.drawImage(
      image,
      offsetX,
      offsetY,
      cropSize,
      cropSize,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    )

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) reject(new Error('Không thể tạo ảnh cắt.'))
        else resolve(result)
      }, 'image/png')
    })

    return blob
  } finally {
    URL.revokeObjectURL(previewUrl)
  }
}

export function ProfileCard({ userId, displayName, avatarUrl }: ProfileCardProps) {
  const supabase = createClient()
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl ?? '')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const resetCropState = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setPendingFile(null)
    setZoom(1)
    setIsCropping(false)
  }

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setZoom(1)
    setIsCropping(true)
    event.target.value = ''
  }

  const uploadAvatar = async (file: File) => {
    const filePath = `${userId}/avatar.png`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = data.publicUrl

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        display_name: displayName ?? null,
        avatar_url: publicUrl,
      },
      {
        onConflict: 'id',
      },
    )

    if (profileError) throw profileError

    setCurrentAvatar(`${publicUrl}?v=${Date.now()}`)
  }

  const handleCropConfirm = async () => {
    if (!pendingFile) return

    setIsUploading(true)
    setError(null)

    try {
      const croppedBlob = await cropImageToSquare(pendingFile, zoom)
      const croppedFile = new File([croppedBlob], 'avatar.png', {
        type: 'image/png',
      })
      await uploadAvatar(croppedFile)
      resetCropState()
    } catch (err: any) {
      setError(formatUploadError(err.message))
      resetCropState()
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-amber-100/70 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-white/70 bg-emerald-50">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Ảnh đại diện" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-emerald-700">
                {(displayName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700/80">Hồ sơ</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {displayName || 'Người dùng'}
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <label
            htmlFor="avatarUpload"
            className="cursor-pointer rounded-full border border-emerald-200 px-4 py-2 text-center font-semibold text-emerald-700 transition hover:border-emerald-300"
          >
            {isUploading ? 'Đang tải...' : 'Tải ảnh đại diện'}
          </label>
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            disabled={isUploading}
            className="hidden"
          />
          <p className="text-xs text-slate-500">Ảnh vuông, khuyến nghị 512x512</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/70 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isMounted && isCropping && previewUrl
        ? createPortal(
            <div className="fixed inset-0 z-[2147483647] grid place-items-center bg-slate-900/45 p-4 backdrop-blur-md">
              <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/20">
                <h3 className="text-lg font-semibold text-slate-900">Cắt ảnh đại diện</h3>
                <p className="mt-2 text-sm text-slate-500">Kéo thanh để phóng to hoặc thu nhỏ khung ảnh.</p>

                <div className="mt-4 flex justify-center">
                  <div className="h-64 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img
                      src={previewUrl}
                      alt="Xem trước"
                      className="h-full w-full object-cover"
                      style={{ transform: `scale(${zoom})` }}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="zoom" className="block text-sm font-medium text-slate-700">
                    Phóng to
                  </label>
                  <input
                    id="zoom"
                    type="range"
                    min={1}
                    max={2}
                    step={0.05}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="mt-2 w-full"
                  />
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={resetCropState}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleCropConfirm}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-200/70 transition hover:bg-emerald-700"
                  >
                    Cắt và lưu
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
