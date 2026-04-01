import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Users, Briefcase, Zap, ArrowRight, CheckCircle2, Search } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/supabase'

const HomePage = () => {
  const [stats, setStats] = useState({ jobs: 0, candidates: 0, companies: 0 })
  const [recentJobs, setRecentJobs] = useState([])
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/jobs?select=count&status=eq.active`, { headers: { ...h, 'Prefer': 'count=exact' } }),
      fetch(`${SUPABASE_URL}/rest/v1/candidates?select=count`, { headers: { ...h, 'Prefer': 'count=exact' } }),
      fetch(`${SUPABASE_URL}/rest/v1/companies?select=count`, { headers: { ...h, 'Prefer': 'count=exact' } }),
      fetch(`${SUPABASE_URL}/rest/v1/jobs?select=id,title,required_skills,min_experience,companies(company_name)&status=eq.active&order=created_at.desc&limit=6`, { headers: h }),
    ]).then(async ([j, c, co, rj]) => {
      setStats({
        jobs: j.headers.get('content-range')?.split('/')[1] || 0,
        candidates: c.headers.get('content-range')?.split('/')[1] || 0,
        companies: co.headers.get('content-range')?.split('/')[1] || 0,
      })
      const jobsData = await rj.json()
      setRecentJobs(Array.isArray(jobsData) ? jobsData : [])
    }).catch(console.error)
  }, [])

  const handleSearch = e => {
    e.preventDefault()
    window.location.href = `/jobs?q=${encodeURIComponent(keyword)}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1699259770610-204f58cc4bf8" alt="hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gray-950/80" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Get your <span className="text-blue-400">dream job</span> using AI
            </h1>
            <p className="text-xl text-gray-300 mb-10">Upload your CV. Our AI finds the right job for you automatically.</p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-6">
              <input value={keyword} onChange={e => setKeyword(e.target.value)}
                placeholder="Job title, skills, or company..."
                className="flex-1 h-14 px-5 rounded-xl text-gray-900 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-base transition-colors flex items-center justify-center gap-2">
                <Search className="w-5 h-5" /> Search
              </button>
            </form>
            <div className="flex flex-wrap justify-center gap-2">
              {['React Developer', 'Data Analyst', 'Product Manager', 'DevOps'].map(tag => (
                <Link key={tag} to={`/jobs?q=${tag}`} className="text-sm text-gray-300 bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full transition-colors">{tag}</Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 grid grid-cols-3 gap-6 text-center">
          {[['Active Jobs', stats.jobs],['Registered Candidates', stats.candidates],['Companies Hiring', stats.companies]].map(([label, value]) => (
            <div key={label}>
              <p className="text-3xl md:text-4xl font-extrabold text-blue-600">{value || '0'}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {recentJobs.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">Latest Jobs</h2>
              <Link to="/jobs" className="flex items-center gap-1 text-blue-600 font-medium text-sm hover:underline">View All <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentJobs.map((job, i) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="bg-white border rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm line-clamp-1">{job.title}</h3>
                      <p className="text-xs text-gray-500">{job.companies?.company_name || 'Company'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {Array.isArray(job.required_skills) && job.required_skills.slice(0, 3).map((s, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{job.min_experience ? `${job.min_experience}+ years` : 'Any experience'}</p>
                  <Link to="/signup" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-xl transition-colors">Apply Now</Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">How Zenrixi Works</h2>
          <p className="text-gray-500 mb-12">3 simple steps to your dream job</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: Users, title: 'Register & Upload CV', desc: 'Create your profile and upload your resume in seconds.' },
              { icon: Zap, title: 'AI Matches You', desc: 'Our AI analyzes your CV and finds the best matching jobs automatically.' },
              { icon: Building2, title: 'Get Hired', desc: 'Companies contact you directly. Interview gets scheduled automatically.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg transition-colors">Upload Your CV — Free</Link>
            <Link to="/company-signup" className="px-8 py-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold rounded-xl text-lg transition-colors">Hire with AI</Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-50 border-t">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Are you hiring?</h2>
          <p className="text-gray-500 mb-8">Post a job and let AI automatically shortlist the best candidates.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {['AI shortlists best candidates','Match scores for every candidate','Auto interview scheduling','Pay per successful hire'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-xl p-3 border">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-xs font-medium">{item}</span>
              </div>
            ))}
          </div>
          <Link to="/company-signup" className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg transition-colors">Register Your Company — Free</Link>
        </div>
      </section>
      <Footer />
    </div>
  )
}
export default HomePage
