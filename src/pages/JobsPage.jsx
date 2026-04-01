import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Briefcase, Clock, Building2 } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/supabase'

const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }

const JobsPage = () => {
  const [searchParams] = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState(searchParams.get('q') || '')
  const [experience, setExperience] = useState('')

  const fetchJobs = async (kw, exp) => {
    setLoading(true)
    try {
      let url = `${SUPABASE_URL}/rest/v1/jobs?select=*,companies(company_name)&status=eq.active&order=created_at.desc`
      if (kw) url += `&or=(title.ilike.*${kw}*,description.ilike.*${kw}*)`
      if (exp) url += `&min_experience=lte.${exp}`
      const res = await fetch(url, { headers: h })
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : [])
    } catch { setJobs([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchJobs(keyword, experience) }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <div className="bg-gray-50 pt-28 pb-10 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-extrabold text-center mb-8">Find Your Dream Job</h1>
          <form onSubmit={e => { e.preventDefault(); fetchJobs(keyword, experience) }} className="bg-white rounded-2xl border p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 border rounded-xl px-3">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Job title, skills..."
                  className="flex-1 h-11 focus:outline-none text-sm" />
              </div>
              <select value={experience} onChange={e => setExperience(e.target.value)}
                className="border rounded-xl px-3 h-11 text-sm focus:outline-none bg-white">
                <option value="">Any Experience</option>
                <option value="0">Fresher</option>
                <option value="1">1+ years</option>
                <option value="2">2+ years</option>
                <option value="3">3+ years</option>
                <option value="5">5+ years</option>
              </select>
              <button type="submit" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm">Search Jobs</button>
            </div>
          </form>
        </div>
      </div>
      <section className="py-12 flex-grow">
        <div className="max-w-5xl mx-auto px-4">
          <p className="mb-6 font-bold text-lg">{loading ? 'Searching...' : `${jobs.length} Job${jobs.length !== 1 ? 's' : ''} Found`}</p>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1,2,3,4].map(i => <div key={i} className="border rounded-2xl p-6 animate-pulse bg-gray-100 h-40" />)}
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {jobs.map(job => (
                <div key={job.id} className="bg-white border rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold line-clamp-1">{job.title}</h3>
                      <p className="text-sm text-gray-500">{job.companies?.company_name || 'Company'}</p>
                    </div>
                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{job.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {Array.isArray(job.required_skills) && job.required_skills.slice(0, 4).map((s, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.min_experience ? `${job.min_experience}+ yrs` : 'Any exp'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Full Time</span>
                  </div>
                  <Link to="/signup" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">Apply Now — Upload Your CV</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white border rounded-2xl">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No jobs found</h3>
              <p className="text-gray-500 mb-4">Try different keywords.</p>
              <button onClick={() => { setKeyword(''); setExperience(''); fetchJobs('', '') }}
                className="px-6 py-2 border rounded-xl text-sm hover:bg-gray-50">Clear Filters</button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
export default JobsPage
