import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-[#EBE6DE]">
        <h2 className="text-3xl font-serif font-bold text-[#1F2421] mb-2">404</h2>
        <p className="text-[#606862] mb-6">The page or booking you are looking for could not be found.</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-[#2B4C7E] text-white font-medium rounded-xl hover:bg-[#1E365D] transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
