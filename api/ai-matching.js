export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { jobData, jobId, candidates, supabaseUrl, supabaseKey } = req.body;
  
  const results = [];
  for (const candidate of candidates) {
    try {
      const prompt = `You are an HR expert. Score this candidate for the job.
Return ONLY valid JSON: {"score": 85, "recommendation": "shortlist", "reason": "Strong match"}
recommendation must be: shortlist, maybe, or reject
CANDIDATE: ${candidate.name}, ${candidate.job_title||''}, ${candidate.experience_years||0} years exp, skills: ${(candidate.parsed_skills||[]).join(', ')}
JOB: ${jobData.title}, Required: ${Array.isArray(jobData.required_skills) ? jobData.required_skills.join(', ') : jobData.required_skills}, Min exp: ${jobData.min_experience} years`;

      const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], max_tokens: 150 })
      });

      const aiData = await aiRes.json();
      const text = aiData.choices?.[0]?.message?.content || '{}';
      const result = JSON.parse(text.replace(/```json|```/g, '').trim());

      // Check existing match
      const existCheck = await fetch(`${supabaseUrl}/rest/v1/matches?candidate_id=eq.${candidate.id}&job_id=eq.${jobId}`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const existData = await existCheck.json();
      if (existData.length > 0) continue;

      // Save match
      await fetch(`${supabaseUrl}/rest/v1/matches`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ candidate_id: candidate.id, job_id: jobId, ai_score: result.score||0, status: result.recommendation||'maybe', match_reason: result.reason||'' })
      });
      results.push({ candidate: candidate.name, score: result.score });
    } catch(e) { console.error('AI match error:', e.message); }
  }
  return res.status(200).json({ success: true, matched: results.length });
}
