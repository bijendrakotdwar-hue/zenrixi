import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import HomePage from './pages/HomePage'
import JobsPage from './pages/JobsPage'
import CompaniesPage from './pages/CompaniesPage'
import SignupPage from './pages/SignupPage'
import CompanySignupPage from './pages/CompanySignupPage'
import ConsultantPortalPage from './pages/ConsultantPortalPage'
import CompanyPortalPage from './pages/CompanyPortalPage'
import CandidatePortalPage from './pages/CandidatePortalPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/company-signup" element={<CompanySignupPage />} />
        <Route path="/company-portal" element={<CompanyPortalPage />} />
        <Route path="/candidate-portal" element={<CandidatePortalPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center text-center px-4">
            <div><h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
            <p className="text-xl text-gray-500 mb-8">Page not found</p>
            <a href="/" className="text-blue-600 hover:underline">Back to home</a></div>
          </div>
        } />
        <Route path="/consultant-portal" element={<ConsultantPortalPage />} />
      </Routes>
      <Toaster richColors />
    </Router>
  )
}
export default App
