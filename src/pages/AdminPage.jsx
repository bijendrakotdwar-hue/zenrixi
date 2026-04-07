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
      ])
      setCandidates(await ca.json())
      setCompanies(await co.json())
      setJobs(await jo.json())
      setMatches(await ma.json())
      setConsultants(await cn.json())
      setPlacements(await pl.json())
      setInvoices(await inv.json())
      setPayments(await pay.json())
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const deleteRecord = async (table, id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: 'DELETE', headers: h })
    await loadAllData()
  }

  const toggleJobStatus = async (id, status) => {
    await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${id}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: status === 'active' ? 'inactive' : 'active' })
    })
    await loadAllData()
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
            {[['dashboard','Dashboard'],['candidates','Candidates'],['companies','Companies'],['jobs','Jobs'],['consultants','Consultants'],['invoices','Invoices'],['payments','Payments']].map(([id,label]) => (
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
                          <button onClick={() => deleteRecord('candidates', c.id, c.name)}
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
                          <button onClick={() => deleteRecord('companies', c.id, c.company_name)}
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
                          <button onClick={() => deleteRecord('consultants', c.id, c.name)}
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

        </main>
      </div>
    </div>
  )
}

export default AdminPage
