'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Shield, LayoutDashboard, Building2, Server, BarChart3, 
  ClipboardList, FolderOpen, PieChart, AlertTriangle, 
  FileText, Users, LogOut, ChevronRight, Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'
  type Profile = Database['public']['Tables']['profiles']['Row']
import { getInitials } from '@/lib/utils'

interface SidebarProps {
  profile: Profile | null
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/organization', label: 'Organization', icon: Building2 },
  { href: '/assets', label: 'Assets', icon: Server },
  { href: '/risk', label: 'Risk Matrix', icon: BarChart3 },
]

const phase2Items = [
  { href: '/checklist', label: 'ISO Checklist', icon: ClipboardList },
  { href: '/evidence', label: 'Evidence', icon: FolderOpen },
  { href: '/compliance', label: 'Compliance', icon: PieChart },
]

const phase3Items = [
  { href: '/findings', label: 'Findings', icon: AlertTriangle },
  { href: '/report', label: 'Audit Report', icon: FileText },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const roleBadgeColor: Record<string, string> = {
    admin: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
    auditor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    auditee: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-[#0a0f1e] border-r border-slate-800/60">
      <div className="p-5 border-b border-slate-800/60">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <span className="text-white font-bold text-base leading-tight block">ISO Shield</span>
            <span className="text-slate-600 text-xs">ISO 27001 Platform</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-5">
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Phase 1</p>
          <div className="space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={`sidebar-link ${isActive(href) ? 'active' : ''}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {isActive(href) && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Phase 2</p>
          <div className="space-y-0.5">
            {phase2Items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={`sidebar-link ${isActive(href) ? 'active' : ''}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {isActive(href) && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Phase 3</p>
          <div className="space-y-0.5">
            {phase3Items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={`sidebar-link ${isActive(href) ? 'active' : ''}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {isActive(href) && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">AI</p>
          <Link
            href="/ai-assistant"
            className={`sidebar-link ${isActive('/ai-assistant')
              ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
              : 'text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/5'
            }`}
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            AI Assistant
            {!isActive('/ai-assistant') && (
              <span className="ml-auto text-[9px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">NEW</span>
            )}
            {isActive('/ai-assistant') && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
          </Link>
        </div>
      </nav>

      <div className="p-3 border-t border-slate-800/60 space-y-1">
        <Link href="/settings" className="sidebar-link">
          <Users className="w-4 h-4 flex-shrink-0" />
          User Management
        </Link>
        <button onClick={handleLogout} className="sidebar-link w-full text-left text-red-500/70 hover:text-red-400 hover:bg-red-500/5">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
        </button>
        {profile && (
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-300 flex-shrink-0">
              {profile.full_name ? getInitials(profile.full_name) : '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-300 font-medium truncate">{profile.full_name || 'User'}</p>
              <span className={`text-[10px] border rounded px-1.5 py-0.5 font-medium ${roleBadgeColor[profile.role] || roleBadgeColor.auditee}`}>
                {profile.role.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
