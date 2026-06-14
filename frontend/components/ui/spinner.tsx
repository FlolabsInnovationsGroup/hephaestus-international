import clsx from 'clsx';

/** Same SVG geometry as FloLabs Chronos (`InlineSearchLoading` / `TimerActionIndicator`). */
export function Spinner({
  className,
  size = 'md',
  label,
  'aria-label': ariaLabel = 'Loading',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  'aria-label'?: string;
}) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-10 w-10' : 'h-5 w-5';

  return (
    <span className={clsx('inline-flex items-center gap-2', className)} aria-live="polite" aria-label={label ? undefined : ariaLabel}>
      <svg
        className={clsx(sizeClass, 'animate-spin shrink-0')}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label ? <span>{label}</span> : null}
    </span>
  );
}
