'use client';

import { useEffect, useState } from 'react';

type Message = {
  id: string;
  author: 'applicant' | 'paula' | 'john' | 'oliver';
  text: string;
  createdAt?: string;
};

const authorNames = {
  applicant: 'You',
  paula: 'Paula Ferry',
  john: 'John Hazlewood',
  oliver: 'Oliver Belliard',
} as const;

function isSameDay(a: Date, b: Date) {
  return a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate();
}

function formatDateSeparator(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);
  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  if (date.getUTCFullYear() === now.getUTCFullYear()) {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const h = String(date.getUTCHours()).padStart(2, '0');
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

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
    const optimistic: Message = { id: tempId, author: optimisticAuthor, text: text.trim(), createdAt: new Date().toISOString() };
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
          setMessages((current) => current.map(m => m.id === tempId ? { id: data.reply.id, author: data.reply.author, text: data.reply.text, createdAt: data.reply.createdAt ?? new Date().toISOString() } : m));
        } else {
          setMessages((current) => [...current, { id: data.reply.id, author: data.reply.author, text: data.reply.text, createdAt: data.reply.createdAt ?? new Date().toISOString() }]);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // Build render list: inject date separators between messages from different days
  const items: ({ type: 'separator'; label: string; key: string } | { type: 'message'; message: Message })[] = [];
  let lastDate = '';
  for (const message of messages) {
    if (message.createdAt) {
      const d = new Date(message.createdAt);
      const dayKey = Number.isNaN(d.getTime()) ? '' : `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      if (dayKey && dayKey !== lastDate) {
        items.push({ type: 'separator', label: formatDateSeparator(message.createdAt), key: `sep-${dayKey}` });
        lastDate = dayKey;
      }
    }
    items.push({ type: 'message', message });
  }

  return (
    <>
      <div className="flex max-h-[680px] flex-col gap-4 overflow-y-auto px-6 py-5">
        {items.map((item) => {
          if (item.type === 'separator') {
            return (
              <div key={item.key} className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-blue-100" />
                <span suppressHydrationWarning className="text-xs font-medium text-gray-400">{item.label}</span>
                <div className="h-px flex-1 bg-blue-100" />
              </div>
            );
          }
          const { message } = item;
          const isApplicant = message.author === 'applicant';
          const time = message.createdAt ? formatTime(message.createdAt) : '';
          return (
            <div key={message.id} className={`max-w-[88%] rounded-2xl px-4 py-3 ${isApplicant ? 'self-end bg-[#00349B] text-white' : 'bg-[#eef5ff] text-gray-900'}`}>
              <p className={`mb-1 text-xs font-semibold ${isApplicant ? 'text-white/80' : 'text-[#00349B]'}`}>{authorNames[message.author]}</p>
              <p className="text-sm leading-6">{message.text}</p>
              {time && (
                <p suppressHydrationWarning className={`mt-1 text-right text-[10px] ${isApplicant ? 'text-white/50' : 'text-gray-400'}`}>{time}</p>
              )}
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
