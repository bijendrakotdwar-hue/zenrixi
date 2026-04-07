import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/supabase'
import { Users, Briefcase, FileText, CreditCard, Phone, Plus, LogOut, Eye, EyeOff, TrendingUp, Bell, CheckCircle, Clock, AlertCircle, Download, Send, Building2, Calendar, DollarSign, Star } from 'lucide-react'

const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }

const ConsultantPortalPage = () => {
  const [tab, setTab] = useState('dashboard')
  const [consultant, setConsultant] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [pendingReg, setPendingReg] = useState(null)
  const [showForgotConsultant, setShowForgotConsultant] = useState(false)
  const [forgotConsultantEmail, setForgotConsultantEmail] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Data
  const [clients, setClients] = useState([])
  const [placements, setPlacements] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [followups, setFollowups] = useState([])
  const [interviewLetters, setInterviewLetters] = useState([])
  const [vacancies, setVacancies] = useState([])
  const [vacancyMatches, setVacancyMatches] = useState([])
  const [matchingVacancyId, setMatchingVacancyId] = useState(null)
  const [showMatchesModal, setShowMatchesModal] = useState(false)
  const [selectedVacancyMatches, setSelectedVacancyMatches] = useState([])

  // Forms
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', phone: '', company_name: '', gst_number: '', address: '' })
  const [clientForm, setClientForm] = useState({ company_name: '', contact_person: '', email: '', phone: '', address: '', gst_number: '' })
  const [placementForm, setPlacementForm] = useState({ client_id: '', candidate_name: '', candidate_email: '', candidate_phone: '', position: '', joining_date: '', ctc: '', commission_percent: '8.33' })
  const [invoiceForm, setInvoiceForm] = useState({ client_id: '', due_date: '', items: [{ description: '', quantity: 1, rate: '', amount: '' }], gst_percent: '18', notes: '' })
  const [paymentForm, setPaymentForm] = useState({ invoice_id: '', client_id: '', amount: '', payment_date: '', payment_mode: 'bank_transfer', reference_number: '', notes: '' })
  const [followupForm, setFollowupForm] = useState({ client_id: '', type: 'call', subject: '', notes: '', follow_up_date: '', priority: 'medium' })
  const [vacancyForm, setVacancyForm] = useState({ client_id: '', title: '', description: '', required_skills: '', min_experience: '0', location: '', salary_range: '', vacancy_count: '1', priority: 'medium', target_date: '', notes: '' })
  const [showVacancyForm, setShowVacancyForm] = useState(false)
  const [letterForm, setLetterForm] = useState({ client_id: '', candidate_name: '', candidate_email: '', position: '', interview_date: '', interview_type: 'in-person', interview_location: '', meeting_link: '', interviewer_name: '' })

  const [showClientForm, setShowClientForm] = useState(false)
  const [showPlacementForm, setShowPlacementForm] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showFollowupForm, setShowFollowupForm] = useState(false)
  const [showLetterForm, setShowLetterForm] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('consultant_session')
    if (saved) {
      const data = JSON.parse(saved)
      setConsultant(data)
      setIsLoggedIn(true)
      loadData(data.id)
    }
  }, [])

  const loadData = async (cid) => {
    try {
      const [cl, pl, inv, pay, fu, il] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/consultant_clients?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/placements?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/invoices?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/payments?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/followups?consultant_id=eq.${cid}&order=follow_up_date.asc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/interview_letters?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/consultant_vacancies?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
      ])
      setClients(await cl.json())
      setPlacements(await pl.json())
      setInvoices(await inv.json())
      setPayments(await pay.json())
      setFollowups(await fu.json())
      const vac = await (await fetch(`${SUPABASE_URL}/rest/v1/consultant_vacancies?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h })).json()
      setInterviewLetters(await il.json())
      setVacancies(Array.isArray(vac) ? vac : [])
    } catch(e) { console.error(e) }
  }

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) { setError('Fill all fields'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/consultants?email=eq.${encodeURIComponent(loginForm.email)}&select=*`, { headers: h })
      const data = await res.json()
      if (!data.length) { setError('Account not found. Please register.'); return }
      if (data[0].password !== loginForm.password) { setError('Incorrect password.'); return }
      setConsultant(data[0]); setIsLoggedIn(true)
      localStorage.setItem('consultant_session', JSON.stringify(data[0]))
      await loadData(data[0].id)
    } catch { setError('Login failed.') }
    finally { setLoading(false) }
  }

  const handleRegister = async () => {
    if (!regForm.name || !regForm.email || !regForm.password) { setError('Name, email and password required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/consultants`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=representation' },
        body: JSON.stringify(regForm)
      })
      if (!res.ok) throw new Error('Registration failed')
      const data = await res.json()
      setConsultant(data[0]); setIsLoggedIn(true)
      localStorage.setItem('consultant_session', JSON.stringify(data[0]))
      await loadData(data[0].id)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const addClient = async () => {
    if (!clientForm.company_name) { alert('Company name required'); return }
    await fetch(`${SUPABASE_URL}/rest/v1/consultant_clients`, {
      method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ ...clientForm, consultant_id: consultant.id })
    })
    setClientForm({ company_name: '', contact_person: '', email: '', phone: '', address: '', gst_number: '' })
    setShowClientForm(false)
    await loadData(consultant.id)
  }

  const deleteRecord = async (table, id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE', headers: h
    })
    await loadData(consultant.id)
  }

  const addPlacement = async () => {
    if (!placementForm.candidate_name || !placementForm.position) { alert('Fill required fields'); return }
    const ctc = parseFloat(placementForm.ctc) || 0
    const commission = (ctc * parseFloat(placementForm.commission_percent)) / 100
    await fetch(`${SUPABASE_URL}/rest/v1/placements`, {
      method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ ...placementForm, consultant_id: consultant.id, commission_amount: commission, ctc })
    })
    setPlacementForm({ client_id: '', candidate_name: '', candidate_email: '', candidate_phone: '', position: '', joining_date: '', ctc: '', commission_percent: '8.33' })
    setShowPlacementForm(false)
    await loadData(consultant.id)
  }

  const addInvoice = async () => {
    if (!invoiceForm.client_id) { alert('Select client'); return }
    const subtotal = invoiceForm.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const gstAmt = (subtotal * parseFloat(invoiceForm.gst_percent)) / 100
    const total = subtotal + gstAmt
    const invNum = `INV-${Date.now().toString().slice(-6)}`
    await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
      method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ ...invoiceForm, consultant_id: consultant.id, invoice_number: invNum, subtotal, gst_amount: gstAmt, total })
    })
    setInvoiceForm({ client_id: '', due_date: '', items: [{ description: '', quantity: 1, rate: '', amount: '' }], gst_percent: '18', notes: '' })
    setShowInvoiceForm(false)
    await loadData(consultant.id)
  }

  const addPayment = async () => {
    if (!paymentForm.amount) { alert('Enter amount'); return }
    await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
      method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ ...paymentForm, consultant_id: consultant.id })
    })
    if (paymentForm.invoice_id) {
      await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${paymentForm.invoice_id}`, {
        method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'paid' })
      })
    }
    setPaymentForm({ invoice_id: '', client_id: '', amount: '', payment_date: '', payment_mode: 'bank_transfer', reference_number: '', notes: '' })
    setShowPaymentForm(false)
    await loadData(consultant.id)
  }

  const addFollowup = async () => {
    if (!followupForm.subject) { alert('Subject required'); return }
    await fetch(`${SUPABASE_URL}/rest/v1/followups`, {
      method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ ...followupForm, consultant_id: consultant.id })
    })
    setFollowupForm({ client_id: '', type: 'call', subject: '', notes: '', follow_up_date: '', priority: 'medium' })
    setShowFollowupForm(false)
    await loadData(consultant.id)
  }

  const completeFollowup = async (id) => {
    await fetch(`${SUPABASE_URL}/rest/v1/followups?id=eq.${id}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'completed' })
    })
    await loadData(consultant.id)
  }

  const runAIMatchingForVacancy = async (vacancy, vacancyId) => {
    try {
      // Get all candidates from Zenrixi DB
      const res = await fetch(`${SUPABASE_URL}/rest/v1/candidates?select=*`, { headers: h })
      const allCandidates = await res.json()
      if (!allCandidates.length) return

      setMatchingVacancyId(vacancyId)

      const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY
      let matched = 0

      for (const candidate of allCandidates.slice(0, 50)) { // max 50 candidates
        try {
          const prompt = `You are an expert HR consultant. Score this candidate for the vacancy.
Return ONLY valid JSON: {"score": 85, "reason": "Strong match because..."}
Score 0-100 based on skills, experience, and job fit.

VACANCY: \${vacancy.title}
Required Skills: \${Array.isArray(vacancy.required_skills) ? vacancy.required_skills.join(', ') : vacancy.required_skills}
Min Experience: \${vacancy.min_experience} years
Location: \${vacancy.location || 'Any'}

CANDIDATE: \${candidate.name}
Current Role: \${candidate.job_title || 'N/A'}
Experience: \${candidate.experience_years || 0} years
Skills: \${Array.isArray(candidate.parsed_skills) ? candidate.parsed_skills.join(', ') : 'N/A'}
Location: \${candidate.location || 'N/A'}`

          const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer \${OPENAI_KEY}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 150 })
          })
          const aiData = await aiRes.json()
          const text = aiData.choices?.[0]?.message?.content || '{}'
          const result = JSON.parse(text.replace(/```json|```/g, '').trim())

          if ((result.score || 0) >= 40) { // Only save 40%+ matches
            await fetch(`\${SUPABASE_URL}/rest/v1/vacancy_matches`, {
              method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
              body: JSON.stringify({
                consultant_id: consultant.id,
                vacancy_id: vacancyId,
                candidate_id: candidate.id,
                ai_score: result.score || 0,
                match_reason: result.reason || '',
                status: 'pending'
              })
            })
            matched++
          }
        } catch(e) { console.error('AI error for candidate:', e) }
      }

      setMatchingVacancyId(null)
      alert(`AI Matching Complete! \${matched} candidates matched for "\${vacancy.title}"`)
      await loadData(consultant.id)
    } catch(e) {
      setMatchingVacancyId(null)
      console.error('Matching failed:', e)
    }
  }

  const viewVacancyMatches = async (vacancyId) => {
    try {
      const res = await fetch(`\${SUPABASE_URL}/rest/v1/vacancy_matches?vacancy_id=eq.\${vacancyId}&select=*,candidates(name,email,phone,job_title,experience_years,parsed_skills,resume_url)&order=ai_score.desc`, { headers: h })
      const data = await res.json()
      setSelectedVacancyMatches(Array.isArray(data) ? data : [])
      setShowMatchesModal(true)
    } catch(e) { console.error(e) }
  }

  const updateMatchStatus = async (matchId, status) => {
    await fetch(`\${SUPABASE_URL}/rest/v1/vacancy_matches?id=eq.\${matchId}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status })
    })
    const updated = selectedVacancyMatches.map(m => m.id === matchId ? {...m, status} : m)
    setSelectedVacancyMatches(updated)
  }

  const postJobForConsultant = async () => {
    if (!jobForm.title || !jobForm.description || !jobForm.skills) { alert('Title, description and skills required'); return }
    setJobLoading(true)
    try {
      const skillsArray = jobForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          title: jobForm.title, description: jobForm.description,
          required_skills: skillsArray, min_experience: parseInt(jobForm.experience)||0,
          location: jobForm.location, status: 'active',
          posted_by_consultant: consultant.id, company_id: null
        })
      })
      if (!res.ok) throw new Error('Job post failed')
      // LinkedIn auto post
      try {
        await fetch('/api/linkedin-post', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: jobForm.title, company_name: consultant.company_name || consultant.name,
            location: jobForm.location || 'India', skills: jobForm.skills, experience: jobForm.experience
          })
        })
      } catch(e) { console.log('LinkedIn:', e) }
      setJobForm({ title: '', description: '', skills: '', experience: '0', location: '', salary: '' })
      setShowJobForm(false)
      await loadData(consultant.id)
      alert('Job posted on Zenrixi + LinkedIn!')
    } catch(e) { alert('Failed: ' + e.message) }
    finally { setJobLoading(false) }
  }

  const addCandidateForConsultant = async () => {
    if (!candidateForm.name || !candidateForm.email) { alert('Name and email required'); return }
    try {
      const check = await fetch(`${SUPABASE_URL}/rest/v1/candidates?email=eq.${encodeURIComponent(candidateForm.email)}&select=id`, { headers: h })
      const existing = await check.json()
      if (existing.length > 0) { alert('Candidate already exists in database!'); return }
      const skillsArray = candidateForm.skills ? candidateForm.skills.split(',').map(s => s.trim()) : []
      await fetch(`${SUPABASE_URL}/rest/v1/candidates`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          name: candidateForm.name, email: candidateForm.email, phone: candidateForm.phone,
          job_title: candidateForm.job_title, experience_years: parseInt(candidateForm.experience_years)||0,
          parsed_skills: skillsArray, location: candidateForm.location,
          password: 'Welcome@123', added_by_consultant: consultant.id
        })
      })
      setCandidateForm({ name: '', email: '', phone: '', job_title: '', experience_years: '0', skills: '', location: '' })
      setShowCandidateForm(false)
      await loadData(consultant.id)
      alert('Candidate added to Zenrixi database!')
    } catch(e) { alert('Failed: ' + e.message) }
  }

  const addVacancy = async () => {
    if (!vacancyForm.title || !vacancyForm.client_id) { alert('Client aur Title required hai'); return }
    const skillsArray = vacancyForm.required_skills.split(',').map(s => s.trim()).filter(Boolean)
    await fetch(`${SUPABASE_URL}/rest/v1/consultant_vacancies`, {
      method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ ...vacancyForm, consultant_id: consultant.id, required_skills: skillsArray, min_experience: parseInt(vacancyForm.min_experience)||0, vacancy_count: parseInt(vacancyForm.vacancy_count)||1 })
    })
    const res2 = await fetch(`${SUPABASE_URL}/rest/v1/consultant_vacancies?consultant_id=eq.${consultant.id}&order=created_at.desc&limit=1`, { headers: h })
    const newVac = await res2.json()
    setVacancyForm({ client_id: '', title: '', description: '', required_skills: '', min_experience: '0', location: '', salary_range: '', vacancy_count: '1', priority: 'medium', target_date: '', notes: '' })
    setShowVacancyForm(false)
    await loadData(consultant.id)
    // Auto trigger AI matching
    if (newVac[0]) {
      setTimeout(() => runAIMatchingForVacancy(newVac[0], newVac[0].id), 500)
    }
  }

  const updateVacancyStatus = async (id, status) => {
    await fetch(`${SUPABASE_URL}/rest/v1/consultant_vacancies?id=eq.${id}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status })
    })
    await loadData(consultant.id)
  }

  const postVacancyToZenrixi = async (vacancy) => {
    const client = clients.find(c => c.id === vacancy.client_id)
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          title: vacancy.title,
          description: vacancy.description || vacancy.title,
          required_skills: vacancy.required_skills || [],
          min_experience: vacancy.min_experience || 0,
          status: 'active',
          company_id: null
        })
      })
      const job = await res.json()
      await fetch(`${SUPABASE_URL}/rest/v1/consultant_vacancies?id=eq.${vacancy.id}`, {
        method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ posted_on_zenrixi: true, zenrixi_job_id: job[0]?.id })
      })
      alert('Vacancy posted on Zenrixi jobs!')
      await loadData(consultant.id)
    } catch(e) { alert('Failed: ' + e.message) }
  }

  const generateInterviewLetter = async () => {
    if (!letterForm.candidate_name || !letterForm.position || !letterForm.interview_date) { alert('Fill required fields'); return }
    const client = clients.find(c => c.id === letterForm.client_id)
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    const iDate = new Date(letterForm.interview_date).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    const html = `<!DOCTYPE html>
<html><head><style>
  body { font-family: 'Arial', sans-serif; max-width: 800px; margin: 40px auto; padding: 40px; color: #222; line-height: 1.7; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 26px; font-weight: 900; color: #1e40af; }
  .company-info { text-align: right; font-size: 12px; color: #666; }
  .title { font-size: 18px; font-weight: bold; text-align: center; margin: 25px 0; text-decoration: underline; letter-spacing: 1px; }
  .ref { font-size: 12px; color: #666; margin-bottom: 20px; }
  .highlight-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  td:first-child { font-weight: 600; color: #374151; width: 40%; }
  .footer { margin-top: 60px; display: flex; justify-content: space-between; }
  .sign-box { text-align: center; }
  .sign-line { border-top: 1px solid #333; padding-top: 8px; margin-top: 50px; font-size: 13px; }
  .stamp-box { width: 100px; height: 100px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px; margin: 0 auto; }
</style></head>
<body>
  <div class="header">
    <div>
      <div class="logo">${consultant?.company_name || consultant?.name}</div>
      <div style="font-size:12px;color:#666">HR Consultancy Services</div>
      ${consultant?.gst_number ? `<div style="font-size:11px;color:#888">GST: ${consultant.gst_number}</div>` : ''}
    </div>
    <div class="company-info">
      <div>${consultant?.address || ''}</div>
      <div>${consultant?.phone || ''}</div>
      <div>${consultant?.email || ''}</div>
    </div>
  </div>

  <div class="ref">Ref No: IL-${Date.now().toString().slice(-6)} &nbsp;&nbsp; Date: ${today}</div>

  <p>To,<br><strong>${letterForm.candidate_name}</strong><br>${letterForm.candidate_email || ''}</p>

  <div class="title">INTERVIEW CALL LETTER</div>

  <p>Dear <strong>${letterForm.candidate_name}</strong>,</p>
  <p>We are pleased to inform you that your profile has been shortlisted for the position of <strong>${letterForm.position}</strong>${client ? ` at <strong>${client.company_name}</strong>` : ''}. We would like to invite you for an interview as per the details mentioned below:</p>

  <div class="highlight-box">
    <table>
      <tr><td>Position Applied For</td><td>${letterForm.position}</td></tr>
      ${client ? `<tr><td>Company Name</td><td>${client.company_name}</td></tr>` : ''}
      <tr><td>Interview Date & Time</td><td><strong>${iDate}</strong></td></tr>
      <tr><td>Interview Mode</td><td>${letterForm.interview_type === 'video' ? '🎥 Video Call' : letterForm.interview_type === 'phone' ? '📞 Phone' : '🏢 In Person'}</td></tr>
      ${letterForm.interview_location ? `<tr><td>Venue / Link</td><td>${letterForm.interview_location || letterForm.meeting_link}</td></tr>` : ''}
      ${letterForm.meeting_link ? `<tr><td>Meeting Link</td><td>${letterForm.meeting_link}</td></tr>` : ''}
      ${letterForm.interviewer_name ? `<tr><td>Interviewer</td><td>${letterForm.interviewer_name}</td></tr>` : ''}
    </table>
  </div>

  <p><strong>Please bring the following documents:</strong></p>
  <ul style="color:#374151;font-size:14px">
    <li>Updated Resume (2 copies)</li>
    <li>Aadhar Card / PAN Card (Original + Photocopy)</li>
    <li>Educational Certificates</li>
    <li>Previous Employment Documents</li>
    <li>Passport size photographs (2)</li>
  </ul>

  <p>Kindly confirm your attendance by replying to this letter or contacting us at <strong>${consultant?.phone || consultant?.email}</strong>.</p>
  <p>We look forward to meeting you.</p>

  <div class="footer">
    <div class="sign-box">
      <div class="stamp-box">STAMP</div>
      <div class="sign-line">Authorized Signatory<br>${consultant?.company_name || consultant?.name}</div>
    </div>
    <div class="sign-box">
      <div class="sign-line">Candidate Acknowledgement<br>${letterForm.candidate_name}</div>
    </div>
  </div>
</body></html>`

    await fetch(`${SUPABASE_URL}/rest/v1/interview_letters`, {
      method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ ...letterForm, consultant_id: consultant.id })
    })

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Interview_Letter_${letterForm.candidate_name.replace(/ /g,'_')}.html`
    a.click()
    setShowLetterForm(false)
    setLetterForm({ client_id: '', candidate_name: '', candidate_email: '', position: '', interview_date: '', interview_type: 'in-person', interview_location: '', meeting_link: '', interviewer_name: '' })
    await loadData(consultant.id)
  }

  const generateInvoicePDF = (inv) => {
    const client = clients.find(c => c.id === inv.client_id)
    const today = new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items

    const html = `<!DOCTYPE html>
