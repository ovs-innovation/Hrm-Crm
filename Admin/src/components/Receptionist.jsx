import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMessageSquare, FiX, FiSend, FiCpu, FiMic, FiMicOff, FiVolume2, FiVolumeX, FiSquare } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

// Premium Animated Realistic Female Corporate Avatar Component
const FemaleAvatar = ({ state }) => {
  // states: 'Idle' | 'Listening' | 'Thinking' | 'Speaking'
  const isListening = state === 'Listening';
  const isThinking = state === 'Thinking';
  const isSpeaking = state === 'Speaking';

  let glowClass = "from-brand-light/35 to-brand/10";
  if (isListening) glowClass = "from-red-500/40 to-red-600/15 animate-pulse";
  if (isSpeaking) glowClass = "from-emerald-500/40 to-emerald-600/15 animate-pulse";
  if (isThinking) glowClass = "from-blue-600/40 to-purple-600/15 animate-spin-slow";

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      {/* Background glow circle */}
      <div className={`absolute inset-1 rounded-full bg-gradient-to-tr ${glowClass} blur-lg transition-all duration-500`} />

      {/* Ripple effects for Listening / Speaking */}
      {isListening && (
        <>
          <div className="absolute inset-2 rounded-full border-2 border-red-500/50 animate-ping opacity-75" />
          <div className="absolute -inset-1 rounded-full border border-red-500/30 animate-ping opacity-40" style={{ animationDelay: '0.2s' }} />
        </>
      )}
      {isSpeaking && (
        <>
          <div className="absolute inset-2 rounded-full border-2 border-emerald-500/50 animate-ping opacity-75" />
          <div className="absolute -inset-1 rounded-full border border-emerald-500/30 animate-ping opacity-40" style={{ animationDelay: '0.2s' }} />
        </>
      )}

      {/* High-quality Digital Human Avatar Photo */}
      <div className={`relative w-28 h-28 rounded-full overflow-hidden border-2 shadow-2xl transition-all duration-500 ${
        isListening ? 'border-red-500 scale-105 ring-4 ring-red-500/20' :
        isSpeaking ? 'border-emerald-500 scale-105 ring-4 ring-emerald-500/20' :
        isThinking ? 'border-blue-500 scale-100 ring-4 ring-blue-500/20' :
        'border-brand/40 hover:border-brand scale-100'
      } ${isSpeaking ? 'animate-bounce-subtle' : 'animate-float-subtle'}`}>
        <img
          src="/ai-agent.png"
          alt="AI Receptionist Avatar"
          className="w-full h-full object-cover select-none"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop';
          }}
        />
      </div>

      {/* Active State Badge Overlay */}
      <div className={`absolute bottom-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg z-20 transition-all duration-300 border border-white/20 ${
        isListening ? 'bg-red-500 text-white animate-pulse' :
        isSpeaking ? 'bg-emerald-500 text-white' :
        isThinking ? 'bg-blue-500 text-white animate-spin-slow' :
        'bg-brand text-white'
      }`}>
        {isListening && '🎤'}
        {isSpeaking && '🔊'}
        {isThinking && '🧠'}
        {state === 'Idle' && '✨'}
      </div>
    </div>
  );
};

