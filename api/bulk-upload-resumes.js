import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { extractedText, fileName } = req.body;
  if (!extractedText || extractedText.trim().length < 30)
    return res.status(400).json({ error: 'No text provided' });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You are a resume parser. Return ONLY a valid JSON object, no markdown, no backticks, no explanation. Schema: {"full_name":"","email":null,"phone":null,"location":null,"current_title":null,"experience_years":0,"skills":[],"education":null,"summary":null}'
        },
        { role: 'user', content: extractedText.substring(0, 5000) }
      ]
    });

    const raw = (completion.choices[0].message.content || '{}').replace(/```json|```/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { return res.status(500).json({ error: 'OpenAI JSON parse failed', raw }); }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.from('candidates').insert({
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
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, candidate: data });

  } catch (err) {
    console.error('bulk-upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
