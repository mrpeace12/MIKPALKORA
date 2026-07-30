import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, FileText, Code2, Loader2, RefreshCw } from 'lucide-react';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CodeFile {
  path: string;
  content: string;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingTxt, setDownloadingTxt] = useState(false);
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [fullText, setFullText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string>('COMBINED');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && files.length === 0) {
      fetchCodebaseData();
    }
  }, [isOpen]);

  const fetchCodebaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/export-codebase-raw');
      if (!res.ok) throw new Error('Failed to load codebase from server');
      const data = await res.json();
      setFiles(data.files || []);
      setFullText(data.fullTextDocument || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not fetch codebase content.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    try {
      const res = await fetch('/api/export-codebase');
      if (!res.ok) throw new Error('Server returned error for Word Document export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mikpal_complete_codebase.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error downloading Word Document: ' + err.message);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDownloadTxt = () => {
    setDownloadingTxt(true);
    try {
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mikpal_complete_codebase.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error downloading Text file: ' + err.message);
    } finally {
      setDownloadingTxt(false);
    }
  };

  const handleCopyCode = () => {
    const textToCopy = selectedFile === 'COMBINED' 
      ? fullText 
      : (files.find(f => f.path === selectedFile)?.content || '');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isOpen) return null;

  const currentContent = selectedFile === 'COMBINED'
    ? fullText
    : (files.find(f => f.path === selectedFile)?.content || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-teal-400">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Master Codebase Document Viewer</span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full">
                  {files.length} Files Included
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                View, copy, or download the full backend server and frontend code in a single document.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              disabled={loading || !currentContent}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Copy visible code to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadDocx}
              disabled={loading || downloadingDocx}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Download as Microsoft Word (.docx) document"
            >
              {downloadingDocx ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Download Word Doc (.docx)</span>
              <span className="sm:hidden">Word Doc</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              disabled={loading || downloadingTxt}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download as plain text (.txt) document"
            >
              {downloadingTxt ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Text Doc (.txt)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
          
          {/* File Selector Navigation Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50 p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0">
            <button
              onClick={() => setSelectedFile('COMBINED')}
              className={`px-3 py-2.5 rounded-xl text-left text-xs font-bold transition flex items-center justify-between shrink-0 cursor-pointer ${
                selectedFile === 'COMBINED'
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>All Files Combined</span>
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-mono">
                DOC
              </span>
            </button>

            <div className="hidden md:block my-2 border-t border-slate-800" />
            <span className="hidden md:block px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Individual Files:
            </span>

            {files.map((f) => (
              <button
                key={f.path}
                onClick={() => setSelectedFile(f.path)}
                className={`px-3 py-2 rounded-xl text-left text-xs font-medium font-mono truncate transition shrink-0 cursor-pointer ${
                  selectedFile === f.path
                    ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={f.path}
              >
                {f.path}
              </button>
            ))}
          </div>

          {/* Main Code View Container */}
          <div className="flex-1 relative overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                <p className="text-sm font-sans font-medium">Generating complete codebase document...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-rose-400 space-y-3">
                <p>{error}</p>
                <button
                  onClick={fetchCodebaseData}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold font-sans inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Fetching</span>
                </button>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-all selection:bg-teal-500/30 selection:text-white">
                <code>{currentContent}</code>
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/90 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span>
            Showing: <strong className="text-slate-200">{selectedFile === 'COMBINED' ? 'Full Combined Document' : selectedFile}</strong>
          </span>
          <span className="text-teal-400/90 font-medium hidden sm:inline">
            Tip: You can select and copy code directly from this window or download as .docx
          </span>
        </div>

      </div>
    </div>
  );
};

