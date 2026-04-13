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
      const params = new URLSearchParams({ title, company: company_name, location: location || 'India', experience: experience || '0', skills: skills || '' });
      const imageUrl = `https://zenrixi.com/api/job-poster?${params.toString()}`;

      const imgRes = await fetch(imageUrl);
      const pngBuffer = Buffer.from(await imgRes.arrayBuffer());

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