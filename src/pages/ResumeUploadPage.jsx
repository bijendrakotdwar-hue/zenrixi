import { useState, useRef, useCallback } from 'react';

async function extractTextFromFile(file) {
  if (file.name.toLowerCase().endsWith('.docx')) {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch(e) { return ''; }
  }
  if (file.name.toLowerCase().endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let rawStr = '';
      for (let i = 0; i < bytes.length; i++) rawStr += String.fromCharCode(bytes[i]);
      const matches = rawStr.match(/\(([^\\()]{2,500})\)/g) || [];
      const text1 = matches.map(m => m.slice(1,-1)).filter(t => /[a-zA-Z]{2,}/.test(t)).join(' ');
      const btBlocks = rawStr.match(/BT[\s\S]{1,500}?ET/g) || [];
      const text2 = btBlocks.join(' ').replace(/[^a-zA-Z0-9@.+\-\s]/g, ' ');
      return (text1 + ' ' + text2).replace(/\s+/g, ' ').trim();
    } catch(e) { return ''; }
  }
  return '';
}

const STATUS = { PENDING:'pending', UPLOADING:'uploading', SUCCESS:'success', ERROR:'error' };

export default function ResumeUploadPage() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = useCallback((newFiles) => {
    const accepted = Array.from(newFiles).filter(f => 
      f.name.endsWith('.pdf') || f.name.endsWith('.docx')
    );
    if (!accepted.length) return;
    setFiles(prev => [...prev, ...accepted.map(f => ({
      id: `${f.name}-${Date.now()}`,
      file: f, status: STATUS.PENDING, message: ''
    }))]);
  }, []);

  const updateFile = (id, patch) => setFiles(prev => prev.map(f => f.id === id ? {...f, ...patch} : f));

  const uploadFile = async (item) => {
    updateFile(item.id, { status: STATUS.UPLOADING, message: 'Uploading...' });
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(item.file);
      });
      const extractedText = await extractTextFromFile(item.file);
      const response = await fetch('/api/parse-and-save-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: item.file.name,
          fileData: base64,
          fileType: item.file.type,
          extractedText
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      updateFile(item.id, { status: STATUS.SUCCESS, message: 'Uploaded!' });
    } catch(e) {
      updateFile(item.id, { status: STATUS.ERROR, message: 'Failed - try again' });
    }
  };

  const processAll = async () => {
    const pending = files.filter(f => f.status === STATUS.PENDING);
    if (!pending.length) return;
    setIsProcessing(true);
    for (const item of pending) await uploadFile(item);
    setIsProcessing(false);
    setDone(true);
  };

  const pendingCount = files.filter(f => f.status === STATUS.PENDING).length;
  const successCount = files.filter(f => f.status === STATUS.SUCCESS).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2.5rem', maxWidth: '520px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.5px' }}>HR Portal</div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Submit Your Resume</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Thank You!</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>{successCount} resume{successCount !== 1 ? 's' : ''} submitted successfully.</p>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>Our team will review your profile and get in touch!</p>
            <button onClick={() => { setFiles([]); setDone(false); }}
              style={{ marginTop: '1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.75rem 2rem', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Upload More
            </button>
          </div>
        ) : (
          <>
            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
              style={{
                border: `2px dashed ${isDragging ? '#2563eb' : '#cbd5e1'}`,
                borderRadius: '1rem',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? '#eff6ff' : '#f8fafc',
                transition: 'all 0.2s',
                marginBottom: '1.5rem'
              }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
              <p style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px', marginBottom: '4px' }}>
                {isDragging ? 'Drop your resumes here!' : 'Click or drag resumes here'}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>PDF and DOCX files supported</p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx" style={{ display: 'none' }}
                onChange={(e) => addFiles(e.target.files)} />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div style={{ marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '0.75rem', fontSize: '13px',
                    background: item.status === 'success' ? '#f0fdf4' : item.status === 'error' ? '#fef2f2' : item.status === 'uploading' ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${item.status === 'success' ? '#bbf7d0' : item.status === 'error' ? '#fecaca' : item.status === 'uploading' ? '#bfdbfe' : '#e2e8f0'}`
                  }}>
                    <span>{item.status === 'success' ? '✅' : item.status === 'error' ? '❌' : item.status === 'uploading' ? '⏳' : '📎'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '500', color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.file.name}</p>
                      {item.message && <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>{item.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {files.length > 0 && (
              <button onClick={processAll} disabled={isProcessing || pendingCount === 0}
                style={{
                  width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none',
                  background: isProcessing || pendingCount === 0 ? '#e2e8f0' : '#2563eb',
                  color: isProcessing || pendingCount === 0 ? '#94a3b8' : 'white',
                  fontWeight: '700', fontSize: '15px', cursor: isProcessing || pendingCount === 0 ? 'not-allowed' : 'pointer'
                }}>
                {isProcessing ? '⏳ Uploading...' : `Submit ${pendingCount} Resume${pendingCount !== 1 ? 's' : ''}`}
              </button>
            )}

            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '1.5rem' }}>
              Your resume will be reviewed by our team
            </p>
          </>
        )}
      </div>
    </div>
  );
}
