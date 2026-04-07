import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Star, Users, Briefcase, Zap, Globe, Heart } from 'lucide-react'

const LaunchPage = () => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [count, setCount] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

  // Launch date countdown
  useEffect(() => {
    const launch = new Date('2026-05-01T00:00:00')
    const timer = setInterval(() => {
      const now = new Date()
      const diff = launch - now
      if (diff <= 0) { clearInterval(timer); return }
      setCount({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000)
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    // Save to Supabase
    try {
      await fetch('https://nurlnqzmiyryfviuujsq.supabase.co/rest/v1/launch_waitlist', {
        method: 'POST',
        headers: {
          'apikey': 'sb_publishable_WTdQ9aVR43R1weeWFHgTBQ_CdUkjR09',
          'Authorization': 'Bearer sb_publishable_WTdQ9aVR43R1weeWFHgTBQ_CdUkjR09',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ email, source: 'launch_page' })
      })
    } catch(e) {}
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-xl font-black text-blue-600">zenrixi</span>
          <div className="flex items-center gap-3">
            <a href="https://www.producthunt.com/posts/zenrixi" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              🔥 Vote on Product Hunt
            </a>
            <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 font-medium">Try Now →</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-4 text-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          {/* PH Badge */}
          <a href="https://www.producthunt.com/posts/zenrixi" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 border border-orange-200 px-4 py-2 rounded-full text-sm font-bold mb-8 hover:bg-orange-200 transition-colors">
            🏆 Featured on Product Hunt — Vote for us!
          </a>

          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 mb-6 leading-tight">
            Hiring is broken.<br/>
            <span className="text-blue-600">We fixed it with AI.</span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Zenrixi is India's first AI-powered job matching platform. Upload resume → AI matches jobs. Post job → AI shortlists candidates. Zero manual work.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2">
              Start Free — No Credit Card <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/company-signup"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold px-8 py-4 rounded-2xl text-lg transition-colors">
              Post Jobs Free
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Free for 1 Year</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> No Credit Card</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Setup in 2 mins</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center text-white">
          {[
            ['100%', 'AI Automated'],
            ['Free', 'For 1 Year'],
            ['3 Portals', 'In One Platform'],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="text-4xl font-black mb-1">{val}</p>
              <p className="text-blue-200 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4">How Zenrixi Works</h2>
          <p className="text-gray-500 text-center mb-12">Three portals, one platform, zero manual work</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: '👤', title: 'For Job Seekers', color: 'bg-blue-50 border-blue-100', steps: ['Upload your resume', 'AI analyzes your skills', 'Get matched to perfect jobs', 'Receive interview calls'] },
              { emoji: '🏢', title: 'For Companies', color: 'bg-green-50 border-green-100', steps: ['Post a job in 2 mins', 'AI reads all resumes', 'Get ranked candidates', 'Schedule interviews instantly'] },
              { emoji: '💼', title: 'For HR Consultants', color: 'bg-purple-50 border-purple-100', steps: ['Manage all clients', 'Track vacancies', 'Generate interview letters', 'Invoice & collect payment'] },
            ].map(({ emoji, title, color, steps }) => (
              <div key={title} className={`${color} border rounded-3xl p-6`}>
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="text-xl font-black mb-4">{title}</h3>
                <ul className="space-y-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-12">Everything you need</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {[
              ['🤖', 'AI Matching', 'GPT-4o-mini powered instant candidate matching'],
              ['📋', 'Interview Letters', 'Professional letters generated in one click'],
              ['💰', 'Invoicing', 'Create and send invoices with GST support'],
              ['📊', 'Analytics', 'Track placements, revenue, and follow-ups'],
              ['🔗', 'LinkedIn Auto-Post', 'Jobs auto-posted to LinkedIn on creation'],
              ['📱', 'Mobile App', 'PWA — install on any device, works offline'],
              ['🔒', 'Secure', 'Bank-grade security with Supabase backend'],
              ['🌍', 'Global', 'Works worldwide — any language, any country'],
              ['⚡', 'Instant Setup', 'Live in 2 minutes — no technical skills needed'],
            ].map(([emoji, title, desc]) => (
              <div key={title} className="bg-white rounded-2xl p-5 border hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="font-bold mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FREE OFFER */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-full mb-6">🎁 LAUNCH OFFER</div>
          <h2 className="text-5xl font-black mb-4">100% Free<br/>for 1 Full Year</h2>
          <p className="text-blue-200 text-lg mb-10">We believe in the product. Try it completely free — no credit card, no commitment. If you love it after a year, pay then.</p>
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              ['Unlimited', 'Job Posts'],
              ['Unlimited', 'Candidates'],
              ['Unlimited', 'AI Matching'],
            ].map(([val, label]) => (
              <div key={label} className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-black">{val}</p>
                <p className="text-blue-200 text-sm">{label}</p>
              </div>
            ))}
          </div>
          <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-blue-700 font-black text-lg px-10 py-4 rounded-2xl hover:bg-blue-50 transition-colors">
            Claim Free Access <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* WAITLIST */}
      <section className="py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-black mb-3">Stay Updated</h2>
          <p className="text-gray-500 mb-8">Get notified about new features, tips, and updates</p>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                className="flex-1 h-12 border-2 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit" className="bg-blue-600 text-white font-bold px-6 rounded-xl hover:bg-blue-700">Notify Me</button>
            </form>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="font-bold text-green-700">You're on the list! 🎉</p>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 border-t text-center text-gray-400 text-sm">
        <p className="font-black text-blue-600 text-xl mb-2">zenrixi</p>
        <p>AI-Powered Hiring Platform • Made in India 🇮🇳 • zenrixi.com</p>
        <div className="flex justify-center gap-6 mt-4">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <Link to="/jobs" className="hover:text-blue-600">Jobs</Link>
          <Link to="/signup" className="hover:text-blue-600">Sign Up</Link>
          <Link to="/company-signup" className="hover:text-blue-600">For Companies</Link>
        </div>
      </footer>
    </div>
  )
}

export default LaunchPage
