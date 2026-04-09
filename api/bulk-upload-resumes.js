import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileName, fileData, fileType } = req.body;
  if (!fileName || !fileData) return res.status(400).json({ error: 'fileName and fileData required' });

  try {
    const buffer = Buffer.from(fileData, 'base64');
    let extractedText = '';
    const lowerName = fileName.toLowerCase();

    if (lowerName.endsWith('.pdf')) {
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text;
    } else if (lowerName.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type: ' + fileName });
    }

    if (!extractedText || extractedText.trim().length < 30)
      return res.status(422).json({ error: 'Could not extract readable text' });

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

    if (error) return res.status(500).json({ error: error.message, details: error });
    return res.status(200).json({ success: true, candidate: data });

  } catch (err) {
    console.error('bulk-upload error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
