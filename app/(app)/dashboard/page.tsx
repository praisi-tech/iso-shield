// app/(app)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Server, AlertTriangle, ShieldAlert, Activity,
  ArrowRight, Plus, TrendingUp, Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/actions/organization'
import StatCard from '@/components/ui/StatCard'
import RiskBadge from '@/components/ui/RiskBadge'
import PageHeader from '@/components/ui/PageHeader'
import { formatDate, formatAssetType } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // STEP 1: Get profile (no join)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  console.log("USER ID:", user.id)
  console.log("PROFILE:", profile)
  console.log("PROFILE ERROR:", profileError)

  if (!profile) {
    console.log("PROFILE NOT FOUND")
    redirect('/organization')
  }

  const orgId = profile.organization_id as string

  // STEP 2: Get organization separately
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  console.log("ORG:", organization)
  console.log("ORG ERROR:", orgError)

  if (!organization) {
    console.log("ORG NOT FOUND")
    redirect('/organization')
  }

  // Parallel queries
  const [stats, recentAssets, highRiskItems] = await Promise.all([
    getDashboardStats(orgId),
    supabase
      .from('assets')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('asset_vulnerabilities')
      .select('*, vulnerability:vulnerabilities(*), asset:assets(name, type)')
      .eq('organization_id', orgId)
      .in('risk_level', ['critical', 'high'])
      .order('risk_score', { ascending: false })
      .limit(5),
  ])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title={`Welcome back, ${profile.full_name?.split(' ')[0] || 'User'} 👋`}
        subtitle={
          organization
            ? `${organization.name} · ${new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}`
            : 'Set up your organization to get started'
        }
        actions={
          <Link
            href="/assets/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </Link>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Assets" value={stats.totalAssets} icon={Server} color="brand" />
        <StatCard label="Critical Assets" value={stats.criticalAssets} icon={ShieldAlert} color="red" />
        <StatCard label="Vulnerabilities" value={stats.totalVulnerabilities} icon={Activity} color="orange" />
        <StatCard label="High/Critical Risks" value={stats.highRisks} icon={AlertTriangle} color="yellow" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            High Risk Items
          </h3>

          {highRiskItems.data?.length ? (
            <div className="space-y-2">
              {highRiskItems.data.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40">
                  <div>
                    <p className="text-xs font-medium text-slate-300">{item.vulnerability?.name}</p>
                    <p className="text-[11px] text-slate-600">
                      {item.asset?.name} · {formatAssetType(item.asset?.type)}
                    </p>
                  </div>
                  <RiskBadge level={item.risk_level} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 text-center py-8">No high-risk findings yet.</p>
          )}
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            Recent Assets
          </h3>

          {recentAssets.data?.length ? (
            <div className="space-y-2">
              {recentAssets.data.map((asset: any) => (
                <Link
                  key={asset.id}
                  href={`/assets/${asset.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40 hover:border-brand-500/20 transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-300">{asset.name}</p>
                    <p className="text-[11px] text-slate-600">
                      {formatAssetType(asset.type)} · Added {formatDate(asset.created_at)}
                    </p>
                  </div>
                  <RiskBadge level={asset.criticality} size="sm" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 text-center py-8">No assets yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}