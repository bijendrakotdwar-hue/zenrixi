import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { SUPABASE_URL, SUPABASE_KEY } from '../lib/supabase'

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/companies?select=*&order=created_at.desc`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    }).then(r => r.json()).then(d => { setCompanies(Array.isArray(d)?d:[]); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <section className="pt-32 pb-12 bg-gray-50 border-b">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold mb-4">Top Companies</h1>
          <p className="text-gray-500 text-lg mb-6">Leading companies hiring with AI.</p>
          <Link to="/company-signup" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">Register Your Company</Link>
        </div>
      </section>
      <section className="py-16 flex-grow">
        <div className="max-w-6xl mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="border rounded-2xl p-6 animate-pulse bg-gray-100 h-40" />)}
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No companies yet</h3>
              <Link to="/company-signup" className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl">Register First Company</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map(company => (
                <div key={company.id} className="bg-white border rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center border shrink-0">
                      <Building2 className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1">{company.company_name}</h3>
                      <p className="text-sm text-gray-500 flex items-center mt-1"><MapPin className="w-3 h-3 mr-1" />India</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 flex-grow">AI-powered hiring. Apply and get matched automatically!</p>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-gray-400">Technology</span>
                    <Link to={`/jobs?q=${encodeURIComponent(company.company_name)}`} className="text-xs px-3 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium">View Jobs</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
export default CompaniesPage
