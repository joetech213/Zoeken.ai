// ZoKenAI.jsx
// A single-file React component that implements a simple, friendly AI chat UI
// built with Tailwind CSS. Integrates with `putter` (assumed installed as a module)
// for any lightweight audio/utility features. Minimal, non-complex, and ready
// to wire to your backend (e.g. /api/chat) or to OpenAI-like endpoints.

/*
Installation notes (run in your project):

1. Ensure Tailwind is set up (https://tailwindcss.com/docs/installation)
2. Install dependencies:
   npm install react putter
   -- or replace `putter` import with your own utils if the package name differs
3. Place this component in your app and render <ZoKenAI />

This component expects an API endpoint at POST /api/chat that accepts
{ message, history } and returns { reply }.
You can change `sendMessageToApi` to call OpenAI or any other model.
*/

import React, { useEffect, useRef, useState } from 'react';
import Putter from 'putter'; // optional: swap or remove if not available

export default function ZoKenAI() {
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('zoken_history') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesRef = useRef(null);
  const putter = useRef(null);

  useEffect(() => {
    // initialize putter if available (safe guard)
    try {
      putter.current = new Putter({ volume: 0.5 });
    } catch (e) {
      putter.current = null;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('zoken_history', JSON.stringify(history));
    // scroll to bottom
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [history]);

  async function sendMessageToApi(message, existingHistory) {
    // Minimal abstraction: posts to /api/chat. Replace with your provider call.
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: existingHistory }),
      });
      if (!res.ok) throw new Error('Network response not ok');
      const json = await res.json();
      return json.reply ?? 'Sorry, no reply.';
    } catch (e) {
      console.warn('API failed, falling back to a simple echo.', e);
      // fallback (local simple AI) — keep it friendly and deterministic
      return `Echo: ${message}`;
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { id: Date.now() + '-u', role: 'user', text: trimmed };
    const nextHistory = [...history, userMsg];
    setHistory(nextHistory);
    setInput('');
    setIsThinking(true);

    // Optimistic audio cue using putter if available
    if (putter.current && putter.current.playPing) {
      try { putter.current.playPing(); } catch (_) {}
    }

    const replyText = await sendMessageToApi(trimmed, nextHistory);

    const botMsg = { id: Date.now() + '-b', role: 'assistant', text: replyText };
    setHistory(prev => [...prev, botMsg]);
    setIsThinking(false);

    // Try a friendly TTS via putter if provided
    if (putter.current && putter.current.speak) {
      try { putter.current.speak(replyText); } catch (_) {}
    }
  }

  function handleClear() {
    setHistory([]);
    localStorage.removeItem('zoken_history');
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zoken_history.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-4">
        {/* Sidebar */}
        <aside className="md:col-span-1 p-4 border-r border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center font-bold">Z</div>
            <div>
              <div className="font-semibold">ZoKen</div>
              <div className="text-xs text-slate-400">Friendly AI assistant</div>
            </div>
          </div>

          <div className="space-y-2">
            <button onClick={() => { setInput('Explain like I am five:'); }} className="w-full text-left px-3 py-2 rounded hover:bg-slate-700/50">Prompt: Explain like I'm 5</button>
            <button onClick={() => { setInput('Give me a plan for the next 7 days to learn React.'); }} className="w-full text-left px-3 py-2 rounded hover:bg-slate-700/50">7-day React plan</button>
            <button onClick={() => { setInput('Create a short friendly reply for social media'); }} className="w-full text-left px-3 py-2 rounded hover:bg-slate-700/50">Social reply</button>
          </div>

          <div className="mt-6 text-xs text-slate-400">
            <div className="flex gap-2">
              <button onClick={handleExport} className="px-2 py-1 rounded bg-slate-700/50">Export</button>
              <button onClick={handleClear} className="px-2 py-1 rounded bg-rose-600/60">Clear</button>
            </div>
            <div className="mt-3">Local history: <span className="font-mono">{history.length}</span></div>
          </div>

          <div className="mt-6 text-xs text-slate-500">Built with React + Tailwind + Putter</div>
        </aside>

        {/* Main Chat Area */}
        <main className="md:col-span-3 flex flex-col">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="font-semibold">Conversation</div>
            <div className="text-sm text-slate-400">Simple · fast · local-first</div>
          </div>

          <div ref={messagesRef} className="flex-1 p-4 overflow-auto space-y-4 bg-gradient-to-b from-slate-800/30 to-transparent">
            {history.length === 0 && (
              <div className="text-center text-slate-400 mt-12">Say hi to ZoKen — type a message below.</div>
            )}

            {history.map(msg => (
              <div key={msg.id} className={`max-w-3xl mx-auto ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600/80' : 'bg-slate-700/60'}`}>
                  <div className="text-sm">{msg.text}</div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="max-w-3xl mx-auto text-left">
                <div className="inline-block px-4 py-2 rounded-2xl bg-slate-700/50 animate-pulse">ZoKen is thinking...</div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-slate-700 flex gap-3 items-center">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask ZoKen anything — try 'Help me write a short bio'"
              className="flex-1 bg-slate-800/60 placeholder:text-slate-500 px-4 py-3 rounded-lg focus:outline-none"
            />

            <button type="submit" disabled={isThinking} className="px-4 py-2 rounded-lg bg-indigo-500/90 hover:bg-indigo-600 disabled:opacity-50">Send</button>
            <button type="button" onClick={() => { setInput(''); }} className="px-3 py-2 rounded-lg bg-slate-700/40">Clear</button>
          </form>
        </main>
      </div>

      {/* lightweight floating credit */}
      <div className="fixed bottom-6 right-6 text-xs text-slate-400">ZoKen — React + Tailwind</div>
    </div>
  );
}
