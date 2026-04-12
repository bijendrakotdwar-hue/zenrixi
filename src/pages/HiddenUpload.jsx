import { useState, useRef } from "react";

export default function HiddenUpload() {
  const [mode, setMode] = useState("single");
  const [singleFile, setSingleFile] = useState(null);
  const [singleStatus, setSingleStatus] = useState(null);
  const [singleMsg, setSingleMsg] = useState("");
  const singleInputRef = useRef();
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);
  const bulkInputRef = useRef();

  const handleSingleUpload = async () => {
    if (!singleFile) return;
    setSingleStatus("uploading"); setSingleMsg("");
    const formData = new FormData();
    formData.append("resume", singleFile);
    try {
      const res = await fetch("/api/parse-and-save-resume", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) { setSingleStatus("success"); setSingleMsg(data.message || "Uploaded!"); setSingleFile(null); if (singleInputRef.current) singleInputRef.current.value = ""; }
      else { setSingleStatus("error"); setSingleMsg(data.error || "Upload failed."); }
    } catch { setSingleStatus("error"); setSingleMsg("Network error."); }
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const handleBulkUpload = async () => {
    if (!bulkFiles.length) return;
    setBulkRunning(true); setBulkDone(false); setBulkResults([]);
    const results = [];
    for (let i = 0; i < bulkFiles.length; i++) {
      const file = bulkFiles[i];
      const formData = new FormData();
      formData.append("resume", file);
      results.push({ name: file.name, status: "uploading" });
      setBulkResults([...results]);
      try {
        const res = await fetch("/api/parse-and-save-resume", { method: "POST", body: formData });
        const data = await res.json();
        results[i] = res.ok ? { name: file.name, status: "success" } : { name: file.name, status: "error" };
      } catch { results[i] = { name: file.name, status: "error" }; }
      setBulkResults([...results]);
      if (i < bulkFiles.length - 1) await sleep(1200);
    }
    setBulkRunning(false); setBulkDone(true);
  };

  const resetBulk = () => { setBulkFiles([]); setBulkResults([]); setBulkDone(false); if (bulkInputRef.current) bulkInputRef.current.value = ""; };
  const successCount = bulkResults.filter((r) => r.status === "success").length;
  const errorCount = bulkResults.filter((r) => r.status === "error").length;
  const progress = bulkFiles.length > 0 ? Math.round((bulkResults.length / bulkFiles.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Resume Upload</h1>
          <p className="text-gray-400 text-sm mt-1">PDF or DOCX files only</p>
        </div>

        <div className="flex bg-gray-900 rounded-xl p-1 mb-6 border border-gray-800">
          <button onClick={() => setMode("single")} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${mode === "single" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-white"}`}>Single Upload</button>
          <button onClick={() => setMode("bulk")} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${mode === "bulk" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-white"}`}>Bulk Upload</button>
        </div>

        {mode === "single" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <label htmlFor="single-file" className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-10 px-4 cursor-pointer transition-colors duration-200 ${singleFile ? "border-indigo-500 bg-indigo-950/30" : "border-gray-700 hover:border-indigo-500 hover:bg-indigo-950/10"}`}>
              <svg className="w-10 h-10 text-indigo-400 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.032A4.5 4.5 0 0117.25 19.5H6.75z" /></svg>
              {singleFile ? <div className="text-center"><p className="text-indigo-300 font-medium text-sm">{singleFile.name}</p><p className="text-gray-500 text-xs mt-1">{(singleFile.size/1024).toFixed(1)} KB</p></div>
              : <div className="text-center"><p className="text-gray-300 text-sm font-medium">Click to select resume</p><p className="text-gray-500 text-xs mt-1">PDF or DOCX</p></div>}
              <input id="single-file" ref={singleInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => { setSingleFile(e.target.files[0]||null); setSingleStatus(null); setSingleMsg(""); }} />
            </label>
            {singleStatus==="success" && <div className="mt-4 flex gap-2 bg-green-950/40 border border-green-800 rounded-xl p-3"><svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p className="text-green-300 text-sm">{singleMsg}</p></div>}
            {singleStatus==="error" && <div className="mt-4 flex gap-2 bg-red-950/40 border border-red-800 rounded-xl p-3"><svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg><p className="text-red-300 text-sm">{singleMsg}</p></div>}
            <button onClick={handleSingleUpload} disabled={!singleFile||singleStatus==="uploading"} className="mt-5 w-full py-3 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {singleStatus==="uploading"?<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Uploading...</>:"Upload Resume"}
            </button>
          </div>
        )}

        {mode === "bulk" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            {!bulkRunning && !bulkDone && (
              <>
                <label htmlFor="bulk-files" className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-10 px-4 cursor-pointer transition-colors duration-200 ${bulkFiles.length?"border-indigo-500 bg-indigo-950/30":"border-gray-700 hover:border-indigo-500 hover:bg-indigo-950/10"}`}>
                  <svg className="w-10 h-10 text-indigo-400 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
                  {bulkFiles.length>0?<div className="text-center"><p className="text-indigo-300 font-medium text-sm">{bulkFiles.length} file{bulkFiles.length>1?"s":""} selected</p><p className="text-gray-500 text-xs mt-1">Click to change</p></div>
                  :<div className="text-center"><p className="text-gray-300 text-sm font-medium">Click to select multiple resumes</p><p className="text-gray-500 text-xs mt-1">PDF or DOCX — multiple files</p></div>}
                  <input id="bulk-files" ref={bulkInputRef} type="file" accept=".pdf,.docx" multiple className="hidden" onChange={(e)=>{setBulkFiles(Array.from(e.target.files));setBulkResults([]);setBulkDone(false);}} />
                </label>
                {bulkFiles.length>0 && <div className="mt-4 max-h-40 overflow-y-auto space-y-1.5">{bulkFiles.map((f,i)=><div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2"><span className="text-gray-300 text-xs truncate flex-1">{f.name}</span><span className="text-gray-500 text-xs">{(f.size/1024).toFixed(0)}KB</span></div>)}</div>}
                <button onClick={handleBulkUpload} disabled={!bulkFiles.length} className="mt-5 w-full py-3 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed">
                  Upload {bulkFiles.length>0?`${bulkFiles.length} Resume${bulkFiles.length>1?"s":""}`:"Resumes"}
                </button>
              </>
            )}
            {(bulkRunning||bulkDone) && (
              <div>
                {bulkRunning && <div className="mb-5"><div className="flex justify-between text-xs text-gray-400 mb-1.5"><span>Processing {bulkResults.length} / {bulkFiles.length}</span><span>{progress}%</span></div><div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{width:`${progress}%`}}/></div></div>}
                {bulkDone && <div className="mb-5 grid grid-cols-2 gap-3"><div className="bg-green-950/40 border border-green-800 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-green-400">{successCount}</p><p className="text-xs text-green-300 mt-0.5">Successful</p></div><div className="bg-red-950/40 border border-red-800 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-red-400">{errorCount}</p><p className="text-xs text-red-300 mt-0.5">Failed</p></div></div>}
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {bulkResults.map((r,i)=><div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${r.status==="success"?"bg-green-950/30 border border-green-900":r.status==="error"?"bg-red-950/30 border border-red-900":"bg-gray-800 border border-gray-700"}`}>
                    {r.status==="uploading"&&<svg className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                    {r.status==="success"&&<svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                    {r.status==="error"&&<svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>}
                    <span className="truncate flex-1 text-gray-300">{r.name}</span>
                  </div>)}
                </div>
                {bulkDone && <button onClick={resetBulk} className="mt-5 w-full py-3 rounded-xl font-semibold text-sm bg-gray-800 hover:bg-gray-700 text-white transition-all duration-200">Upload More Resumes</button>}
              </div>
            )}
          </div>
        )}
        <p className="text-center text-gray-600 text-xs mt-6">Supported formats: PDF, DOCX · Max 10MB per file</p>
      </div>
    </div>
  );
}
