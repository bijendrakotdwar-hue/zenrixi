export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileName, fileData, fileType } = req.body;
  if (!fileName || !fileData) return res.status(400).json({ error: 'fileName and fileData required' });

  try {
    // Extract text server side
    const buffer = Buffer.from(fileData, 'base64');
    let extractedText = '';

    if (fileName.toLowerCase().endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileName.toLowerCase().endsWith('.pdf')) {
      // Use Groq vision or text extraction
      // For PDF - send base64 directly to Groq
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
              content: 'You are a resume parser. The user will provide base64 PDF data. Extract resume information and return ONLY a valid JSON object. Schema: {"full_name":"","email":null,"phone":null,"location":null,"current_title":null,"experience_years":0,"skills":[],"education":null,"summary":null}'
            },
            {
              role: 'user',
              content: `Parse this resume PDF (base64): ${fileData.substring(0, 3000)}`
            }
          ]
        })
      });

      const groqData = await groqRes.json();
      const raw = (groqData.choices?.[0]?.message?.content || '{}').replace(/```json|```/g, '').trim();

      let parsed;
      try { parsed = JSON.parse(raw); }
      catch (e) { parsed = { full_name: fileName.replace('.pdf',''), skills: [] }; }

      // Save to Supabase
      const supaUrl = process.env.VITE_SUPABASE_URL;
      const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
          source: 'bulk_upload',
          created_at: new Date().toISOString()
        })
      });

      const dbData = await dbRes.json();
      if (!dbRes.ok) return res.status(500).json({ error: dbData?.message || 'Supabase error', details: dbData });
      return res.status(200).json({ success: true, candidate: Array.isArray(dbData) ? dbData[0] : dbData });
    }

  } catch (err) {
    console.error('parse-and-save error:', err);
    return res.status(500).json({ error: err.message });
  }
}
