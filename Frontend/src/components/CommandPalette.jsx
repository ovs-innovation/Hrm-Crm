import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCommand, FiSearch, FiCpu, FiCornerDownLeft, FiX } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const paletteRef = useRef(null);

  // Global key listener for Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResult(null);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCommandSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/ai/agent/command', { userInput: query });
      setResult(res.data);
      toast.success('AI executed action!');
      
      // Auto redirect if returned by agent
      if (res.data.redirectUrl) {
        setTimeout(() => {
          navigate(res.data.redirectUrl);
          setIsOpen(false);
        }, 1500);
      }
    } catch (err) {
      toast.error('Agent execution failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm p-4 animate-fade-in">
      <div 
        ref={paletteRef} 
        className="w-full max-w-2xl rounded border border-line bg-surface p-4 shadow-xl relative"
      >
        <div className="flex justify-between items-center border-b border-line pb-3 mb-3">
          <span className="text-[13px] font-bold text-muted flex items-center gap-1.5">
            <FiCommand className="h-3.5 w-3.5" /> Vastora AI Command Palette
          </span>
          <button onClick={() => setIsOpen(false)} className="text-muted hover:text-ink transition-colors">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleCommandSubmit} className="flex gap-2 relative">
          <FiSearch className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command... (e.g. 'How many leave limits', 'Ask policy details', 'Today's attendance')"
            className="app-input h-10 w-full pl-9 pr-4 text-[13px] focus:outline-none"
          />
          <button 
            type="submit" 
            className="btn-primary h-10 px-4 text-[13px] font-semibold flex items-center gap-1"
          >
            Run <FiCornerDownLeft className="h-3 w-3" />
          </button>
        </form>

        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-muted mt-4 justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
            Analyzing parameters and selecting execution tool...
          </div>
        )}

        {result && (
          <div className="mt-4 border-t border-line/60 pt-4 space-y-3 text-[13px]">
            <div className="flex items-center gap-2">
              <FiCpu className="text-brand h-4.5 w-4.5" />
              <span className="font-bold text-ink">Execution Result</span>
            </div>
            
            <p className="text-ink bg-soft border border-line rounded p-3 leading-relaxed font-semibold">
              {result.chatResponse}
            </p>

            <div className="grid grid-cols-2 gap-2 text-muted text-[12px] font-medium pt-2">
              <div>
                <strong>Selected Tool:</strong> {result.parsedCommand?.toolName || 'General Chat'}
              </div>
              <div>
                <strong>Redirect URL:</strong> {result.redirectUrl || 'Stay on page'}
              </div>
            </div>

            {result.autofillData && (
              <div className="rounded border border-line bg-soft/40 p-3 space-y-1.5">
                <span className="text-[11px] text-brand uppercase font-bold">Prefilled form parameters detected</span>
                <pre className="font-mono text-[11px] text-muted overflow-x-auto p-1.5 bg-soft rounded border border-line">
                  {JSON.stringify(result.autofillData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 border-t border-line pt-3 flex justify-between items-center text-[11px] text-muted font-semibold">
          <span>Type <kbd className="bg-soft px-1 rounded border border-line">Esc</kbd> to exit</span>
          <span>Press <kbd className="bg-soft px-1 rounded border border-line">Ctrl + K</kbd> to toggle anywhere</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
