"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { ConfigMissing } from "./config-missing";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * AuthGuard — wraps protected pages. While Firebase is initializing we
 * render a skeleton; when no user is present we redirect to /sign-in.
 *
 * For server-rendered metadata we still let the page module export `metadata`
 * — only the body is gated here.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, initializing, configured } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!configured) return;
    if (initializing) return;
    if (!user) router.replace("/sign-in");
  }, [configured, initializing, user, router]);

  if (!configured) return <ConfigMissing />;
  if (initializing || !user) return <AuthFallback />;
  return <>{children}</>;
}

function AuthFallback() {
  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="mt-6 h-96 w-full rounded-lg" />
    </div>
  );
}
