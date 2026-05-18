'use client';

import { useEffect, useState } from 'react';

type Message = {
  id: string;
  author: 'applicant' | 'paula' | 'john' | 'oliver';
  text: string;
};

const authorNames = {
  applicant: 'You',
  paula: 'Paula Ferry',
  john: 'John Hazlewood',
  oliver: 'Oliver Belliard',
} as const;

export function ApplicantChat({ initialMessages, applicantId, canReplyAsHr = false, hrAuthor = 'paula' }: { initialMessages: Message[]; applicantId?: string; canReplyAsHr?: boolean; hrAuthor?: 'paula' | 'john' | 'oliver' }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
    setText('');
  }, [initialMessages, applicantId]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    const tempId = `local-${Date.now()}`;
    const optimisticAuthor = canReplyAsHr ? hrAuthor : 'applicant';
    const optimistic: Message = { id: tempId, author: optimisticAuthor, text: text.trim() };
    setMessages((current) => [...current, optimistic]);
    const submittedText = text.trim();
    setText('');
    setLoading(true);
    try {
      const res = await fetch('/api/applications/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: submittedText, applicantId }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        if (canReplyAsHr) {
          // Replace the optimistic HR message with the confirmed stored one
          setMessages((current) => current.map(m => m.id === tempId ? { id: data.reply.id, author: data.reply.author, text: data.reply.text } : m));
        } else {
          // Append Paula's auto-reply after the applicant's optimistic message
          setMessages((current) => [...current, { id: data.reply.id, author: data.reply.author, text: data.reply.text }]);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex max-h-[680px] flex-col gap-4 overflow-y-auto px-6 py-5">
        {messages.map((message) => {
          const isApplicant = message.author === 'applicant';
          return (
            <div key={message.id} className={`max-w-[88%] rounded-2xl px-4 py-3 ${isApplicant ? 'self-end bg-[#00349B] text-white' : 'bg-[#eef5ff] text-gray-900'}`}>
              <p className={`mb-1 text-xs font-semibold ${isApplicant ? 'text-white/80' : 'text-[#00349B]'}`}>{authorNames[message.author]}</p>
              <p className="text-sm leading-6">{message.text}</p>
            </div>
          );
        })}
      </div>
      <form onSubmit={sendMessage} className="border-t border-blue-50 px-6 py-4">
        <div className="flex gap-3">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={canReplyAsHr ? 'Reply to the applicant as HR' : 'Ask Paula about your current stage'} className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]" />
          <button disabled={loading} className="rounded-xl bg-[#00349B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Sending...' : canReplyAsHr ? 'Reply' : 'Send'}</button>
        </div>
      </form>
    </>
  );
}
