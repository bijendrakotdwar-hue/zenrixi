import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Job Opening';
  const company = searchParams.get('company') || 'Company';
  const location = searchParams.get('location') || 'India';
  const experience = searchParams.get('experience') || '0';
  const skills = (searchParams.get('skills') || '').split(',').slice(0, 4);

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: { width: '100%', height: '100%', backgroundColor: '#1a3a8f', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', fontFamily: 'sans-serif' },
        children: [
          { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: [
            { type: 'div', props: { style: { color: '#f5a623', fontSize: '20px', fontWeight: 700 }, children: company.toUpperCase() } },
            { type: 'div', props: { style: { color: '#ffffff', fontSize: '52px', fontWeight: 800, lineHeight: 1.1 }, children: 'Hiring: ' + title } },
            { type: 'div', props: { style: { color: '#c8d8ff', fontSize: '22px', marginTop: '8px' }, children: location + '  |  ' + experience + '+ Years Experience' } },
          ]}},
          { type: 'div', props: { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' }, children: skills.filter(s => s.trim()).map(skill => ({
            type: 'div', props: { style: { border: '1.5px solid #f5a623', borderRadius: '8px', color: '#f5a623', fontSize: '18px', padding: '8px 18px', fontWeight: 600 }, children: skill.trim() }
          }))}},
          { type: 'div', props: { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [
            { type: 'div', props: { style: { color: '#ffffff', fontSize: '20px', fontWeight: 700 }, children: 'Apply: zenrixi.com/jobs' } },
            { type: 'div', props: { style: { backgroundColor: '#f5a623', borderRadius: '10px', color: '#1a1a1a', fontSize: '18px', fontWeight: 700, padding: '12px 28px' }, children: 'Apply Now' } },
          ]}},
        ]
      }
    },
    { width: 1200, height: 627 }
  );
}