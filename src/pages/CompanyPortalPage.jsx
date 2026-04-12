import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, Users, Briefcase, Star, LogOut, Eye, EyeOff, Calendar, FileText, CheckCircle, Clock, XCircle, Phone, Mail, Download, Send } from 'lucide-react'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/supabase'
import { sendPasswordResetEmail } from '../lib/email'

const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }

const STAGES = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Hired', 'Rejected']
const STAGE_COLORS = {
  'Applied': 'bg-gray-100 text-gray-700',
  'Shortlisted': 'bg-blue-100 text-blue-700',
  'Interview': 'bg-yellow-100 text-yellow-700',
  'Selected': 'bg-green-100 text-green-700',
  'Hired': 'bg-emerald-100 text-emerald-700',
  'Rejected': 'bg-red-100 text-red-700'
}

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
  const [interviews, setInterviews] = useState([])
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [editingJob, setEditingJob] = useState(null)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [interviewData, setInterviewData] = useState({ scheduled_at: '', duration_minutes: 60, interview_type: 'video', meeting_link: '', interviewer_name: '', notes: '' })
  const [offerData, setOfferData] = useState({ salary: '', joining_date: '', designation: '', department: '' })
  const [job, setJob] = useState({ title: '', description: '', skills: '', experience: '0', location: '', salary: '' })
  const [filterJob, setFilterJob] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterExp, setFilterExp] = useState('all')
  const [searchName, setSearchName] = useState('')
  const [kanbanJob, setKanbanJob] = useState('all')
  const [selectedProfile, setSelectedProfile] = useState(null)

  React.useEffect(() => {
    const saved = localStorage.getItem('company_session')
    if (saved) {
      const data = JSON.parse(saved)
      setCompany(data)
      setIsLoggedIn(true)
      loadData(data.id)
    }
  }, [])

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/companies?email=eq.${encodeURIComponent(email)}&select=*`, { headers: h })
      const data = await res.json()
      if (!data.length) { setError('Company not found.'); return }
      if (data[0].password !== password) { setError('Incorrect password.'); return }
      setCompany(data[0]); setIsLoggedIn(true)
      localStorage.setItem('company_session', JSON.stringify(data[0]))
      await loadData(data[0].id)
    } catch { setError('Login failed.') }
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
      setShowForgot(false); setForgotEmail(''); setError('')
      alert('Password reset link sent!')
    } catch { setError('Failed to reset password.') }
    finally { setLoading(false) }
  }

  const loadData = async companyId => {
    try {
      const [jr, cr, ir] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/jobs?company_id=eq.${companyId}&select=*&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/candidates?select=*`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/interviews?select=*,candidates(name,email,phone,job_title),jobs(title)&order=scheduled_at.desc`, { headers: h }),
      ])
      const jobsData = await jr.json()
      const candidatesData = await cr.json()
      const interviewsData = await ir.json()
      setJobs(Array.isArray(jobsData) ? jobsData : [])
      setCandidates(Array.isArray(candidatesData) ? candidatesData : [])
      setInterviews(Array.isArray(interviewsData) ? interviewsData : [])
      const mr = await fetch(`${SUPABASE_URL}/rest/v1/matches?select=*,jobs!inner(company_id,title),candidates(name,email,phone,job_title,experience_years,parsed_skills,resume_url)&jobs.company_id=eq.${companyId}&order=ai_score.desc`, { headers: h })
      const matchData = await mr.json()
      setMatches(Array.isArray(matchData) ? matchData : [])
    } catch(e) { console.error(e) }
  }

  const updateMatchStatus = async (matchId, status) => {
    await fetch(`${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status })
    })
    await loadData(company.id)
  }

  const scheduleInterview = async () => {
    if (!interviewData.scheduled_at) { alert('Please select date and time'); return }
    setLoading(true)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/interviews`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          candidate_id: selectedCandidate.candidates?.id || selectedCandidate.id,
          job_id: selectedCandidate.job_id,
          scheduled_at: interviewData.scheduled_at,
          duration_minutes: interviewData.duration_minutes,
          interview_type: interviewData.interview_type,
          meeting_link: interviewData.meeting_link,
          interviewer_name: interviewData.interviewer_name,
          notes: interviewData.notes,
          status: 'scheduled'
        })
      })
      await updateMatchStatus(selectedCandidate.id, 'Interview')
      setShowInterviewModal(false)
      setInterviewData({ scheduled_at: '', duration_minutes: 60, interview_type: 'video', meeting_link: '', interviewer_name: '', notes: '' })
      alert('Interview scheduled! Candidate will be notified.')
      await loadData(company.id)
    } catch(e) { alert('Failed: ' + e.message) }
    finally { setLoading(false) }
  }

  const generateOfferLetter = () => {
    if (!offerData.salary || !offerData.joining_date || !offerData.designation) { alert('Please fill all fields'); return }
    const candidate = selectedCandidate?.candidates || selectedCandidate
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    const joiningDate = new Date(offerData.joining_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    
    const letterHTML = `<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 40px; color: #333; }
  .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 28px; font-weight: 900; color: #1e40af; }
  .title { font-size: 20px; font-weight: bold; text-align: center; margin: 20px 0; text-decoration: underline; }
  .content { line-height: 1.8; }
  .highlight { background: #eff6ff; padding: 15px; border-left: 4px solid #1e40af; margin: 20px 0; }
  .footer { margin-top: 60px; display: flex; justify-content: space-between; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  td, th { border: 1px solid #ddd; padding: 10px; text-align: left; }
  th { background: #eff6ff; }
</style></head>
<body>
  <div class="header">
    <div class="logo">zenrixi</div>
    <div>AI-Powered HR Solutions | zenrixi.com</div>
    <div>${company?.company_name}</div>
  </div>
  <div style="text-align:right">Date: ${today}</div>
  <div class="title">OFFER LETTER</div>
  <div class="content">
    <p>Dear <strong>${candidate?.name}</strong>,</p>
    <p>We are pleased to offer you the position of <strong>${offerData.designation}</strong> at <strong>${company?.company_name}</strong>. After careful consideration, we believe you will be a valuable addition to our team.</p>
    <div class="highlight">
      <table>
        <tr><th>Position</th><td>${offerData.designation}</td></tr>
        <tr><th>Department</th><td>${offerData.department || 'To be assigned'}</td></tr>
        <tr><th>Date of Joining</th><td>${joiningDate}</td></tr>
        <tr><th>CTC Per Annum</th><td>₹${Number(offerData.salary).toLocaleString('en-IN')}</td></tr>
        <tr><th>Employment Type</th><td>Full Time, Permanent</td></tr>
      </table>
    </div>
    <p>This offer is contingent upon successful completion of background verification and submission of required documents.</p>
    <p>Please confirm your acceptance by signing and returning this letter within <strong>3 working days</strong>.</p>
    <p>We look forward to welcoming you to our team!</p>
    <p>Warm regards,</p>
  </div>
  <div class="footer">
    <div>
      <div style="margin-top:40px;border-top:1px solid #333;padding-top:5px">Authorized Signatory</div>
      <div>${company?.company_name}</div>
    </div>
    <div>
      <div style="margin-top:40px;border-top:1px solid #333;padding-top:5px">Candidate Signature</div>
      <div>${candidate?.name}</div>
    </div>
  </div>
</body>
</html>`

    const blob = new Blob([letterHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Offer_Letter_${candidate?.name?.replace(/ /g,'_')}.html`
    a.click()
    setShowOfferModal(false)
  }

  const runAIMatching = async (jobData, jobId, allCandidates) => {
    try {
      await fetch('/api/ai-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobData, jobId, candidates: allCandidates,
          supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_KEY
        })
      });
    } catch(e) { console.error('AI matching error:', e); }
  }

  const deleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${jobId}`, {
      method: 'DELETE', headers: h
    })
    await loadData(company.id)
  }

  const updateJob = async () => {
    if (!editingJob.title) { alert('Title required'); return }
    const skillsArray = typeof editingJob.required_skills === 'string'
      ? editingJob.required_skills.split(',').map(s => s.trim()).filter(Boolean)
      : editingJob.required_skills
    await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${editingJob.id}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        title: editingJob.title,
        description: editingJob.description,
        required_skills: skillsArray,
        min_experience: parseInt(editingJob.min_experience) || 0,
      })
    })
    setEditingJob(null)
    await loadData(company.id)
  }

  const toggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${jobId}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: newStatus })
    })
    await loadData(company.id)
  }



  const postJob = async () => {
    if (!job.title||!job.description||!job.skills) { setError('Title, description and skills are required'); return }
    setLoading(true)
    try {
      const skillsArray = job.skills.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ company_id: company.id, title: job.title, description: job.description, required_skills: skillsArray, min_experience: parseInt(job.experience)||0, status: 'active', location: job.location||null, salary: job.salary||null })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error('Job post failed: ' + JSON.stringify(errData))
      }
      setJob({ title:'', description:'', skills:'', experience:'0', location:'', salary:'' })
      try {
        await fetch('/api/linkedin-post', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: job.title, company_name: company.company_name, location: job.location||'India', skills: job.skills, experience: job.experience })
        })
      } catch(e) { console.log('LinkedIn:', e) }
      // AI matching will run on next data load
      await loadData(company.id)
      setTab('candidates')
      alert('Job posted! AI matching complete!')
    } catch(e) { setError('Failed: ' + e.message) }
    finally { setLoading(false) }
  }

  const shortlisted = matches.filter(m => m.status === 'shortlist' || m.status === 'Shortlisted')
  const activeJobs = jobs.filter(j => j.status === 'active')
  const upcomingInterviews = interviews.filter(i => i.status === 'scheduled')

  if (!isLoggedIn) {
    // EditJobModal rendered below
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold text-blue-600">zenrixi</Link>
          <Link to="/company-signup" className="text-sm text-blue-600 font-bold hover:underline">Register Company</Link>
        </header>
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-5">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            {!showForgot ? (
              <>
                <h1 className="text-2xl font-bold mb-1">Company Portal</h1>
                <p className="text-gray-500 text-sm mb-6">Login to manage your hiring</p>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-xl">{error}</p>}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold block mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hr@company.com"
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
                    {loading ? 'Logging in...' : 'Login →'}
                  </button>
                </div>
                <p className="text-center text-xs text-gray-500 mt-5">Not registered? <Link to="/company-signup" className="text-blue-600 font-bold hover:underline">Register here</Link></p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold mb-1">Reset Password</h1>
                <p className="text-gray-500 text-sm mb-6">Enter your registered email</p>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-xl">{error}</p>}
                <div className="space-y-4">
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Registered email"
                    className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleForgot} disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button onClick={() => { setShowForgot(false); setError('') }} className="w-full text-xs text-gray-500 hover:text-blue-600 text-center">← Back to Login</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const saveJob = async () => {
    if (!editingJob?.title) { alert('Title required'); return }
    setLoading(true)
    const skillsArray = typeof editingJob.required_skills === 'string'
      ? editingJob.required_skills.split(',').map(s => s.trim()).filter(Boolean)
      : editingJob.required_skills
    await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${editingJob.id}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ title: editingJob.title, description: editingJob.description, required_skills: skillsArray, min_experience: parseInt(editingJob.min_experience)||0, location: editingJob.location, salary: editingJob.salary, status: editingJob.status })
    })
    setEditingJob(null)
    await loadData(company.id)
    setLoading(false)
    alert('Job updated!')
  }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {editingJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingJob(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">✏️ Edit Job</h2>
              <button onClick={() => setEditingJob(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-1">Job Title*</label>
                <input value={editingJob.title || ''} onChange={e => setEditingJob({...editingJob, title: e.target.value})}
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Description</label>
                <textarea value={editingJob.description || ''} onChange={e => setEditingJob({...editingJob, description: e.target.value})} rows={3}
                  className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Required Skills (comma separated)</label>
                <input value={editingJob.required_skills || ''} onChange={e => setEditingJob({...editingJob, required_skills: e.target.value})}
                  placeholder="React, Node.js, JavaScript"
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold block mb-1">Min Experience (yrs)</label>
                  <input type="number" value={editingJob.min_experience || 0} onChange={e => setEditingJob({...editingJob, min_experience: e.target.value})}
                    className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Location</label>
                  <input value={editingJob.location || ''} onChange={e => setEditingJob({...editingJob, location: e.target.value})}
                    placeholder="Delhi / Remote"
                    className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Salary (CTC)</label>
                <input value={editingJob.salary || ''} onChange={e => setEditingJob({...editingJob, salary: e.target.value})}
                  placeholder="e.g. 8-12 LPA"
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Status</label>
                <select value={editingJob.status || 'active'} onChange={e => setEditingJob({...editingJob, status: e.target.value})}
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸ Inactive</option>
                  <option value="closed">🔒 Closed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingJob(null)}
                  className="flex-1 py-2 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={saveJob} disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b py-3 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <Link to="/" className="text-lg font-extrabold text-blue-600">zenrixi</Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {company?.company_name?.charAt(0)}
            </div>
            <span className="text-sm font-bold">{company?.company_name}</span>
          </div>
          <button onClick={() => { setIsLoggedIn(false); setCompany(null); setJobs([]); setMatches([]); localStorage.removeItem('company_session') }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 border rounded-lg px-3 py-1.5">
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r hidden md:flex flex-col p-4 gap-1 sticky top-[57px] h-[calc(100vh-57px)]">
          {[
            ['dashboard', 'Dashboard', Star],
            ['post-job', 'Post a Job', Plus],
            ['jobs', 'My Jobs', Briefcase],
            ['candidates', `Candidates (${matches.length})`, Users],
            ['interviews', `Interviews (${upcomingInterviews.length})`, Calendar],
            ['offer-letter', 'Offer Letter', FileText],
          ].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${tab===id?'bg-blue-600 text-white shadow-md':'text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </button>
          ))}
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full">
          <div className="flex gap-2 p-3 bg-white border-b overflow-x-auto">
            {[['dashboard','Dashboard'],['post-job','Post Job'],['jobs','Jobs'],['candidates','Candidates'],['interviews','Interviews'],['offer-letter','Offer'],['kanban','Kanban']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${tab===id?'bg-blue-600 text-white':'bg-gray-100 text-gray-500'}`}>{label}</button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-6">
          {/* Dashboard */}
          {tab==='dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Welcome back, {company?.company_name}! 👋</h2>
                <p className="text-gray-500 text-sm mt-1">Here's your hiring overview</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ['Active Jobs', activeJobs.length, 'bg-blue-500', Briefcase, 'jobs'],
                  ['Total Matches', matches.length, 'bg-purple-500', Users, 'candidates'],
                  ['Shortlisted', shortlisted.length, 'bg-green-500', CheckCircle, 'candidates'],
                  ['Interviews', upcomingInterviews.length, 'bg-orange-500', Calendar, 'interviews'],
                ].map(([label, value, color, Icon, targetTab]) => (
                  <div key={label} onClick={() => setTab(targetTab)}
                    className="bg-white rounded-2xl border p-5 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all">
                    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button onClick={() => setTab('post-job')} className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors">
                  <Plus className="w-5 h-5" /><span className="font-medium">Post New Job</span>
                </button>
                <button onClick={() => setTab('candidates')} className="flex items-center gap-3 p-4 bg-white border-2 border-blue-200 rounded-2xl hover:bg-blue-50 transition-colors">
                  <Users className="w-5 h-5 text-blue-600" /><span className="font-medium text-blue-600">View Candidates</span>
                </button>
                <button onClick={() => setTab('interviews')} className="flex items-center gap-3 p-4 bg-white border-2 border-orange-200 rounded-2xl hover:bg-orange-50 transition-colors">
                  <Calendar className="w-5 h-5 text-orange-500" /><span className="font-medium text-orange-500">Schedule Interview</span>
                </button>
              </div>

              {/* Recent interviews */}
              {upcomingInterviews.length > 0 && (
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-500" /> Upcoming Interviews</h3>
                  <div className="space-y-3">
                    {upcomingInterviews.slice(0,3).map(iv => (
                      <div key={iv.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                        <div>
                          <p className="font-medium text-sm">{iv.candidates?.name}</p>
                          <p className="text-xs text-gray-500">{iv.jobs?.title} • {iv.interview_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-orange-600">{new Date(iv.scheduled_at).toLocaleDateString('en-IN')}</p>
                          <p className="text-xs text-gray-500">{new Date(iv.scheduled_at).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Post Job */}
          {tab==='post-job' && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">Post a New Job</h2>
              {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-xl">{error}</p>}
              <div className="bg-white rounded-2xl border p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold block mb-1">Job Title*</label>
                    <input value={job.title} onChange={e => setJob({...job, title:e.target.value})} placeholder="e.g. Senior React Developer"
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold block mb-1">Job Description*</label>
                    <textarea value={job.description} onChange={e => setJob({...job, description:e.target.value})} rows={4} placeholder="Role, responsibilities..."
                      className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold block mb-1">Required Skills* <span className="font-normal text-gray-400">(comma separated)</span></label>
                    <input value={job.skills} onChange={e => setJob({...job, skills:e.target.value})} placeholder="React, Node.js, JavaScript"
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Min Experience (years)</label>
                    <input type="number" value={job.experience} onChange={e => setJob({...job, experience:e.target.value})}
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Location</label>
                    <input value={job.location} onChange={e => setJob({...job, location:e.target.value})} placeholder="Delhi / Remote"
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Salary (CTC)</label>
                    <input value={job.salary} onChange={e => setJob({...job, salary:e.target.value})} placeholder="e.g. 8-12 LPA"
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">🤖 AI will instantly analyze all candidates and rank them by fit!</div>
                <button onClick={postJob} disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm">
                  {loading ? '⏳ AI Matching in progress...' : '🚀 Post Job & Start AI Matching'}
                </button>
              </div>
            </div>
          )}

          {/* My Jobs */}
          {tab==='jobs' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">My Jobs ({jobs.length})</h2>
              {jobs.length===0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No jobs posted yet.</p>
                  <button onClick={() => setTab('post-job')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Post First Job</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map(j => (
                    <div key={j.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{j.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{j.description?.slice(0,100)}...</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleJobStatus(j.id, j.status)}
                            className={`text-xs px-3 py-1 rounded-full font-medium ${j.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>
                            {j.status==='active' ? '✅ Active' : '⏸ Inactive'}
                          </button>
                          <button onClick={() => setEditingJob({...j, required_skills: Array.isArray(j.required_skills) ? j.required_skills.join(', ') : j.required_skills})}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200">✏️ Edit</button>
                          <button onClick={() => deleteJob(j.id)}
                            className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200">🗑️ Delete</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(j.required_skills) && j.required_skills.map((s,i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{s}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>Min {j.min_experience} yrs exp</span>
                        <span>{matches.filter(m => m.job_id === j.id).length} matches</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Candidates Pipeline */}
          {tab==='candidates' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Candidate Pipeline</h2>
                  <p className="text-sm text-gray-500">AI-ranked candidates for your jobs</p>
                </div>
              </div>
              {/* Filters */}
              <div className="bg-white rounded-2xl border p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input value={searchName} onChange={e=>setSearchName(e.target.value)} placeholder="🔍 Search name..."
                  className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={filterJob} onChange={e=>setFilterJob(e.target.value)}
                  className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Jobs</option>
                  {jobs.map(j=><option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                  className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Stages</option>
                  {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterExp} onChange={e=>setFilterExp(e.target.value)}
                  className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">Any Experience</option>
                  <option value="0-2">0-2 yrs</option>
                  <option value="3-5">3-5 yrs</option>
                  <option value="6+">6+ yrs</option>
                </select>
              </div>
              {matches.length===0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No candidates yet. Post a job first!</p>
                </div>
              ) : (() => {
                const filtered = matches.filter(m => {
                  const exp = m.candidates?.experience_years || 0
                  const nameMatch = !searchName || m.candidates?.name?.toLowerCase().includes(searchName.toLowerCase())
                  const jobMatch = filterJob === 'all' || m.job_id === filterJob
                  const statusMatch = filterStatus === 'all' || m.status === filterStatus
                  const expMatch = filterExp === 'all' ||
                    (filterExp === '0-2' && exp <= 2) ||
                    (filterExp === '3-5' && exp >= 3 && exp <= 5) ||
                    (filterExp === '6+' && exp >= 6)
                  return nameMatch && jobMatch && statusMatch && expMatch
                }).sort((a,b) => b.ai_score - a.ai_score)
                return filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl border p-8 text-center text-gray-400 text-sm">No candidates match your filters</div>
                ) : (
                <div className="space-y-3">
                  {filtered.map(match => (
                    <div key={match.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedProfile(match)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-lg">
                            {match.candidates?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold">{match.candidates?.name}</h3>
                            <p className="text-xs text-gray-500">{match.candidates?.job_title} • {match.candidates?.experience_years}yr exp</p>
                            <p className="text-xs text-blue-500 mt-0.5">For: {match.jobs?.title}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{match.ai_score}%</div>
                          <select value={match.status} onChange={e => updateMatchStatus(match.id, e.target.value)}
                            className="text-xs border rounded-lg px-2 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      {match.match_reason && <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-lg p-2">{match.match_reason}</p>}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <button onClick={() => { setSelectedCandidate(match); setShowInterviewModal(true) }}
                          className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-orange-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Schedule Interview
                        </button>
                        <button onClick={() => { setSelectedCandidate(match); setShowOfferModal(true) }}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Offer Letter
                        </button>
                        <a href={`mailto:${match.candidates?.email}`} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Email
                        </a>
                        {match.candidates?.phone && <a href={`tel:${match.candidates?.phone}`} className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-gray-700 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Call
                        </a>}
                        {match.candidates?.resume_url && <a href={match.candidates.resume_url} target="_blank" rel="noreferrer" className="text-xs border border-blue-500 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-50 flex items-center gap-1">
                          <Download className="w-3 h-3" /> Resume
                        </a>}
                      </div>
                    </div>
                  ))}
                </div>
                )
              })()}
            </div>
          )}

          {/* KANBAN BOARD */}
          {tab==='kanban' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">📋 Kanban Board</h2>
                <select value={kanbanJob} onChange={e=>setKanbanJob(e.target.value)}
                  className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Jobs</option>
                  {jobs.map(j=><option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              {matches.length===0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <p className="text-gray-500">No candidates yet. Post a job first!</p>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-4">
                  {STAGES.map(stage => {
                    const stageCandidates = matches.filter(m =>
                      (kanbanJob === 'all' || m.job_id === kanbanJob) && m.status === stage
                    )
                    return (
                      <div key={stage} className="flex-shrink-0 w-64">
                        <div className={`rounded-xl px-3 py-2 mb-2 flex items-center justify-between ${STAGE_COLORS[stage]}`}>
                          <span className="text-sm font-bold">{stage}</span>
                          <span className="text-xs font-bold bg-white/50 rounded-full px-2 py-0.5">{stageCandidates.length}</span>
                        </div>
                        <div className="space-y-2 min-h-24">
                          {stageCandidates.map(match => (
                            <div key={match.id} className="bg-white rounded-xl border p-3 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                                  {match.candidates?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm truncate">{match.candidates?.name}</p>
                                  <p className="text-xs text-gray-400 truncate">{match.candidates?.job_title}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-blue-600 font-bold">{match.ai_score}% match</span>
                                <span className="text-xs text-gray-400">{match.candidates?.experience_years}yr exp</span>
                              </div>
                              <p className="text-xs text-gray-400 truncate mb-2">{match.jobs?.title}</p>
                              <div className="flex gap-1 flex-wrap">
                                {STAGES.filter(s=>s!==stage).slice(0,2).map(s=>(
                                  <button key={s} onClick={()=>updateMatchStatus(match.id,s)}
                                    className="text-xs bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-2 py-0.5 rounded-lg transition-colors">
                                    → {s}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-1 mt-2">
                                <button onClick={()=>{setSelectedCandidate(match);setShowInterviewModal(true)}}
                                  className="flex-1 text-xs bg-orange-50 text-orange-600 py-1 rounded-lg hover:bg-orange-100">📅</button>
                                {match.candidates?.resume_url && (
                                  <a href={match.candidates.resume_url} target="_blank" rel="noreferrer"
                                    className="flex-1 text-xs bg-blue-50 text-blue-600 py-1 rounded-lg hover:bg-blue-100 text-center">📥</a>
                                )}
                                <a href={`mailto:${match.candidates?.email}`}
                                  className="flex-1 text-xs bg-gray-50 text-gray-600 py-1 rounded-lg hover:bg-gray-100 text-center">✉️</a>
                              </div>
                            </div>
                          ))}
                          {stageCandidates.length === 0 && (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-300">
                              No candidates
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Interviews */}
          {tab==='interviews' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Interview Schedule</h2>
              {interviews.length===0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No interviews scheduled yet.</p>
                  <button onClick={() => setTab('candidates')} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold">Go to Candidates</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {interviews.map(iv => (
                    <div key={iv.id} className="bg-white rounded-2xl border p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-lg">
                            {iv.candidates?.name?.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold">{iv.candidates?.name}</h3>
                            <p className="text-xs text-gray-500">{iv.jobs?.title}</p>
                            <p className="text-xs text-orange-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(iv.scheduled_at).toLocaleString('en-IN', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${iv.status==='scheduled'?'bg-orange-100 text-orange-700':iv.status==='completed'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>
                            {iv.status}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{iv.duration_minutes} min • {iv.interview_type}</p>
                        </div>
                      </div>
                      {iv.meeting_link && (
                        <a href={iv.meeting_link} target="_blank" rel="noreferrer"
                          className="mt-3 flex items-center gap-2 text-xs text-blue-600 hover:underline">
                          🔗 {iv.meeting_link}
                        </a>
                      )}
                      {iv.notes && <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">{iv.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Offer Letter */}
          {tab==='offer-letter' && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">Generate Offer Letter</h2>
              <div className="bg-white rounded-2xl border p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-1">Select Candidate</label>
                  <select onChange={e => setSelectedCandidate(matches.find(m => m.id === e.target.value))}
                    className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Select candidate --</option>
                    {matches.filter(m => m.status === 'Selected' || m.status === 'Hired' || m.status === 'shortlist').map(m => (
                      <option key={m.id} value={m.id}>{m.candidates?.name} — {m.jobs?.title}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold block mb-1">Designation</label>
                    <input value={offerData.designation} onChange={e => setOfferData({...offerData, designation:e.target.value})} placeholder="e.g. Software Engineer"
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Department</label>
                    <input value={offerData.department} onChange={e => setOfferData({...offerData, department:e.target.value})} placeholder="e.g. Engineering"
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">CTC (Annual ₹)</label>
                    <input type="number" value={offerData.salary} onChange={e => setOfferData({...offerData, salary:e.target.value})} placeholder="e.g. 800000"
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Date of Joining</label>
                    <input type="date" value={offerData.joining_date} onChange={e => setOfferData({...offerData, joining_date:e.target.value})}
                      className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <button onClick={generateOfferLetter}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Generate & Download Offer Letter
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Candidate Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProfile(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold">👤 Candidate Profile</h3>
              <button onClick={() => setSelectedProfile(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-2xl flex-shrink-0">
                  {selectedProfile.candidates?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedProfile.candidates?.name}</h2>
                  <p className="text-gray-500 text-sm">{selectedProfile.candidates?.job_title || selectedProfile.candidates?.current_title || 'Professional'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selectedProfile.ai_score}% match</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{selectedProfile.candidates?.experience_years || 0} yrs exp</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">📞 Contact Information</h4>
                {selectedProfile.candidates?.email ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">✉️</span>
                    <a href={`mailto:${selectedProfile.candidates.email}`} className="text-blue-600 hover:underline">{selectedProfile.candidates.email}</a>
                  </div>
                ) : <p className="text-sm text-gray-400">Email not available</p>}
                {selectedProfile.candidates?.phone ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">📱</span>
                    <a href={`tel:${selectedProfile.candidates.phone}`} className="text-blue-600 hover:underline">{selectedProfile.candidates.phone}</a>
                  </div>
                ) : <p className="text-sm text-gray-400">Phone not available</p>}
                {selectedProfile.candidates?.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">📍</span>
                    <span>{selectedProfile.candidates.location}</span>
                  </div>
                )}
              </div>

              {/* Job Applied For */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-sm text-blue-700 mb-1">💼 Applied For</h4>
                <p className="text-sm font-medium">{selectedProfile.jobs?.title}</p>
                <p className="text-xs text-blue-500 mt-1">{selectedProfile.match_reason}</p>
              </div>

              {/* Skills */}
              {selectedProfile.candidates?.parsed_skills?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">🛠️ Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.candidates.parsed_skills.map((s, i) => (
                      <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education & Summary */}
              {selectedProfile.candidates?.education && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">🎓 Education</h4>
                  <p className="text-sm text-gray-600">{selectedProfile.candidates.education}</p>
                </div>
              )}
              {selectedProfile.candidates?.summary && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">📝 Summary</h4>
                  <p className="text-sm text-gray-600">{selectedProfile.candidates.summary}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap pt-2 border-t">
                {selectedProfile.candidates?.resume_url && (
                  <a href={selectedProfile.candidates.resume_url} target="_blank" rel="noreferrer"
                    className="flex-1 text-center py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-1">
                    <Download className="w-4 h-4" /> Download Resume
                  </a>
                )}
                {selectedProfile.candidates?.email && (
                  <a href={`mailto:${selectedProfile.candidates.email}`}
                    className="flex-1 text-center py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 flex items-center justify-center gap-1">
                    <Mail className="w-4 h-4" /> Send Email
                  </a>
                )}
                {selectedProfile.candidates?.phone && (
                  <a href={`tel:${selectedProfile.candidates.phone}`}
                    className="flex-1 text-center py-2 bg-gray-600 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 flex items-center justify-center gap-1">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                )}
                <button onClick={() => { setSelectedCandidate(selectedProfile); setShowInterviewModal(true); setSelectedProfile(null) }}
                  className="flex-1 text-center py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 flex items-center justify-center gap-1">
                  <Calendar className="w-4 h-4" /> Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Schedule Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInterviewModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-500" /> Schedule Interview</h2>
              <button onClick={() => setShowInterviewModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">For: <strong>{selectedCandidate?.candidates?.name}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold block mb-1">Date & Time*</label>
                <input type="datetime-local" value={interviewData.scheduled_at} onChange={e => setInterviewData({...interviewData, scheduled_at:e.target.value})}
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold block mb-1">Duration (min)</label>
                  <select value={interviewData.duration_minutes} onChange={e => setInterviewData({...interviewData, duration_minutes:e.target.value})}
                    className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Type</label>
                  <select value={interviewData.interview_type} onChange={e => setInterviewData({...interviewData, interview_type:e.target.value})}
                    className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="video">Video Call</option>
                    <option value="phone">Phone</option>
                    <option value="in-person">In Person</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Meeting Link</label>
                <input value={interviewData.meeting_link} onChange={e => setInterviewData({...interviewData, meeting_link:e.target.value})} placeholder="https://meet.google.com/..."
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Interviewer Name</label>
                <input value={interviewData.interviewer_name} onChange={e => setInterviewData({...interviewData, interviewer_name:e.target.value})} placeholder="HR Manager name"
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Notes</label>
                <textarea value={interviewData.notes} onChange={e => setInterviewData({...interviewData, notes:e.target.value})} rows={2} placeholder="Interview notes..."
                  className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              <button onClick={scheduleInterview} disabled={loading}
                className="w-full h-11 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" /> {loading ? 'Scheduling...' : 'Confirm Interview'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Letter Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOfferModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-green-600" /> Generate Offer Letter</h2>
              <button onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">For: <strong>{selectedCandidate?.candidates?.name}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold block mb-1">Designation*</label>
                <input value={offerData.designation} onChange={e => setOfferData({...offerData, designation:e.target.value})} placeholder="e.g. Software Engineer"
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Department</label>
                <input value={offerData.department} onChange={e => setOfferData({...offerData, department:e.target.value})} placeholder="e.g. Engineering"
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">CTC Annual (₹)*</label>
                <input type="number" value={offerData.salary} onChange={e => setOfferData({...offerData, salary:e.target.value})} placeholder="e.g. 800000"
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Date of Joining*</label>
                <input type="date" value={offerData.joining_date} onChange={e => setOfferData({...offerData, joining_date:e.target.value})}
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <button onClick={generateOfferLetter}
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download Offer Letter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyPortalPage
