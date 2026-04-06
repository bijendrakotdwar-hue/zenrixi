import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const AppLandingPage = () => {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e1b4b 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{
          width: 80, height: 80,
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          borderRadius: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, marginBottom: 20,
          boxShadow: '0 20px 60px rgba(59,130,246,0.4)'
        }}>Z</div>
        <h1 style={{fontSize: 32, fontWeight: 900, letterSpacing: -1, marginBottom: 8}}>zenrixi</h1>
        <p style={{color: '#93c5fd', fontSize: 14}}>AI-Powered Job Platform</p>
        <div style={{marginTop: 60, display: 'flex', gap: 8}}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 4,
              background: i === 0 ? '#60a5fa' : 'rgba(255,255,255,0.2)',
              animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`
            }} />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1e1b4b 100%)',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 24px',
      color: 'white'
    }}>
      {/* Logo */}
      <div style={{textAlign: 'center', marginBottom: 48, marginTop: 20}}>
        <div style={{
          width: 72, height: 72,
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 16px',
          boxShadow: '0 20px 60px rgba(59,130,246,0.3)'
        }}>Z</div>
        <h1 style={{fontSize: 28, fontWeight: 900, marginBottom: 6}}>zenrixi</h1>
        <p style={{color: '#93c5fd', fontSize: 13}}>India's AI-Powered Job Platform</p>
      </div>

      {/* Main heading */}
      <div style={{textAlign: 'center', marginBottom: 48}}>
        <h2 style={{fontSize: 24, fontWeight: 800, marginBottom: 8, lineHeight: 1.3}}>
          Welcome! Who are you?
        </h2>
        <p style={{color: '#94a3b8', fontSize: 14}}>Select your role to get started</p>
      </div>

      {/* Role cards */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400, margin: '0 auto', width: '100%'}}>
        
        {/* Candidate */}
        <Link to="/candidate-portal" style={{textDecoration: 'none'}}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))',
            border: '1px solid rgba(96,165,250,0.3)',
            borderRadius: 20,
            padding: '24px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0
            }}>👤</div>
            <div style={{flex: 1}}>
              <h3 style={{fontSize: 18, fontWeight: 700, marginBottom: 4}}>Job Seeker</h3>
              <p style={{color: '#93c5fd', fontSize: 12}}>Find jobs, get AI-matched, apply instantly</p>
            </div>
            <div style={{color: '#60a5fa', fontSize: 20}}>›</div>
          </div>
        </Link>

        {/* Employer */}
        <Link to="/company-portal" style={{textDecoration: 'none'}}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 20,
            padding: '24px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0
            }}>🏢</div>
            <div style={{flex: 1}}>
              <h3 style={{fontSize: 18, fontWeight: 700, marginBottom: 4}}>Employer</h3>
              <p style={{color: '#6ee7b7', fontSize: 12}}>Post jobs, AI shortlists best candidates</p>
            </div>
            <div style={{color: '#34d399', fontSize: 20}}>›</div>
          </div>
        </Link>

        {/* Consultant */}
        <Link to="/consultant-portal" style={{textDecoration: 'none'}}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.2))',
            border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 20,
            padding: '24px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0
            }}>💼</div>
            <div style={{flex: 1}}>
              <h3 style={{fontSize: 18, fontWeight: 700, marginBottom: 4}}>HR Consultant</h3>
              <p style={{color: '#c4b5fd', fontSize: 12}}>Manage clients, vacancies, billing & more</p>
            </div>
            <div style={{color: '#a78bfa', fontSize: 20}}>›</div>
          </div>
        </Link>
      </div>

      {/* Browse jobs link */}
      <div style={{textAlign: 'center', marginTop: 32}}>
        <Link to="/jobs" style={{color: '#60a5fa', fontSize: 14, textDecoration: 'none'}}>
          Browse Jobs without Login →
        </Link>
      </div>

      {/* Footer */}
      <div style={{textAlign: 'center', marginTop: 'auto', paddingTop: 40}}>
        <p style={{color: '#475569', fontSize: 12}}>zenrixi.com • AI-Powered Hiring</p>
      </div>
    </div>
  )
}

export default AppLandingPage
