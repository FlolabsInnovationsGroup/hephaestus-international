'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'hephaestus_stage_notice';

export function StageCompletionNotice() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = sessionStorage.getItem(STORAGE_KEY);
      if (v) {
        setText(v);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* private mode / quota */
    }
  }, []);

  if (!text) return null;

  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-gray-800" role="status">
      {text}
    </div>
  );
}
