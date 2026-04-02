import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Upload, FileText, X, CheckCircle2 } from 'lucide-react'
import Header from '../components/Header'
import { SUPABASE_URL, SUPABASE_KEY, supabase } from '../lib/supabase'

const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }

const SignupPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', confirm:'' })
  const [file, setFile] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFile = e => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5*1024*1024) { setError('File must be less than 5MB'); return }
    setFile(f); setError('')
  }


  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/candidate-portal' }
    })
    if (error) alert('Google login failed: ' + error.message)
  }
  const handleSubmit = async e => {
    e.preventDefault(); setError('')
    if (!form.name||!form.email||!form.phone||!form.password) { setError('All fields are required'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (form.password !== form.confirm) { setError("Passwords don't match"); return }
    if (!file) { setError('Please upload your CV'); return }
    setLoading(true)
    try {
      const check = await fetch(`${SUPABASE_URL}/rest/v1/candidates?email=eq.${encodeURIComponent(form.email)}&select=id`, { headers: h })
      const existing = await check.json()
      if (existing.length > 0) { setError('Email already registered. Please login.'); setLoading(false); return }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/candidates`, {
        method: 'POST', headers: { ...h, 'Prefer': 'return=representation' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: '+91'+form.phone, password: form.password })
      })
      if (!res.ok) throw new Error('Registration failed')
      navigate('/candidate-portal')
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex flex-grow pt-20">
        <div className="hidden lg:flex flex-col w-96 bg-blue-50 p-10 border-r">
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6">On registering, you can</h2>
            <ul className="space-y-5">
              {['Build your profile and let recruiters find you','Get job postings matched by AI','Find a job and grow your career','Track all your applications in one place'].map((item,i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-grow p-6 md:p-10 max-w-xl mx-auto lg:mx-0">
          <h1 className="text-3xl font-bold mb-2">Create your profile</h1>
          <p className="text-gray-500 mb-8">Relax, our AI will find you the perfect job!</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm">{error}</div>}

            <button type="button" onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 h-12 border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors mb-4">
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">or register with email</span></div>
            </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-1">Full Name*</label>
              <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Enter your full name"
                className="w-full h-12 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Email*</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="your@email.com"
                className="w-full h-12 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">Phone Number*</label>
              <div className="flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <span className="bg-gray-50 px-4 flex items-center text-sm text-gray-500 border-r">+91</span>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="Phone number"
                  className="flex-1 h-12 px-4 text-sm focus:outline-none" />
              </div>
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
            <div>
              <label className="text-sm font-semibold block mb-2">Upload CV/Resume*</label>
              {!file ? (
                <>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFile} ref={fileRef} className="hidden" />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors">
                    <Upload className="w-4 h-4" /> Upload Your CV
                  </button>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX | Max 5MB</p>
                </>
              ) : (
                <div className="flex items-center gap-3 p-3 border-2 border-blue-200 bg-blue-50 rounded-xl">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="text-sm font-medium flex-1 truncate">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-lg transition-colors">
              {loading ? 'Registering...' : 'Register Now'}
            </button>
            <p className="text-center text-sm text-gray-500">Already registered? <Link to="/candidate-portal" className="text-blue-600 font-bold hover:underline">Login here</Link></p>
            <p className="text-center text-sm text-gray-500">Are you a company? <Link to="/company-signup" className="text-blue-600 font-bold hover:underline">Register as Company</Link></p>
          </form>
        </div>
      </div>
    </div>
  )
}
export default SignupPage
