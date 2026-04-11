export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { text } = req.body
  const OPENAI_KEY = process.env.GROQ_API_KEY

  const prompt = `Extract candidate information from this resume text. Return ONLY valid JSON:
{
  "name": "Full Name",
  "email": "email@example.com", 
  "phone": "phone number",
  "job_title": "current job title",
  "experience_years": 3,
  "location": "city, state",
  "current_company": "company name",
  "skills": "skill1, skill2, skill3",
  "education": "B.Tech Computer Science",
  "summary": "2 line summary"
}
Resume: ${text.slice(0, 4000)}`

  try {
    const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], max_tokens: 500 })
    })
    const data = await aiRes.json()
    const raw = data.choices?.[0]?.message?.content || '{}'
    const info = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return res.status(200).json(info)
  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
