'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get the redirect path from URL (e.g., /auth/login?redirect=/risk)
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear errors from URL if present (e.g., from middleware redirects)
  useEffect(() => {
    const errorMsg = searchParams.get('error')
    if (errorMsg) setError(decodeURIComponent(errorMsg))
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })

      if (authError) {
        // Handle common Supabase errors with friendly messages
        if (authError.message === 'Invalid login credentials') {
          setError('The email or password you entered is incorrect.')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      // 1. Refresh the router to ensure the middleware/server-side sees the new session
      router.refresh()
      
      // 2. Small delay to allow the cookie to be processed by the browser
      setTimeout(() => {
        router.push(redirectTo)
      }, 100)
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] bg-grid flex items-center justify-center p-4">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-4 glow-brand">
            <Shield className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            ISO Shield
          </h1>
          <p className="text-slate-500 text-sm mt-1">ISO 27001 Risk & Audit Platform</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Sign in to your account</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-dark">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="input-dark pl-10"
                  placeholder="auditor@company.com"
                />
              </div>
            </div>

            <div>
              <label className="label-dark">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="input-dark pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer group">
                <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500/20" />
                <span className="group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-brand-400 hover:text-brand-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium 
                         transition-all duration-200 flex items-center justify-center gap-2 
                         disabled:opacity-50 disabled:cursor-not-allowed glow-brand mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Demo hint */}
        <div className="mt-4 glass-sm rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500">
            Demo: Register a new account or use your Supabase credentials
          </p>
        </div>
      </div>
    </div>
  )
}