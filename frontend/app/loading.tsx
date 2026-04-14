export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="fixed left-0 right-0 top-0 z-[9999] h-1 overflow-hidden bg-[#d7e5ff]">
        <div className="h-full w-1/3 animate-[loadingBar_1.1s_ease-in-out_infinite] bg-[#00349B]" />
      </div>

      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-4 border-[#00349B] mb-3" />
          <p className="text-base text-gray-600">Loading page...</p>
        </div>
      </div>

      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(420%); }
        }
      `}</style>
    </div>
  );
}
