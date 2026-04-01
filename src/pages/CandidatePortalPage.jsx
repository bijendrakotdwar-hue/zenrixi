import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Briefcase, Star, LogOut, Eye, EyeOff, Search } from 'lucide-react'
import Header from '../components/Header'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/supabase'

const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }

const CandidatePortalPage = () => {
  const [tab, setTab] = useState('dashboard')
  const [candidate, setCandidate] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState([])
  const [matches, setMatches] = useState([])
  const [keyword, setKeyword] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [newPass, setNewPass] = useState('')

  const handleLogin = async () => {
    if (!email||!password) { setError('Please enter email and password'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/candidates?email=eq.${encodeURIComponent(email)}&select=*`, { headers: h })
      const data = await res.json()
      if (!data.length) { setError('Account not found. Please register first.'); return }
      if (data[0].password !== password) { setError('Incorrect password.'); return }
      setCandidate(data[0]); setIsLoggedIn(true)
      await loadJobs(''); await loadMatches(data[0].id)
    } catch { setError('Login failed. Try again.') }
    finally { setLoading(false) }
  }

  const handleForgot = async () => {
    if (!forgotEmail||!newPass) { setError('Please enter email and new password'); return }
    if (newPass.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const check = await fetch(`${SUPABASE_URL}/rest/v1/candidates?email=eq.${encodeURIComponent(forgotEmail)}&select=id`, { headers: h })
      const data = await check.json()
      if (!data.length) { setError('Email not found.'); return }
      await fetch(`${SUPABASE_URL}/rest/v1/candidates?email=eq.${encodeURIComponent(forgotEmail)}`, {
        method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' }, body: JSON.stringify({ password: newPass })
      })
      setShowForgot(false); setForgotEmail(''); setNewPass(''); setError('')
      alert('Password updated! Please login.')
    } catch { setError('Failed to reset password.') }
    finally { setLoading(false) }
  }

  const loadJobs = async kw => {
    try {
      let url = `${SUPABASE_URL}/rest/v1/jobs?select=*,companies(company_name)&status=eq.active&order=created_at.desc`
      if (kw) url += `&or=(title.ilike.*${kw}*,description.ilike.*${kw}*)`
      const res = await fetch(url, { headers: h })
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : [])
    } catch {}
  }

  const loadMatches = async candidateId => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/matches?candidate_id=eq.${candidateId}&select=*,jobs(title,description,required_skills,companies(company_name))&order=ai_score.desc`, { headers: h })
      const data = await res.json()
      setMatches(Array.isArray(data) ? data : [])
    } catch {}
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center p-6 pt-24">
          <div className="w-full max-w-sm bg-white border rounded-2xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            {!showForgot ? (
              <>
                <h1 className="text-2xl font-bold mb-1">Candidate Portal</h1>
                <p className="text-gray-500 text-sm mb-6">Login to explore jobs and track applications</p>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded-lg">{error}</p>}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold block mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Password</label>
                    <div className="relative">
                      <input type={showPass?'text':'password'} value={password} onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key==='Enter'&&handleLogin()} placeholder="Your password"
                        className="w-full h-11 border rounded-xl px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setShowForgot(true)} className="text-xs text-blue-600 hover:underline w-full text-right">Forgot password?</button>
                  <button onClick={handleLogin} disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm">
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </div>
                <p className="text-center text-xs text-gray-500 mt-5">Not registered? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Register here</Link></p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold mb-1">Reset Password</h1>
                <p className="text-gray-500 text-sm mb-6">Enter your email and set a new password</p>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded-lg">{error}</p>}
                <div className="space-y-4">
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Registered email"
                    className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password (min 8 chars)"
                    className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleForgot} disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm">
                    {loading ? 'Updating...' : 'Reset Password'}
                  </button>
                  <button onClick={() => { setShowForgot(false); setError('') }} className="w-full text-xs text-gray-500 hover:text-blue-600 text-center">Back to Login</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const shortlisted = matches.filter(m => m.status === 'shortlist')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b py-3 px-6 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="text-xl font-extrabold text-blue-600">zenrixi</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold hidden sm:block">{candidate?.name}</span>
          <button onClick={() => { setIsLoggedIn(false); setCandidate(null) }} className="p-2 text-gray-500 hover:text-red-500"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>
      <div className="flex flex-1 max-w-6xl mx-auto w-full">
        <aside className="w-52 bg-white border-r hidden md:flex flex-col p-3 gap-1 sticky top-[57px] h-[calc(100vh-57px)]">
          {[['dashboard','Dashboard',Star],['jobs','Explore Jobs',Search],['matches',`Matches (${shortlisted.length})`,Briefcase],['profile','My Profile',User]].map(([id,label,Icon]) => (
            <button key={id} onClick={() => { setTab(id); if(id==='jobs') loadJobs('') }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${tab===id?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-100'}`}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </button>
          ))}
        </aside>
        <div className="md:hidden w-full">
          <div className="flex gap-2 p-3 bg-white border-b overflow-x-auto">
            {[['dashboard','Dashboard'],['jobs','Jobs'],['matches','Matches'],['profile','Profile']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${tab===id?'bg-blue-600 text-white':'bg-gray-100 text-gray-500'}`}>{label}</button>
            ))}
          </div>
        </div>
        <main className="flex-1 p-5">
          {tab==='dashboard' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Welcome, {candidate?.name}!</h2>
              <div className="grid grid-cols-3 gap-3">
                {[['Jobs Available',jobs.length||'—','text-blue-600'],['AI Matches',matches.length,'text-green-600'],['Shortlisted',shortlisted.length,'text-amber-600']].map(([label,value,color]) => (
                  <div key={label} className="bg-white rounded-2xl border p-4">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              {shortlisted.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <p className="font-bold text-green-800 text-sm">You have been shortlisted for {shortlisted.length} job{shortlisted.length>1?'s':''}!</p>
                  <button onClick={() => setTab('matches')} className="text-xs text-green-700 hover:underline mt-1">View matches →</button>
                </div>
              )}
            </div>
          )}
          {tab==='jobs' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Explore Jobs</h2>
              <div className="flex gap-3 mb-5">
                <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search jobs..."
                  className="flex-1 h-10 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => loadJobs(keyword)} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold">Search</button>
              </div>
              {jobs.length===0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center"><p className="text-gray-500 text-sm">No jobs found.</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map(job => (
                    <div key={job.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all">
                      <h3 className="font-bold text-sm mb-1">{job.title}</h3>
                      <p className="text-xs text-gray-500 mb-2">{job.companies?.company_name}</p>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(job.required_skills)&&job.required_skills.slice(0,3).map((s,i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab==='matches' && (
            <div>
              <h2 className="text-xl font-bold mb-2">My AI Matches</h2>
              <p className="text-sm text-gray-500 mb-5">Jobs AI matched you with based on your profile</p>
              {matches.length===0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center"><p className="text-sm text-gray-500">No matches yet. Companies will match you when they post jobs!</p></div>
              ) : (
                <div className="space-y-3">
                  {matches.map(match => (
                    <div key={match.id} className="bg-white rounded-2xl border p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold">{match.jobs?.title}</h3>
                          <p className="text-sm text-gray-500">{match.jobs?.companies?.company_name}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{match.ai_score}%</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${match.status==='shortlist'?'bg-green-100 text-green-700':match.status==='reject'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>
                            {match.status==='shortlist'?'Shortlisted':match.status==='reject'?'Not Selected':'Under Review'}
                          </span>
                        </div>
                      </div>
                      {match.match_reason&&<p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{match.match_reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab==='profile' && (
            <div className="max-w-lg">
              <h2 className="text-xl font-bold mb-5">My Profile</h2>
              <div className="bg-white rounded-2xl border p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-2xl font-bold text-blue-600">
                    {candidate?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{candidate?.name}</h3>
                    <p className="text-sm text-gray-500">{candidate?.job_title||'Job Seeker'}</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  {[['Email',candidate?.email],['Phone',candidate?.phone||'—'],['Experience',candidate?.experience_years?`${candidate.experience_years} years`:'—']].map(([label,value]) => (
                    <div key={label} className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
export default CandidatePortalPage
