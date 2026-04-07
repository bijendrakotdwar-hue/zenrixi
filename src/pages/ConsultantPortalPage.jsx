import React, { useState, useEffect } from 'react'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/supabase'
import { Users, Briefcase, FileText, CreditCard, Phone, Plus, LogOut, Eye, EyeOff, TrendingUp, Bell, CheckCircle, Clock, Download, Send, Building2, Calendar, DollarSign, Star, Search, Upload, X, ChevronRight, BarChart2, Mail, MapPin, Globe, Edit2, Trash2 } from 'lucide-react'

const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }
const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY

const ConsultantPortalPage = () => {
  const [tab, setTab] = useState('dashboard')
  const [consultant, setConsultant] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [pendingReg, setPendingReg] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [candidateFilter, setCandidateFilter] = useState('all')
  const [candidateStatuses, setCandidateStatuses] = useState({})
  const [allDbCandidates, setAllDbCandidates] = useState([])
  const [aiParsing, setAiParsing] = useState(false)
  const [parsedResume, setParsedResume] = useState(null)

  // Data
  const [partners, setPartners] = useState([])
  const [contacts, setContacts] = useState([])
  const [candidates, setCandidates] = useState([])
  const [placements, setPlacements] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [followups, setFollowups] = useState([])
  const [interviewLetters, setInterviewLetters] = useState([])
  const [vacancies, setVacancies] = useState([])
  const [consultantJobs, setConsultantJobs] = useState([])

  // Modals
  const [activeModal, setActiveModal] = useState(null)
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  // Forms
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', phone: '', company_name: '', gst_number: '', address: '' })
  const [partnerForm, setPartnerForm] = useState({ company_name: '', industry: '', website: '', address: '', city: '', state: '', gst_number: '', pan_number: '', notes: '' })
  const [contactForm, setContactForm] = useState({ partner_id: '', name: '', designation: '', email: '', phone: '', whatsapp: '', department: '', is_primary: false, notes: '' })
  const [candidateForm, setCandidateForm] = useState({ name: '', email: '', phone: '', job_title: '', experience_years: '0', skills: '', location: '', current_company: '', education: '', summary: '' })
  const [placementForm, setPlacementForm] = useState({ partner_id: '', candidate_name: '', candidate_email: '', candidate_phone: '', position: '', joining_date: '', ctc: '', commission_percent: '8.33' })
  const [invoiceForm, setInvoiceForm] = useState({ partner_id: '', due_date: '', items: [{ description: '', quantity: 1, rate: '', amount: '' }], gst_percent: '18', notes: '' })
  const [paymentForm, setPaymentForm] = useState({ invoice_id: '', partner_id: '', amount: '', payment_date: '', payment_mode: 'bank_transfer', reference_number: '', notes: '' })
  const [followupForm, setFollowupForm] = useState({ partner_id: '', type: 'call', subject: '', notes: '', follow_up_date: '', priority: 'medium' })
  const [letterForm, setLetterForm] = useState({ partner_id: '', candidate_name: '', candidate_email: '', position: '', interview_date: '', interview_type: 'in-person', interview_location: '', meeting_link: '', interviewer_name: '' })
  const [jobForm, setJobForm] = useState({ title: '', description: '', skills: '', experience: '0', location: '', salary: '' })
  const [vacancyForm, setVacancyForm] = useState({ partner_id: '', title: '', description: '', required_skills: '', min_experience: '0', location: '', salary_range: '', vacancy_count: '1', priority: 'medium', target_date: '', notes: '' })

  useEffect(() => {
    const saved = localStorage.getItem('consultant_session')
    if (saved) { const d = JSON.parse(saved); setConsultant(d); setIsLoggedIn(true); loadData(d.id) }
  }, [])

  const loadData = async (cid) => {
    try {
      const [pa, co, ca, pl, inv, pay, fu, il, vac, jobs] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/consultant_partners?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/consultant_contacts?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/candidates?select=*&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/placements?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/invoices?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/payments?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/followups?consultant_id=eq.${cid}&order=follow_up_date.asc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/interview_letters?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/consultant_vacancies?consultant_id=eq.${cid}&order=created_at.desc`, { headers: h }),
        fetch(`${SUPABASE_URL}/rest/v1/jobs?posted_by_consultant=eq.${cid}&order=created_at.desc`, { headers: h }),
      ])
      const candData = await ca.json()
      setAllDbCandidates(Array.isArray(candData) ? candData : [])
      setCandidates(Array.isArray(candData) ? candData.filter(c => c.added_by_consultant === cid) : [])
      // Load candidate statuses
      const statusRes = await fetch(`${SUPABASE_URL}/rest/v1/consultant_candidate_status?consultant_id=eq.${cid}&select=*`, { headers: h })
      const statusData = await statusRes.json()
      const statusMap = {}
      if (Array.isArray(statusData)) statusData.forEach(s => { statusMap[s.candidate_id] = s })
      setCandidateStatuses(statusMap)
      setPartners(await pa.json()); setContacts(await co.json())
      setPlacements(await pl.json()); setInvoices(await inv.json()); setPayments(await pay.json())
      setFollowups(await fu.json()); setInterviewLetters(await il.json()); setVacancies(await vac.json())
      setConsultantJobs(await jobs.json())
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
      const check = await fetch(`${SUPABASE_URL}/rest/v1/consultants?email=eq.${encodeURIComponent(regForm.email)}&select=id`, { headers: h })
      const existing = await check.json()
      if (existing.length > 0) { setError('Email already registered. Please login.'); return }
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      await fetch(`${SUPABASE_URL}/rest/v1/verification_otps`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ email: regForm.email, otp })
      })
      await fetch('/api/send-verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regForm.email, name: regForm.name, otp })
      })
      setPendingReg(regForm); setOtpSent(true); setError('')
    } catch(e) { setError('Failed to send OTP') }
    finally { setLoading(false) }
  }

  const verifyOTPAndRegister = async () => {
    if (!otpInput || otpInput.length !== 6) { setError('Enter 6-digit OTP'); return }
    setLoading(true); setError('')
    try {
      const now = new Date().toISOString()
      const res = await fetch(`${SUPABASE_URL}/rest/v1/verification_otps?email=eq.${encodeURIComponent(pendingReg.email)}&otp=eq.${otpInput}&verified=eq.false&expires_at=gte.${now}&select=id`, { headers: h })
      const otpData = await res.json()
      if (!otpData.length) { setError('Invalid or expired OTP.'); setLoading(false); return }
      await fetch(`${SUPABASE_URL}/rest/v1/verification_otps?id=eq.${otpData[0].id}`, {
        method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ verified: true })
      })
      const regRes = await fetch(`${SUPABASE_URL}/rest/v1/consultants`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=representation' },
        body: JSON.stringify({ ...pendingReg, verified: true, status: 'active' })
      })
      if (!regRes.ok) throw new Error('Registration failed')
      const data = await regRes.json()
      setConsultant(data[0]); setIsLoggedIn(true)
      localStorage.setItem('consultant_session', JSON.stringify(data[0]))
      await loadData(data[0].id)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  // CRUD Operations
  const saveRecord = async (table, data, idField = 'consultant_id') => {
    const body = { ...data, [idField]: consultant.id }
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify(body)
    })
    await loadData(consultant.id)
  }

  const deleteRecord = async (table, id) => {
    if (!confirm('Delete this record?')) return
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: 'DELETE', headers: h })
    await loadData(consultant.id)
  }

  const addPlacement = async () => {
    if (!placementForm.candidate_name || !placementForm.position) { alert('Fill required fields'); return }
    const ctc = parseFloat(placementForm.ctc) || 0
    const commission = (ctc * parseFloat(placementForm.commission_percent)) / 100
    await saveRecord('placements', { ...placementForm, commission_amount: commission, ctc })
    setPlacementForm({ partner_id: '', candidate_name: '', candidate_email: '', candidate_phone: '', position: '', joining_date: '', ctc: '', commission_percent: '8.33' })
    setActiveModal(null)
  }

  const addInvoice = async () => {
    if (!invoiceForm.partner_id) { alert('Select partner'); return }
    const subtotal = invoiceForm.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    const gstAmt = (subtotal * parseFloat(invoiceForm.gst_percent)) / 100
    const total = subtotal + gstAmt
    const invNum = `INV-${Date.now().toString().slice(-6)}`
    await saveRecord('invoices', { ...invoiceForm, invoice_number: invNum, subtotal, gst_amount: gstAmt, total })
    setInvoiceForm({ partner_id: '', due_date: '', items: [{ description: '', quantity: 1, rate: '', amount: '' }], gst_percent: '18', notes: '' })
    setActiveModal(null)
  }

  const addPayment = async () => {
    if (!paymentForm.amount) { alert('Enter amount'); return }
    await saveRecord('payments', paymentForm)
    if (paymentForm.invoice_id) {
      await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${paymentForm.invoice_id}`, {
        method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'paid' })
      })
    }
    setPaymentForm({ invoice_id: '', partner_id: '', amount: '', payment_date: '', payment_mode: 'bank_transfer', reference_number: '', notes: '' })
    setActiveModal(null)
  }

  const addFollowup = async () => {
    if (!followupForm.subject) { alert('Subject required'); return }
    await saveRecord('followups', followupForm)
    setFollowupForm({ partner_id: '', type: 'call', subject: '', notes: '', follow_up_date: '', priority: 'medium' })
    setActiveModal(null)
  }

  const completeFollowup = async (id) => {
    await fetch(`${SUPABASE_URL}/rest/v1/followups?id=eq.${id}`, {
      method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'completed' })
    })
    await loadData(consultant.id)
  }

  const postJob = async () => {
    if (!jobForm.title || !jobForm.skills) { alert('Title and skills required'); return }
    setLoading(true)
    try {
      const skillsArray = jobForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ title: jobForm.title, description: jobForm.description, required_skills: skillsArray, min_experience: parseInt(jobForm.experience)||0, location: jobForm.location, status: 'active', posted_by_consultant: consultant.id })
      })
      try {
        await fetch('/api/linkedin-post', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: jobForm.title, company_name: consultant.company_name || consultant.name, location: jobForm.location || 'India', skills: jobForm.skills, experience: jobForm.experience })
        })
      } catch(e) {}
      setJobForm({ title: '', description: '', skills: '', experience: '0', location: '', salary: '' })
      setActiveModal(null)
      await loadData(consultant.id)
      alert('Job posted on Zenrixi + LinkedIn!')
    } catch(e) { alert('Failed: ' + e.message) }
    finally { setLoading(false) }
  }

  const addCandidate = async () => {
    if (!candidateForm.name || !candidateForm.email) { alert('Name and email required'); return }
    try {
      const check = await fetch(`${SUPABASE_URL}/rest/v1/candidates?email=eq.${encodeURIComponent(candidateForm.email)}&select=id`, { headers: h })
      const existing = await check.json()
      if (existing.length > 0) { alert('Candidate already exists!'); return }
      const skillsArray = candidateForm.skills ? candidateForm.skills.split(',').map(s => s.trim()) : []
      await fetch(`${SUPABASE_URL}/rest/v1/candidates`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ ...candidateForm, parsed_skills: skillsArray, experience_years: parseInt(candidateForm.experience_years)||0, password: 'Welcome@123', added_by_consultant: consultant.id })
      })
      setCandidateForm({ name: '', email: '', phone: '', job_title: '', experience_years: '0', skills: '', location: '' })
      setActiveModal(null)
      await loadData(consultant.id)
      alert('Candidate added to Zenrixi!')
    } catch(e) { alert('Failed: ' + e.message) }
  }

  const parseSingleResume = async (file) => {
    setAiParsing(true)
    setActiveModal('candidate')
    try {
      const text = await file.text()
      const prompt = `Extract all candidate information from this resume. Return ONLY valid JSON with these exact fields:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "job_title": "current or most recent job title",
  "experience_years": 3,
  "location": "city, state",
  "current_company": "current company name",
  "skills": "skill1, skill2, skill3",
  "education": "highest education",
  "summary": "2 line professional summary"
}
Resume text:
${text.slice(0, 3000)}`

      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 500 })
      })
      const aiData = await aiRes.json()
      const raw = aiData.choices?.[0]?.message?.content || '{}'
      const info = JSON.parse(raw.replace(/```json|```/g, '').trim())
      setCandidateForm({
        name: info.name || '',
        email: info.email || '',
        phone: info.phone || '',
        job_title: info.job_title || '',
        experience_years: String(info.experience_years || '0'),
        skills: info.skills || '',
        location: info.location || '',
        current_company: info.current_company || '',
        education: info.education || '',
        summary: info.summary || ''
      })
      setParsedResume(file.name)
    } catch(e) {
      console.error('AI parse error:', e)
    }
    setAiParsing(false)
  }

  const handleResumeUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    let imported = 0
    for (const file of files) {
      const text = await file.text().catch(() => '')
      if (!text) continue
      try {
        const prompt = `Extract candidate info from this resume text. Return ONLY valid JSON:
{"name":"","email":"","phone":"","job_title":"","experience_years":0,"skills":[],"location":""}
Resume: ${text.slice(0, 2000)}`
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 300 })
        })
        const aiData = await aiRes.json()
        const raw = aiData.choices?.[0]?.message?.content || '{}'
        const info = JSON.parse(raw.replace(/```json|```/g, '').trim())
        if (info.email) {
          const check = await fetch(`${SUPABASE_URL}/rest/v1/candidates?email=eq.${encodeURIComponent(info.email)}&select=id`, { headers: h })
          const ex = await check.json()
          if (!ex.length) {
            await fetch(`${SUPABASE_URL}/rest/v1/candidates`, {
              method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ ...info, password: 'Welcome@123', added_by_consultant: consultant.id })
            })
            imported++
          }
        }
      } catch(e) { console.error(e) }
    }
    await loadData(consultant.id)
    alert(`${imported} candidates imported from resumes!`)
  }

  const updateCandidateStatus = async (candidateId, status) => {
    const existing = candidateStatuses[candidateId]
    if (existing) {
      await fetch(`${SUPABASE_URL}/rest/v1/consultant_candidate_status?id=eq.${existing.id}`, {
        method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status })
      })
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/consultant_candidate_status`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ consultant_id: consultant.id, candidate_id: candidateId, status })
      })
    }
    setCandidateStatuses(prev => ({ ...prev, [candidateId]: { ...prev[candidateId], status, candidate_id: candidateId } }))
  }




  const generateInterviewLetter = async () => {
    if (!letterForm.candidate_name || !letterForm.position || !letterForm.interview_date) { alert('Fill required fields'); return }
    const partner = partners.find(p => p.id === letterForm.partner_id)
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    const iDate = new Date(letterForm.interview_date).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const html = `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:40px;color:#222;line-height:1.7}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:30px}
.logo{font-size:26px;font-weight:900;color:#2563eb}.title{font-size:18px;font-weight:bold;text-align:center;margin:25px 0;text-decoration:underline;letter-spacing:1px}
.box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:20px 0}
table{width:100%;border-collapse:collapse}td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px}td:first-child{font-weight:600;color:#374151;width:40%}
.footer{margin-top:60px;display:flex;justify-content:space-between}.sign-line{border-top:1px solid #333;padding-top:8px;margin-top:50px;font-size:13px}
</style></head><body>
<div class="header"><div><div class="logo">${consultant?.company_name || consultant?.name}</div><div style="font-size:12px;color:#666">HR Consultancy</div></div><div style="text-align:right;font-size:12px;color:#666">Date: ${today}<br>Ref: IL-${Date.now().toString().slice(-6)}</div></div>
<p>To,<br><strong>${letterForm.candidate_name}</strong><br>${letterForm.candidate_email || ''}</p>
<div class="title">INTERVIEW CALL LETTER</div>
<p>Dear <strong>${letterForm.candidate_name}</strong>,</p>
<p>We are pleased to inform you that your profile has been shortlisted for the position of <strong>${letterForm.position}</strong>${partner ? ` at <strong>${partner.company_name}</strong>` : ''}.</p>
<div class="box"><table>
<tr><td>Position</td><td>${letterForm.position}</td></tr>
${partner ? `<tr><td>Company</td><td>${partner.company_name}</td></tr>` : ''}
<tr><td>Interview Date & Time</td><td><strong>${iDate}</strong></td></tr>
<tr><td>Mode</td><td>${letterForm.interview_type === 'video' ? '🎥 Video Call' : letterForm.interview_type === 'phone' ? '📞 Phone' : '🏢 In Person'}</td></tr>
${letterForm.interview_location ? `<tr><td>Venue</td><td>${letterForm.interview_location}</td></tr>` : ''}
${letterForm.meeting_link ? `<tr><td>Meeting Link</td><td>${letterForm.meeting_link}</td></tr>` : ''}
${letterForm.interviewer_name ? `<tr><td>Interviewer</td><td>${letterForm.interviewer_name}</td></tr>` : ''}
</table></div>
<p><strong>Please bring:</strong> Resume (2 copies), Aadhar/PAN, Educational certificates, Previous employment docs, 2 passport photos</p>
<p>Confirm attendance: ${consultant?.phone || consultant?.email}</p>
<div class="footer"><div><div style="width:100px;height:100px;border:2px dashed #ccc;display:flex;align-items:center;justify-content:center;color:#999;font-size:11px;margin-bottom:8px">STAMP</div><div class="sign-line">Authorized Signatory<br>${consultant?.company_name || consultant?.name}</div></div><div><div class="sign-line" style="margin-top:108px">Candidate Acknowledgement<br>${letterForm.candidate_name}</div></div></div>
</body></html>`
    await fetch(`${SUPABASE_URL}/rest/v1/interview_letters`, {
      method: 'POST', headers: { ...h, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ ...letterForm, consultant_id: consultant.id })
    })
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `Interview_${letterForm.candidate_name.replace(/ /g,'_')}.html`; a.click()
    setActiveModal(null); setLetterForm({ partner_id: '', candidate_name: '', candidate_email: '', position: '', interview_date: '', interview_type: 'in-person', interview_location: '', meeting_link: '', interviewer_name: '' })
    await loadData(consultant.id)
  }

  const generateInvoicePDF = (inv) => {
    const partner = partners.find(p => p.id === inv.partner_id)
    const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items
    const html = `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;max-width:800px;margin:30px auto;padding:40px;color:#222}
.header{display:flex;justify-content:space-between;border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:25px}
.logo{font-size:28px;font-weight:900;color:#2563eb}.inv-title{font-size:22px;font-weight:bold;color:#2563eb;text-align:right}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0}
.party{background:#f8fafc;padding:15px;border-radius:8px;font-size:13px}
.party h4{color:#2563eb;margin:0 0 8px;font-size:11px;letter-spacing:1px}
table{width:100%;border-collapse:collapse;margin:20px 0}
th{background:#2563eb;color:white;padding:10px 12px;text-align:left;font-size:13px}
td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
.total-box{float:right;width:280px}.total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
.grand{background:#2563eb;color:white;padding:10px;border-radius:6px;display:flex;justify-content:space-between;font-weight:bold;font-size:16px}
.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:bold;background:${inv.status==='paid'?'#dcfce7':'#fef9c3'};color:${inv.status==='paid'?'#166534':'#854d0e'}}
</style></head><body>
<div class="header"><div><div class="logo">${consultant?.company_name || consultant?.name}</div><div style="font-size:12px;color:#666">${consultant?.address||''}</div><div style="font-size:12px;color:#666">GST: ${consultant?.gst_number||'N/A'}</div></div>
<div style="text-align:right"><div class="inv-title">INVOICE</div><div style="font-size:13px;color:#666"># ${inv.invoice_number}</div><div style="font-size:13px;color:#666">${new Date(inv.invoice_date).toLocaleDateString('en-IN')}</div><div><span class="badge">${inv.status?.toUpperCase()}</span></div></div></div>
<div class="parties">
<div class="party"><h4>FROM</h4><strong>${consultant?.company_name||consultant?.name}</strong><br>${consultant?.email||''}<br>${consultant?.phone||''}</div>
<div class="party"><h4>BILL TO</h4><strong>${partner?.company_name||'Client'}</strong><br>${partner?.city||''}<br>${partner?.gst_number?`GST: ${partner.gst_number}`:''}</div></div>
<table><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Rate (₹)</th><th>Amount (₹)</th></tr></thead><tbody>
${items.map((item,i)=>`<tr><td>${i+1}</td><td>${item.description}</td><td>${item.quantity}</td><td>${Number(item.rate).toLocaleString('en-IN')}</td><td>${Number(item.amount).toLocaleString('en-IN')}</td></tr>`).join('')}
</tbody></table>
<div class="total-box">
<div class="total-row"><span>Subtotal</span><span>₹${Number(inv.subtotal).toLocaleString('en-IN')}</span></div>
<div class="total-row"><span>GST (${inv.gst_percent}%)</span><span>₹${Number(inv.gst_amount).toLocaleString('en-IN')}</span></div>
<div class="grand"><span>Total</span><span>₹${Number(inv.total).toLocaleString('en-IN')}</span></div></div>
<div style="clear:both;margin-top:30px;font-size:13px">${inv.notes?`<p><strong>Notes:</strong> ${inv.notes}</p>`:''}</div>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `Invoice_${inv.invoice_number}.html`; a.click()
  }

  // Stats
  const totalRevenue = payments.reduce((s,p) => s+(parseFloat(p.amount)||0), 0)
  const pendingInvoices = invoices.filter(i => i.status==='unpaid')
  const pendingFollowups = followups.filter(f => f.status==='pending')

  // Input helper
  const inp = (cls='') => `w-full h-10 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${cls}`
  const stopEnter = { onKeyDown: e => e.key==='Enter' && e.preventDefault() }

  // LOGIN/REGISTER
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-white text-3xl font-black">Z</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900">zenrixi</h1>
            <p className="text-gray-500 mt-1">HR Consultant Portal</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            {otpSent ? (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">📧</div>
                  <h2 className="text-xl font-bold">Verify your email</h2>
                  <p className="text-sm text-gray-500 mt-1">OTP sent to <strong>{pendingReg?.email}</strong></p>
                </div>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-xl">{error}</p>}
                <input type="text" maxLength={6} placeholder="Enter 6-digit OTP" value={otpInput}
                  onChange={e => setOtpInput(e.target.value.replace(/\D/g,''))}
                  className="w-full h-14 border-2 rounded-2xl px-4 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
                <button onClick={verifyOTPAndRegister} disabled={loading}
                  className="w-full h-11 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-60 mb-2">
                  {loading ? 'Verifying...' : 'Verify & Create Account'}
                </button>
                <button onClick={() => { setOtpSent(false); setOtpInput(''); setError('') }}
                  className="w-full text-sm text-gray-500 hover:text-blue-600 text-center">← Back</button>
              </>
            ) : !isRegister ? (
              <>
                <h2 className="text-xl font-bold mb-6">Welcome back!</h2>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-xl">{error}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">EMAIL</label>
                    <input type="email" placeholder="your@email.com" value={loginForm.email}
                      onChange={e => setLoginForm({...loginForm, email:e.target.value})} {...stopEnter}
                      className={inp()} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">PASSWORD</label>
                    <div className="relative">
                      <input type={showPass?'text':'password'} placeholder="••••••••" value={loginForm.password}
                        onChange={e => setLoginForm({...loginForm, password:e.target.value})}
                        onKeyDown={e => e.key==='Enter' && handleLogin()}
                        className={inp('pr-10')} />
                      <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-400">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={handleLogin} disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-60">
                    {loading ? 'Logging in...' : 'Login →'}
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-6">New consultant? <button onClick={() => { setIsRegister(true); setError('') }} className="text-blue-600 font-bold">Register here</button></p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-6">Create Account</h2>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-xl">{error}</p>}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 block mb-1">FULL NAME*</label>
                      <input placeholder="Your Name" value={regForm.name} onChange={e => setRegForm({...regForm, name:e.target.value})} {...stopEnter} className={inp()} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">EMAIL*</label>
                      <input type="email" placeholder="you@email.com" value={regForm.email} onChange={e => setRegForm({...regForm, email:e.target.value})} {...stopEnter} className={inp()} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">PASSWORD*</label>
                      <input type="password" placeholder="••••••••" value={regForm.password} onChange={e => setRegForm({...regForm, password:e.target.value})} {...stopEnter} className={inp()} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">PHONE</label>
                      <input placeholder="9876543210" value={regForm.phone} onChange={e => setRegForm({...regForm, phone:e.target.value})} {...stopEnter} className={inp()} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">FIRM NAME</label>
                      <input placeholder="Your Consultancy" value={regForm.company_name} onChange={e => setRegForm({...regForm, company_name:e.target.value})} {...stopEnter} className={inp()} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 block mb-1">GST NUMBER</label>
                      <input placeholder="GST Number (optional)" value={regForm.gst_number} onChange={e => setRegForm({...regForm, gst_number:e.target.value})} {...stopEnter} className={inp()} />
                    </div>
                  </div>
                  <button onClick={handleRegister} disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-60">
                    {loading ? 'Sending OTP...' : 'Send OTP →'}
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">Already registered? <button onClick={() => { setIsRegister(false); setError('') }} className="text-blue-600 font-bold">Login</button></p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // NAV ITEMS
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Star },
    { id: 'partners', label: `Partners (${partners.length})`, icon: Building2 },
    { id: 'contacts', label: `Contacts (${contacts.length})`, icon: Phone },
    { id: 'candidates', label: `Candidates (${candidates.length})`, icon: Users },
    { id: 'jobs', label: `Job Posts (${consultantJobs.length})`, icon: Briefcase },
    { id: 'vacancies', label: `Vacancies (${vacancies.length})`, icon: Briefcase },
    { id: 'interviews', label: `Letters (${interviewLetters.length})`, icon: Calendar },
    { id: 'placements', label: `Placements (${placements.length})`, icon: TrendingUp },
    { id: 'invoices', label: `Invoices (${invoices.length})`, icon: FileText },
    { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
    { id: 'followups', label: `Follow-ups (${pendingFollowups.length})`, icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">Z</span>
            </div>
            <div>
              <span className="font-black text-gray-900">zenrixi</span>
              <span className="text-gray-400 text-xs ml-2">HR Console</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-800">{consultant?.company_name || consultant?.name}</p>
              <p className="text-xs text-gray-400">{consultant?.email}</p>
            </div>
            <button onClick={() => { setIsLoggedIn(false); setConsultant(null); localStorage.removeItem('consultant_session') }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 border rounded-lg px-3 py-1.5 transition-colors">
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* SIDEBAR */}
        <aside className="w-52 bg-white border-r hidden md:flex flex-col sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <div className="p-3 space-y-0.5">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-left ${tab===id?'bg-blue-600 text-white font-medium':'text-gray-600 hover:bg-gray-50'}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* MOBILE NAV */}
        <div className="md:hidden w-full sticky top-14 z-10 bg-white border-b">
          <div className="flex gap-1.5 p-2 overflow-x-auto">
            {navItems.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${tab===id?'bg-blue-600 text-white':'bg-gray-100 text-gray-600'}`}>
                {label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <main className="flex-1 p-5 overflow-auto">

          {/* DASHBOARD */}
          {tab==='dashboard' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black text-gray-900">Good day, {consultant?.name}! 👋</h1>
                  <p className="text-gray-500 text-sm">{consultant?.company_name} • HR Console</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'bg-green-500', tab: 'payments' },
                  { label: 'Pending Amount', value: `₹${pendingInvoices.reduce((s,i)=>s+(parseFloat(i.total)||0),0).toLocaleString('en-IN')}`, icon: Bell, color: 'bg-red-500', tab: 'invoices' },
                  { label: 'Placements', value: placements.length, icon: TrendingUp, color: 'bg-blue-500', tab: 'placements' },
                  { label: 'Follow-ups Due', value: pendingFollowups.length, icon: Clock, color: 'bg-orange-500', tab: 'followups' },
                ].map(stat => (
                  <div key={stat.label} onClick={() => setTab(stat.tab)}
                    className="bg-white rounded-2xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all hover:border-blue-200">
                    <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center shrink-0`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-bold text-gray-700 mb-3 text-sm">QUICK ACTIONS</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Add Partner', icon: '🏢', action: () => setActiveModal('partner'), color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                    { label: 'Post Job', icon: '💼', action: () => setActiveModal('job'), color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                    { label: 'Interview Letter', icon: '📋', action: () => setActiveModal('letter'), color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
                    { label: 'Create Invoice', icon: '🧾', action: () => setActiveModal('invoice'), color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                    { label: 'Add Candidate', icon: '👤', action: () => setActiveModal('candidate'), color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
                    { label: 'Upload Resumes', icon: '📤', action: () => document.getElementById('resume-upload').click(), color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
                    { label: 'Record Payment', icon: '💰', action: () => setActiveModal('payment'), color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                    { label: 'Add Follow-up', icon: '🔔', action: () => setActiveModal('followup'), color: 'bg-red-50 text-red-700 hover:bg-red-100' },
                  ].map(action => (
                    <button key={action.label} onClick={action.action}
                      className={`${action.color} rounded-xl p-3 text-sm font-medium flex items-center gap-2 transition-colors text-left`}>
                      <span>{action.icon}</span>{action.label}
                    </button>
                  ))}
                </div>
                <input id="resume-upload" type="file" multiple accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
              </div>

              {/* Pending followups */}
              {pendingFollowups.length > 0 && (
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-sm"><Bell className="w-4 h-4 text-orange-500" /> PENDING FOLLOW-UPS</h3>
                  <div className="space-y-2">
                    {pendingFollowups.slice(0,5).map(f => (
                      <div key={f.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium">{f.subject}</p>
                          <p className="text-xs text-gray-500">{f.type} • {f.follow_up_date ? new Date(f.follow_up_date).toLocaleDateString('en-IN') : 'No date'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.priority==='high'?'bg-red-100 text-red-700':f.priority==='medium'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600'}`}>{f.priority}</span>
                          <button onClick={() => completeFollowup(f.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg">✓ Done</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PARTNERS */}
          {tab==='partners' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black">Partner Master</h2>
                <button onClick={() => setActiveModal('partner')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                  <Plus className="w-4 h-4" /> Add Partner
                </button>
              </div>
              {partners.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No partners yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partners.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center font-black text-blue-700 text-xl">{p.company_name?.charAt(0)}</div>
                          <div>
                            <h3 className="font-bold text-gray-900">{p.company_name}</h3>
                            <p className="text-xs text-gray-500">{p.industry}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-500 mb-3">
                        {p.city && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}, {p.state}</p>}
                        {p.website && <p className="flex items-center gap-1"><Globe className="w-3 h-3" />{p.website}</p>}
                        {p.gst_number && <p>GST: {p.gst_number}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedPartner(p); setTab('contacts') }}
                          className="flex-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium">
                          View Contacts ({contacts.filter(c=>c.partner_id===p.id).length})
                        </button>
                        <button onClick={() => deleteRecord('consultant_partners', p.id)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONTACTS */}
          {tab==='contacts' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black">Contact Master</h2>
                  {selectedPartner && <p className="text-sm text-blue-600 mt-0.5">Filtered: {selectedPartner.company_name} <button onClick={() => setSelectedPartner(null)} className="text-gray-400 ml-1">×</button></p>}
                </div>
                <button onClick={() => setActiveModal('contact')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                  <Plus className="w-4 h-4" /> Add Contact
                </button>
              </div>
              {(selectedPartner ? contacts.filter(c=>c.partner_id===selectedPartner.id) : contacts).length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No contacts yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(selectedPartner ? contacts.filter(c=>c.partner_id===selectedPartner.id) : contacts).map(c => {
                    const partner = partners.find(p=>p.id===c.partner_id)
                    return (
                      <div key={c.id} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-lg">{c.name?.charAt(0)}</div>
                            <div>
                              <h3 className="font-bold text-gray-900">{c.name}</h3>
                              <p className="text-xs text-gray-500">{c.designation}</p>
                              {c.is_primary && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Primary</span>}
                            </div>
                          </div>
                          <button onClick={() => deleteRecord('consultant_contacts', c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        {partner && <p className="text-xs text-blue-600 mb-2 font-medium">🏢 {partner.company_name}</p>}
                        <div className="space-y-1 text-xs text-gray-500">
                          {c.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</p>}
                          {c.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>}
                          {c.department && <p>Dept: {c.department}</p>}
                        </div>
                        <div className="flex gap-2 mt-3">
                          {c.email && <a href={`mailto:${c.email}`} className="flex-1 text-xs bg-blue-50 text-blue-700 px-2 py-1.5 rounded-lg text-center hover:bg-blue-100">Email</a>}
                          {c.phone && <a href={`tel:${c.phone}`} className="flex-1 text-xs bg-green-50 text-green-700 px-2 py-1.5 rounded-lg text-center hover:bg-green-100">Call</a>}
                          {c.whatsapp && <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1.5 rounded-lg text-center hover:bg-emerald-100">WhatsApp</a>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* CANDIDATES */}
          {tab==='candidates' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black">Candidate Database ({allDbCandidates.length})</h2>
                <div className="flex gap-2">
                  <label className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer hover:bg-indigo-700">
                    <Upload className="w-4 h-4" /> Upload Resumes
                    <input type="file" multiple accept=".txt,.pdf" className="hidden" onChange={handleResumeUpload} />
                  </label>
                  <button onClick={() => setActiveModal('candidate')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>

              {/* Search + Filter */}
              <div className="bg-white rounded-2xl border p-4 mb-4 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    placeholder="Search by name, email, skills, location..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && e.preventDefault()}
                    className="w-full h-10 border rounded-xl pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'all', label: `All (${allDbCandidates.length})`, color: 'bg-gray-600' },
                    { id: 'favourite', label: `⭐ Favourite (${Object.values(candidateStatuses).filter(s=>s.status==='favourite').length})`, color: 'bg-yellow-500' },
                    { id: 'shortlisted', label: `✅ Shortlisted (${Object.values(candidateStatuses).filter(s=>s.status==='shortlisted').length})`, color: 'bg-green-600' },
                    { id: 'hold', label: `⏸ On Hold (${Object.values(candidateStatuses).filter(s=>s.status==='hold').length})`, color: 'bg-orange-500' },
                    { id: 'rejected', label: `❌ Rejected (${Object.values(candidateStatuses).filter(s=>s.status==='rejected').length})`, color: 'bg-red-500' },
                    { id: 'mine', label: `👤 Added by Me (${candidates.length})`, color: 'bg-blue-600' },
                  ].map(f => (
                    <button key={f.id} onClick={() => setCandidateFilter(f.id)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${candidateFilter===f.id?`${f.color} text-white`:'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Candidates list */}
              {(() => {
                let filtered = allDbCandidates
                if (candidateFilter === 'mine') filtered = filtered.filter(c => c.added_by_consultant === consultant?.id)
                else if (['favourite','shortlisted','hold','rejected'].includes(candidateFilter)) {
                  const ids = Object.entries(candidateStatuses).filter(([,s]) => s.status === candidateFilter).map(([id]) => id)
                  filtered = filtered.filter(c => ids.includes(c.id))
                }
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase()
                  filtered = filtered.filter(c =>
                    c.name?.toLowerCase().includes(q) ||
                    c.email?.toLowerCase().includes(q) ||
                    c.job_title?.toLowerCase().includes(q) ||
                    c.location?.toLowerCase().includes(q) ||
                    (Array.isArray(c.parsed_skills) && c.parsed_skills.some(s => s.toLowerCase().includes(q)))
                  )
                }
                if (filtered.length === 0) return (
                  <div className="bg-white rounded-2xl border p-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No candidates found.</p>
                  </div>
                )
                return (
                  <div className="space-y-3">
                    {filtered.map(c => {
                      const status = candidateStatuses[c.id]?.status || 'none'
                      const statusColors = { favourite: 'bg-yellow-100 text-yellow-700', shortlisted: 'bg-green-100 text-green-700', hold: 'bg-orange-100 text-orange-700', rejected: 'bg-red-100 text-red-600', none: 'bg-gray-100 text-gray-500' }
                      const statusLabels = { favourite: '⭐ Favourite', shortlisted: '✅ Shortlisted', hold: '⏸ On Hold', rejected: '❌ Rejected', none: 'Set Status' }
                      return (
                        <div key={c.id} className="bg-white rounded-2xl border p-4 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-lg shrink-0">
                                {c.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{c.name}</h4>
                                <p className="text-xs text-gray-500">{c.job_title} • {c.experience_years}yr exp</p>
                                <p className="text-xs text-gray-400">{c.email} {c.phone ? `• ${c.phone}` : ''}</p>
                                {c.location && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</p>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <select value={status} onChange={e => updateCandidateStatus(c.id, e.target.value)}
                                className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusColors[status]} focus:outline-none`}>
                                <option value="none">Set Status</option>
                                <option value="favourite">⭐ Favourite</option>
                                <option value="shortlisted">✅ Shortlisted</option>
                                <option value="hold">⏸ On Hold</option>
                                <option value="rejected">❌ Rejected</option>
                              </select>
                              {c.added_by_consultant === consultant?.id && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Added by me</span>
                              )}
                            </div>
                          </div>

                          {/* Skills */}
                          {Array.isArray(c.parsed_skills) && c.parsed_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {c.parsed_skills.slice(0,6).map((s,i) => <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>)}
                              {c.parsed_skills.length > 6 && <span className="text-xs text-gray-400">+{c.parsed_skills.length-6} more</span>}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 flex-wrap">
                            <button onClick={() => { setLetterForm({...letterForm, candidate_name: c.name, candidate_email: c.email}); setActiveModal('letter') }}
                              className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-100 flex items-center gap-1">
                              📋 Interview Letter
                            </button>
                            {c.email && <a href={`mailto:${c.email}`} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100">✉️ Email</a>}
                            {c.phone && <a href={`tel:${c.phone}`} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100">📞 Call</a>}
                            {c.phone && <a href={`https://wa.me/${c.phone}`} target="_blank" rel="noreferrer" className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100">💬 WhatsApp</a>}
                            {c.resume_url && (
                              <a href={c.resume_url} target="_blank" rel="noreferrer" className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 flex items-center gap-1">
                                <Download className="w-3 h-3" /> Resume
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <p className="text-xs text-gray-400 text-center pt-2">Showing {filtered.length} of {allDbCandidates.length} candidates</p>
                  </div>
                )
              })()}
            </div>
          )}

          {/* JOB POSTS */}
          {tab==='jobs' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black">Job Posts ({consultantJobs.length})</h2>
                <button onClick={() => setActiveModal('job')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                  <Plus className="w-4 h-4" /> Post Job
                </button>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 mb-4 flex items-center gap-2">
                🚀 Jobs posted here appear on Zenrixi Jobs page + LinkedIn auto-post
              </div>
              {consultantJobs.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No jobs posted yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consultantJobs.map(j => (
                    <div key={j.id} className="bg-white rounded-2xl border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold">{j.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{j.location} • Min {j.min_experience}yr exp</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${j.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{j.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Array.isArray(j.required_skills) && j.required_skills.map((s,i) => <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VACANCIES */}
          {tab==='vacancies' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black">Vacancy Tracker ({vacancies.length})</h2>
                <button onClick={() => setActiveModal('vacancy')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                  <Plus className="w-4 h-4" /> Add Vacancy
                </button>
              </div>
              {vacancies.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No vacancies tracked yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vacancies.map(v => {
                    const partner = partners.find(p=>p.id===v.partner_id)
                    return (
                      <div key={v.id} className="bg-white rounded-2xl border p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold">{v.title}</h3>
                            <p className="text-xs text-blue-600 font-medium">{partner?.company_name}</p>
                            <p className="text-xs text-gray-500">{v.location} • {v.salary_range} • {v.vacancy_count} position(s)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.priority==='high'?'bg-red-100 text-red-700':v.priority==='medium'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600'}`}>{v.priority}</span>
                            <button onClick={() => deleteRecord('consultant_vacancies', v.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        {Array.isArray(v.required_skills) && v.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {v.required_skills.map((s,i) => <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>)}
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => { setLetterForm({...letterForm, partner_id: v.partner_id, position: v.title}); setActiveModal('letter') }}
                            className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-100">📋 Interview Letter</button>
                          <button onClick={() => { setFollowupForm({...followupForm, partner_id: v.partner_id, subject: `Follow up: ${v.title}`}); setActiveModal('followup') }}
                            className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-100">🔔 Follow-up</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* INTERVIEW LETTERS */}
          {tab==='interviews' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black">Interview Letters ({interviewLetters.length})</h2>
                <button onClick={() => setActiveModal('letter')} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-600">
                  <Plus className="w-4 h-4" /> Generate Letter
                </button>
              </div>
              {interviewLetters.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No letters generated yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interviewLetters.map(il => {
                    const partner = partners.find(p=>p.id===il.partner_id)
                    return (
                      <div key={il.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold">{il.candidate_name}</h3>
                          <p className="text-sm text-gray-500">{il.position}</p>
                          <p className="text-xs text-blue-600">{partner?.company_name}</p>
                          <p className="text-xs text-gray-400">{il.interview_date ? new Date(il.interview_date).toLocaleDateString('en-IN') : ''} • {il.interview_type}</p>
                        </div>
                        <button onClick={() => deleteRecord('interview_letters', il.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* PLACEMENTS */}
          {tab==='placements' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black">Placements ({placements.length})</h2>
                <button onClick={() => setActiveModal('placement')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                  <Plus className="w-4 h-4" /> Add Placement
                </button>
              </div>
              {placements.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No placements recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {placements.map(p => {
                    const partner = partners.find(pa=>pa.id===p.partner_id)
                    return (
                      <div key={p.id} className="bg-white rounded-2xl border p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold">{p.candidate_name}</h3>
                            <p className="text-sm text-gray-500">{p.position}</p>
                            <p className="text-xs text-blue-600">{partner?.company_name}</p>
                            {p.joining_date && <p className="text-xs text-gray-400">Joining: {new Date(p.joining_date).toLocaleDateString('en-IN')}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">Commission: ₹{Number(p.commission_amount).toLocaleString('en-IN')}</p>
                            <p className="text-xs text-gray-400">CTC: ₹{Number(p.ctc).toLocaleString('en-IN')}</p>
                            <button onClick={() => deleteRecord('placements', p.id)} className="text-red-400 hover:text-red-600 mt-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* INVOICES */}
          {tab==='invoices' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black">Invoices ({invoices.length})</h2>
                <button onClick={() => setActiveModal('invoice')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                  <Plus className="w-4 h-4" /> Create Invoice
                </button>
              </div>
              {invoices.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No invoices yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map(inv => {
                    const partner = partners.find(p=>p.id===inv.partner_id)
                    return (
                      <div key={inv.id} className="bg-white rounded-2xl border p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold">#{inv.invoice_number}</h3>
                            <p className="text-sm text-gray-500">{partner?.company_name}</p>
                            <p className="text-xs text-gray-400">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">₹{Number(inv.total).toLocaleString('en-IN')}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status==='paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => generateInvoicePDF(inv)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1">
                            <Download className="w-3 h-3" /> Download
                          </button>
                          {inv.status==='unpaid' && (
                            <button onClick={() => { setPaymentForm({...paymentForm, invoice_id: inv.id, partner_id: inv.partner_id, amount: inv.total}); setActiveModal('payment') }}
                              className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Mark Paid
                            </button>
                          )}
                          <button onClick={() => deleteRecord('invoices', inv.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS */}
          {tab==='payments' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black">Payments ({payments.length})</h2>
                <button onClick={() => setActiveModal('payment')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                  <Plus className="w-4 h-4" /> Record Payment
                </button>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white mb-5">
                <p className="text-sm opacity-80">Total Revenue Received</p>
                <p className="text-4xl font-black">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-sm opacity-80 mt-1">Pending: ₹{pendingInvoices.reduce((s,i)=>s+(parseFloat(i.total)||0),0).toLocaleString('en-IN')}</p>
              </div>
              {payments.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No payments recorded.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map(p => {
                    const partner = partners.find(pa=>pa.id===p.partner_id)
                    return (
                      <div key={p.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-green-600 text-lg">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                          <p className="text-sm text-gray-500">{partner?.company_name}</p>
                          <p className="text-xs text-gray-400">{p.payment_mode} • {p.reference_number || '—'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '—'}</p>
                          <button onClick={() => deleteRecord('payments', p.id)} className="text-red-400 hover:text-red-600 mt-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* FOLLOW-UPS */}
          {tab==='followups' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black">Follow-ups</h2>
                <button onClick={() => setActiveModal('followup')} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-600">
                  <Plus className="w-4 h-4" /> Add Follow-up
                </button>
              </div>
              <div className="flex gap-3 mb-4">
                <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-sm font-bold">Pending: {pendingFollowups.length}</div>
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-bold">Done: {followups.filter(f=>f.status==='completed').length}</div>
              </div>
              {followups.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No follow-ups added.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followups.map(f => {
                    const partner = partners.find(p=>p.id===f.partner_id)
                    return (
                      <div key={f.id} className={`bg-white rounded-2xl border p-5 ${f.status==='completed'?'opacity-50':''}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{f.type==='call'?'📞':f.type==='email'?'✉️':f.type==='meeting'?'🤝':'📋'}</span>
                              <h3 className="font-bold">{f.subject}</h3>
                            </div>
                            {partner && <p className="text-xs text-blue-600">{partner.company_name}</p>}
                            {f.notes && <p className="text-xs text-gray-500 mt-1">{f.notes}</p>}
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${f.priority==='high'?'bg-red-100 text-red-700':f.priority==='medium'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600'}`}>{f.priority}</span>
                            {f.follow_up_date && <p className="text-xs text-gray-400">{new Date(f.follow_up_date).toLocaleDateString('en-IN')}</p>}
                            <div className="flex gap-1">
                              {f.status==='pending' && <button onClick={() => completeFollowup(f.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg">✓ Done</button>}
                              <button onClick={() => deleteRecord('followups', f.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* =================== MODALS =================== */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setActiveModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">
                {activeModal==='partner'?'Add Partner':activeModal==='contact'?'Add Contact':activeModal==='candidate'?'Add Candidate':activeModal==='job'?'Post Job':activeModal==='vacancy'?'Add Vacancy':activeModal==='letter'?'Generate Interview Letter':activeModal==='placement'?'Record Placement':activeModal==='invoice'?'Create Invoice':activeModal==='payment'?'Record Payment':'Add Follow-up'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            {/* PARTNER FORM */}
            {activeModal==='partner' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">COMPANY NAME*</label><input value={partnerForm.company_name} onChange={e=>setPartnerForm({...partnerForm,company_name:e.target.value})} {...stopEnter} placeholder="Company Ltd." className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">INDUSTRY</label><input value={partnerForm.industry} onChange={e=>setPartnerForm({...partnerForm,industry:e.target.value})} {...stopEnter} placeholder="Technology" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">WEBSITE</label><input value={partnerForm.website} onChange={e=>setPartnerForm({...partnerForm,website:e.target.value})} {...stopEnter} placeholder="company.com" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">CITY</label><input value={partnerForm.city} onChange={e=>setPartnerForm({...partnerForm,city:e.target.value})} {...stopEnter} placeholder="Delhi" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">STATE</label><input value={partnerForm.state} onChange={e=>setPartnerForm({...partnerForm,state:e.target.value})} {...stopEnter} placeholder="Delhi" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">GST NUMBER</label><input value={partnerForm.gst_number} onChange={e=>setPartnerForm({...partnerForm,gst_number:e.target.value})} {...stopEnter} placeholder="GST..." className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">PAN NUMBER</label><input value={partnerForm.pan_number} onChange={e=>setPartnerForm({...partnerForm,pan_number:e.target.value})} {...stopEnter} placeholder="PAN..." className={inp()} /></div>
                  <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">ADDRESS</label><textarea value={partnerForm.address} onChange={e=>setPartnerForm({...partnerForm,address:e.target.value})} rows={2} placeholder="Full address..." className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
                  <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">NOTES</label><textarea value={partnerForm.notes} onChange={e=>setPartnerForm({...partnerForm,notes:e.target.value})} rows={2} placeholder="Any notes..." className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
                </div>
                <button onClick={async()=>{if(!partnerForm.company_name){alert('Company name required');return};await saveRecord('consultant_partners',partnerForm,'consultant_id');setPartnerForm({company_name:'',industry:'',website:'',address:'',city:'',state:'',gst_number:'',pan_number:'',notes:''});setActiveModal(null)}} className="w-full h-11 bg-blue-600 text-white font-bold rounded-xl">Add Partner</button>
              </div>
            )}

            {/* CONTACT FORM */}
            {activeModal==='contact' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">PARTNER COMPANY</label><select value={contactForm.partner_id} onChange={e=>setContactForm({...contactForm,partner_id:e.target.value})} className={inp()}><option value="">Select Partner</option>{partners.map(p=><option key={p.id} value={p.id}>{p.company_name}</option>)}</select></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">FULL NAME*</label><input value={contactForm.name} onChange={e=>setContactForm({...contactForm,name:e.target.value})} {...stopEnter} placeholder="Contact Name" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">DESIGNATION</label><input value={contactForm.designation} onChange={e=>setContactForm({...contactForm,designation:e.target.value})} {...stopEnter} placeholder="HR Manager" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">EMAIL</label><input type="email" value={contactForm.email} onChange={e=>setContactForm({...contactForm,email:e.target.value})} {...stopEnter} placeholder="hr@company.com" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">PHONE</label><input value={contactForm.phone} onChange={e=>setContactForm({...contactForm,phone:e.target.value})} {...stopEnter} placeholder="9876543210" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">WHATSAPP</label><input value={contactForm.whatsapp} onChange={e=>setContactForm({...contactForm,whatsapp:e.target.value})} {...stopEnter} placeholder="9876543210" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">DEPARTMENT</label><input value={contactForm.department} onChange={e=>setContactForm({...contactForm,department:e.target.value})} {...stopEnter} placeholder="Human Resources" className={inp()} /></div>
                  <div className="col-span-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={contactForm.is_primary} onChange={e=>setContactForm({...contactForm,is_primary:e.target.checked})} /><span className="text-sm">Mark as Primary Contact</span></label></div>
                </div>
                <button onClick={async()=>{if(!contactForm.name){alert('Name required');return};await saveRecord('consultant_contacts',contactForm,'consultant_id');setContactForm({partner_id:'',name:'',designation:'',email:'',phone:'',whatsapp:'',department:'',is_primary:false,notes:''});setActiveModal(null)}} className="w-full h-11 bg-blue-600 text-white font-bold rounded-xl">Add Contact</button>
              </div>
            )}

            {/* CANDIDATE FORM - AI Powered */}
            {activeModal==='candidate' && (
              <div className="space-y-3">
                {/* Resume Upload for AI Parse */}
                <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 text-center bg-blue-50">
                  <div className="text-2xl mb-1">🤖</div>
                  <p className="text-sm font-bold text-blue-700 mb-1">Upload Resume — AI Auto Fill</p>
                  <p className="text-xs text-blue-500 mb-2">AI will read resume and fill form automatically</p>
                  <label className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-700">
                    <Upload className="w-3 h-3" />
                    {aiParsing ? 'AI Reading Resume...' : parsedResume ? `✅ ${parsedResume}` : 'Upload Resume (PDF/TXT)'}
                    <input type="file" accept=".txt,.pdf,.doc" className="hidden" onChange={e => e.target.files[0] && parseSingleResume(e.target.files[0])} />
                  </label>
                  {aiParsing && <p className="text-xs text-blue-500 mt-2 animate-pulse">🤖 AI is reading and extracting information...</p>}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">FULL NAME*</label>
                    <input value={candidateForm.name} onChange={e=>setCandidateForm({...candidateForm,name:e.target.value})} {...stopEnter} placeholder="John Doe" className={inp()} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">EMAIL*</label>
                    <input type="email" value={candidateForm.email} onChange={e=>setCandidateForm({...candidateForm,email:e.target.value})} {...stopEnter} placeholder="john@email.com" className={inp()} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">PHONE</label>
                    <input value={candidateForm.phone} onChange={e=>setCandidateForm({...candidateForm,phone:e.target.value})} {...stopEnter} placeholder="9876543210" className={inp()} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">CURRENT ROLE</label>
                    <input value={candidateForm.job_title} onChange={e=>setCandidateForm({...candidateForm,job_title:e.target.value})} {...stopEnter} placeholder="Software Engineer" className={inp()} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">CURRENT COMPANY</label>
                    <input value={candidateForm.current_company} onChange={e=>setCandidateForm({...candidateForm,current_company:e.target.value})} {...stopEnter} placeholder="Company Pvt Ltd" className={inp()} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">EXPERIENCE (YRS)</label>
                    <input type="number" value={candidateForm.experience_years} onChange={e=>setCandidateForm({...candidateForm,experience_years:e.target.value})} className={inp()} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">LOCATION</label>
                    <input value={candidateForm.location} onChange={e=>setCandidateForm({...candidateForm,location:e.target.value})} {...stopEnter} placeholder="Delhi, India" className={inp()} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">EDUCATION</label>
                    <input value={candidateForm.education} onChange={e=>setCandidateForm({...candidateForm,education:e.target.value})} {...stopEnter} placeholder="B.Tech, MBA..." className={inp()} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">SKILLS (comma separated)</label>
                    <input value={candidateForm.skills} onChange={e=>setCandidateForm({...candidateForm,skills:e.target.value})} {...stopEnter} placeholder="React, Node.js, Python, SQL" className={inp()} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">PROFESSIONAL SUMMARY</label>
                    <textarea value={candidateForm.summary} onChange={e=>setCandidateForm({...candidateForm,summary:e.target.value})} rows={2} placeholder="Brief professional summary..." className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 flex items-center gap-2">
                  ℹ️ Added to Zenrixi main database. Candidate can login with default password: <strong>Welcome@123</strong>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setCandidateForm({ name:'',email:'',phone:'',job_title:'',experience_years:'0',skills:'',location:'',current_company:'',education:'',summary:'' }); setParsedResume(null) }}
                    className="flex-1 h-11 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">
                    Clear Form
                  </button>
                  <button onClick={addCandidate} disabled={aiParsing}
                    className="flex-1 h-11 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-60">
                    {aiParsing ? '⏳ Processing...' : 'Add to Database'}
                  </button>
                </div>
              </div>
            )}

            {/* JOB FORM */}
            {activeModal==='job' && (
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">JOB TITLE*</label><input value={jobForm.title} onChange={e=>setJobForm({...jobForm,title:e.target.value})} {...stopEnter} placeholder="Senior React Developer" className={inp()} /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">DESCRIPTION</label><textarea value={jobForm.description} onChange={e=>setJobForm({...jobForm,description:e.target.value})} rows={3} placeholder="Job details..." className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">REQUIRED SKILLS* (comma separated)</label><input value={jobForm.skills} onChange={e=>setJobForm({...jobForm,skills:e.target.value})} {...stopEnter} placeholder="React, Node.js" className={inp()} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">MIN EXP (years)</label><input type="number" value={jobForm.experience} onChange={e=>setJobForm({...jobForm,experience:e.target.value})} className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">LOCATION</label><input value={jobForm.location} onChange={e=>setJobForm({...jobForm,location:e.target.value})} {...stopEnter} placeholder="Delhi / Remote" className={inp()} /></div>
                </div>
                <div className="bg-blue-50 rounded-xl p-2 text-xs text-blue-700">🚀 Will post on Zenrixi Jobs + LinkedIn</div>
                <button onClick={postJob} disabled={loading} className="w-full h-11 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-60">{loading?'Posting...':'Post Job on Zenrixi + LinkedIn'}</button>
              </div>
            )}

            {/* VACANCY FORM */}
            {activeModal==='vacancy' && (
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">PARTNER COMPANY*</label><select value={vacancyForm.partner_id} onChange={e=>setVacancyForm({...vacancyForm,partner_id:e.target.value})} className={inp()}><option value="">Select Partner</option>{partners.map(p=><option key={p.id} value={p.id}>{p.company_name}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">JOB TITLE*</label><input value={vacancyForm.title} onChange={e=>setVacancyForm({...vacancyForm,title:e.target.value})} {...stopEnter} placeholder="Position title" className={inp()} /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">REQUIRED SKILLS</label><input value={vacancyForm.required_skills} onChange={e=>setVacancyForm({...vacancyForm,required_skills:e.target.value})} {...stopEnter} placeholder="React, Node.js" className={inp()} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">LOCATION</label><input value={vacancyForm.location} onChange={e=>setVacancyForm({...vacancyForm,location:e.target.value})} {...stopEnter} placeholder="Delhi" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">SALARY RANGE</label><input value={vacancyForm.salary_range} onChange={e=>setVacancyForm({...vacancyForm,salary_range:e.target.value})} {...stopEnter} placeholder="8-12 LPA" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">POSITIONS</label><input type="number" value={vacancyForm.vacancy_count} onChange={e=>setVacancyForm({...vacancyForm,vacancy_count:e.target.value})} className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">PRIORITY</label><select value={vacancyForm.priority} onChange={e=>setVacancyForm({...vacancyForm,priority:e.target.value})} className={inp()}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">MIN EXP</label><input type="number" value={vacancyForm.min_experience} onChange={e=>setVacancyForm({...vacancyForm,min_experience:e.target.value})} className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">TARGET DATE</label><input type="date" value={vacancyForm.target_date} onChange={e=>setVacancyForm({...vacancyForm,target_date:e.target.value})} className={inp()} /></div>
                </div>
                <button onClick={async()=>{if(!vacancyForm.title||!vacancyForm.partner_id){alert('Partner and title required');return};const skills=vacancyForm.required_skills.split(',').map(s=>s.trim()).filter(Boolean);await saveRecord('consultant_vacancies',{...vacancyForm,required_skills:skills,min_experience:parseInt(vacancyForm.min_experience)||0,vacancy_count:parseInt(vacancyForm.vacancy_count)||1},'consultant_id');setVacancyForm({partner_id:'',title:'',description:'',required_skills:'',min_experience:'0',location:'',salary_range:'',vacancy_count:'1',priority:'medium',target_date:'',notes:''});setActiveModal(null)}} className="w-full h-11 bg-blue-600 text-white font-bold rounded-xl">Add Vacancy</button>
              </div>
            )}

            {/* INTERVIEW LETTER FORM */}
            {activeModal==='letter' && (
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">PARTNER COMPANY</label><select value={letterForm.partner_id} onChange={e=>setLetterForm({...letterForm,partner_id:e.target.value})} className={inp()}><option value="">Select Partner</option>{partners.map(p=><option key={p.id} value={p.id}>{p.company_name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">CANDIDATE NAME*</label><input value={letterForm.candidate_name} onChange={e=>setLetterForm({...letterForm,candidate_name:e.target.value})} {...stopEnter} placeholder="John Doe" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">CANDIDATE EMAIL</label><input type="email" value={letterForm.candidate_email} onChange={e=>setLetterForm({...letterForm,candidate_email:e.target.value})} {...stopEnter} placeholder="john@email.com" className={inp()} /></div>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">POSITION*</label><input value={letterForm.position} onChange={e=>setLetterForm({...letterForm,position:e.target.value})} {...stopEnter} placeholder="Software Engineer" className={inp()} /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">INTERVIEW DATE & TIME*</label><input type="datetime-local" value={letterForm.interview_date} onChange={e=>setLetterForm({...letterForm,interview_date:e.target.value})} className={inp()} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">MODE</label><select value={letterForm.interview_type} onChange={e=>setLetterForm({...letterForm,interview_type:e.target.value})} className={inp()}><option value="in-person">In Person</option><option value="video">Video Call</option><option value="phone">Phone</option></select></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">INTERVIEWER</label><input value={letterForm.interviewer_name} onChange={e=>setLetterForm({...letterForm,interviewer_name:e.target.value})} {...stopEnter} placeholder="HR Manager" className={inp()} /></div>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">VENUE / LINK</label><input value={letterForm.interview_location || letterForm.meeting_link} onChange={e=>setLetterForm({...letterForm,interview_location:e.target.value,meeting_link:e.target.value})} {...stopEnter} placeholder="Address or meeting link" className={inp()} /></div>
                <button onClick={generateInterviewLetter} className="w-full h-11 bg-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Generate & Download Letter</button>
              </div>
            )}

            {/* PLACEMENT FORM */}
            {activeModal==='placement' && (
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">PARTNER COMPANY</label><select value={placementForm.partner_id} onChange={e=>setPlacementForm({...placementForm,partner_id:e.target.value})} className={inp()}><option value="">Select Partner</option>{partners.map(p=><option key={p.id} value={p.id}>{p.company_name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">CANDIDATE NAME*</label><input value={placementForm.candidate_name} onChange={e=>setPlacementForm({...placementForm,candidate_name:e.target.value})} {...stopEnter} placeholder="John Doe" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">POSITION*</label><input value={placementForm.position} onChange={e=>setPlacementForm({...placementForm,position:e.target.value})} {...stopEnter} placeholder="Software Engineer" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">EMAIL</label><input type="email" value={placementForm.candidate_email} onChange={e=>setPlacementForm({...placementForm,candidate_email:e.target.value})} {...stopEnter} placeholder="john@email.com" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">PHONE</label><input value={placementForm.candidate_phone} onChange={e=>setPlacementForm({...placementForm,candidate_phone:e.target.value})} {...stopEnter} placeholder="9876543210" className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">CTC ANNUAL (₹)</label><input type="number" value={placementForm.ctc} onChange={e=>setPlacementForm({...placementForm,ctc:e.target.value})} className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">COMMISSION %</label><input type="number" value={placementForm.commission_percent} onChange={e=>setPlacementForm({...placementForm,commission_percent:e.target.value})} className={inp()} /></div>
                </div>
                {placementForm.ctc && <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 font-medium">Commission: ₹{((parseFloat(placementForm.ctc)*parseFloat(placementForm.commission_percent))/100).toLocaleString('en-IN')}</div>}
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">DATE OF JOINING</label><input type="date" value={placementForm.joining_date} onChange={e=>setPlacementForm({...placementForm,joining_date:e.target.value})} className={inp()} /></div>
                <button onClick={addPlacement} className="w-full h-11 bg-blue-600 text-white font-bold rounded-xl">Record Placement</button>
              </div>
            )}

            {/* INVOICE FORM */}
            {activeModal==='invoice' && (
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">PARTNER*</label><select value={invoiceForm.partner_id} onChange={e=>setInvoiceForm({...invoiceForm,partner_id:e.target.value})} className={inp()}><option value="">Select Partner</option>{partners.map(p=><option key={p.id} value={p.id}>{p.company_name}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">DUE DATE</label><input type="date" value={invoiceForm.due_date} onChange={e=>setInvoiceForm({...invoiceForm,due_date:e.target.value})} className={inp()} /></div>
                <div className="border rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">ITEMS</p>
                  {invoiceForm.items.map((item,idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                      <input placeholder="Description" value={item.description} onChange={e=>{const items=[...invoiceForm.items];items[idx].description=e.target.value;setInvoiceForm({...invoiceForm,items})}} {...stopEnter} className="col-span-2 h-9 border rounded-lg px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                      <input placeholder="Rate" type="number" value={item.rate} onChange={e=>{const items=[...invoiceForm.items];items[idx].rate=e.target.value;items[idx].amount=e.target.value*items[idx].quantity;setInvoiceForm({...invoiceForm,items})}} className="h-9 border rounded-lg px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                      <input placeholder="Amount" type="number" value={item.amount} readOnly className="h-9 border rounded-lg px-2 text-xs bg-gray-50" />
                    </div>
                  ))}
                  <button onClick={()=>setInvoiceForm({...invoiceForm,items:[...invoiceForm.items,{description:'',quantity:1,rate:'',amount:''}]})} className="text-xs text-blue-600 font-bold">+ Add Item</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={invoiceForm.gst_percent} onChange={e=>setInvoiceForm({...invoiceForm,gst_percent:e.target.value})} className={inp()}><option value="0">GST 0%</option><option value="5">GST 5%</option><option value="12">GST 12%</option><option value="18">GST 18%</option></select>
                  <div className="bg-blue-50 rounded-xl px-3 flex items-center text-sm font-bold text-blue-700">Total: ₹{(invoiceForm.items.reduce((s,i)=>s+(parseFloat(i.amount)||0),0)*(1+parseFloat(invoiceForm.gst_percent)/100)).toLocaleString('en-IN')}</div>
                </div>
                <button onClick={addInvoice} className="w-full h-11 bg-blue-600 text-white font-bold rounded-xl">Create Invoice</button>
              </div>
            )}

            {/* PAYMENT FORM */}
            {activeModal==='payment' && (
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">PARTNER</label><select value={paymentForm.partner_id} onChange={e=>setPaymentForm({...paymentForm,partner_id:e.target.value})} className={inp()}><option value="">Select Partner</option>{partners.map(p=><option key={p.id} value={p.id}>{p.company_name}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">LINK INVOICE</label><select value={paymentForm.invoice_id} onChange={e=>setPaymentForm({...paymentForm,invoice_id:e.target.value})} className={inp()}><option value="">Link Invoice (optional)</option>{invoices.filter(i=>i.status==='unpaid').map(i=><option key={i.id} value={i.id}>#{i.invoice_number} — ₹{Number(i.total).toLocaleString('en-IN')}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">AMOUNT (₹)*</label><input type="number" value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm,amount:e.target.value})} className={inp()} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">DATE</label><input type="date" value={paymentForm.payment_date} onChange={e=>setPaymentForm({...paymentForm,payment_date:e.target.value})} className={inp()} /></div>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">MODE</label><select value={paymentForm.payment_mode} onChange={e=>setPaymentForm({...paymentForm,payment_mode:e.target.value})} className={inp()}><option value="bank_transfer">Bank Transfer</option><option value="upi">UPI</option><option value="cheque">Cheque</option><option value="cash">Cash</option><option value="neft">NEFT/RTGS</option></select></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">REFERENCE NUMBER</label><input value={paymentForm.reference_number} onChange={e=>setPaymentForm({...paymentForm,reference_number:e.target.value})} {...stopEnter} placeholder="UTR/Cheque no." className={inp()} /></div>
                <button onClick={addPayment} className="w-full h-11 bg-green-600 text-white font-bold rounded-xl">Record Payment</button>
              </div>
            )}

            {/* FOLLOWUP FORM */}
            {activeModal==='followup' && (
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">PARTNER</label><select value={followupForm.partner_id} onChange={e=>setFollowupForm({...followupForm,partner_id:e.target.value})} className={inp()}><option value="">Select Partner</option>{partners.map(p=><option key={p.id} value={p.id}>{p.company_name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">TYPE</label><select value={followupForm.type} onChange={e=>setFollowupForm({...followupForm,type:e.target.value})} className={inp()}><option value="call">📞 Call</option><option value="email">✉️ Email</option><option value="meeting">🤝 Meeting</option><option value="other">📋 Other</option></select></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">PRIORITY</label><select value={followupForm.priority} onChange={e=>setFollowupForm({...followupForm,priority:e.target.value})} className={inp()}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">SUBJECT*</label><input value={followupForm.subject} onChange={e=>setFollowupForm({...followupForm,subject:e.target.value})} {...stopEnter} placeholder="Follow up regarding..." className={inp()} /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">DATE</label><input type="date" value={followupForm.follow_up_date} onChange={e=>setFollowupForm({...followupForm,follow_up_date:e.target.value})} className={inp()} /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">NOTES</label><textarea value={followupForm.notes} onChange={e=>setFollowupForm({...followupForm,notes:e.target.value})} rows={2} placeholder="Additional notes..." className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
                <button onClick={addFollowup} className="w-full h-11 bg-red-500 text-white font-bold rounded-xl">Add Follow-up</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsultantPortalPage
