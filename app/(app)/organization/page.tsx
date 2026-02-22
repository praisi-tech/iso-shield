'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, Globe, Users, Mail, Phone, MapPin, 
  Server, Shield, AlertCircle, CheckCircle, Edit3, Save
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatSector, formatExposureLevel } from '@/lib/utils'
import type { Organization } from '@/types/models'
import PageHeader from '@/components/ui/PageHeader'

const sectors = [
  'financial', 'healthcare', 'government', 'education',
  'retail', 'manufacturing', 'technology', 'telecommunications', 'other'
]

const systemTypeOptions = [
  { id: 'web', label: 'Web Application' },
  { id: 'mobile', label: 'Mobile App' },
  { id: 'cloud', label: 'Cloud Services' },
  { id: 'on_premise', label: 'On-Premise' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'iot', label: 'IoT/OT Systems' },
  { id: 'api', label: 'APIs/Microservices' },
]

const exposureLevels = [
  { value: 'internet_facing', label: 'Internet-Facing', desc: 'Directly accessible from the internet' },
  { value: 'internal', label: 'Internal Only', desc: 'Only accessible within internal network' },
  { value: 'restricted', label: 'Restricted', desc: 'Limited access with strict controls' },
  { value: 'air_gapped', label: 'Air-Gapped', desc: 'Completely isolated from external networks' },
]

