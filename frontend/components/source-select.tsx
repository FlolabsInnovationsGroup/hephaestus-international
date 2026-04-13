'use client';

import { useMemo, useState } from 'react';

type SourceSelectProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function SourceSelect({ options, value, onChange }: SourceSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-sm text-gray-900 outline-none transition focus:border-[#00349B]"
      >
        <span className="block truncate">{value || 'Select a source'}</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl">
          <div className="border-b border-blue-50 p-3">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sources"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#00349B]"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-500">No sources found.</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${option === value ? 'bg-[#eef5ff] text-[#00349B]' : 'text-gray-700 hover:bg-[#f7faff]'}`}
                >
                  {option}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
