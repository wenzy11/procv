"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100">
        <div className="grid min-h-screen place-items-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-xl font-semibold">ProCV encountered an error</h1>
            <p className="text-sm text-zinc-400">{error.message}</p>
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