export default function OrganizationPage() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Organization>>({
    name: '', description: '', sector: 'technology', employee_count: null,
    website: '', address: '', country: 'Indonesia', contact_name: '',
    contact_email: '', contact_phone: '', system_types: [],
    exposure_level: 'internal', risk_appetite: 'medium', scope_description: '',
    audit_period_start: '', audit_period_end: '',
  })

  useEffect(() => {
    loadOrg()
  }, [])

  async function loadOrg() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) {
      setLoading(false)
      setEditing(true)
      return
    }

    const { data } = await supabase.from('organizations').select('*').eq('id', profile.organization_id).single()
    if (data) {
      setOrg(data)
      setForm(data)
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

    if (org && profile?.organization_id) {
      // Update
      const { error: err } = await supabase.from('organizations').update(form).eq('id', org.id)
      if (err) { setError(err.message); setSaving(false); return }
      setOrg({ ...org, ...form } as Organization)
    } else {
      // Create
      const { data: newOrg, error: err } = await supabase.from('organizations').insert({ ...form, created_by: user.id } as any).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      await supabase.from('profiles').update({ organization_id: newOrg.id, role: 'admin' }).eq('id', user.id)
      setOrg(newOrg)
    }

    setSaving(false)
    setSuccess(true)
    setEditing(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  const toggleSystemType = (type: string) => {
    const current: string[] = form.system_types ?? []
    setForm({
      ...form,
      system_types: current.includes(type) ? current.filter(t => t !== type) : [...current, type]
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Organization Profile"
        subtitle="Manage your organization's details and audit scope"
        actions={
          !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {org && (
                <button
                  onClick={() => { setEditing(false); setForm(org) }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {org ? 'Save Changes' : 'Create Organization'}
              </button>
            </div>
          )
        }
      />

      {success && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400">Organization profile saved successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!org && !editing && (
        <div className="glass rounded-xl p-12 text-center mb-6">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Organization Yet</h3>
          <p className="text-slate-500 text-sm mb-5">Set up your organization profile to start the audit process.</p>
          <button onClick={() => setEditing(true)} className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all">
            Create Organization
          </button>
        </div>
      )}

      {(editing || org) && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-400" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label-dark">Organization Name *</label>
                {editing ? (
                  <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" placeholder="PT. Contoh Indonesia" required />
                ) : (
                  <p className="text-slate-200 font-medium py-2">{org?.name || '—'}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="label-dark">Description</label>
                {editing ? (
                  <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="input-dark h-20 resize-none" placeholder="Brief description of the organization..." />
                ) : (
                  <p className="text-slate-400 py-2 text-sm">{org?.description || '—'}</p>
                )}
              </div>
              <div>
                <label className="label-dark">Business Sector *</label>
                {editing ? (
                  <select value={form.sector || 'technology'} onChange={e => setForm({ ...form, sector: e.target.value as any })} className="input-dark">
                    {sectors.map(s => (
                      <option key={s} value={s} className="bg-slate-900">{formatSector(s)}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-slate-200 py-2">{formatSector(org?.sector || '')}</p>
                )}
              </div>
              <div>
                <label className="label-dark">Number of Employees</label>
                {editing ? (
                  <input type="number" value={form.employee_count || ''} onChange={e => setForm({ ...form, employee_count: parseInt(e.target.value) || null })} className="input-dark" placeholder="e.g., 500" />
                ) : (
                  <p className="text-slate-200 py-2">{org?.employee_count?.toLocaleString() || '—'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-400" />
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-dark">Contact Person</label>
                {editing ? (
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" value={form.contact_name || ''} onChange={e => setForm({ ...form, contact_name: e.target.value })} className="input-dark pl-10" placeholder="John Doe" />
                  </div>
                ) : (
                  <p className="text-slate-200 py-2 flex items-center gap-2"><Users className="w-4 h-4 text-slate-600" />{org?.contact_name || '—'}</p>
                )}
              </div>
              <div>
                <label className="label-dark">Contact Email</label>
                {editing ? (
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="email" value={form.contact_email || ''} onChange={e => setForm({ ...form, contact_email: e.target.value })} className="input-dark pl-10" placeholder="security@company.com" />
                  </div>
                ) : (
                  <p className="text-slate-200 py-2 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-600" />{org?.contact_email || '—'}</p>
                )}
              </div>
              <div>
                <label className="label-dark">Phone</label>
                {editing ? (
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="tel" value={form.contact_phone || ''} onChange={e => setForm({ ...form, contact_phone: e.target.value })} className="input-dark pl-10" placeholder="+62 21 1234 5678" />
                  </div>
                ) : (
                  <p className="text-slate-200 py-2 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-600" />{org?.contact_phone || '—'}</p>
                )}
              </div>
              <div>
                <label className="label-dark">Website</label>
                {editing ? (
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="url" value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} className="input-dark pl-10" placeholder="https://company.com" />
                  </div>
                ) : (
                  <p className="text-slate-200 py-2 flex items-center gap-2"><Globe className="w-4 h-4 text-slate-600" />{org?.website || '—'}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="label-dark">Address</label>
                {editing ? (
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <textarea value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="input-dark pl-10 h-16 resize-none" placeholder="Jl. Sudirman No. 1, Jakarta 10220" />
                  </div>
                ) : (
                  <p className="text-slate-200 py-2 flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-600 mt-0.5" />{org?.address || '—'}</p>
                )}
              </div>
            </div>
          </div>

          {/* System & Exposure */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-400" />
              System Profile
            </h3>

            <div className="mb-5">
              <label className="label-dark mb-3 block">System Types in Scope</label>
              <div className="grid grid-cols-4 gap-2">
                {systemTypeOptions.map(({ id, label }) => {
                  const selected = (form.system_types || []).includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={!editing}
                      onClick={() => editing && toggleSystemType(id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        selected
                          ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                          : 'bg-slate-900/40 border-slate-800 text-slate-500'
                      } ${editing ? 'cursor-pointer hover:border-brand-500/30' : 'cursor-default'}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mb-5">
              <label className="label-dark mb-3 block">Exposure Level</label>
              <div className="grid grid-cols-2 gap-2">
                {exposureLevels.map(({ value, label, desc }) => {
                  const selected = form.exposure_level === value
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!editing}
                      onClick={() => editing && setForm({ ...form, exposure_level: value as any })}
                      className={`p-3 rounded-lg text-left border transition-all ${
                        selected
                          ? 'bg-brand-500/10 border-brand-500/40'
                          : 'bg-slate-900/40 border-slate-800'
                      } ${editing ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <p className={`text-xs font-semibold ${selected ? 'text-brand-300' : 'text-slate-400'}`}>{label}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">{desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label-dark">Risk Appetite</label>
                {editing ? (
                  <select value={form.risk_appetite || 'medium'} onChange={e => setForm({ ...form, risk_appetite: e.target.value as any })} className="input-dark">
                    <option value="low" className="bg-slate-900">Low — Conservative</option>
                    <option value="medium" className="bg-slate-900">Medium — Balanced</option>
                    <option value="high" className="bg-slate-900">High — Aggressive</option>
                  </select>
                ) : (
                  <p className="text-slate-200 py-2 capitalize">{org?.risk_appetite || 'medium'}</p>
                )}
              </div>
              <div>
                <label className="label-dark">Audit Period Start</label>
                {editing ? (
                  <input type="date" value={form.audit_period_start || ''} onChange={e => setForm({ ...form, audit_period_start: e.target.value })} className="input-dark" />
                ) : (
                  <p className="text-slate-200 py-2">{org?.audit_period_start || '—'}</p>
                )}
              </div>
              <div>
                <label className="label-dark">Audit Period End</label>
                {editing ? (
                  <input type="date" value={form.audit_period_end || ''} onChange={e => setForm({ ...form, audit_period_end: e.target.value })} className="input-dark" />
                ) : (
                  <p className="text-slate-200 py-2">{org?.audit_period_end || '—'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Scope */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-400" />
              Audit Scope
            </h3>
            <label className="label-dark">Scope Description</label>
            {editing ? (
              <textarea
                value={form.scope_description || ''}
                onChange={e => setForm({ ...form, scope_description: e.target.value })}
                className="input-dark h-28 resize-none"
                placeholder="Describe the scope of this ISO 27001 audit. What systems, processes, and locations are included?"
              />
            ) : (
              <p className="text-slate-400 text-sm leading-relaxed py-2">{org?.scope_description || '—'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


