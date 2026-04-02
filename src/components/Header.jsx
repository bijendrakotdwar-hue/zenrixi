import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [empOpen, setEmpOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [regOpen, setRegOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b shadow-sm py-3' : 'bg-white/80 backdrop-blur-sm py-4'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-extrabold text-blue-600">zenrixi</Link>
        <div className="hidden md:flex items-center gap-6">
          {[['Jobs','/jobs'],['Companies','/companies'],['Services','/services']].map(([name,path]) => (
            <Link key={path} to={path} className={`text-sm font-medium transition-colors ${location.pathname===path?'text-blue-600':'text-gray-600 hover:text-gray-900'}`}>{name}</Link>
          ))}
          <div className="relative">
            <button onClick={() => setEmpOpen(!empOpen)} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
              For employers <ChevronDown className="w-4 h-4" />
            </button>
            {empOpen && (
              <div className="absolute top-8 right-0 bg-white border rounded-xl shadow-lg w-48 py-2 z-50" onMouseLeave={() => setEmpOpen(false)}>
                <Link to="/company-signup" onClick={() => setEmpOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Register Company</Link>
                <Link to="/company-portal" onClick={() => setEmpOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Company Portal</Link>
                <Link to="/company-portal" onClick={() => setEmpOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Post a Job</Link>
              </div>
            )}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setLoginOpen(!loginOpen)} className="flex items-center gap-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50">
              Login <ChevronDown className="w-3 h-3" />
            </button>
            {loginOpen && (
              <div className="absolute top-10 right-0 bg-white border rounded-xl shadow-lg w-48 py-2 z-50" onMouseLeave={() => setLoginOpen(false)}>
                <Link to="/candidate-portal" onClick={() => setLoginOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Candidate Login</Link>
                <Link to="/company-portal" onClick={() => setLoginOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Company Login</Link>
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setRegOpen(!regOpen)} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Register <ChevronDown className="w-3 h-3" />
            </button>
            {regOpen && (
              <div className="absolute top-10 right-0 bg-white border rounded-xl shadow-lg w-52 py-2 z-50" onMouseLeave={() => setRegOpen(false)}>
                <Link to="/signup" onClick={() => setRegOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Register as Candidate</Link>
                <Link to="/company-signup" onClick={() => setRegOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Register as Company</Link>
              </div>
            )}
          </div>
        </div>
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>
      {isOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 flex flex-col gap-2">
          {[['Home','/'],['Jobs','/jobs'],['Companies','/companies']].map(([name,path]) => (
            <Link key={path} to={path} onClick={() => setIsOpen(false)} className="py-2 text-sm font-medium text-gray-700">{name}</Link>
          ))}
          <hr className="my-2" />
          <Link to="/company-signup" onClick={() => setIsOpen(false)} className="py-1 text-sm text-gray-600">Register Company</Link>
          <Link to="/company-portal" onClick={() => setIsOpen(false)} className="py-1 text-sm text-gray-600">Company Portal</Link>
          <hr className="my-2" />
          <Link to="/signup" onClick={() => setIsOpen(false)} className="py-1 text-sm text-gray-600">Register as Candidate</Link>
          <Link to="/candidate-portal" onClick={() => setIsOpen(false)} className="py-1 text-sm text-gray-600">Candidate Login</Link>
        </div>
      )}
    </header>
  )
}
export default Header
