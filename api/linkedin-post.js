export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, company_name, location, skills, experience } = req.body;
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgId = '113453944';
  if (!token) return res.status(500).json({ error: 'LinkedIn token not configured' });

  const text = `🚀 New Job Opening at ${company_name}!\n\n💼 Position: ${title}\n📍 Location: ${location || 'India'}\n🛠 Skills: ${skills}\n📅 Experience: ${experience}+ years\n\nApply Now: https://zenrixi.com/jobs\n\n#hiring #jobs #zenrixi #recruitment`;

  try {
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: `urn:li:person:Rk19HuTj5c`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(400).json({ error: data });
    return res.status(200).json({ success: true, id: data.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}