import { useState, useRef, useCallback } from 'react';

const STATUS = { PENDING:'pending', UPLOADING:'uploading', SUCCESS:'success', ERROR:'error' };
const statusStyle = { pending:'bg-gray-100 text-gray-500', uploading:'bg-blue-50 text-blue-600', success:'bg-green-50 text-green-600', error:'bg-red-50 text-red-500' };
const statusIcon  = { pending:'⏳', uploading:'🔄', success:'✅', error:'❌' };

async function extractTextFromFile(file) {
  if (file.name.toLowerCase().endsWith('.docx')) {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log('DOCX extracted chars:', result.value.length);
      return result.value;
    } catch(e) {
      console.error('DOCX error:', e.message);
      return '';
    }
  }
  
  if (file.name.toLowerCase().endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Try text extraction first
      let rawStr = '';
      for (let i = 0; i < bytes.length; i++) {
        rawStr += String.fromCharCode(bytes[i]);
      }
      const matches = rawStr.match(/\(([^\\()]{2,500})\)/g) || [];
      const text1 = matches.map(m => m.slice(1, -1)).filter(t => /[a-zA-Z]{2,}/.test(t)).join(' ');
      const btBlocks = rawStr.match(/BT[\s\S]{1,500}?ET/g) || [];
      const text2 = btBlocks.join(' ').replace(/[^a-zA-Z0-9@.+\-\s]/g, ' ');
      const combined = (text1 + ' ' + text2).replace(/\s+/g, ' ').trim();
      
      if (combined.length > 100) {
        console.log('Text PDF extracted:', combined.length, 'chars');
        return combined;
      }
      
      // Scanned PDF - use Tesseract OCR
      console.log('Scanned PDF detected, using OCR...');
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      
      // Convert PDF to image using canvas
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
      const pdf = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      
      let ocrText = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        const { data: { text } } = await worker.recognize(canvas);
        ocrText += text + '\n';
      }
      await worker.terminate();
      console.log('OCR extracted:', ocrText.length, 'chars');
      return ocrText;
    } catch(e) {
      console.error('PDF error:', e.message);
      return '';
    }
  }
  return '';
}

async function uploadResume(file) {
  // Convert to base64 for storage upload
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Extract text client side
  let extractedText = '';
  try {
    extractedText = await extractTextFromFile(file);
  } catch(e) {
    console.error('Text extraction error:', e);
  }

  const res = await fetch('/api/parse-and-save-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      fileName: file.name, 
      fileData: base64, 
      fileType: file.type,
      extractedText: extractedText.substring(0, 5000)
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Upload failed');
  return json.candidate;
}

export default function BulkUploadCard({ onCandidatesAdded }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = useCallback((newFiles) => {
    const accepted = Array.from(newFiles).filter(f => f.name.endsWith('.pdf') || f.name.endsWith('.docx'));
    if (!accepted.length) return;
    setFiles(prev => [...prev, ...accepted.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f, status: STATUS.PENDING, message: ''
    }))]);
  }, []);

  const updateFile = (id, patch) => setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));

  const processAll = async () => {
    const pending = files.filter(f => f.status === STATUS.PENDING);
    if (!pending.length) return;
    setIsProcessing(true);
    let successCount = 0;
    for (const item of pending) {
      updateFile(item.id, { status: STATUS.UPLOADING, message: 'Extracting & parsing...' });
      try {
        const candidate = await uploadResume(item.file);
        updateFile(item.id, { status: STATUS.SUCCESS, message: `✅ Saved: ${candidate?.name || 'Candidate'}` });
        successCount++;
      } catch (err) {
        updateFile(item.id, { status: STATUS.ERROR, message: err.message });
      }
    }
    setIsProcessing(false);
    if (successCount > 0 && onCandidatesAdded) onCandidatesAdded(successCount);
  };

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));
  const clearAll = () => setFiles([]);
  const pendingCount = files.filter(f => f.status === STATUS.PENDING).length;
  const successCount = files.filter(f => f.status === STATUS.SUCCESS).length;
  const errorCount   = files.filter(f => f.status === STATUS.ERROR).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">📄</div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Bulk Resume Upload</h3>
            <p className="text-xs text-gray-400">PDF & DOCX • AI parsed & auto-saved</p>
          </div>
        </div>
        {files.length > 0 && (
          <div className="flex gap-1 text-xs text-gray-400">
            {successCount > 0 && <span className="text-green-600 font-medium">{successCount} saved</span>}
            {errorCount > 0   && <><span>•</span><span className="text-red-500">{errorCount} failed</span></>}
            {pendingCount > 0 && <><span>•</span><span>{pendingCount} pending</span></>}
          </div>
        )}
      </div>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all select-none ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:border-indigo-300'}`}
      >
        <div className="text-2xl mb-1">📂</div>
        <p className="text-sm font-medium text-gray-600">{isDragging ? 'Drop karo!' : 'Files drag करो या click करो'}</p>
        <p className="text-xs text-gray-400 mt-0.5">PDF aur DOCX supported</p>
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx" className="hidden"
          onChange={(e) => addFiles(e.target.files)} />
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
          {files.map(item => (
            <div key={item.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${statusStyle[item.status]}`}>
              <span className="text-base flex-shrink-0">{statusIcon[item.status]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.file.name}</p>
                {item.message && <p className="text-xs opacity-80 truncate">{item.message}</p>}
              </div>
              {item.status === STATUS.PENDING && !isProcessing && (
                <button onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                  className="text-gray-400 hover:text-red-500 font-bold">×</button>
              )}
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="flex gap-2 mt-3">
          <button onClick={processAll} disabled={isProcessing || pendingCount === 0}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${isProcessing || pendingCount === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'}`}>
            {isProcessing ? '⏳ Processing...' : `🚀 Upload ${pendingCount} Resume${pendingCount !== 1 ? 's' : ''}`}
          </button>
          {!isProcessing && (
            <button onClick={clearAll} className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50">Clear</button>
          )}
        </div>
      )}
    </div>
  );
}
