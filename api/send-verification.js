export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { email, name, otp } = req.body
  const RESEND_KEY = process.env.VITE_RESEND_KEY || process.env.RESEND_KEY

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Zenrixi <noreply@zenrixi.com>',
        to: email,
        subject: 'Verify your Zenrixi Consultant Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; font-size: 28px; font-weight: 900; margin: 0;">zenrixi</h1>
              <p style="color: #64748b; font-size: 14px;">AI-Powered Job Platform</p>
            </div>
            <div style="background: #f8fafc; border-radius: 16px; padding: 30px; text-align: center;">
              <h2 style="color: #1e293b; margin-bottom: 8px;">Welcome, ${name}!</h2>
              <p style="color: #64748b; margin-bottom: 24px;">Use this OTP to verify your Consultant account:</p>
              <div style="background: #2563eb; color: white; font-size: 36px; font-weight: 900; letter-spacing: 12px; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                ${otp}
              </div>
              <p style="color: #94a3b8; font-size: 13px;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;">
              If you did not register on Zenrixi, please ignore this email.
            </p>
          </div>
        `
      })
    })
    if (!response.ok) throw new Error('Email failed')
    return res.status(200).json({ success: true })
  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
