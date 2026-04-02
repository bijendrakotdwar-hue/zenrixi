const RESEND_API_KEY = 're_c8cscWr9_D3GR15tAme3y8vcAYGDa3eDi'

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Zenrixi <support@zenrixi.com>',
        to,
        subject,
        html
      })
    })
    return await res.json()
  } catch(e) {
    console.error('Email error:', e)
  }
}

export const sendWelcomeEmail = async (name, email) => {
  return sendEmail({
    to: email,
    subject: 'Welcome to Zenrixi — Your AI Job Portal!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">zenrixi</h1>
        </div>
        <div style="padding: 30px;">
          <h2>Welcome, ${name}!</h2>
          <p>Your account has been created successfully. Our AI will now match you with the best jobs automatically!</p>
          <a href="https://zenrixi.com/candidate-portal" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to Candidate Portal</a>
          <p style="color: #666; margin-top: 20px;">If you have any questions, contact us at support@zenrixi.com</p>
        </div>
      </div>
    `
  })
}

export const sendCompanyWelcomeEmail = async (companyName, email) => {
  return sendEmail({
    to: email,
    subject: 'Welcome to Zenrixi — Start Hiring with AI!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">zenrixi</h1>
        </div>
        <div style="padding: 30px;">
          <h2>Welcome, ${companyName}!</h2>
          <p>Your company has been registered successfully. Post a job and our AI will instantly shortlist the best candidates!</p>
          <a href="https://zenrixi.com/company-portal" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to Company Portal</a>
          <p style="color: #666; margin-top: 20px;">If you have any questions, contact us at support@zenrixi.com</p>
        </div>
      </div>
    `
  })
}

export const sendPasswordResetEmail = async (name, email, resetToken, userType) => {
  const resetLink = `https://zenrixi.com/reset-password?token=${resetToken}&type=${userType}`
  return sendEmail({
    to: email,
    subject: 'Reset Your Zenrixi Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">zenrixi</h1>
        </div>
        <div style="padding: 30px;">
          <h2>Reset Your Password</h2>
          <p>Hi ${name}, we received a request to reset your password.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
          <p style="color: #666; margin-top: 20px;">If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `
  })
}