<html><head><style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 30px auto; padding: 40px; color: #222; }
  .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 25px; }
  .logo { font-size: 28px; font-weight: 900; color: #1e40af; }
  .inv-title { font-size: 22px; font-weight: bold; color: #1e40af; text-align: right; }
  .inv-num { color: #666; font-size: 13px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
  .party-box { background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 13px; }
  .party-box h4 { color: #1e40af; margin: 0 0 8px; font-size: 11px; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #1e40af; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
  td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  .total-box { float: right; width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .grand-total { background: #1e40af; color: white; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;
    background: ${inv.status === 'paid' ? '#dcfce7' : '#fef9c3'}; color: ${inv.status === 'paid' ? '#166534' : '#854d0e'}; }
  .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 15px; }
</style></head>
<body>
  <div class="header">
    <div>
      <div class="logo">${consultant?.company_name || consultant?.name}</div>
      <div style="font-size:12px;color:#666">${consultant?.address || ''}</div>
      <div style="font-size:12px;color:#666">GST: ${consultant?.gst_number || 'N/A'}</div>
    </div>
    <div style="text-align:right">
      <div class="inv-title">INVOICE</div>
      <div class="inv-num"># ${inv.invoice_number}</div>
      <div class="inv-num">Date: ${today}</div>
      <div class="inv-num">Due: ${inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : 'N/A'}</div>
      <div><span class="status-badge">${inv.status?.toUpperCase()}</span></div>
    </div>
  </div>

  <div class="parties">
    <div class="party-box">
      <h4>FROM</h4>
      <strong>${consultant?.company_name || consultant?.name}</strong><br>
      ${consultant?.email || ''}<br>${consultant?.phone || ''}
    </div>
    <div class="party-box">
      <h4>BILL TO</h4>
      <strong>${client?.company_name || 'Client'}</strong><br>
      ${client?.contact_person || ''}<br>
      ${client?.email || ''}<br>
      ${client?.gst_number ? `GST: ${client.gst_number}` : ''}
    </div>
  </div>

  <table>
    <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Rate (₹)</th><th>Amount (₹)</th></tr></thead>
    <tbody>
      ${items.map((item, i) => `<tr><td>${i+1}</td><td>${item.description}</td><td>${item.quantity}</td><td>${Number(item.rate).toLocaleString('en-IN')}</td><td>${Number(item.amount).toLocaleString('en-IN')}</td></tr>`).join('')}
    </tbody>
  </table>

  <div class="total-box">
    <div class="total-row"><span>Subtotal</span><span>₹${Number(inv.subtotal).toLocaleString('en-IN')}</span></div>
    <div class="total-row"><span>GST (${inv.gst_percent}%)</span><span>₹${Number(inv.gst_amount).toLocaleString('en-IN')}</span></div>
    <div class="grand-total"><span>Total</span><span>₹${Number(inv.total).toLocaleString('en-IN')}</span></div>
  </div>

  <div style="clear:both;margin-top:30px">
    ${inv.notes ? `<p style="font-size:13px;color:#666"><strong>Notes:</strong> ${inv.notes}</p>` : ''}
    <p style="font-size:13px"><strong>Bank Details:</strong> Please contact us for bank transfer details.</p>
  </div>

  <div class="footer">Thank you for your business! | ${consultant?.company_name || consultant?.name} | ${consultant?.email}</div>
</body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice_${inv.invoice_number}.html`
    a.click()
  }

  // Stats
  const totalRevenue = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const pendingInvoices = invoices.filter(i => i.status === 'unpaid')
  const pendingAmount = pendingInvoices.reduce((s, i) => s + (parseFloat(i.total) || 0), 0)
  const pendingFollowups = followups.filter(f => f.status === 'pending')
  const totalPlacements = placements.length
  const openVacancies = vacancies.filter(v => v.status === 'open').length

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-3xl font-black text-blue-700">zenrixi</div>
            <div className="text-sm text-gray-500 mt-1">Consultant Portal</div>
          </div>
          {showForgotConsultant ? (
          <>
            <h2 className="text-xl font-bold mb-5 text-center">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-4 text-center">Enter your registered email</p>
            {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-xl">{error}</p>}
            <div className="space-y-3">
              <input type="email" placeholder="Registered email" value={forgotConsultantEmail}
                onChange={e => setForgotConsultantEmail(e.target.value)}
                className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={async () => {
                if (!forgotConsultantEmail) { setError('Email required'); return }
                const res = await fetch(`${SUPABASE_URL}/rest/v1/consultants?email=eq.${encodeURIComponent(forgotConsultantEmail)}&select=id,name`, { headers: h })
                const data = await res.json()
                if (!data.length) { setError('Email not found'); return }
                alert('Please contact admin to reset your password or re-register with a new account.')
                setShowForgotConsultant(false)
              }} className="w-full h-11 bg-blue-700 text-white font-bold rounded-xl">Check Email</button>
              <button onClick={() => { setShowForgotConsultant(false); setError('') }} className="w-full text-xs text-gray-500 hover:text-blue-600 text-center">← Back to Login</button>
            </div>
          </>
        ) : !isRegister ? (
            <>
              <h2 className="text-xl font-bold mb-5 text-center">Login to your account</h2>
              {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-xl">{error}</p>}
              <div className="space-y-3">
                <input type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email:e.target.value})}
                  onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="relative">
                  <input type={showPass?'text':'password'} placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password:e.target.value})}
                    onKeyDown={e => e.key==='Enter'&&handleLogin()}
                    className="w-full h-11 border rounded-xl px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button onClick={() => setShowForgotConsultant(true)} className="text-xs text-blue-600 hover:underline text-right w-full">Forgot password?</button>
                <button onClick={handleLogin} disabled={loading}
                  className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl disabled:opacity-60">
                  {loading ? 'Logging in...' : 'Login →'}
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">New consultant? <button onClick={() => { setIsRegister(true); setError('') }} className="text-blue-600 font-bold">Register here</button></p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-5 text-center">Create Account</h2>
              {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-xl">{error}</p>}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Full Name*" value={regForm.name} onChange={e => setRegForm({...regForm, name:e.target.value})}
                    className="h-11 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2" />
                  <input type="email" placeholder="Email*" value={regForm.email} onChange={e => setRegForm({...regForm, email:e.target.value})}
                    className="h-11 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="password" placeholder="Password*" value={regForm.password} onChange={e => setRegForm({...regForm, password:e.target.value})}
                    className="h-11 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input placeholder="Phone" value={regForm.phone} onChange={e => setRegForm({...regForm, phone:e.target.value})}
                    className="h-11 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input placeholder="Firm/Company Name" value={regForm.company_name} onChange={e => setRegForm({...regForm, company_name:e.target.value})}
                    className="h-11 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input placeholder="GST Number" value={regForm.gst_number} onChange={e => setRegForm({...regForm, gst_number:e.target.value})}
                    className="h-11 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2" />
                  <textarea placeholder="Address" value={regForm.address} onChange={e => setRegForm({...regForm, address:e.target.value})} rows={2}
                    className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2 resize-none" />
                </div>
                <button onClick={handleRegister} disabled={loading}
                  className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl disabled:opacity-60">
                  {loading ? 'Creating...' : 'Create Account →'}
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">Already have account? <button onClick={() => { setIsRegister(false); setError('') }} className="text-blue-600 font-bold">Login</button></p>
            </>
          )}
        </div>
      </div>
    )
  }

  const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
          </div>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-3 px-6 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-xl font-black">zenrixi</div>
          <span className="text-blue-300 text-xs hidden sm:block">Consultant Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-bold">{consultant?.company_name || consultant?.name}</div>
            <div className="text-xs text-blue-300">{consultant?.email}</div>
          </div>
          <button onClick={() => { setIsLoggedIn(false); setConsultant(null); localStorage.removeItem('consultant_session') }}
            className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside className="w-56 bg-white border-r hidden md:flex flex-col p-4 gap-1 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          {[
            ['dashboard', 'Dashboard', Star],
            ['clients', `Clients (${clients.length})`, Building2],
            ['placements', `Placements (${totalPlacements})`, Users],
            ['interviews', `Interview Letters (${interviewLetters.length})`, Calendar],
            ['invoices', `Invoices (${invoices.length})`, FileText],
            ['payments', `Payments (${payments.length})`, CreditCard],
            ['vacancies', `Vacancies (${vacancies.length})`, Briefcase],
            ['followups', `Follow-ups (${pendingFollowups.length})`, Bell],
          ].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${tab===id?'bg-blue-700 text-white shadow-md':'text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </button>
          ))}
        </aside>

        <div className="md:hidden w-full">
          <div className="flex gap-2 p-3 bg-white border-b overflow-x-auto">
            {[['dashboard','Home'],['clients','Clients'],['placements','Placed'],['interviews','Letters'],['invoices','Invoices'],['payments','Payments'],['post-job','Post Job'],['my-candidates','Candidates'],['vacancies','Vacancies'],['followups','Follow-up']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${tab===id?'bg-blue-700 text-white':'bg-gray-100 text-gray-600'}`}>{label}</button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-5 overflow-y-auto">

          {/* DASHBOARD */}
          {tab==='dashboard' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">Good day, {consultant?.name}! 👋</h2>
                <p className="text-gray-500 text-sm">Here's your business overview</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ['Total Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`, 'bg-green-500', TrendingUp, 'payments'],
                  ['Pending Amount', `₹${pendingAmount.toLocaleString('en-IN')}`, 'bg-red-500', AlertCircle, 'invoices'],
                  ['Total Placements', totalPlacements, 'bg-blue-500', Users, 'placements'],
                  ['Follow-ups Due', pendingFollowups.length, 'bg-orange-500', Bell, 'followups'],
                ].map(([label, value, color, Icon, targetTab]) => (
                  <div key={label} onClick={() => setTab(targetTab)} className="bg-white rounded-2xl border p-5 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all">
                    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{value}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ['+ Add Client', () => { setTab('clients'); setShowClientForm(true) }, 'bg-blue-700 text-white'],
                  ['+ New Placement', () => { setTab('placements'); setShowPlacementForm(true) }, 'bg-green-600 text-white'],
                  ['+ Interview Letter', () => { setTab('interviews'); setShowLetterForm(true) }, 'bg-purple-600 text-white'],
                  ['+ Create Invoice', () => { setTab('invoices'); setShowInvoiceForm(true) }, 'bg-orange-500 text-white'],
                  ['+ Record Payment', () => { setTab('payments'); setShowPaymentForm(true) }, 'bg-teal-600 text-white'],
                  ['+ Add Vacancy', () => { setTab('vacancies'); setShowVacancyForm(true) }, 'bg-indigo-600 text-white'],
                  ['+ Add Follow-up', () => { setTab('followups'); setShowFollowupForm(true) }, 'bg-red-500 text-white'],
                ].map(([label, action, cls]) => (
                  <button key={label} onClick={action} className={`${cls} rounded-xl py-3 text-sm font-bold hover:opacity-90 transition-opacity`}>{label}</button>
                ))}
              </div>

              {pendingFollowups.length > 0 && (
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-orange-500" /> Pending Follow-ups</h3>
                  <div className="space-y-2">
                    {pendingFollowups.slice(0,5).map(f => (
                      <div key={f.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium">{f.subject}</p>
                          <p className="text-xs text-gray-500">{f.type} • {f.follow_up_date ? new Date(f.follow_up_date).toLocaleDateString('en-IN') : 'No date'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${f.priority==='high'?'bg-red-100 text-red-700':f.priority==='medium'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600'}`}>{f.priority}</span>
                          <button onClick={() => completeFollowup(f.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg">Done</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CLIENTS */}
          {tab==='clients' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold">Clients ({clients.length})</h2>
                <button onClick={() => setShowClientForm(true)} className="bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Client
                </button>
              </div>
              {clients.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No clients yet. Add your first client!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clients.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-700 text-lg">{c.company_name?.charAt(0)}</div>
                        <div>
                          <h3 className="font-bold">{c.company_name}</h3>
                          <p className="text-xs text-gray-500">{c.contact_person}</p>
                        </div>
                        <span className={`ml-auto text-xs px-2 py-1 rounded-full ${c.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        {c.email && <p className="flex items-center gap-2"><span>✉️</span>{c.email}</p>}
                        {c.phone && <p className="flex items-center gap-2"><span>📞</span>{c.phone}</p>}
                        {c.gst_number && <p className="flex items-center gap-2"><span>🏛️</span>GST: {c.gst_number}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PLACEMENTS */}
          {tab==='placements' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold">Placements ({placements.length})</h2>
                <button onClick={() => setShowPlacementForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Placement
                </button>
              </div>
              {placements.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No placements recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {placements.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl border p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold">{p.candidate_name}</h3>
                          <p className="text-sm text-gray-500">{p.position}</p>
                          <p className="text-xs text-blue-600 mt-1">{clients.find(c=>c.id===p.client_id)?.company_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">Commission: ₹{Number(p.commission_amount).toLocaleString('en-IN')}</p>
                          <p className="text-xs text-gray-400">CTC: ₹{Number(p.ctc).toLocaleString('en-IN')}</p>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.status}</span>
                        </div>
                      </div>
                      {p.joining_date && <p className="text-xs text-gray-400 mt-2">Joining: {new Date(p.joining_date).toLocaleDateString('en-IN')}</p>}
                      <button onClick={() => deleteRecord('placements', p.id)} className="text-xs text-red-500 hover:text-red-700 mt-2">🗑 Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INTERVIEW LETTERS */}
          {tab==='interviews' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold">Interview Letters ({interviewLetters.length})</h2>
                <button onClick={() => setShowLetterForm(true)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Generate Letter
                </button>
              </div>
              {interviewLetters.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No interview letters generated yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interviewLetters.map(il => (
                    <div key={il.id} className="bg-white rounded-2xl border p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold">{il.candidate_name}</h3>
                          <p className="text-sm text-gray-500">{il.position}</p>
                          <p className="text-xs text-purple-600">{clients.find(c=>c.id===il.client_id)?.company_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{il.interview_date ? new Date(il.interview_date).toLocaleDateString('en-IN') : ''}</p>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{il.interview_type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INVOICES */}
          {tab==='invoices' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold">Invoices ({invoices.length})</h2>
                <button onClick={() => setShowInvoiceForm(true)} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create Invoice
                </button>
              </div>
              {invoices.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No invoices created yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map(inv => (
                    <div key={inv.id} className="bg-white rounded-2xl border p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold">#{inv.invoice_number}</h3>
                          <p className="text-sm text-gray-500">{clients.find(c=>c.id===inv.client_id)?.company_name}</p>
                          <p className="text-xs text-gray-400">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">₹{Number(inv.total).toLocaleString('en-IN')}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status==='paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => deleteRecord('invoices', inv.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200">🗑</button>
                        <button onClick={() => generateInvoicePDF(inv)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <Download className="w-3 h-3" /> Download
                        </button>
                        {inv.status === 'unpaid' && (
                          <button onClick={() => { setPaymentForm({...paymentForm, invoice_id: inv.id, client_id: inv.client_id, amount: inv.total}); setShowPaymentForm(true); setTab('payments') }}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS */}
          {tab==='payments' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold">Payments ({payments.length})</h2>
                <button onClick={() => setShowPaymentForm(true)} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Record Payment
                </button>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-5 text-white mb-5">
                <p className="text-sm opacity-80">Total Revenue Received</p>
                <p className="text-4xl font-black">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-sm opacity-80 mt-1">Pending: ₹{pendingAmount.toLocaleString('en-IN')}</p>
              </div>
              {payments.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No payments recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl border p-5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-green-600">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500">{clients.find(c=>c.id===p.client_id)?.company_name}</p>
                        <p className="text-xs text-gray-400">{p.payment_mode} • {p.reference_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : ''}</p>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Received</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FOLLOW-UPS */}
          {tab==='followups' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold">Follow-ups</h2>
                <button onClick={() => setShowFollowupForm(true)} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Follow-up
                </button>
              </div>
              <div className="flex gap-3 mb-4">
                <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-sm font-bold">Pending: {pendingFollowups.length}</div>
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-bold">Completed: {followups.filter(f=>f.status==='completed').length}</div>
              </div>
              {followups.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No follow-ups added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followups.map(f => (
                    <div key={f.id} className={`bg-white rounded-2xl border p-5 ${f.status==='completed'?'opacity-60':''}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{f.type==='call'?'📞':f.type==='email'?'✉️':f.type==='meeting'?'🤝':'📋'}</span>
                            <h3 className="font-bold">{f.subject}</h3>
                          </div>
                          <p className="text-xs text-gray-500">{clients.find(c=>c.id===f.client_id)?.company_name}</p>
                          {f.notes && <p className="text-xs text-gray-500 mt-1">{f.notes}</p>}
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${f.priority==='high'?'bg-red-100 text-red-700':f.priority==='medium'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600'}`}>{f.priority}</span>
                          {f.follow_up_date && <p className="text-xs text-gray-400">{new Date(f.follow_up_date).toLocaleDateString('en-IN')}</p>}
                          {f.status === 'pending' && (
                            <button onClick={() => completeFollowup(f.id)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg">✓ Done</button>
                          )}
                          <button onClick={() => deleteRecord('followups', f.id)} className="text-xs text-red-400 hover:text-red-600">🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* AI Matches Modal */}
      {showMatchesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMatchesModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold">AI Matched Candidates</h3>
                <p className="text-sm text-gray-500">{selectedVacancyMatches.length} candidates matched</p>
              </div>
              <button onClick={() => setShowMatchesModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            {selectedVacancyMatches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No matches yet. Run AI Matching first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedVacancyMatches.map(match => (
                  <div key={match.id} className="border rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {match.candidates?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold">{match.candidates?.name}</h4>
                          <p className="text-xs text-gray-500">{match.candidates?.job_title} • {match.candidates?.experience_years}yr exp</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-indigo-600">{match.ai_score}%</div>
                        <select value={match.status} onChange={e => updateMatchStatus(match.id, e.target.value)}
                          className="text-xs border rounded-lg px-2 py-0.5 mt-1 focus:outline-none">
                          <option value="pending">Pending</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview_scheduled">Interview Scheduled</option>
                          <option value="selected">Selected</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                    {match.match_reason && <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">{match.match_reason}</p>}
                    {Array.isArray(match.candidates?.parsed_skills) && match.candidates.parsed_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {match.candidates.parsed_skills.slice(0,5).map((s,i) => <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{s}</span>)}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      {match.candidates?.email && <a href={`mailto:${match.candidates.email}`} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">✉️ Email</a>}
                      {match.candidates?.phone && <a href={`tel:${match.candidates.phone}`} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">📞 Call</a>}
                      {match.candidates?.resume_url && <a href={match.candidates.resume_url} target="_blank" rel="noreferrer" className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700">📄 Resume</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal show={showVacancyForm} onClose={() => setShowVacancyForm(false)} title="Add New Vacancy">
        <div className="space-y-3">
          <select value={vacancyForm.client_id} onChange={e => setVacancyForm({...vacancyForm, client_id:e.target.value})} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select Client*</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <input placeholder="Job Title*" value={vacancyForm.title} onChange={e => setVacancyForm({...vacancyForm, title:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <textarea placeholder="Job Description" value={vacancyForm.description} onChange={e => setVacancyForm({...vacancyForm, description:e.target.value})} rows={3} className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          <input placeholder="Required Skills (comma separated)" value={vacancyForm.required_skills} onChange={e => setVacancyForm({...vacancyForm, required_skills:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Location" value={vacancyForm.location} onChange={e => setVacancyForm({...vacancyForm, location:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input placeholder="Salary Range (e.g. 8-12 LPA)" value={vacancyForm.salary_range} onChange={e => setVacancyForm({...vacancyForm, salary_range:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input placeholder="Min Experience (years)" type="number" value={vacancyForm.min_experience} onChange={e => setVacancyForm({...vacancyForm, min_experience:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input placeholder="No. of Positions" type="number" value={vacancyForm.vacancy_count} onChange={e => setVacancyForm({...vacancyForm, vacancy_count:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={vacancyForm.priority} onChange={e => setVacancyForm({...vacancyForm, priority:e.target.value})} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input type="date" placeholder="Target Date" value={vacancyForm.target_date} onChange={e => setVacancyForm({...vacancyForm, target_date:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <textarea placeholder="Notes" value={vacancyForm.notes} onChange={e => setVacancyForm({...vacancyForm, notes:e.target.value})} rows={2} className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          <button onClick={addVacancy} className="w-full h-11 bg-indigo-600 text-white font-bold rounded-xl">Add Vacancy</button>
        </div>
      </Modal>

      <Modal show={showClientForm} onClose={() => setShowClientForm(false)} title="Add New Client">
        <div className="space-y-3">
          <input placeholder="Company Name*" value={clientForm.company_name} onChange={e => setClientForm({...clientForm, company_name:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Contact Person" value={clientForm.contact_person} onChange={e => setClientForm({...clientForm, contact_person:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Phone" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input placeholder="GST Number" value={clientForm.gst_number} onChange={e => setClientForm({...clientForm, gst_number:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea placeholder="Address" value={clientForm.address} onChange={e => setClientForm({...clientForm, address:e.target.value})} rows={2} className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <button onClick={addClient} className="w-full h-11 bg-blue-700 text-white font-bold rounded-xl">Add Client</button>
        </div>
      </Modal>

      <Modal show={showPlacementForm} onClose={() => setShowPlacementForm(false)} title="Record Placement">
        <div className="space-y-3">
          <select value={placementForm.client_id} onChange={e => setPlacementForm({...placementForm, client_id:e.target.value})} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Client*</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Candidate Name*" value={placementForm.candidate_name} onChange={e => setPlacementForm({...placementForm, candidate_name:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Position*" value={placementForm.position} onChange={e => setPlacementForm({...placementForm, position:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Email" value={placementForm.candidate_email} onChange={e => setPlacementForm({...placementForm, candidate_email:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Phone" value={placementForm.candidate_phone} onChange={e => setPlacementForm({...placementForm, candidate_phone:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="CTC Annual (₹)" type="number" value={placementForm.ctc} onChange={e => setPlacementForm({...placementForm, ctc:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Commission %" type="number" value={placementForm.commission_percent} onChange={e => setPlacementForm({...placementForm, commission_percent:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input type="date" value={placementForm.joining_date} onChange={e => setPlacementForm({...placementForm, joining_date:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {placementForm.ctc && placementForm.commission_percent && (
            <div className="bg-green-50 p-3 rounded-xl text-sm text-green-700 font-medium">
              Commission: ₹{((parseFloat(placementForm.ctc) * parseFloat(placementForm.commission_percent)) / 100).toLocaleString('en-IN')}
            </div>
          )}
          <button onClick={addPlacement} className="w-full h-11 bg-green-600 text-white font-bold rounded-xl">Record Placement</button>
        </div>
      </Modal>

      <Modal show={showLetterForm} onClose={() => setShowLetterForm(false)} title="Generate Interview Letter">
        <div className="space-y-3">
          <select value={letterForm.client_id} onChange={e => setLetterForm({...letterForm, client_id:e.target.value})} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Select Client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Candidate Name*" value={letterForm.candidate_name} onChange={e => setLetterForm({...letterForm, candidate_name:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input placeholder="Candidate Email" value={letterForm.candidate_email} onChange={e => setLetterForm({...letterForm, candidate_email:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <input placeholder="Position*" value={letterForm.position} onChange={e => setLetterForm({...letterForm, position:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <input type="datetime-local" value={letterForm.interview_date} onChange={e => setLetterForm({...letterForm, interview_date:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <div className="grid grid-cols-2 gap-3">
            <select value={letterForm.interview_type} onChange={e => setLetterForm({...letterForm, interview_type:e.target.value})} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="in-person">In Person</option>
              <option value="video">Video Call</option>
              <option value="phone">Phone</option>
            </select>
            <input placeholder="Interviewer Name" value={letterForm.interviewer_name} onChange={e => setLetterForm({...letterForm, interviewer_name:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <input placeholder="Venue / Location" value={letterForm.interview_location} onChange={e => setLetterForm({...letterForm, interview_location:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <input placeholder="Meeting Link (for video)" value={letterForm.meeting_link} onChange={e => setLetterForm({...letterForm, meeting_link:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <button onClick={generateInterviewLetter} className="w-full h-11 bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Generate & Download Letter
          </button>
        </div>
      </Modal>

      <Modal show={showInvoiceForm} onClose={() => setShowInvoiceForm(false)} title="Create Invoice">
        <div className="space-y-3">
          <select value={invoiceForm.client_id} onChange={e => setInvoiceForm({...invoiceForm, client_id:e.target.value})} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">Select Client*</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <input type="date" placeholder="Due Date" value={invoiceForm.due_date} onChange={e => setInvoiceForm({...invoiceForm, due_date:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <div className="border rounded-xl p-3">
            <p className="text-sm font-semibold mb-2">Items</p>
            {invoiceForm.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                <input placeholder="Description" value={item.description} onChange={e => { const items=[...invoiceForm.items]; items[idx].description=e.target.value; setInvoiceForm({...invoiceForm, items}) }} className="col-span-2 h-9 border rounded-lg px-3 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                <input placeholder="Rate" type="number" value={item.rate} onChange={e => { const items=[...invoiceForm.items]; items[idx].rate=e.target.value; items[idx].amount=e.target.value*items[idx].quantity; setInvoiceForm({...invoiceForm, items}) }} className="h-9 border rounded-lg px-3 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                <input placeholder="Amount" type="number" value={item.amount} readOnly className="h-9 border rounded-lg px-3 text-xs bg-gray-50" />
              </div>
            ))}
            <button onClick={() => setInvoiceForm({...invoiceForm, items:[...invoiceForm.items, {description:'',quantity:1,rate:'',amount:''}]})} className="text-xs text-orange-600 font-bold">+ Add Item</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={invoiceForm.gst_percent} onChange={e => setInvoiceForm({...invoiceForm, gst_percent:e.target.value})} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="0">GST 0%</option>
              <option value="5">GST 5%</option>
              <option value="12">GST 12%</option>
              <option value="18">GST 18%</option>
            </select>
            <div className="bg-orange-50 rounded-xl px-4 flex items-center text-sm font-bold text-orange-700">
              Total: ₹{(invoiceForm.items.reduce((s,i)=>s+(parseFloat(i.amount)||0),0)*(1+parseFloat(invoiceForm.gst_percent)/100)).toLocaleString('en-IN')}
            </div>
          </div>
          <textarea placeholder="Notes" value={invoiceForm.notes} onChange={e => setInvoiceForm({...invoiceForm, notes:e.target.value})} rows={2} className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          <button onClick={addInvoice} className="w-full h-11 bg-orange-500 text-white font-bold rounded-xl">Create Invoice</button>
        </div>
      </Modal>

      <Modal show={showPaymentForm} onClose={() => setShowPaymentForm(false)} title="Record Payment">
        <div className="space-y-3">
          <select value={paymentForm.client_id} onChange={e => setPaymentForm({...paymentForm, client_id:e.target.value})} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Select Client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <select value={paymentForm.invoice_id} onChange={e => setPaymentForm({...paymentForm, invoice_id:e.target.value})} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Link Invoice (optional)</option>
            {invoices.filter(i=>i.status==='unpaid').map(i => <option key={i.id} value={i.id}>#{i.invoice_number} — ₹{Number(i.total).toLocaleString('en-IN')}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Amount (₹)*" type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <select value={paymentForm.payment_mode} onChange={e => setPaymentForm({...paymentForm, payment_mode:e.target.value})} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
            <option value="cheque">Cheque</option>
            <option value="cash">Cash</option>
            <option value="neft">NEFT/RTGS</option>
          </select>
          <input placeholder="Reference Number" value={paymentForm.reference_number} onChange={e => setPaymentForm({...paymentForm, reference_number:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <textarea placeholder="Notes" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes:e.target.value})} rows={2} className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          <button onClick={addPayment} className="w-full h-11 bg-teal-600 text-white font-bold rounded-xl">Record Payment</button>
        </div>
      </Modal>

      <Modal show={showFollowupForm} onClose={() => setShowFollowupForm(false)} title="Add Follow-up">
        <div className="space-y-3">
          <select value={followupForm.client_id} onChange={e => setFollowupForm({...followupForm, client_id:e.target.value})} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
            <option value="">Select Client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={followupForm.type} onChange={e => setFollowupForm({...followupForm, type:e.target.value})} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="call">📞 Call</option>
              <option value="email">✉️ Email</option>
              <option value="meeting">🤝 Meeting</option>
              <option value="other">📋 Other</option>
            </select>
            <select value={followupForm.priority} onChange={e => setFollowupForm({...followupForm, priority:e.target.value})} className="h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <input placeholder="Subject*" value={followupForm.subject} onChange={e => setFollowupForm({...followupForm, subject:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          <textarea placeholder="Notes" value={followupForm.notes} onChange={e => setFollowupForm({...followupForm, notes:e.target.value})} rows={2} className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
          <input type="date" value={followupForm.follow_up_date} onChange={e => setFollowupForm({...followupForm, follow_up_date:e.target.value})} onKeyDown={e => e.key==='Enter' && e.preventDefault()} className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          <button onClick={addFollowup} className="w-full h-11 bg-red-500 text-white font-bold rounded-xl">Add Follow-up</button>
        </div>
      </Modal>
    </div>
  )
}

export default ConsultantPortalPage
