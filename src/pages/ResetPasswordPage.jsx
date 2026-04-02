import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/supabase'

const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const userType = searchParams.get('type')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleReset = async () => {
    if (!newPass || !confirmPass) { setError('Please enter both fields'); return }
    if (newPass.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPass !== confirmPass) { setError("Passwords don't match"); return }
    setLoading(true); setError('')
    try {
      const table = userType === 'company' ? 'companies' : 'candidates'
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/password_resets?token=eq.${token}&used=eq.false&select=*`,
        { headers: h }
      )
      const resetData = await checkRes.json()
      if (!resetData.length) { setError('Invalid or expired reset link.'); return }
      if (new Date(resetData[0].expires_at) < new Date()) { setError('Reset link has expired. Please request a new one.'); return }

      await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?email=eq.${encodeURIComponent(resetData[0].email)}`,
        { method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' }, body: JSON.stringify({ password: newPass }) }
      )
      await fetch(
        `${SUPABASE_URL}/rest/v1/password_resets?token=eq.${token}`,
        { method: 'PATCH', headers: { ...h, 'Prefer': 'return=minimal' }, body: JSON.stringify({ used: true }) }
      )
      setSuccess(true)
      setTimeout(() => navigate(userType === 'company' ? '/company-portal' : '/candidate-portal'), 3000)
    } catch(e) { setError('Failed to reset password. Please try again.') }
    finally { setLoading(false) }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
          <Link to="/" className="text-blue-600 hover:underline">Go to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border rounded-2xl p-8 shadow-sm">
        <Link to="/" className="text-2xl font-extrabold text-blue-600 block mb-6">zenrixi</Link>
        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Password Reset!</h2>
            <p className="text-gray-500 text-sm">Redirecting to portal...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1">Reset Password</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your new password</p>
            {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded-lg">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-1">New Password</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full h-11 border rounded-xl px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Confirm Password</label>
                <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={handleReset} disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
export default ResetPasswordPage
