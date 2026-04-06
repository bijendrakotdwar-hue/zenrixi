import os, json, time
import fitz  # pymupdf
from docx import Document
from openai import OpenAI
from supabase import create_client

# Config
SUPABASE_URL = "https://nurlnqzmiyryfviuujsq.supabase.co"
SUPABASE_KEY = "sb_publishable_WTdQ9aVR43R1weeWFHgTBQ_CdUkjR09"
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
RESUME_FOLDER = "./resumes"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
openai = OpenAI(api_key=OPENAI_KEY)

def extract_text_pdf(path):
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)

def extract_text_docx(path):
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs)

def extract_text(path):
    ext = path.lower().split('.')[-1]
    if ext == 'pdf': return extract_text_pdf(path)
    if ext in ['docx','doc']: return extract_text_docx(path)
    return ""

def parse_with_ai(text, filename):
    prompt = f"""Extract candidate info from this resume. Return ONLY valid JSON.
{{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number or null",
  "job_title": "current or desired job title",
  "experience_years": 0,
  "skills": ["skill1", "skill2"],
  "location": "city or null",
  "summary": "2-3 line summary"
}}

Resume:
{text[:3000]}"""
    
    res = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500
    )
    raw = res.choices[0].message.content.strip()
    raw = raw.replace("```json","").replace("```","").strip()
    return json.loads(raw)

def insert_candidate(data, filename):
    # Check duplicate by email
    if data.get('email'):
        existing = supabase.table('candidates').select('id').eq('email', data['email']).execute()
        if existing.data:
            print(f"  ⚠️  Duplicate skipped: {data['email']}")
            return False
    
    supabase.table('candidates').insert({
        'name': data.get('name', filename),
        'email': data.get('email', f"unknown_{filename}@import.com"),
        'phone': data.get('phone'),
        'job_title': data.get('job_title'),
        'experience_years': data.get('experience_years', 0),
        'parsed_skills': data.get('skills', []),
        'location': data.get('location'),
        'summary': data.get('summary'),
        'password': 'imported123',
        'source': 'bulk_import'
    }).execute()
    return True

def main():
    files = [f for f in os.listdir(RESUME_FOLDER) 
             if f.lower().endswith(('.pdf','.docx','.doc'))]
    
    print(f"Found {len(files)} resumes\n")
    success, failed, skipped = 0, 0, 0
    
    for i, filename in enumerate(files, 1):
        path = os.path.join(RESUME_FOLDER, filename)
        print(f"[{i}/{len(files)}] {filename}")
        
        try:
            text = extract_text(path)
            if not text.strip():
                print(f"  ❌ Empty text")
                failed += 1
                continue
            
            data = parse_with_ai(text, filename)
            inserted = insert_candidate(data, filename)
            
            if inserted:
                print(f"  ✅ {data.get('name')} | {data.get('email')} | {data.get('experience_years')}yr")
                success += 1
            else:
                skipped += 1
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
            failed += 1
        
        time.sleep(0.5)  # Rate limit
    
    print(f"\n{'='*40}")
    print(f"✅ Imported: {success}")
    print(f"⚠️  Skipped:  {skipped}")
    print(f"❌ Failed:   {failed}")

if __name__ == "__main__":
    main()