const Receptionist = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI receptionist. Tell me what you need, and I can execute tasks, draft emails, or redirect you instantly.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Conversational Voice Mode State
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState('Idle'); // 'Idle' | 'Listening' | 'Thinking' | 'Speaking'
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const pageContext = () => ({
    path: location.pathname,
    page: location.pathname,
    module: location.pathname.includes('/crm')
      ? 'CRM'
      : location.pathname.includes('/hrm')
        ? 'HRM'
        : location.pathname.includes('/workspace')
          ? 'Workspace'
          : 'Dashboard',
  });
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up speech synthesis
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Load browser speech voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
        setVoices(englishVoices.length > 0 ? englishVoices : availableVoices);
        
        const defaultVoice = englishVoices.find(v => v.name.includes('Natural') || v.name.includes('Google')) || 
                             englishVoices[0] || 
                             availableVoices[0];
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Handle Proactive AI Speech trigger on Dashboard load
  useEffect(() => {
    const handleProactiveSpeech = (e) => {
      const text = e.detail.text;
      setMessages((prev) => [...prev, { sender: 'ai', text }]);
      setIsOpen(true);
      if (voiceEnabled) {
        queueAndSpeakResponse(text);
      }
    };
    window.addEventListener('ai-proactive-speech', handleProactiveSpeech);
    return () => window.removeEventListener('ai-proactive-speech', handleProactiveSpeech);
  }, [voiceEnabled]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setVoiceState('Listening');
    };

    rec.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      if (!last?.isFinal) return;
      const transcript = last[0].transcript;
      if (transcript.trim()) {
        setInput(transcript);
        handleVoiceLoopSubmit(transcript);
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission denied.');
        stopVoiceSession();
      } else if (event.error === 'no-speech') {
        if (voiceMode) {
          restartRecognition();
        }
      } else {
        setVoiceState('Idle');
      }
    };

    rec.onend = () => {
      // Auto-restart listening if we are in voice mode and not currently thinking or speaking
      if (voiceMode && voiceState === 'Listening' && !isSpeakingRef.current) {
        try {
          rec.start();
        } catch (e) {}
      }
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [voiceMode, voiceState]);

  const restartRecognition = () => {
    if (!recognitionRef.current || !voiceMode || isSpeakingRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {}
    
    setTimeout(() => {
      try {
        if (voiceMode && !isSpeakingRef.current) {
          recognitionRef.current.start();
          setVoiceState('Listening');
        }
      } catch (e) {
        console.error('Failed to restart speech recognition:', e);
      }
    }, 150);
  };

  const startVoiceSession = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setVoiceMode(true);
      setVoiceState('Listening');
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;
      speechQueueRef.current = [];
      setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }
      }, 100);
      toast.success('Conversational Voice Mode active');
    } catch (err) {
      toast.error('Microphone permission required.');
    }
  };

  const stopVoiceSession = () => {
    setVoiceMode(false);
    setVoiceState('Idle');
    isSpeakingRef.current = false;
    speechQueueRef.current = [];
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const interruptSpeaking = () => {
    isSpeakingRef.current = false;
    speechQueueRef.current = [];
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('Listening');
    restartRecognition();
    toast.success('Interrupted AI response');
  };

  // Speaks sentences sequentially for low-latency streaming feel
  const speakNextSentence = () => {
    if (!window.speechSynthesis || speechQueueRef.current.length === 0) {
      isSpeakingRef.current = false;
      if (voiceMode) {
        setVoiceState('Listening');
        restartRecognition();
      } else {
        setVoiceState('Idle');
      }
      return;
    }

    isSpeakingRef.current = true;
    setVoiceState('Speaking');
    
    const sentence = speechQueueRef.current.shift();
    const cleanText = sentence.replace(/[*#`_\-]/g, '').trim();
    if (!cleanText) {
      speakNextSentence();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (selectedVoiceName) {
      const selected = voices.find(v => v.name === selectedVoiceName);
      if (selected) utterance.voice = selected;
    }

    utterance.onend = () => {
      speakNextSentence();
    };

    utterance.onerror = (e) => {
      console.error('Utterance error:', e);
      speakNextSentence();
    };

    window.speechSynthesis.speak(utterance);
  };

  const queueAndSpeakResponse = (fullText) => {
    // Split text into sentences using standard punctuation rules
    const sentences = fullText.match(/[^.!?]+[.!?]+(\s|$)/g) || [fullText];
    speechQueueRef.current = sentences.map(s => s.trim()).filter(Boolean);
    
    if (!isSpeakingRef.current) {
      speakNextSentence();
    }
  };

  const handleVoiceLoopSubmit = async (text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInput('');
    setLoading(true);
    setVoiceState('Thinking');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    try {
      const res = await api.post('/ai/agent/command', { userInput: text, context: pageContext() });
      const reply = res.data.chatResponse || res.data.chatReply || 'Executed command successfully.';
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      
      if (voiceEnabled) {
        queueAndSpeakResponse(reply);
      } else {
        setVoiceState('Listening');
        restartRecognition();
      }

      if (res.data.redirectUrl) {
        toast.success(`Redirecting you to ${res.data.redirectUrl}...`);
        setTimeout(() => {
          navigate(res.data.redirectUrl);
          setIsOpen(false);
          stopVoiceSession();
        }, 1200);
      }
    } catch (err) {
      toast.error('Receptionist error');
      setVoiceState('Listening');
      restartRecognition();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/agent/command', { userInput: userText, context: pageContext() });
      const reply = res.data.chatResponse || res.data.chatReply || 'Executed command successfully.';
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      
      if (voiceEnabled) {
        queueAndSpeakResponse(reply);
      }

      if (res.data.redirectUrl) {
        toast.success(`Redirecting you to ${res.data.redirectUrl}...`);
        setTimeout(() => {
          navigate(res.data.redirectUrl);
          setIsOpen(false);
          stopVoiceSession();
        }, 1200);
      }
    } catch (err) {
      toast.error('Receptionist error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[990] flex flex-col items-end">
      {/* CSS Animation definitions injected dynamically */}
      <style>{`
        @keyframes float-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0) scale(1.05); }
          50% { transform: translateY(-3px) scale(1.07); }
        }
        .animate-float-subtle {
          animation: float-subtle 3s infinite ease-in-out;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1.2s infinite ease-in-out;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>

      {/* Expanded chat window */}
      {isOpen && (
        <div className="mb-4 w-90 h-[480px] rounded-lg border border-line bg-surface shadow-xl flex flex-col overflow-hidden animate-fade-in text-ink text-[13px]">
          {/* Header */}
          <div className="bg-brand px-4 py-3 flex justify-between items-center text-white">
            <span className="font-bold flex items-center gap-1.5">
              <FiCpu className="h-4.5 w-4.5 animate-pulse" /> Vastora AI Assistant
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (voiceEnabled && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setVoiceEnabled(!voiceEnabled);
                  toast.success(voiceEnabled ? 'Voice responses muted' : 'Voice responses active');
                }}
                className="text-white/85 hover:text-white transition-colors"
                title={voiceEnabled ? 'Mute AI speech' : 'Unmute AI speech'}
              >
                {voiceEnabled ? <FiVolume2 className="h-4.5 w-4.5" /> : <FiVolumeX className="h-4.5 w-4.5" />}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white/80 hover:text-white text-xs font-semibold px-2 py-0.5 rounded border border-white/20 hover:border-white/50 transition-all"
              >
                Voice options
              </button>
              <button
                onClick={() => {
                  stopVoiceSession();
                  setIsOpen(false);
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <FiX className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Voice Settings Dropdown */}
          {showSettings && (
            <div className="bg-soft border-b border-line p-3 text-xs space-y-2 animate-fade-in z-20">
              <div className="flex justify-between items-center">
                <span className="font-medium text-ink">Choose Accent / Voice:</span>
                <button onClick={() => setShowSettings(false)} className="text-muted hover:text-ink">Close</button>
              </div>
              <select
                value={selectedVoiceName}
                onChange={(e) => setSelectedVoiceName(e.target.value)}
                className="w-full rounded border border-line bg-surface p-1.5 text-xs text-ink outline-none"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Continuous Voice Session Panel */}
          {voiceMode ? (
            <div className="flex-1 flex flex-col items-center justify-between p-6 bg-brand-xlight/10 text-center">
              {/* Top status */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand">Conversational Mode</h4>
                <div className="text-sm font-semibold text-muted">
                  {voiceState === 'Listening' && '🎤 Listening to you...'}
                  {voiceState === 'Thinking' && '🧠 Processing...'}
                  {voiceState === 'Speaking' && '🔊 Speaking response...'}
                  {voiceState === 'Idle' && '💤 Idle...'}
                </div>
              </div>

              {/* Face Avatar */}
              <FemaleAvatar state={voiceState} />

              {/* Siri / ChatGPT Voice Waveform Visualizer */}
              <div className="flex items-center justify-center gap-1.5 h-8 w-full">
                {voiceState === 'Listening' ? (
                  <>
                    <div className="w-1 bg-brand rounded-full animate-bounce" style={{ height: '14px', animationDelay: '0.1s', animationDuration: '0.8s' }}></div>
                    <div className="w-1 bg-brand rounded-full animate-bounce" style={{ height: '28px', animationDelay: '0.2s', animationDuration: '0.8s' }}></div>
                    <div className="w-1 bg-brand rounded-full animate-bounce" style={{ height: '20px', animationDelay: '0.3s', animationDuration: '0.8s' }}></div>
                    <div className="w-1 bg-brand rounded-full animate-bounce" style={{ height: '32px', animationDelay: '0.4s', animationDuration: '0.8s' }}></div>
                    <div className="w-1 bg-brand rounded-full animate-bounce" style={{ height: '12px', animationDelay: '0.5s', animationDuration: '0.8s' }}></div>
                  </>
                ) : voiceState === 'Speaking' ? (
                  <>
                    <div className="w-1 bg-success rounded-full animate-bounce" style={{ height: '10px', animationDelay: '0.1s', animationDuration: '0.6s' }}></div>
                    <div className="w-1 bg-success rounded-full animate-bounce" style={{ height: '20px', animationDelay: '0.2s', animationDuration: '0.6s' }}></div>
                    <div className="w-1 bg-success rounded-full animate-bounce" style={{ height: '24px', animationDelay: '0.3s', animationDuration: '0.6s' }}></div>
                    <div className="w-1 bg-success rounded-full animate-bounce" style={{ height: '14px', animationDelay: '0.4s', animationDuration: '0.6s' }}></div>
                    <div className="w-1 bg-success rounded-full animate-bounce" style={{ height: '8px', animationDelay: '0.5s', animationDuration: '0.6s' }}></div>
                  </>
                ) : voiceState === 'Thinking' ? (
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                ) : (
                  <div className="h-1 w-12 bg-line rounded-full"></div>
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3 mt-4">
                {voiceState === 'Speaking' && (
                  <button
                    onClick={interruptSpeaking}
                    className="bg-warning text-white font-semibold text-xs px-4 py-2 rounded-full hover:bg-warning/90 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <FiSquare className="h-3.5 w-3.5" /> Interrupt
                  </button>
                )}
                <button
                  onClick={stopVoiceSession}
                  className="bg-danger text-white font-semibold text-xs px-5 py-2.5 rounded-full hover:bg-danger/90 active:scale-95 transition-all flex items-center gap-1.5 shadow"
                >
                  <FiMicOff className="h-4 w-4" /> Stop Voice Mode
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col bg-soft/10">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded p-2.5 leading-relaxed text-[12px] border ${
                      m.sender === 'user'
                        ? 'bg-brand text-white border-brand self-end rounded-tr-none'
                        : 'bg-surface border-line text-ink self-start rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted self-start bg-soft border border-line p-2 rounded">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand"></div>
                    Processing request...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick task action chips */}
              <div className="px-3 py-1.5 flex gap-1 border-t border-line overflow-x-auto max-w-full bg-soft/20">
                {[
                  'Create lead',
                  'Check attendance',
                  'Approve leave'
                ].map(chip => (
                  <button
                    key={chip}
                    onClick={() => setInput(chip)}
                    className="bg-surface border border-line hover:border-brand px-2 py-0.5 rounded text-[10px] text-muted hover:text-ink transition-all whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input form */}
              <form onSubmit={handleSubmit} className="p-3 border-t border-line bg-surface flex gap-2 items-center">
                <button
                  type="button"
                  onClick={startVoiceSession}
                  className="rounded-full p-2 bg-soft hover:bg-brand hover:text-white text-muted hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                  title="Start Conversational Voice Mode"
                >
                  <FiMic className="h-4.5 w-4.5 animate-pulse" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message or press mic..."
                  className="app-input h-9 w-full text-[13px]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-brand px-3 h-9 text-white flex items-center justify-center hover:bg-brand/90 transition-colors disabled:opacity-50"
                >
                  <FiSend className="h-3.5 w-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Receptionist Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="rounded-full bg-brand p-3.5 shadow-lg text-white hover:bg-brand/90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-white/10"
      >
        <FiMessageSquare className="h-5.5 w-5.5" />
      </button>
    </div>
  );
};

export default Receptionist;
