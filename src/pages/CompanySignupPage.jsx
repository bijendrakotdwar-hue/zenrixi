import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2, Building2 } from 'lucide-react'
import Header from '../components/Header'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/supabase'
import { sendCompanyWelcomeEmail } from '../lib/email'

const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }

const INDUSTRIES = ['Information Technology','Software Development','Banking & Finance','Healthcare & Pharmaceuticals','Education & E-Learning','Manufacturing','Retail & E-Commerce','Real Estate','Media & Entertainment','Telecommunications','Logistics & Supply Chain','Automotive','Food & Beverages','Travel & Hospitality','Consulting','Legal Services','Marketing & Advertising','Construction & Engineering','Energy & Utilities','Non-Profit & NGO','Government & Public Sector','Agriculture','Fashion & Apparel','Sports & Fitness','Other']

const CITIES = ['Mumbai, India','Delhi, India','Bengaluru, India','Hyderabad, India','Chennai, India','Kolkata, India','Pune, India','Ahmedabad, India','Jaipur, India','Dehradun, India','Noida, India','Gurugram, India','Chandigarh, India','Lucknow, India','Indore, India','New York, USA','San Francisco, USA','London, UK','Dubai, UAE','Singapore','Sydney, Australia','Toronto, Canada','Berlin, Germany','Remote (Worldwide)','Remote (India)']

const CompanySignupPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ company_name:'', email:'', phone:'', industry:'', city:'', password:'', confirm:'', website:'' })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault(); setError('')
    if (!form.company_name||!form.email||!form.phone||!form.industry||!form.city||!form.password) { setError('All fields are required'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (form.password !== form.confirm) { setError("Passwords don't match"); return }
    setLoading(true)
    try {
      const check = await fetch(`${SUPABASE_URL}/rest/v1/companies?email=eq.${encodeURIComponent(form.email)}&select=id`, { headers: h })
      const existing = await check.json()
      if (existing.length > 0) { setError('Email already registered. Please login.'); setLoading(false); return }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/companies`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=representation' },
        body: JSON.stringify({ company_name: form.company_name, email: form.email, password: form.password, credits_balance: 0 })
      })
      if (!res.ok) throw new Error('Registration failed')
      await sendCompanyWelcomeEmail(form.company_name, form.email)
      navigate('/company-portal')
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex flex-grow pt-20">
        <div className="hidden lg:flex flex-col w-96 bg-blue-50 p-10 border-r">
          <div className="mt-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-6">Hire smarter with AI</h2>
            <ul className="space-y-5">
              {['AI automatically shortlists best candidates','Get ranked candidates with match scores','Interviews auto-scheduled','Pay only per successful hire'].map((item,i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-grow p-6 md:p-10 max-w-xl mx-auto lg:mx-0">
          <h1 className="text-3xl font-bold mb-2">Register your company</h1>
          <p className="text-gray-500 mb-8">Post jobs and get AI-matched candidates instantly.</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-1">Company Name*</label>
              <input value={form.company_name} onChange={e => setForm({...form, company_name:e.target.value})} placeholder="e.g. TechCorp India Pvt Ltd"
                className="w-full h-12 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Official Email*</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="hr@yourcompany.com"
                className="w-full h-12 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Phone Number*</label>
              <div className="flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <span className="bg-gray-50 px-4 flex items-center text-sm text-gray-500 border-r">+91</span>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="HR contact number"
                  className="flex-1 h-12 px-4 text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Industry*</label>
              <select value={form.industry} onChange={e => setForm({...form, industry:e.target.value})}
                className="w-full h-12 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select your industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">City / Location*</label>
              <select value={form.city} onChange={e => setForm({...form, city:e.target.value})}
                className="w-full h-12 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select your city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Website (optional)</label>
              <input value={form.website} onChange={e => setForm({...form, website:e.target.value})} placeholder="https://yourcompany.com"
                className="w-full h-12 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Password*</label>
              <div className="relative">
                <input type={showPass?'text':'password'} value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="Min 8 characters"
                  className="w-full h-12 border rounded-xl px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-400">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Confirm Password*</label>
              <div className="relative">
                <input type={showConfirm?'text':'password'} value={form.confirm} onChange={e => setForm({...form, confirm:e.target.value})} placeholder="Re-enter password"
                  className="w-full h-12 border rounded-xl px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3.5 text-gray-400">
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-lg transition-colors">
              {loading ? 'Registering...' : 'Register Company'}
            </button>
            <p className="text-center text-sm text-gray-500">Already registered? <Link to="/company-portal" className="text-blue-600 font-bold hover:underline">Login to Portal</Link></p>
          </form>
        </div>
      </div>
    </div>
  )
}
export default CompanySignupPage
