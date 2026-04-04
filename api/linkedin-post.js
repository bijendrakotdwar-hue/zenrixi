export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { title, skills, experience, companyName, jobId, location, salary } = req.body
  
  const skillsList = skills.split(',').map(s => s.trim()).join(' • ')
  
  const postText = `🎯 We're Hiring: ${title}

━━━━━━━━━━━━━━━━━━━━━━
🏢 ${companyName}
━━━━━━━━━━━━━━━━━━━━━━

📌 Role: ${title}
📍 Location: ${location || 'India / Remote'}
💰 Salary: ${salary || 'Competitive'}
⏰ Experience: ${experience}+ years required

🛠️ Skills Required:
${skills.split(',').map(s => `   ✅ ${s.trim()}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━
🤖 HOW TO APPLY:
━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Visit: https://zenrixi.com/signup
2️⃣ Upload your CV
3️⃣ Our AI instantly matches you!

🔗 Apply Now: https://zenrixi.com/signup
━━━━━━━━━━━━━━━━━━━━━━

⚡ Powered by Zenrixi AI — India's Smartest Job Portal

#Hiring #JobOpening #${title.replace(/\s+/g, '')} #Jobs #India #AI #Recruitment #Zenrixi #Career #JobSearch #NowHiring`

  try {
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LINKEDIN_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: `urn:li:company:${process.env.LINKEDIN_COMPANY_ID}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: postText },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                description: { text: `Apply for ${title} at ${companyName} — Upload CV & Get AI Matched Instantly!` },
                originalUrl: 'https://zenrixi.com/signup',
                title: { text: `🚀 ${title} at ${companyName} | Apply on Zenrixi` }
              }
            ]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    })
    
    const data = await response.json()
    console.log('LinkedIn response:', data)
    res.status(200).json(data)
  } catch(e) {
    console.error('LinkedIn error:', e)
    res.status(500).json({ error: e.message })
  }
}
