export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { title, skills, experience, companyName } = req.body
  
  const postText = `🚀 New Job Opening!

🏢 Company: ${companyName}
💼 Position: ${title}
✅ Skills: ${skills}
⏰ Experience: ${experience}+ years

🤖 Apply using AI matching — upload your CV and get instantly matched!

🔗 Apply here: https://zenrixi.com/jobs

#Hiring #Jobs #AI #Recruitment #Zenrixi #India`

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
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    })
  })
  
  const data = await response.json()
  res.status(200).json(data)
}
