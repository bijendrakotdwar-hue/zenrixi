export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { extractedText, fileName } = req.body;
  if (!extractedText || extractedText.trim().length < 30)
    return res.status(400).json({ error: 'No text provided' });

  try {
    // Gemini API (free)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a resume parser. Extract info and return ONLY valid JSON, no markdown, no backticks.
Schema: {"full_name":"","email":null,"phone":null,"location":null,"current_title":null,"experience_years":0,"skills":[],"education":null,"summary":null}

Resume text:
${extractedText.substring(0, 5000)}`
            }]
          }],
          generationConfig: { temperature: 0.1 }
        })
      }
    );

    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) return res.status(500).json({ error: 'Gemini error', details: geminiData });

    const raw = (geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}')
      .replace(/```json|```/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { return res.status(500).json({ error: 'Gemini JSON parse failed', raw }); }

    // Supabase via fetch
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
        full_name: parsed.full_name || 'Unknown',
        email: parsed.email || null,
        phone: parsed.phone || null,
        location: parsed.location || null,
        current_title: parsed.current_title || null,
        experience_years: parsed.experience_years || 0,
        skills: parsed.skills || [],
        education: parsed.education || null,
        summary: parsed.summary || null,
        resume_file_name: fileName,
        source: 'bulk_upload',
        status: 'active',
        created_at: new Date().toISOString()
      })
    });

    const dbData = await dbRes.json();
    if (!dbRes.ok) return res.status(500).json({ error: 'Supabase error', details: dbData });

    return res.status(200).json({ success: true, candidate: Array.isArray(dbData) ? dbData[0] : dbData });

  } catch (err) {
    console.error('bulk-upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
