import { Spinner } from '@/components/ui/spinner';

/** Route-level loading shell (Chronos spinner + Hephaestus palette). */
export function PageLoadingOverlay({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[#f7faff] px-4">
      <Spinner size="lg" className="text-[#00349B]" label={label} />
    </div>
  );
}
