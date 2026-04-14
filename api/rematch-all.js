export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supaUrl = process.env.VITE_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const [candidatesRes, jobsRes] = await Promise.all([
      fetch(`${supaUrl}/rest/v1/candidates?select=*&order=created_at.desc`, {
        headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
      }),
      fetch(`${supaUrl}/rest/v1/jobs?status=eq.active&select=*`, {
        headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
      })
    ]);

    const candidates = await candidatesRes.json();
    const jobs = await jobsRes.json();

    let created = 0, skipped = 0, errors = 0;

    for (const job of jobs) {
      for (const candidate of candidates) {
        try {
          const existCheck = await fetch(`${supaUrl}/rest/v1/matches?candidate_id=eq.${candidate.id}&job_id=eq.${job.id}&select=id`, {
            headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
          });
          const existing = await existCheck.json();
          if (existing.length > 0) { skipped++; continue; }

          const prompt = `You are a strict HR expert. Score this candidate for the job.
Return ONLY valid JSON, no markdown, no backticks:
{"overall_score":70,"recommendation":"maybe","education":{"score":7,"max":10,"summary":"brief"},"experience":{"score":6,"max":10,"summary":"brief"},"skills":{"score":8,"max":10,"summary":"brief"},"location":{"score":5,"max":10,"summary":"brief"},"reason":"brief reason"}

CANDIDATE: ${candidate.name}, ${candidate.current_title||'Unknown'}, ${candidate.experience_years||0}yrs exp, skills: ${(candidate.parsed_skills||[]).join(', ')||'Not specified'}, education: ${candidate.education||'Unknown'}
JOB: ${job.title}, dept: ${job.department||'N/A'}, required skills: ${Array.isArray(job.required_skills)?job.required_skills.join(', '):job.required_skills||'N/A'}, min exp: ${job.min_experience||0}yrs

RULES: If field completely different, score below 30. shortlist if score>=65, reject if score<40, else maybe.`;

          const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
            })
          });

          const aiData = await aiRes.json();
          const text = (aiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}').replace(/```json|```/g,'').trim();
          let result;
          try { result = JSON.parse(text); } catch { result = { overall_score: 50, recommendation: 'maybe' }; }

          await fetch(`${supaUrl}/rest/v1/matches`, {
            method: 'POST',
            headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({
              candidate_id: candidate.id,
              job_id: job.id,
              ai_score: result.overall_score || 50,
              status: result.recommendation === 'shortlist' ? 'Shortlisted' : result.recommendation === 'reject' ? 'Rejected' : 'Applied',
              match_reason: JSON.stringify({ reason: result.reason, education: result.education, experience: result.experience, skills: result.skills, location: result.location })
            })
          });
          created++;

          await new Promise(r => setTimeout(r, 500));
        } catch(e) { errors++; }
      }
    }

    return res.status(200).json({ success: true, created, skipped, errors, candidates: candidates.length, jobs: jobs.length });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}