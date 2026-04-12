import React, { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://nurlnqzmiyryfviuujsq.supabase.co', 'sb_publishable_WTdQ9aVR43R1weeWFHgTBQ_CdUkjR09')
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ResumeUploadPage from './pages/ResumeUploadPage'
import ResumeUploadPage from './pages/ResumeUploadPage'
import { Toaster } from 'sonner'
import HomePage from './pages/HomePage'
import JobsPage from './pages/JobsPage'
import CompaniesPage from './pages/CompaniesPage'
import SignupPage from './pages/SignupPage'
import CompanySignupPage from './pages/CompanySignupPage'
import LaunchPage from './pages/LaunchPage'
import AdminPage from './pages/AdminPage'
import AIAgents from './components/AIAgents'
import AppLandingPage from './pages/AppLandingPage'
import ConsultantPortalPage from './pages/ConsultantPortalPage'
import CompanyPortalPage from './pages/CompanyPortalPage'
import CandidatePortalPage from './pages/CandidatePortalPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function App() {

  useEffect(() => {
    const trackVisit = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const geo = await res.json();
        await supabase.from('site_visits').insert({
          country: geo.country_name,
          country_code: geo.country_code,
          city: geo.city,
          page: window.location.pathname
        });
      } catch (e) {}
    };
    trackVisit();
  }, []);

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
        <Route path="/app" element={<AppLandingPage />} />
        <Route path="/launch" element={<LaunchPage />} />
        <Route path="/admin-panel" element={<AdminPage />} />
        <Route path="/zx9k2m" element={<ResumeUploadPage />} />
        <Route path="/zx9k2m" element={<ResumeUploadPage />} />
        <Route path="/consultant-portal" element={<ConsultantPortalPage />} />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center text-center px-4">
            <div><h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
            <p className="text-xl text-gray-500 mb-8">Page not found</p>
            <a href="/" className="text-blue-600 hover:underline">Back to home</a></div>
          </div>
        } />
      </Routes>
      <Toaster richColors />
      <AIAgents />
    </Router>
  )
}

export default App
