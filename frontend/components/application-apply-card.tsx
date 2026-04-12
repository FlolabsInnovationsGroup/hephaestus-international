import Link from 'next/link';

export function ApplicationApplyCard({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border-2 border-[#dbe8ff] bg-[#f7faff] p-8 shadow-sm">
      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">New application flow</p>
          <h4 className="mt-2 text-2xl font-bold text-gray-900">Apply directly in the FloLabs platform</h4>
          <p className="mt-3 text-gray-700">This role will automatically pre-fill the job title in the new application flow, create the applicant profile, and open the application dashboard with the next step on the right and Paula chat on the left.</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>Role is captured automatically from this internship page</li>
            <li>Applicant data is stored in a structured profile instead of HubSpot only</li>
            <li>The same credentials can later be reused for Chronos</li>
          </ul>
        </div>
        <div className="space-y-3">
          <Link href={`/login?role=${encodeURIComponent(title)}`} className="block rounded-xl bg-[#00349B] px-5 py-3 text-center font-semibold text-white hover:bg-[#002775]">
            Start application
          </Link>
          <p className="text-xs text-gray-500">Preview version. Final submission backend and file upload persistence come next.</p>
        </div>
      </div>
    </div>
  );
}
