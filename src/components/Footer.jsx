import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => (
  <footer className="bg-gray-50 border-t pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div>
          <Link to="/" className="text-2xl font-extrabold text-blue-600">zenrixi</Link>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">AI-powered recruitment platform. Upload your CV and our AI finds the perfect job for you automatically.</p>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/jobs" className="hover:text-blue-600">Browse Jobs</Link></li>
            <li><Link to="/companies" className="hover:text-blue-600">Top Companies</Link></li>
            <li><Link to="/signup" className="hover:text-blue-600">Register as Candidate</Link></li>
            <li><Link to="/candidate-portal" className="hover:text-blue-600">Candidate Login</Link></li>
            <li><Link to="/app" className="hover:text-purple-600 font-medium">📱 Download App</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-4">For Employers</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/company-signup" className="hover:text-blue-600">Register Company</Link></li>
            <li><Link to="/company-portal" className="hover:text-blue-600">Company Portal</Link></li>
            <li><Link to="/company-portal" className="hover:text-blue-600">Post a Job</Link></li>
            <li><Link to="/company-portal" className="hover:text-blue-600">View Candidates</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /><span>Dehradun, Uttarakhand, India</span></li>

            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-600 shrink-0" /><a href="mailto:support@zenrixi.com" className="hover:text-blue-600">support@zenrixi.com</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} zenrixi. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-blue-600">Terms of Service</Link>
        </div>
      </div>
    </div>
  </footer>
)
export default Footer
