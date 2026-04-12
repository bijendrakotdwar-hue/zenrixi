export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileName, fileData, fileType } = req.body;
  if (!fileName || !fileData) return res.status(400).json({ error: 'fileName and fileData required' });

  const supaUrl = process.env.VITE_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Step 1: Upload file to Supabase Storage
    const fileBuffer = Buffer.from(fileData, 'base64');
    const uniqueName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const uploadRes = await fetch(`${supaUrl}/storage/v1/object/resumes/${uniqueName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supaKey}`,
        'apikey': supaKey,
        'Content-Type': fileType || 'application/pdf',
        'x-upsert': 'true'
      },
      body: fileBuffer
    });

    const uploadData = await uploadRes.json();
    console.log('Storage upload status:', uploadRes.status, JSON.stringify(uploadData));

    const resumeUrl = uploadRes.ok 
      ? `${supaUrl}/storage/v1/object/public/resumes/${uniqueName}`
      : null;

    if (!uploadRes.ok) console.error('Storage upload failed:', uploadData);

    // Step 2: Parse with Groq
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'You are a resume parser. Return ONLY a valid JSON object, no markdown, no backticks. Schema: {"full_name":"","email":null,"phone":null,"location":null,"current_title":null,"experience_years":0,"skills":[],"education":null,"summary":null}'
          },
          { 
            role: 'user', 
            content: `Parse this resume. Filename: ${fileName}. Content preview (base64): ${fileData.substring(0, 2000)}`
          }
        ]
      })
    });

    const groqData = await groqRes.json();
    const raw = (groqData.choices?.[0]?.message?.content || '{}').replace(/```json|```/g, '').trim();
    
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { parsed = { full_name: fileName.replace(/\.pdf|\.docx/gi, ''), skills: [] }; }

    // Step 3: Save to candidates table
    const dbRes = await fetch(`${supaUrl}/rest/v1/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supaKey}`,
        'apikey': supaKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: parsed.full_name || fileName.replace(/\.pdf|\.docx/gi, ''),
        email: parsed.email || null,
        phone: parsed.phone || null,
        current_title: parsed.current_title || null,
        experience_years: parsed.experience_years || 0,
        parsed_skills: parsed.skills || [],
        education: parsed.education || null,
        summary: parsed.summary || null,
        resume_file_name: fileName,
        resume_url: resumeUrl,
        source: 'bulk_upload',
        created_at: new Date().toISOString()
      })
    });

    const dbData = await dbRes.json();
    if (!dbRes.ok) return res.status(500).json({ error: 'Supabase error', details: dbData });
    
    const candidate = Array.isArray(dbData) ? dbData[0] : dbData;

    // Auto trigger AI matching for all active jobs
    try {
      const jobsRes = await fetch(`${supaUrl}/rest/v1/jobs?status=eq.active&select=*`, {
        headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
      });
      const jobs = await jobsRes.json();
      
      for (const job of jobs) {
        // Check if match already exists
        const existCheck = await fetch(`${supaUrl}/rest/v1/matches?candidate_id=eq.${candidate.id}&job_id=eq.${job.id}`, {
          headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
        });
        const existing = await existCheck.json();
        if (existing.length > 0) continue;

        // AI scoring via Groq
        const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            messages: [{
              role: 'user',
              content: `Score this candidate for the job. Return ONLY JSON: {"score":75,"recommendation":"maybe","reason":"Brief reason"}
CANDIDATE: ${candidate.name}, ${candidate.current_title||''}, ${candidate.experience_years||0}yrs, skills: ${(candidate.parsed_skills||[]).join(',')}
JOB: ${job.title}, required: ${Array.isArray(job.required_skills)?job.required_skills.join(','):''}, min exp: ${job.min_experience||0}yrs`
            }],
            max_tokens: 100
          })
        });
        const aiData = await aiRes.json();
        const raw = (aiData.choices?.[0]?.message?.content || '{"score":60,"recommendation":"maybe","reason":"Auto matched"}').replace(/```json|```/g,'').trim();
        let result;
        try { result = JSON.parse(raw); } catch { result = {score:60, recommendation:'maybe', reason:'Auto matched'}; }

        // Save match
        await fetch(`${supaUrl}/rest/v1/matches`, {
          method: 'POST',
          headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            candidate_id: candidate.id,
            job_id: job.id,
            ai_score: result.score || 60,
            status: 'Applied',
            match_reason: result.reason || 'Auto matched'
          })
        });
      }
    } catch(e) { console.error('AI matching error:', e.message); }

    return res.status(200).json({ success: true, candidate });

  } catch (err) {
    console.error('parse-and-save error:', err);
    return res.status(500).json({ error: err.message });
  }
}
