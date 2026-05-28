import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen px-4 py-16 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 rounded-3xl border border-white/70 bg-white/75 p-8 shadow-xl shadow-amber-100/70 backdrop-blur-xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-700/80">
            Notion Mini
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Quên mật khẩu</h2>
          <p className="mt-2 text-slate-600">
            Nhập email để nhận liên kết đặt lại mật khẩu
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
