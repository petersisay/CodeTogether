import React, { useState } from 'react';
import { X, FileCode } from 'lucide-react';

export default function CreateFileModal({ isOpen, onClose, onFileCreated, activeRoom }) {
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!filename.trim()) return;

    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('codetogether_token');
      const res = await fetch(`${backendUrl}/api/rooms/${activeRoom}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ filename: filename.trim(), content: `// ${filename.trim()}\n` }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create file');
      }

      onFileCreated(filename.trim(), `// ${filename.trim()}\n`);
      setFilename('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ zIndex: 9999 }} className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl bg-[#091124] border border-blue-600/40 shadow-[0_0_50px_rgba(37,99,235,0.4)] overflow-hidden text-left">
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-900/40 bg-[#0A142A]">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Create New File</h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 flex items-center justify-center cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              File Name (e.g. <span className="text-sky-400">utils.js</span>, <span className="text-sky-400">Header.jsx</span>)
            </label>
            <input
              type="text"
              id="input-create-filename"
              required
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="filename.js"
              className="w-full px-3 py-1.5 rounded-xl bg-[#060B18] border border-blue-900/40 focus:border-blue-500 text-xs text-white placeholder-slate-500 outline-none font-code"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-create-file"
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
