import { createRequire } from 'module';
const require = createRequire(import.meta.url);


export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileName, fileData, fileType } = req.body;
  if (!fileName) return res.status(400).json({ error: 'fileName required' });

  const supaUrl = process.env.VITE_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    let extractedText = req.body.extractedText || '';
    
    // Server-side extraction
    if (fileData) {
      const buffer = Buffer.from(fileData, 'base64');
      try {
        if (fileName.toLowerCase().endsWith('.docx')) {
          const mammoth = require('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        }
        // PDF: Gemini will handle directly via base64
      } catch(e) {
        console.error('Server extraction error:', e.message);
      }
    }

    console.log('Final text length:', extractedText.length);
    console.log('Text preview:', extractedText.substring(0, 200));

    // Upload to Storage
    let resumeUrl = null;
    if (fileData) {
      const buffer = Buffer.from(fileData, 'base64');
      const uniqueName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadRes = await fetch(`${supaUrl}/storage/v1/object/resumes/${uniqueName}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supaKey}`, 'apikey': supaKey, 'Content-Type': fileType || 'application/pdf', 'x-upsert': 'true' },
        body: buffer
      });
      if (uploadRes.ok) resumeUrl = `${supaUrl}/storage/v1/object/public/resumes/${uniqueName}`;
    }

    // Parse with Groq
    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const geminiParts = isPdf && fileData
      ? [
          { inline_data: { mime_type: 'application/pdf', data: fileData } },
          { text: `Extract resume info. Return ONLY valid JSON, no markdown, no backticks. NEVER fabricate data, use null if not found.
Schema: {"full_name":"","email":null,"phone":null,"location":null,"current_title":null,"experience_years":0,"skills":[],"education":null,"summary":null}` }
        ]
      : [{ text: `You are a strict resume parser. Extract ONLY information that ACTUALLY EXISTS in the resume text. NEVER fabricate data, use null if not found. Return ONLY valid JSON, no markdown, no backticks.
Schema: {"full_name":"","email":null,"phone":null,"location":null,"current_title":null,"experience_years":0,"skills":[],"education":null,"summary":null}

Resume text:
${extractedText.substring(0, 8000) || 'Resume filename: ' + fileName}` }];

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: geminiParts }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
      })
    });

    const geminiData = await geminiRes.json();
    console.log('Gemini response:', JSON.stringify(geminiData).substring(0, 500));
    const raw = (geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}').replace(/```json|```/g, '').trim();
    console.log('Raw parsed:', raw.substring(0, 200));
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { parsed = { full_name: fileName.replace(/\.pdf|\.docx/gi, ''), skills: [] }; }

    // Check if candidate with same email already exists
    if (parsed.email) {
      const checkRes = await fetch(`${supaUrl}/rest/v1/candidates?email=eq.${encodeURIComponent(parsed.email)}&select=id,name`, {
        headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
      });
      const existing = await checkRes.json();
      if (existing.length > 0) {
        console.log('Candidate already exists:', parsed.email);
        return res.status(200).json({ success: true, candidate: existing[0], skipped: true, reason: 'Email already exists' });
      }
    }

    // Save candidate
    const dbRes = await fetch(`${supaUrl}/rest/v1/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supaKey}`, 'apikey': supaKey, 'Prefer': 'return=representation' },
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

    // Auto AI matching
    try {
      const jobsRes = await fetch(`${supaUrl}/rest/v1/jobs?status=eq.active&select=*`, {
        headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
      });
      const jobs = await jobsRes.json();
      for (const job of jobs) {
        const existCheck = await fetch(`${supaUrl}/rest/v1/matches?candidate_id=eq.${candidate.id}&job_id=eq.${job.id}`, {
          headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
        });
        const existing = await existCheck.json();
        if (existing.length > 0) continue;
        const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant', temperature: 0.1, max_tokens: 300,
            messages: [{ role: 'user', content: `Score candidate for job. Return ONLY JSON: {"overall_score":75,"recommendation":"maybe","education":{"score":7,"max":10,"summary":"brief"},"experience":{"score":6,"max":10,"summary":"brief"},"skills":{"score":8,"max":10,"summary":"brief"},"location":{"score":5,"max":10,"summary":"brief"},"reason":"brief"}
CANDIDATE: ${candidate.name}, ${candidate.current_title||''}, ${candidate.experience_years||0}yrs, skills: ${(candidate.parsed_skills||[]).join(',')}, education: ${candidate.education||'unknown'}
JOB: ${job.title}, required: ${Array.isArray(job.required_skills)?job.required_skills.join(','):''}, min exp: ${job.min_experience||0}yrs` }]
          })
        });
        const aiData = await aiRes.json();
        const aiRaw = (aiData.choices?.[0]?.message?.content || '{}').replace(/```json|```/g,'').trim();
        let result;
        try { result = JSON.parse(aiRaw); } catch { result = {overall_score:60, recommendation:'maybe'}; }
        await fetch(`${supaUrl}/rest/v1/matches`, {
          method: 'POST',
          headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            candidate_id: candidate.id, job_id: job.id,
            ai_score: result.overall_score || 60,
            status: result.recommendation === 'shortlist' ? 'Shortlisted' : result.recommendation === 'reject' ? 'Rejected' : 'Applied',
            match_reason: JSON.stringify({ reason: result.reason, education: result.education, experience: result.experience, skills: result.skills, location: result.location })
          })
        });
      }
    } catch(e) { console.error('AI matching error:', e.message); }

    return res.status(200).json({ success: true, candidate });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
