import React, { useState, useEffect } from 'react'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/supabase'
import { Users, Briefcase, Building2, TrendingUp, Trash2, Eye, LogOut, RefreshCw, DollarSign, FileText, Bell } from 'lucide-react'

const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }

const AdminPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)

  // Data
  const [candidates, setCandidates] = useState([])
  const [companies, setCompanies] = useState([])
  const [jobs, setJobs] = useState([])
  const [matches, setMatches] = useState([])
  const [consultants, setConsultants] = useState([])
  const [placements, setPlacements] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [bulkTab, setBulkTab] = useState('candidate')
  const [bulkData, setBulkData] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [editingType, setEditingType] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [supportChats, setSupportChats] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [adminReply, setAdminReply] = useState('')
  const [team, setTeam] = useState([])
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [teamForm, setTeamForm] = useState({
    name: '', email: '', password: '', role: 'staff', status: 'active',
    permissions: {
      view_candidates: true, edit_candidates: false, delete_candidates: false,
      view_companies: true, edit_companies: false, delete_companies: false,
      view_jobs: true, edit_jobs: false, delete_jobs: false,
      view_consultants: true, edit_consultants: false, delete_consultants: false,
      view_invoices: false, view_payments: false, bulk_upload: false,
      support_inbox: false, manage_users: false
    }
  })

  useEffect(() => {
    const saved = localStorage.getItem('admin_session')
    if (saved) { setIsLoggedIn(true); loadAllData() }
  }, [])

  const handleLogin = async () => {
    if (!username || !password) { setError('Fill all fields'); return }
    setLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_users?username=eq.${encodeURIComponent(username)}&select=*`, { headers: h })
      const data = await res.json()
      if (!data.length || data[0].password !== password) { setError('Invalid credentials'); return }
      setIsLoggedIn(true)
      localStorage.setItem('admin_session', 'true')
      await loadAllData()
    } catch { setError('Login failed') }
    finally { setLoading(false) }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [ca, co, jo, ma, cn, pl, inv, pay] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/candidates?select=*&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/companies?select=*&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/jobs?select=*,companies(company_name)&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/matches?select=*&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/consultants?select=*&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/placements?select=*&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/invoices?select=*&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/payments?select=*&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/support_chats?select=*&order=created_at.desc&limit=100`, { headers: h }),
      ])
      setCandidates(await ca.json())
      setCompanies(await co.json())
      setJobs(await jo.json())
      setMatches(await ma.json())
      setConsultants(await cn.json())
      setPlacements(await pl.json())
      setInvoices(await inv.json())
      setPayments(await pay.json())
      const teamRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_team?select=*&order=created_at.desc`, { headers: h })
      setTeam(await teamRes.json())
      const scRes = await fetch(`${SUPABASE_URL}/rest/v1/support_chats?select=*&order=created_at.desc&limit=100`, { headers: h })
      setSupportChats(await scRes.json())
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const deleteRecord = async (table, id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      // For consultants - delete related records first
      if (table === 'consultants') {
        const relatedTables = ['vacancy_matches', 'consultant_vacancies', 'interview_letters', 'followups', 'payments', 'invoices', 'placements', 'consultant_clients']
        for (const t of relatedTables) {
          await fetch(`${SUPABASE_URL}/rest/v1/${t}?consultant_id=eq.${id}`, { method: 'DELETE', headers: h })
        }
      }
      // For companies - delete related records first
      if (table === 'companies') {
        const jobs = await (await fetch(`${SUPABASE_URL}/rest/v1/jobs?company_id=eq.${id}&select=id`, { headers: h })).json()
        for (const job of jobs) {
          await fetch(`${SUPABASE_URL}/rest/v1/matches?job_id=eq.${job.id}`, { method: 'DELETE', headers: h })
        }
        await fetch(`${SUPABASE_URL}/rest/v1/jobs?company_id=eq.${id}`, { method: 'DELETE', headers: h })
      }
      // For candidates - delete related records first  
      if (table === 'candidates') {
        await fetch(`${SUPABASE_URL}/rest/v1/matches?candidate_id=eq.${id}`, { method: 'DELETE', headers: h })
      }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: 'DELETE', headers: h })
      if (!res.ok) {
        const err = await res.text()
        alert('Delete failed: ' + err)
        return
      }
      await loadAllData()
    } catch(e) {
      alert('Error: ' + e.message)
    }
  }

  const toggleJobStatus = async (id, status) => {
    await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${id}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: status === 'active' ? 'inactive' : 'active' })
    })
    await loadAllData()
  }

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    return lines.slice(1).map(line => {
      const vals = []
      let inQuotes = false
      let val = ''
      for (let ch of line) {
        if (ch === '"') { inQuotes = !inQuotes }
        else if (ch === ',' && !inQuotes) { vals.push(val.trim()); val = '' }
        else { val += ch }
      }
      vals.push(val.trim())
      const obj = {}
      headers.forEach((h, i) => { obj[h] = vals[i] || '' })
      return obj
    }).filter(row => Object.values(row).some(v => v))
  }

  const handleCSVUpload = (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result)
      setBulkData(parsed)
      setBulkResult(null)
    }
    reader.readAsText(file)
  }

  const uploadBulkCandidates = async () => {
    if (!bulkData.length) { alert('No data to upload'); return }
    setBulkLoading(true)
    let success = 0, failed = 0, skipped = 0
    for (const row of bulkData) {
      try {
        if (!row.name || !row.email) { failed++; continue }
        const check = await fetch(`${SUPABASE_URL}/rest/v1/candidates?email=eq.${encodeURIComponent(row.email)}&select=id`, { headers: h })
        const existing = await check.json()
        if (existing.length > 0) { skipped++; continue }
        const skills = row.skills ? row.skills.split(',').map(s => s.trim()) : []
        const res = await fetch(`${SUPABASE_URL}/rest/v1/candidates`, {
          method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            name: row.name, email: row.email, phone: row.phone || null,
            job_title: row.job_title || null, experience_years: parseInt(row.experience_years) || 0,
            parsed_skills: skills, location: row.location || null,
            password: row.password || 'Welcome@123', source: 'bulk_import'
          })
        })
        if (res.ok) success++; else failed++
      } catch { failed++ }
    }
    setBulkResult({ success, failed, skipped })
    setBulkLoading(false)
    setBulkData([])
    await loadAllData()
  }

  const uploadBulkCompanies = async () => {
    if (!bulkData.length) { alert('No data to upload'); return }
    setBulkLoading(true)
    let success = 0, failed = 0, skipped = 0
    for (const row of bulkData) {
      try {
        if (!row.company_name || !row.email) { failed++; continue }
        const check = await fetch(`${SUPABASE_URL}/rest/v1/companies?email=eq.${encodeURIComponent(row.email)}&select=id`, { headers: h })
        const existing = await check.json()
        if (existing.length > 0) { skipped++; continue }
        const res = await fetch(`${SUPABASE_URL}/rest/v1/companies`, {
          method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            company_name: row.company_name, email: row.email,
            phone: row.phone || null, industry: row.industry || null,
            location: row.location || null, website: row.website || null,
            password: row.password || 'Company@123', source: 'bulk_import'
          })
        })
        if (res.ok) success++; else failed++
      } catch { failed++ }
    }
    setBulkResult({ success, failed, skipped })
    setBulkLoading(false)
    setBulkData([])
    await loadAllData()
  }

  const updateUser = async () => {
    if (!editingUser) return
    const table = editingType === 'candidate' ? 'candidates' : editingType === 'company' ? 'companies' : 'consultants'
    const updateData = {}
    if (editingType === 'candidate') {
      updateData.name = editForm.name
      updateData.email = editForm.email
      updateData.phone = editForm.phone
      updateData.job_title = editForm.job_title
      updateData.experience_years = parseInt(editForm.experience_years) || 0
      if (editForm.password) updateData.password = editForm.password
    } else if (editingType === 'company') {
      updateData.company_name = editForm.company_name
      updateData.email = editForm.email
      updateData.phone = editForm.phone
      if (editForm.password) updateData.password = editForm.password
    } else if (editingType === 'consultant') {
      updateData.name = editForm.name
      updateData.email = editForm.email
      updateData.phone = editForm.phone
      updateData.company_name = editForm.company_name
      if (editForm.password) updateData.password = editForm.password
    }
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${editingUser.id}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify(updateData)
    })
    setEditingUser(null)
    setEditForm({})
    await loadAllData()
    alert('Updated successfully!')
  }

  const addTeamMember = async () => {
    if (!teamForm.name || !teamForm.email || !teamForm.password) { alert('Name, email, password required'); return }
    const method = editingTeam ? 'PATCH' : 'POST'
    const url = editingTeam 
      ? `${SUPABASE_URL}/rest/v1/admin_team?id=eq.${editingTeam.id}`
      : `${SUPABASE_URL}/rest/v1/admin_team`
    await fetch(url, {
      method, headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify(teamForm)
    })
    setShowTeamForm(false)
    setEditingTeam(null)
    setTeamForm({
      name: '', email: '', password: '', role: 'staff', status: 'active',
      permissions: {
        view_candidates: true, edit_candidates: false, delete_candidates: false,
        view_companies: true, edit_companies: false, delete_companies: false,
        view_jobs: true, edit_jobs: false, delete_jobs: false,
        view_consultants: true, edit_consultants: false, delete_consultants: false,
        view_invoices: false, view_payments: false, bulk_upload: false,
        support_inbox: false, manage_users: false
      }
    })
    await loadAllData()
  }

  const toggleTeamStatus = async (id, status) => {
    await fetch(`${SUPABASE_URL}/rest/v1/admin_team?id=eq.${id}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: status === 'active' ? 'inactive' : 'active' })
    })
    await loadAllData()
  }

  const PERMISSION_LABELS = {
    view_candidates: 'View Candidates',
    edit_candidates: 'Edit Candidates',
    delete_candidates: 'Delete Candidates',
    view_companies: 'View Companies',
    edit_companies: 'Edit Companies',
    delete_companies: 'Delete Companies',
    view_jobs: 'View Jobs',
    edit_jobs: 'Edit Jobs',
    delete_jobs: 'Delete Jobs',
    view_consultants: 'View Consultants',
    edit_consultants: 'Edit Consultants',
    delete_consultants: 'Delete Consultants',
    view_invoices: 'View Invoices',
    view_payments: 'View Payments',
    bulk_upload: 'Bulk Upload',
    support_inbox: 'Support Inbox',
    manage_users: 'Manage Users'
  }

  const ROLE_PRESETS = {
    admin: { view_candidates: true, edit_candidates: true, delete_candidates: true, view_companies: true, edit_companies: true, delete_companies: true, view_jobs: true, edit_jobs: true, delete_jobs: true, view_consultants: true, edit_consultants: true, delete_consultants: true, view_invoices: true, view_payments: true, bulk_upload: true, support_inbox: true, manage_users: true },
    manager: { view_candidates: true, edit_candidates: true, delete_candidates: false, view_companies: true, edit_companies: true, delete_companies: false, view_jobs: true, edit_jobs: true, delete_jobs: false, view_consultants: true, edit_consultants: true, delete_consultants: false, view_invoices: true, view_payments: true, bulk_upload: true, support_inbox: true, manage_users: false },
    staff: { view_candidates: true, edit_candidates: false, delete_candidates: false, view_companies: true, edit_companies: false, delete_companies: false, view_jobs: true, edit_jobs: false, delete_jobs: false, view_consultants: true, edit_consultants: false, delete_consultants: false, view_invoices: false, view_payments: false, bulk_upload: false, support_inbox: true, manage_users: false },
    support: { view_candidates: false, edit_candidates: false, delete_candidates: false, view_companies: false, edit_companies: false, delete_companies: false, view_jobs: false, edit_jobs: false, delete_jobs: false, view_consultants: false, edit_consultants: false, delete_consultants: false, view_invoices: false, view_payments: false, bulk_upload: false, support_inbox: true, manage_users: false }
  }

  const totalRevenue = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const pendingInvoices = invoices.filter(i => i.status === 'unpaid')

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-4">Z</div>
            <h1 className="text-2xl font-black">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-1">Zenrixi Owner Access</p>
          </div>
          {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-xl">{error}</p>}
          <div className="space-y-3">
            <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleLogin} disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl disabled:opacity-60">
              {loading ? 'Logging in...' : 'Login as Admin →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-blue-950 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl">Z</div>
          <div>
            <div className="font-black text-lg">Zenrixi Admin</div>
            <div className="text-blue-300 text-xs">Owner Dashboard</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadAllData} className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('admin_session') }}
            className="flex items-center gap-1 text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-lg text-red-300">
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r hidden md:flex flex-col p-4 gap-1 sticky top-[64px] h-[calc(100vh-64px)]">
          {[
            ['dashboard', 'Dashboard', TrendingUp],
            ['candidates', `Candidates (${candidates.length})`, Users],
            ['companies', `Companies (${companies.length})`, Building2],
            ['jobs', `Jobs (${jobs.length})`, Briefcase],
            ['consultants', `Consultants (${consultants.length})`, Users],
            ['placements', `Placements (${placements.length})`, TrendingUp],
            ['invoices', `Invoices (${invoices.length})`, FileText],
            ['payments', `Payments (${payments.length})`, DollarSign],
          ].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${tab===id?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </button>
          ))}
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full">
          <div className="flex gap-2 p-3 bg-white border-b overflow-x-auto">
            {[['dashboard','Dashboard'],['candidates','Candidates'],['companies','Companies'],['jobs','Jobs'],['consultants','Consultants'],['invoices','Invoices'],['payments','Payments'],['bulk','Bulk Upload'],['support','Support'],['team','Team'],['analytics','Analytics']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${tab===id?'bg-blue-600 text-white':'bg-gray-100 text-gray-600'}`}>{label}</button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-6">

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black">Welcome, Bijendra! 👑</h2>
                <p className="text-gray-500 text-sm">Complete overview of Zenrixi platform</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ['Total Candidates', candidates.length, 'bg-blue-500', Users],
                  ['Total Companies', companies.length, 'bg-green-500', Building2],
                  ['Active Jobs', jobs.filter(j=>j.status==='active').length, 'bg-purple-500', Briefcase],
                  ['Consultants', consultants.length, 'bg-orange-500', Users],
                  ['Total Matches', matches.length, 'bg-teal-500', TrendingUp],
                  ['Placements', placements.length, 'bg-pink-500', TrendingUp],
                  ['Total Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`, 'bg-emerald-500', DollarSign],
                  ['Pending Invoices', pendingInvoices.length, 'bg-red-500', Bell],
                ].map(([label, value, color, Icon]) => (
                  <div key={label} className="bg-white rounded-2xl border p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                    <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-black">{value}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Recent Candidates</h3>
                  <div className="space-y-3">
                    {candidates.slice(0,5).map(c => (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">{c.name?.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.email}</p>
                          </div>
                        </div>
                        <button onClick={() => deleteRecord('candidates', c.id, c.name)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-green-500" /> Recent Companies</h3>
                  <div className="space-y-3">
                    {companies.slice(0,5).map(c => (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">{c.company_name?.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-medium">{c.company_name}</p>
                            <p className="text-xs text-gray-400">{c.email}</p>
                          </div>
                        </div>
                        <button onClick={() => deleteRecord('companies', c.id, c.company_name)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CANDIDATES */}
          
          {tab === 'analytics' && (
            <AnalyticsTab supabaseUrl={SUPABASE_URL} headers={h} counts={{candidates: candidates.length, companies: companies.length, consultants: consultants.length}} />
          )}
          {tab === 'candidates' && (
            <div>
              <h2 className="text-2xl font-black mb-6">All Candidates ({candidates.length})</h2>
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Phone</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Experience</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c, i) => (
                      <tr key={c.id} className={`border-b hover:bg-gray-50 ${i%2===0?'':'bg-gray-50/30'}`}>
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.email}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.phone || '—'}</td>
                        <td className="px-4 py-3 hidden md:table-cell">{c.experience_years || 0} yrs</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingUser(c); setEditingType('candidate'); setEditForm({...c, password: ''}) }}
                              className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-200">✏️ Edit</button>
                            <button onClick={() => deleteRecord('candidates', c.id, c.name)}
                              className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COMPANIES */}
          {tab === 'companies' && (
            <div>
              <h2 className="text-2xl font-black mb-6">All Companies ({companies.length})</h2>
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Company</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Phone</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c, i) => (
                      <tr key={c.id} className={`border-b hover:bg-gray-50 ${i%2===0?'':'bg-gray-50/30'}`}>
                        <td className="px-4 py-3 font-medium">{c.company_name}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.email}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingUser(c); setEditingType('company'); setEditForm({...c, password: ''}) }}
                              className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-200">✏️ Edit</button>
                            <button onClick={() => deleteRecord('companies', c.id, c.company_name)}
                              className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* JOBS */}
          {tab === 'jobs' && (
            <div>
              <h2 className="text-2xl font-black mb-6">All Jobs ({jobs.length})</h2>
              <div className="space-y-3">
                {jobs.map(j => (
                  <div key={j.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{j.title}</h3>
                      <p className="text-xs text-gray-500">{j.companies?.company_name} • Min {j.min_experience}yr exp</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${j.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{j.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleJobStatus(j.id, j.status)}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">
                        {j.status==='active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => deleteRecord('jobs', j.id, j.title)}
                        className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONSULTANTS */}
          {tab === 'consultants' && (
            <div>
              <h2 className="text-2xl font-black mb-6">All Consultants ({consultants.length})</h2>
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Company</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultants.map((c, i) => (
                      <tr key={c.id} className={`border-b hover:bg-gray-50 ${i%2===0?'':'bg-gray-50/30'}`}>
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.company_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingUser(c); setEditingType('consultant'); setEditForm({...c, password: ''}) }}
                              className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-200">✏️ Edit</button>
                            <button onClick={() => deleteRecord('consultants', c.id, c.name)}
                              className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PLACEMENTS */}
          {tab === 'placements' && (
            <div>
              <h2 className="text-2xl font-black mb-6">All Placements ({placements.length})</h2>
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Candidate</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Position</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">CTC</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Commission</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placements.map((p, i) => (
                      <tr key={p.id} className={`border-b hover:bg-gray-50 ${i%2===0?'':'bg-gray-50/30'}`}>
                        <td className="px-4 py-3 font-medium">{p.candidate_name}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.position}</td>
                        <td className="px-4 py-3 hidden md:table-cell">₹{Number(p.ctc).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-green-600 font-medium hidden md:table-cell">₹{Number(p.commission_amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteRecord('placements', p.id, p.candidate_name)}
                            className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INVOICES */}
          {tab === 'invoices' && (
            <div>
              <h2 className="text-2xl font-black mb-4">All Invoices ({invoices.length})</h2>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <p className="text-sm text-green-700 font-medium">Paid</p>
                  <p className="text-2xl font-black text-green-700">{invoices.filter(i=>i.status==='paid').length}</p>
                </div>
                <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
                  <p className="text-sm text-yellow-700 font-medium">Unpaid</p>
                  <p className="text-2xl font-black text-yellow-700">{invoices.filter(i=>i.status==='unpaid').length}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Invoice #</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, i) => (
                      <tr key={inv.id} className={`border-b hover:bg-gray-50 ${i%2===0?'':'bg-gray-50/30'}`}>
                        <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 font-bold">₹{Number(inv.total).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status==='paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteRecord('invoices', inv.id, inv.invoice_number)}
                            className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAYMENTS */}
          {tab === 'payments' && (
            <div>
              <h2 className="text-2xl font-black mb-4">All Payments ({payments.length})</h2>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white mb-5">
                <p className="text-sm opacity-80">Total Revenue</p>
                <p className="text-4xl font-black">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Mode</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Reference</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={p.id} className={`border-b hover:bg-gray-50 ${i%2===0?'':'bg-gray-50/30'}`}>
                        <td className="px-4 py-3 font-bold text-green-600">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.payment_mode}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.reference_number || '—'}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteRecord('payments', p.id, `₹${p.amount}`)}
                            className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* TEAM MANAGEMENT */}
          {tab === 'team' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black">User Management</h2>
                  <p className="text-gray-500 text-sm mt-1">Add team members and manage their access rights</p>
                </div>
                <button onClick={() => { setShowTeamForm(true); setEditingTeam(null) }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                  + Add User
                </button>
              </div>

              {/* Role presets info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  ['👑 Admin', 'Full access to everything', 'bg-purple-50 border-purple-200 text-purple-700'],
                  ['🎯 Manager', 'View + Edit, no delete', 'bg-blue-50 border-blue-200 text-blue-700'],
                  ['👤 Staff', 'View only + Support', 'bg-green-50 border-green-200 text-green-700'],
                  ['🎧 Support', 'Support inbox only', 'bg-orange-50 border-orange-200 text-orange-700'],
                ].map(([role, desc, cls]) => (
                  <div key={role} className={`border rounded-xl p-3 \${cls}`}>
                    <p className="font-bold text-sm">{role}</p>
                    <p className="text-xs mt-1 opacity-80">{desc}</p>
                  </div>
                ))}
              </div>

              {/* Team list */}
              {team.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <div className="text-5xl mb-3">👥</div>
                  <p className="text-gray-500">No team members yet. Add your first user!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {team.map(member => (
                    <div key={member.id} className="bg-white rounded-2xl border p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            {member.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold">{member.name}</h3>
                            <p className="text-sm text-gray-500">{member.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium \${member.role==='admin'?'bg-purple-100 text-purple-700':member.role==='manager'?'bg-blue-100 text-blue-700':member.role==='support'?'bg-orange-100 text-orange-700':'bg-green-100 text-green-700'}`}>
                                {member.role}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium \${member.status==='active'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                                {member.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleTeamStatus(member.id, member.status)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium \${member.status==='active'?'bg-red-100 text-red-600 hover:bg-red-200':'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                            {member.status==='active' ? '⏸ Deactivate' : '▶ Activate'}
                          </button>
                          <button onClick={() => { setEditingTeam(member); setTeamForm({...member, password: ''}); setShowTeamForm(true) }}
                            className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-200">✏️ Edit</button>
                          <button onClick={() => deleteRecord('admin_team', member.id, member.name)}
                            className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200">🗑</button>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-semibold text-gray-500 mb-2">PERMISSIONS</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(member.permissions || {}).filter(([k,v]) => v).map(([key]) => (
                            <span key={key} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              {PERMISSION_LABELS[key] || key}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit User Modal */}
              {showTeamForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTeamForm(false)}>
                  <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-lg font-bold">{editingTeam ? 'Edit User' : 'Add New User'}</h3>
                      <button onClick={() => setShowTeamForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                    </div>

                    {/* Basic info */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name*</label>
                        <input value={teamForm.name} onChange={e => setTeamForm({...teamForm, name:e.target.value})}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full h-10 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Email*</label>
                        <input type="email" value={teamForm.email} onChange={e => setTeamForm({...teamForm, email:e.target.value})}
                          placeholder="rahul@zenrixi.com"
                          className="w-full h-10 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">{editingTeam ? 'New Password (optional)' : 'Password*'}</label>
                        <input type="password" value={teamForm.password} onChange={e => setTeamForm({...teamForm, password:e.target.value})}
                          placeholder={editingTeam ? 'Leave blank to keep' : 'Set password'}
                          className="w-full h-10 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Role</label>
                        <select value={teamForm.role} onChange={e => {
                          const role = e.target.value
                          setTeamForm({...teamForm, role, permissions: ROLE_PRESETS[role] || teamForm.permissions})
                        }} className="w-full h-10 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="admin">👑 Admin</option>
                          <option value="manager">🎯 Manager</option>
                          <option value="staff">👤 Staff</option>
                          <option value="support">🎧 Support</option>
                        </select>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="border rounded-2xl p-4 mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-sm">Custom Permissions</h4>
                        <div className="flex gap-2">
                          <button onClick={() => setTeamForm({...teamForm, permissions: Object.fromEntries(Object.keys(PERMISSION_LABELS).map(k => [k, true]))})}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">All On</button>
                          <button onClick={() => setTeamForm({...teamForm, permissions: Object.fromEntries(Object.keys(PERMISSION_LABELS).map(k => [k, false]))})}
                            className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg">All Off</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <div className="relative">
                              <input type="checkbox" checked={teamForm.permissions[key] || false}
                                onChange={e => setTeamForm({...teamForm, permissions: {...teamForm.permissions, [key]: e.target.checked}})}
                                className="sr-only" />
                              <div className={`w-9 h-5 rounded-full transition-colors \${teamForm.permissions[key] ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform \${teamForm.permissions[key] ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                              </div>
                            </div>
                            <span className="text-sm text-gray-700">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button onClick={addTeamMember}
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                      {editingTeam ? '💾 Save Changes' : '➕ Add User'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* SUPPORT INBOX */}
          {tab === 'support' && (
            <div>
              <h2 className="text-2xl font-black mb-2">Support Inbox</h2>
              <p className="text-gray-500 text-sm mb-6">All user conversations from Zeni Support chatbot</p>

              {supportChats.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <div className="text-5xl mb-3">💬</div>
                  <p className="text-gray-500">No support conversations yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Sessions list */}
                  <div className="bg-white rounded-2xl border overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="font-bold text-sm">Conversations ({[...new Set(supportChats.map(c => c.session_id))].length})</h3>
                    </div>
                    <div className="overflow-y-auto max-h-[500px]">
                      {[...new Set(supportChats.map(c => c.session_id))].map(sessionId => {
                        const sessionChats = supportChats.filter(c => c.session_id === sessionId)
                        const latest = sessionChats[0]
                        const hasOpen = sessionChats.some(c => c.status === 'open')
                        return (
                          <div key={sessionId} onClick={() => setSelectedSession(sessionId)}
                            className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors \${selectedSession === sessionId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-mono text-gray-400">{sessionId.slice(0,15)}...</span>
                              {hasOpen && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                            </div>
                            <p className="text-sm text-gray-700 truncate">{latest?.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(latest?.created_at).toLocaleString('en-IN')}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full \${hasOpen ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {hasOpen ? 'Open' : 'Resolved'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Chat detail */}
                  <div className="md:col-span-2 bg-white rounded-2xl border overflow-hidden">
                    {selectedSession ? (
                      <>
                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                          <h3 className="font-bold text-sm">Conversation Detail</h3>
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              const sessionMsgs = supportChats.filter(c => c.session_id === selectedSession)
                              for (const msg of sessionMsgs) {
                                await fetch(`${SUPABASE_URL}/rest/v1/support_chats?id=eq.\${msg.id}`, {
                                  method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
                                  body: JSON.stringify({ status: 'resolved' })
                                })
                              }
                              await loadAllData()
                            }} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200">
                              ✓ Mark Resolved
                            </button>
                            <button onClick={async () => {
                              if (!confirm('Delete this conversation?')) return
                              const sessionMsgs = supportChats.filter(c => c.session_id === selectedSession)
                              for (const msg of sessionMsgs) {
                                await fetch(`${SUPABASE_URL}/rest/v1/support_chats?id=eq.\${msg.id}`, {
                                  method: 'DELETE', headers: h
                                })
                              }
                              setSelectedSession(null)
                              await loadAllData()
                            }} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200">
                              🗑 Delete
                            </button>
                          </div>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[400px] space-y-4">
                          {supportChats.filter(c => c.session_id === selectedSession).reverse().map(chat => (
                            <div key={chat.id} className="space-y-2">
                              {/* User message */}
                              <div className="flex justify-end">
                                <div className="bg-blue-600 text-white text-sm px-4 py-2 rounded-2xl rounded-br-sm max-w-xs">
                                  {chat.message}
                                </div>
                              </div>
                              {/* AI Reply */}
                              {chat.reply && (
                                <div className="flex justify-start gap-2">
                                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-sm shrink-0">🤖</div>
                                  <div className="bg-gray-100 text-gray-800 text-sm px-4 py-2 rounded-2xl rounded-bl-sm max-w-xs">
                                    {chat.reply}
                                  </div>
                                </div>
                              )}
                              <p className="text-xs text-gray-400 text-center">{new Date(chat.created_at).toLocaleString('en-IN')}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[300px] text-gray-400">
                        <div className="text-center">
                          <div className="text-4xl mb-2">💬</div>
                          <p className="text-sm">Select a conversation to view</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* BULK UPLOAD */}
          {tab === 'bulk' && (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-black mb-2">Bulk Upload</h2>
              <p className="text-gray-500 text-sm mb-6">Upload candidates or companies via CSV file</p>

              {/* Tab selector */}
              <div className="flex gap-3 mb-6">
                <button onClick={() => { setBulkTab('candidate'); setBulkData([]); setBulkResult(null) }}
                  className={`px-5 py-2 rounded-xl font-bold text-sm \${bulkTab==='candidate'?'bg-blue-600 text-white':'bg-gray-100 text-gray-600'}`}>
                  👤 Candidates
                </button>
                <button onClick={() => { setBulkTab('company'); setBulkData([]); setBulkResult(null) }}
                  className={`px-5 py-2 rounded-xl font-bold text-sm \${bulkTab==='company'?'bg-green-600 text-white':'bg-gray-100 text-gray-600'}`}>
                  🏢 Companies
                </button>
              </div>

              {/* Download template */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-5">
                <h3 className="font-bold text-blue-800 mb-2">📥 Step 1: Download Template</h3>
                <p className="text-sm text-blue-600 mb-3">Download the CSV template, fill in the data, and upload below.</p>
                <a href={bulkTab === 'candidate' ? '/candidate_template.csv' : '/company_template.csv'}
                  download className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">
                  ⬇️ Download {bulkTab === 'candidate' ? 'Candidate' : 'Company'} Template
                </a>
              </div>

              {/* Upload CSV */}
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 mb-5 text-center">
                <h3 className="font-bold mb-2">📤 Step 2: Upload CSV File</h3>
                <p className="text-sm text-gray-500 mb-4">Select your filled CSV file</p>
                <input type="file" accept=".csv" onChange={e => handleCSVUpload(e, bulkTab)}
                  className="block mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>

              {/* Preview */}
              {bulkData.length > 0 && (
                <div className="bg-white rounded-2xl border p-5 mb-5">
                  <h3 className="font-bold mb-3">👀 Preview ({bulkData.length} records)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          {Object.keys(bulkData[0]).map(key => (
                            <th key={key} className="text-left px-3 py-2 border text-gray-600 font-semibold">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkData.slice(0,5).map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-3 py-2 border text-gray-700">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bulkData.length > 5 && <p className="text-xs text-gray-400 mt-2">...and {bulkData.length - 5} more records</p>}
                  </div>

                  <button onClick={bulkTab === 'candidate' ? uploadBulkCandidates : uploadBulkCompanies}
                    disabled={bulkLoading}
                    className={`mt-4 w-full h-11 font-bold text-white rounded-xl disabled:opacity-60 \${bulkTab==='candidate'?'bg-blue-600 hover:bg-blue-700':'bg-green-600 hover:bg-green-700'}`}>
                    {bulkLoading ? '⏳ Uploading...' : `🚀 Upload ${bulkData.length} ${bulkTab === 'candidate' ? 'Candidates' : 'Companies'}`}
                  </button>
                </div>
              )}

              {/* Result */}
              {bulkResult && (
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold mb-3">✅ Upload Complete!</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-green-600">{bulkResult.success}</p>
                      <p className="text-xs text-green-700">Uploaded</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-yellow-600">{bulkResult.skipped}</p>
                      <p className="text-xs text-yellow-700">Skipped (duplicate)</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-red-600">{bulkResult.failed}</p>
                      <p className="text-xs text-red-700">Failed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default AdminPage

function AnalyticsTab({ supabaseUrl, headers, counts }) {
  const [visits, setVisits] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [registrations, setRegistrations] = React.useState([])

  React.useEffect(() => {
    const load = async () => {
      try {
        const [v, c, co, cn] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/site_visits?select=country,country_code,city,page,visited_at&order=visited_at.desc&limit=500`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/candidates?select=created_at&order=created_at.desc`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/companies?select=created_at&order=created_at.desc`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/consultants?select=created_at&order=created_at.desc`, { headers }),
        ])
        const vd = await v.json()
        const cd = await c.json()
        const cod = await co.json()
        const cnd = await cn.json()
        setVisits(vd)
        const today = new Date().toISOString().slice(0,10)
        const week = new Date(Date.now()-7*24*60*60*1000).toISOString()
        setRegistrations([
          { label: 'Candidates', total: cd.length, today: cd.filter(x=>x.created_at?.startsWith(today)).length, week: cd.filter(x=>x.created_at>week).length },
          { label: 'Companies', total: cod.length, today: cod.filter(x=>x.created_at?.startsWith(today)).length, week: cod.filter(x=>x.created_at>week).length },
          { label: 'Consultants', total: cnd.length, today: cnd.filter(x=>x.created_at?.startsWith(today)).length, week: cnd.filter(x=>x.created_at>week).length },
        ])
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const countryCounts = visits.reduce((acc, v) => {
    if (v.country) acc[v.country] = (acc[v.country]||0)+1
    return acc
  }, {})
  const countryList = Object.entries(countryCounts).sort((a,b)=>b[1]-a[1])

  const pageCounts = visits.reduce((acc, v) => {
    if (v.page) acc[v.page] = (acc[v.page]||0)+1
    return acc
  }, {})
  const pageList = Object.entries(pageCounts).sort((a,b)=>b[1]-a[1]).slice(0,10)

  const today = new Date().toISOString().slice(0,10)
  const todayVisits = visits.filter(v=>v.visited_at?.startsWith(today)).length
  const weekVisits = visits.filter(v=>v.visited_at > new Date(Date.now()-7*24*60*60*1000).toISOString()).length

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black">Analytics & Reports</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Visits", value: visits.length, color: "bg-blue-500" },
          { label: "Today Visits", value: todayVisits, color: "bg-green-500" },
          { label: "This Week", value: weekVisits, color: "bg-purple-500" },
          { label: "Countries", value: countryList.length, color: "bg-orange-500" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
              <span className="text-white text-lg">📊</span>
            </div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-bold text-lg mb-4">📋 Registrations Report</h3>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50">
            <th className="text-left px-4 py-2">Type</th>
            <th className="text-center px-4 py-2">Total</th>
            <th className="text-center px-4 py-2">Today</th>
            <th className="text-center px-4 py-2">This Week</th>
          </tr></thead>
          <tbody>
            {registrations.map(r => (
              <tr key={r.label} className="border-t">
                <td className="px-4 py-3 font-medium">{r.label}</td>
                <td className="px-4 py-3 text-center font-bold text-blue-600">{r.total}</td>
                <td className="px-4 py-3 text-center text-green-600">{r.today}</td>
                <td className="px-4 py-3 text-center text-purple-600">{r.week}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border">
          <h3 className="font-bold text-lg mb-4">🌍 Visitors by Country</h3>
          {countryList.length === 0 ? <p className="text-gray-400 text-sm">No data yet — visit the site first!</p> :
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {countryList.map(([country, count]) => (
              <div key={country} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{country}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{width: `${(count/visits.length*100).toFixed(0)}%`}}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border">
          <h3 className="font-bold text-lg mb-4">📄 Top Pages</h3>
          {pageList.length === 0 ? <p className="text-gray-400 text-sm">No data yet!</p> :
          <div className="space-y-2">
            {pageList.map(([page, count]) => (
              <div key={page} className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium text-gray-700">{page || '/'}</span>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{count}</span>
              </div>
            ))}
          </div>}
        </div>
      </div>
    </div>
  )
}
