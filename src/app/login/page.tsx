import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  return (
    <div className="min-h-screen px-4 py-16 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 rounded-3xl border border-white/70 bg-white/75 p-8 shadow-xl shadow-amber-100/70 backdrop-blur-xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-700/80">
            Notion Mini
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Đăng nhập</h2>
          <p className="mt-2 text-slate-600">
            Đăng nhập để quản lý ghi chú của bạn
          </p>
        </div>

        {searchParams?.message && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-sm text-emerald-800">
            {searchParams.message}
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  )
}