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
    
    return res.status(200).json({ 
      success: true, 
      candidate: Array.isArray(dbData) ? dbData[0] : dbData,
      resume_url: resumeUrl,
      storage_status: uploadRes.status,
      storage_response: uploadData
    });

  } catch (err) {
    console.error('parse-and-save error:', err);
    return res.status(500).json({ error: err.message });
  }
}
