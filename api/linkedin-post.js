import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, company_name, location, skills, experience } = req.body;
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgId = '113453944';
  if (!token) return res.status(500).json({ error: 'LinkedIn token not configured' });

  const text = `New Job Opening at ${company_name}!\n\nPosition: ${title}\nLocation: ${location || 'India'}\nSkills: ${skills}\nExperience: ${experience}+ years\n\nApply Now: https://zenrixi.com/jobs\n\n#hiring #jobs #zenrixi #recruitment`;

  try {
    let assetUrn = null;
    try {
      const skillList = (skills || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 5);
      const svg = await satori({
        type: 'div',
        props: {
          style: { width: 1200, height: 627, backgroundColor: '#1a3a8f', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', fontFamily: 'sans-serif' },
          children: [
            { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', gap: 12 }, children: [
              { type: 'div', props: { style: { color: '#f5a623', fontSize: 20, fontWeight: 700 }, children: (company_name || 'COMPANY').toUpperCase() } },
              { type: 'div', props: { style: { color: '#ffffff', fontSize: 52, fontWeight: 800 }, children: 'Hiring: ' + title } },
              { type: 'div', props: { style: { color: '#c8d8ff', fontSize: 24, marginTop: 8 }, children: (location || 'India') + '  |  ' + experience + '+ Years Experience' } },
            ]}},
            { type: 'div', props: { style: { display: 'flex', flexWrap: 'wrap', gap: 12 }, children: skillList.map(skill => ({ type: 'div', props: { style: { border: '1.5px solid #f5a623', borderRadius: 8, color: '#f5a623', fontSize: 18, padding: '8px 18px', fontWeight: 600 }, children: skill } })) }},
            { type: 'div', props: { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [
              { type: 'div', props: { style: { color: '#ffffff', fontSize: 20, fontWeight: 700 }, children: 'Apply: zenrixi.com/jobs' } },
              { type: 'div', props: { style: { backgroundColor: '#f5a623', borderRadius: 10, color: '#1a1a1a', fontSize: 18, fontWeight: 700, padding: '12px 28px' }, children: 'Apply Now' } },
            ]}},
          ]
        }
      }, { width: 1200, height: 627, fonts: [] });

      const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
      const pngBuffer = resvg.render().asPng();

      const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
        body: JSON.stringify({ registerUploadRequest: { recipes: ['urn:li:digitalmediaRecipe:feedshare-image'], owner: `urn:li:organization:${orgId}`, serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }] } })
      });
      const registerData = await registerRes.json();
      const uploadUrl = registerData?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
      assetUrn = registerData?.value?.asset;
      if (uploadUrl && assetUrn) {
        await fetch(uploadUrl, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'image/png' }, body: pngBuffer });
        console.log('Image uploaded:', assetUrn);
      }
    } catch (imgErr) { console.error('Image error:', imgErr.message); }

    const mediaContent = assetUrn
      ? { shareCommentary: { text }, shareMediaCategory: 'IMAGE', media: [{ status: 'READY', description: { text: title }, media: assetUrn, title: { text: title + ' at ' + company_name } }] }
      : { shareCommentary: { text }, shareMediaCategory: 'NONE' };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
      body: JSON.stringify({ author: `urn:li:organization:${orgId}`, lifecycleState: 'PUBLISHED', specificContent: { 'com.linkedin.ugc.ShareContent': mediaContent }, visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' } })
    });
    const data = await response.json();
    if (!response.ok) return res.status(400).json({ error: data });
    return res.status(200).json({ success: true, id: data.id, imageAttached: !!assetUrn });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}