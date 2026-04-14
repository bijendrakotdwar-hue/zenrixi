export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { jobData, jobId, candidates, supabaseUrl, supabaseKey } = req.body;
  
  const results = [];
  for (const candidate of candidates) {
    try {
      const prompt = `You are a strict HR expert. Evaluate this candidate for the job with detailed scoring.
Be very strict - only give high scores if there is a DIRECT and STRONG match.

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
- Department: ${jobData.department || 'Not specified'}
- Industry: ${jobData.industry || 'Not specified'}
- Required Qualification: ${jobData.qualification || 'Not specified'}
- Required Skills: ${Array.isArray(jobData.required_skills) ? jobData.required_skills.join(', ') : jobData.required_skills || 'Not specified'}
- Min Experience: ${jobData.min_experience || 0} years
- Location: ${jobData.location || 'Not specified'}
- Job Type: ${jobData.job_type || 'Full Time'}
- Description: ${jobData.description ? jobData.description.substring(0, 400) : 'Not specified'}

STRICT SCORING RULES:
- MOST IMPORTANT: Check if candidate's department/field matches job department
  * QA/Quality person for Maintenance job = score below 25
  * Production person for QA job = score below 35  
  * Pharma person for IT job = score below 20
  * If field is COMPLETELY different, overall score MUST be below 30
- If candidate has NO relevant skills for job, skills score must be 0-2
- Education: Score based on relevance of degree to job field (0-10)
- Experience: Score based on years AND relevance of experience to job (0-10)  
- Skills: Score based on how many required skills candidate has (0-10)
- Location: 10 if same city, 7 if same state, 5 if different state, 3 if unknown
- Stability: Score based on average tenure at previous jobs (0-10)
- Overall: Weighted average (Education 20% + Experience 30% + Skills 30% + Location 10% + Stability 10%)
- recommendation: "shortlist" if overall >= 6.5, "maybe" if 4-6.4, "reject" if below 4

Return ONLY valid JSON:
{
  "overall_score": 70,
  "recommendation": "shortlist",
  "education": {"score": 7, "max": 10, "summary": "Brief education assessment"},
  "experience": {"score": 5, "max": 10, "summary": "Brief experience assessment"},
  "skills": {"score": 8, "max": 10, "summary": "Brief skills assessment"},
  "location": {"score": 10, "max": 10, "summary": "Brief location assessment"},
  "stability": {"score": 6, "max": 10, "summary": "Brief stability assessment"},
  "reason": "Overall brief summary"
}`;

      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Custom': 'gemini' },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 800 }, max_tokens: 500, temperature: 0.1 })
      });

      const aiData = await aiRes.json();
      const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const result = JSON.parse(text.replace(/```json|```/g, '').trim());

      // Skip if below minimum threshold
      if (result.overall_score < 30) {
        console.log(`Skipping ${candidate.name} - score too low: ${result.overall_score}`);
        continue;
      }

      const existCheck = await fetch(`${supabaseUrl}/rest/v1/matches?candidate_id=eq.${candidate.id}&job_id=eq.${jobId}`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const existData = await existCheck.json();
      
      if (existData.length > 0) {
        // Update existing match with new score
        await fetch(`${supabaseUrl}/rest/v1/matches?candidate_id=eq.${candidate.id}&job_id=eq.${jobId}`, {
          method: 'PATCH',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            ai_score: result.overall_score,
            status: result.recommendation === 'shortlist' ? 'Shortlisted' : result.recommendation === 'reject' ? 'Rejected' : 'Applied',
            match_reason: JSON.stringify({ reason: result.reason, education: result.education, experience: result.experience, skills: result.skills, location: result.location, stability: result.stability })
          })
        });
        continue;
      }

      await fetch(`${supabaseUrl}/rest/v1/matches`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          job_id: jobId,
          ai_score: result.overall_score,
          status: result.recommendation === 'shortlist' ? 'Shortlisted' : result.recommendation === 'reject' ? 'Rejected' : 'Applied',
          match_reason: JSON.stringify({ reason: result.reason, education: result.education, experience: result.experience, skills: result.skills, location: result.location, stability: result.stability })
        })
      });
      results.push({ candidate: candidate.name, score: result.overall_score });
    } catch(e) { console.error('AI match error:', e.message); }
  }
  return res.status(200).json({ success: true, matched: results.length, results });
}
