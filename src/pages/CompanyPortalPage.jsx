import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, Users, Briefcase, Star, LogOut, Eye, EyeOff } from 'lucide-react'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/supabase'
import { sendPasswordResetEmail } from '../lib/email'

const OPENAI_KEY = 'YOUR_OPENAI_KEY_HERE'
const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }

const CompanyPortalPage = () => {
  const [tab, setTab] = useState('dashboard')
  const [company, setCompany] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState([])
  const [matches, setMatches] = useState([])
  const [candidates, setCandidates] = useState([])
  const [showForgot, setShowForgot] = useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem('company_session')
    if (saved) {
      const data = JSON.parse(saved)
      setCompany(data)
      setIsLoggedIn(true)
      loadData(data.id)
    }
  }, [])
  const [forgotEmail, setForgotEmail] = useState('')
  const [job, setJob] = useState({ title:'', description:'', skills:'', experience:'0', location:'', salary:'' })
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const handleLogin = async () => {
    if (!email||!password) { setError('Please enter email and password'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/companies?email=eq.${encodeURIComponent(email)}&select=*`, { headers: h })
      const data = await res.json()
      if (!data.length) { setError('Company not found. Please register first.'); return }
      if (data[0].password !== password) { setError('Incorrect password.'); return }
      setCompany(data[0]); setIsLoggedIn(true)
      localStorage.setItem('company_session', JSON.stringify(data[0]))
      await loadData(data[0].id)
    } catch { setError('Login failed. Try again.') }
    finally { setLoading(false) }
  }

  const handleForgot = async () => {
    if (!forgotEmail) { setError('Please enter your email'); return }
    setLoading(true)
    try {
      const check = await fetch(`${SUPABASE_URL}/rest/v1/companies?email=eq.${encodeURIComponent(forgotEmail)}&select=id,company_name`, { headers: h })
      const data = await check.json()
      if (!data.length) { setError('Email not found.'); return }
      const token = crypto.randomUUID()
      await fetch(`${SUPABASE_URL}/rest/v1/password_resets`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ email: forgotEmail, token, user_type: 'company' })
      })
      await sendPasswordResetEmail(data[0].company_name || 'Company', forgotEmail, token, 'company')
      setShowForgot(false); setForgotEmail(''); setNewPass(''); setError('')
      alert('Password reset link sent to your email!')
    } catch { setError('Failed to reset password.') }
    finally { setLoading(false) }
  }

  const loadData = async companyId => {
    try {
      const [jr, cr] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/jobs?company_id=eq.${companyId}&select=*&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/candidates?select=*`, { headers: h }),
      ])
      const jobsData = await jr.json()
      const candidatesData = await cr.json()
      setJobs(Array.isArray(jobsData) ? jobsData : [])
      setCandidates(Array.isArray(candidatesData) ? candidatesData : [])
      const mr = await fetch(`${SUPABASE_URL}/rest/v1/matches?select=*,jobs!inner(company_id,title),candidates(name,email,phone,job_title,experience_years)&jobs.company_id=eq.${companyId}&order=ai_score.desc`, { headers: h })
      const matchData = await mr.json()
      setMatches(Array.isArray(matchData) ? matchData : [])
    } catch(e) { console.error(e) }
  }

  const runAIMatching = async (jobData, jobId, allCandidates) => {
    for (const candidate of allCandidates) {
      try {
        const prompt = `You are an HR expert. Score this candidate for the job.
Return ONLY valid JSON: {"score": 85, "recommendation": "shortlist", "reason": "Strong match"}
recommendation must be: shortlist, maybe, or reject
CANDIDATE: ${candidate.name}, ${candidate.job_title||''}, ${candidate.experience_years||0} years exp
JOB: ${jobData.title}, Required: ${jobData.required_skills?.join(', ')}, Min exp: ${jobData.min_experience} years`
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 150 })
        })
        const aiData = await aiRes.json()
        const text = aiData.choices?.[0]?.message?.content || '{}'
        const result = JSON.parse(text.replace(/```json|```/g, '').trim())
        const existCheck = await fetch(`${SUPABASE_URL}/rest/v1/matches?candidate_id=eq.${candidate.id}&job_id=eq.${jobId}`, { headers: h })
        const existData = await existCheck.json()
        if (existData.length > 0) continue
        await fetch(`${SUPABASE_URL}/rest/v1/matches`, {
          method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ candidate_id: candidate.id, job_id: jobId, ai_score: result.score||0, status: result.recommendation||'maybe', match_reason: result.reason||'' })
        })
      } catch(e) { console.error('AI error:', e) }
    }
  }

  const postJob = async () => {
    if (!job.title||!job.description||!job.skills) { setError('Title, description and skills are required'); return }
    setLoading(true)
    try {
      const skillsArray = job.skills.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=representation' },
        body: JSON.stringify({ company_id: company.id, title: job.title, description: job.description, required_skills: skillsArray, min_experience: parseInt(job.experience)||0, status: 'active' })
      })
      if (!res.ok) throw new Error('Job post failed')
      const newJob = await res.json()
      setJob({ title:'', description:'', skills:'', experience:'0', location:'', salary:'' })

    // LinkedIn auto post
    try {
      await fetch('https://bijendra85.app.n8n.cloud/webhook/d5708100-f631-442c-8215-2a723f14cbeb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company_name: company.company_name,
          location: job.location || 'India',
          skills: job.skills,
          experience: job.experience
        })
      })
    } catch(e) { console.log('LinkedIn post failed:', e) }
      await runAIMatching(newJob[0], newJob[0].id, candidates)
      
      // LinkedIn auto post
      try {
        await fetch('/api/linkedin-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: job.title,
            skills: job.skills,
            experience: job.experience,
            companyName: company.company_name,
            location: job.location,
            salary: job.salary
          })
        })
      } catch(e) { console.error('LinkedIn post error:', e) }
      
      await loadData(company.id)
      setTab('candidates')
      alert('Job posted! AI matching complete and LinkedIn post done!')
    } catch(e) { setError('Failed: ' + e.message) }
    finally { setLoading(false) }
  }


  const CandidateModal = ({ match, onClose }) => {
    if (!match) return null
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-2xl font-bold text-blue-600">
                {match.candidates?.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div>
                <h2 className="text-xl font-bold">{match.candidates?.name}</h2>
                <p className="text-sm text-gray-500">{match.candidates?.job_title || 'Professional'}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-gray-500">Email</span>
              <a href={`mailto:${match.candidates?.email}`} className="text-blue-600 hover:underline">{match.candidates?.email}</a>
            </div>
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-gray-500">Phone</span>
              <a href={`tel:${match.candidates?.phone}`} className="text-blue-600 hover:underline">{match.candidates?.phone || '—'}</a>
            </div>
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-gray-500">Experience</span>
              <span className="font-medium">{match.candidates?.experience_years ? `${match.candidates.experience_years} years` : '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-gray-500">AI Score</span>
              <span className="font-bold text-blue-600">{match.ai_score}%</span>
            </div>
            <div className="flex justify-between py-2 border-b text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${match.status==='shortlist'?'bg-green-100 text-green-700':match.status==='reject'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>
                {match.status==='shortlist'?'Shortlisted':match.status==='reject'?'Rejected':'Maybe'}
              </span>
            </div>
            {match.candidates?.parsed_skills?.length > 0 && (
              <div className="py-2 border-b text-sm">
                <span className="text-gray-500 block mb-2">Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {match.candidates.parsed_skills.map((s,i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {match.match_reason && (
              <div className="py-2 text-sm">
                <span className="text-gray-500 block mb-1">AI Analysis</span>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-2 text-xs">{match.match_reason}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <a href={`mailto:${match.candidates?.email}`}
              className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
              Send Email
            </a>
            {match.candidates?.phone && (
              <a href={`tel:${match.candidates?.phone}`}
                className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                Call Now
              </a>
            )}
            {match.candidates?.resume_url && (
              <a href={match.candidates.resume_url} target="_blank" rel="noreferrer"
                className="flex-1 text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                View Resume
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      {selectedCandidate && <CandidateModal match={selectedCandidate} onClose={() => setSelectedCandidate(null)} />}
        <header className="bg-white border-b py-4 px-6 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold text-blue-600">zenrixi</Link>
          <Link to="/company-signup" className="text-sm text-blue-600 font-bold hover:underline">Register Company</Link>
        </header>
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white border rounded-2xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            {!showForgot ? (
              <>
                <h1 className="text-2xl font-bold mb-1">Company Portal</h1>
                <p className="text-gray-500 text-sm mb-6">Login with your company email</p>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded-lg">{error}</p>}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold block mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hr@yourcompany.com"
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
                <p className="text-center text-xs text-gray-500 mt-5">Not registered? <Link to="/company-signup" className="text-blue-600 font-bold hover:underline">Register here</Link></p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold mb-1">Reset Password</h1>
                <p className="text-gray-500 text-sm mb-6">Enter your email and set a new password</p>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded-lg">{error}</p>}
                <div className="space-y-4">
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Registered email"
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
  const activeJobs = jobs.filter(j => j.status === 'active')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b py-3 px-6 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="text-lg font-extrabold text-blue-600">zenrixi</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold hidden sm:block">{company?.company_name}</span>
          <button onClick={() => { setIsLoggedIn(false); setCompany(null); setJobs([]); setMatches([]); localStorage.removeItem('company_session') }} className="p-2 text-gray-500 hover:text-red-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <div className="flex flex-1 max-w-6xl mx-auto w-full">
        <aside className="w-52 bg-white border-r hidden md:flex flex-col p-3 gap-1 sticky top-[57px] h-[calc(100vh-57px)]">
          {[['dashboard','Dashboard',Star],['post-job','Post a Job',Plus],['jobs','My Jobs',Briefcase],['candidates',`Candidates (${shortlisted.length})`,Users]].map(([id,label,Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${tab===id?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-100'}`}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </button>
          ))}
        </aside>
        <div className="md:hidden w-full">
          <div className="flex gap-2 p-3 bg-white border-b overflow-x-auto">
            {[['dashboard','Dashboard'],['post-job','Post Job'],['jobs','Jobs'],['candidates','Candidates']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${tab===id?'bg-blue-600 text-white':'bg-gray-100 text-gray-500'}`}>{label}</button>
            ))}
          </div>
        </div>
        <main className="flex-1 p-5">
          {tab==='dashboard' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Welcome, {company?.company_name}!</h2>
              <div className="grid grid-cols-3 gap-3">
                {[['Active Jobs',activeJobs.length,'text-blue-600'],['Total Matches',matches.length,'text-green-600'],['Shortlisted',shortlisted.length,'text-amber-600']].map(([label,value,color]) => (
                  <div key={label} className="bg-white rounded-2xl border p-4">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => setTab('post-job')} className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left">
                  <Plus className="w-5 h-5 text-blue-600" /><span className="text-sm font-medium">Post a New Job</span>
                </button>
                <button onClick={() => setTab('candidates')} className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-left">
                  <Users className="w-5 h-5 text-green-600" /><span className="text-sm font-medium">View Candidates</span>
                </button>
              </div>
            </div>
          )}
          {tab==='post-job' && (
            <div className="max-w-xl">
              <h2 className="text-xl font-bold mb-5">Post a New Job</h2>
              {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded-lg">{error}</p>}
              <div className="bg-white rounded-2xl border p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-1">Job Title*</label>
                  <input value={job.title} onChange={e => setJob({...job, title:e.target.value})} placeholder="e.g. Senior React Developer"
                    className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Job Description*</label>
                  <textarea value={job.description} onChange={e => setJob({...job, description:e.target.value})}
                    placeholder="Role, responsibilities, requirements..." rows={4}
                    className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Required Skills* <span className="font-normal text-gray-400">(comma separated)</span></label>
                  <input value={job.skills} onChange={e => setJob({...job, skills:e.target.value})} placeholder="e.g. React, Node.js, JavaScript"
                    className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold block mb-1">Min Experience (years)</label>
                    <input type="number" value={job.experience} onChange={e => setJob({...job, experience:e.target.value})}
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Location</label>
                    <input value={job.location} onChange={e => setJob({...job, location:e.target.value})} placeholder="e.g. Delhi / Remote"
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">After posting, AI will instantly analyze all candidates and show best matches!</div>
                <button onClick={postJob} disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl">
                  {loading ? 'AI Matching in progress...' : 'Post Job — Start AI Matching'}
                </button>
              </div>
            </div>
          )}
          {tab==='jobs' && (
            <div>
              <h2 className="text-xl font-bold mb-5">My Jobs ({jobs.length})</h2>
              {jobs.length===0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <p className="text-sm text-gray-500">No jobs posted yet.</p>
                  <button onClick={() => setTab('post-job')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Post Your First Job</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map(j => (
                    <div key={j.id} className="bg-white rounded-2xl border p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold">{j.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${j.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{j.status}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{j.description?.slice(0,120)}...</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(j.required_skills)&&j.required_skills.map((s,i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab==='candidates' && (
            <div>
              <h2 className="text-xl font-bold mb-2">AI Matched Candidates</h2>
              <p className="text-sm text-gray-500 mb-5">Candidates automatically shortlisted by AI for your jobs</p>
              {matches.filter(m => m.ai_score >= 20).length===0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <p className="text-sm text-gray-500">No candidates with 20%+ match yet. Post a job and AI will match candidates!</p>
                  <button onClick={() => setTab('post-job')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Post a Job</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.filter(m => m.ai_score >= 20).sort((a,b) => b.ai_score - a.ai_score).map(match => (
                    <div key={match.id} className="bg-white rounded-2xl border p-5 cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedCandidate(match)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-lg cursor-pointer hover:bg-blue-100"
                            onClick={() => setSelectedCandidate(match.candidates)}>
                            {match.candidates?.name?.charAt(0)?.toUpperCase()||'C'}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm cursor-pointer hover:text-blue-600"
                              onClick={() => setSelectedCandidate(match.candidates)}>
                              {match.candidates?.name}
                            </h3>
                            <p className="text-xs text-gray-500">{match.candidates?.job_title||'Professional'} • {match.candidates?.experience_years||0} yrs exp</p>
                            <p className="text-xs text-blue-600 mt-0.5">For: {match.jobs?.title}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{match.ai_score}%</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${match.status==='shortlist'?'bg-green-100 text-green-700':match.status==='reject'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>
                            {match.status==='shortlist'?'Shortlisted':match.status==='reject'?'Rejected':'Maybe'}
                          </span>
                        </div>
                      </div>
                      {match.match_reason&&<p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{match.match_reason}</p>}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <button onClick={() => setSelectedCandidate(match.candidates)}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700">View Profile</button>
                        <a href={`mailto:${match.candidates?.email}`} className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-gray-700">Email</a>
                        {match.candidates?.phone&&<a href={`tel:${match.candidates?.phone}`} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700">Call</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedCandidate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCandidate(null)}>
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-lg font-bold">Candidate Profile</h2>
                      <button onClick={() => setSelectedCandidate(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                    </div>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-2xl font-bold text-blue-600">
                        {selectedCandidate?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{selectedCandidate?.name}</h3>
                        <p className="text-sm text-gray-500">{selectedCandidate?.job_title || 'Professional'}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm mb-5">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Email</span>
                        <a href={`mailto:${selectedCandidate?.email}`} className="text-blue-600 hover:underline">{selectedCandidate?.email}</a>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Phone</span>
                        <a href={`tel:${selectedCandidate?.phone}`} className="text-blue-600 hover:underline">{selectedCandidate?.phone || '—'}</a>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Experience</span>
                        <span className="font-medium">{selectedCandidate?.experience_years ? `${selectedCandidate.experience_years} years` : '—'}</span>
                      </div>
                      <div className="py-2">
                        <span className="text-gray-500 block mb-2">Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(selectedCandidate?.parsed_skills) && selectedCandidate.parsed_skills.length > 0
                            ? selectedCandidate.parsed_skills.map((s,i) => <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>)
                            : <span className="text-gray-400 text-xs">No skills listed</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {selectedCandidate?.resume_url ? (
                        <a href={selectedCandidate.resume_url} target="_blank" rel="noreferrer" download
                          className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm">
                          Download Resume
                        </a>
                      ) : (
                        <div className="flex-1 text-center bg-gray-100 text-gray-400 font-bold py-2.5 rounded-xl text-sm">
                          No Resume Uploaded
                        </div>
                      )}
                      <a href={`mailto:${selectedCandidate?.email}`}
                        className="flex-1 text-center border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-2.5 rounded-xl text-sm">
                        Send Email
                      </a>
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
export default CompanyPortalPage
