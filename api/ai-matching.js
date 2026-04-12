export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { jobData, jobId, candidates, supabaseUrl, supabaseKey } = req.body;
  
  const results = [];
  for (const candidate of candidates) {
    try {
      const prompt = `You are an expert HR recruiter. Evaluate this candidate for the job with detailed scoring.

CANDIDATE:
- Name: ${candidate.name}
- Current Title: ${candidate.job_title || candidate.current_title || 'Not specified'}
- Experience: ${candidate.experience_years || 0} years
- Skills: ${(candidate.parsed_skills || []).join(', ') || 'Not specified'}
- Education: ${candidate.education || 'Not specified'}
- Location: ${candidate.location || 'Not specified'}
- Summary: ${candidate.summary || 'Not specified'}

JOB REQUIREMENTS:
- Title: ${jobData.title}
- Required Skills: ${Array.isArray(jobData.required_skills) ? jobData.required_skills.join(', ') : jobData.required_skills || 'Not specified'}
- Min Experience: ${jobData.min_experience || 0} years
- Location: ${jobData.location || 'Not specified'}
- Description: ${jobData.description ? jobData.description.substring(0, 300) : 'Not specified'}

Return ONLY valid JSON with this exact structure:
{
  "overall_score": 75,
  "recommendation": "shortlist",
  "education": {"score": 8, "max": 10, "summary": "Brief education assessment"},
  "experience": {"score": 7, "max": 10, "summary": "Brief experience assessment"},
  "skills": {"score": 8, "max": 10, "summary": "Brief skills assessment"},
  "location": {"score": 5, "max": 10, "summary": "Brief location assessment"},
  "reason": "Overall brief summary of fit"
}
recommendation must be: shortlist, maybe, or reject`;

      const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], max_tokens: 400 })
      });

      const aiData = await aiRes.json();
      const text = aiData.choices?.[0]?.message?.content || '{}';
      const result = JSON.parse(text.replace(/```json|```/g, '').trim());

      const existCheck = await fetch(`${supabaseUrl}/rest/v1/matches?candidate_id=eq.${candidate.id}&job_id=eq.${jobId}`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const existData = await existCheck.json();
      if (existData.length > 0) continue;

      await fetch(`${supabaseUrl}/rest/v1/matches`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          job_id: jobId,
          ai_score: result.overall_score || 60,
          status: result.recommendation === 'shortlist' ? 'Shortlisted' : result.recommendation === 'reject' ? 'Rejected' : 'Applied',
          match_reason: JSON.stringify({
            reason: result.reason,
            education: result.education,
            experience: result.experience,
            skills: result.skills,
            location: result.location
          })
        })
      });
      results.push({ candidate: candidate.name, score: result.overall_score });
    } catch(e) { console.error('AI match error:', e.message); }
  }
  return res.status(200).json({ success: true, matched: results.length });
}
