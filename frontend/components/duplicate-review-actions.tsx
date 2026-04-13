'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/button';

const actions = [
  { value: 'confirmed_duplicate', label: 'Approve as duplicate' },
  { value: 'different_people', label: 'Reject, different people' },
  { value: 'merged', label: 'Already merged' },
] as const;

export function DuplicateReviewActions({ reviewId, leadId, candidateId, currentStatus }: { reviewId?: string; leadId: string; candidateId: string; currentStatus?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function update(status: string) {
    setLoading(status);
    await fetch('/api/admin/leads/duplicate-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, leadId, candidateId, status }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.value}
          type="button"
          size="sm"
          variant={currentStatus === action.value ? 'secondary' : 'outline'}
          onClick={() => update(action.value)}
          disabled={loading !== null}
        >
          {loading === action.value ? 'Saving...' : action.label}
        </Button>
      ))}
    </div>
  );
}
