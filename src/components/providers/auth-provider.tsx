"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { isProAccess } from "@/lib/billing/plan";
import type { SubscriptionStatus, UserPlan } from "@/lib/billing/types";
import {
  fetchUserProfile,
  signOutUser,
  subscribeToAuth,
  updateUserLocale,
  type AppUser,
} from "@/lib/firebase/auth";
import {
  initAnalytics,
  initAppCheck,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import { useI18n } from "./i18n-provider";
import { isLocale } from "@/lib/i18n";
import { useResumeStore } from "@/store/resume-store";

interface AuthContextValue {
  user: AppUser | null;
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
  isPro: boolean;
  /** True until the first onAuthStateChanged callback fires. */
  initializing: boolean;
  /** True if Firebase env vars are present. */
  configured: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

/**
 * AuthProvider — subscribes to Firebase Auth, hydrates the user profile,
 * and syncs the user's preferred locale into the i18n provider.
 *
 * Gracefully degrades when Firebase isn't configured (showing the
 * "configuration missing" empty state instead of crashing).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setLocale } = useI18n();

  const [user, setUser] = React.useState<AppUser | null>(null);
  const [plan, setPlan] = React.useState<UserPlan>("free");
  const [subscriptionStatus, setSubscriptionStatus] =
    React.useState<SubscriptionStatus>("none");
  const [initializing, setInitializing] = React.useState(true);
  const configured = isFirebaseConfigured();

  const loadProfile = React.useCallback(async (uid: string) => {
    const profile = await fetchUserProfile(uid);
    if (profile) {
      setPlan(profile.plan ?? "free");
      setSubscriptionStatus(profile.subscriptionStatus ?? "none");
      if (isLocale(profile.locale)) {
        setLocale(profile.locale);
      }
    }
    return profile;
  }, [setLocale]);

  const refreshProfile = React.useCallback(async () => {
    if (!user) return;
    try {
      await loadProfile(user.uid);
    } catch {
      // non-fatal
    }
  }, [user, loadProfile]);

  React.useEffect(() => {
    if (!configured) {
      setInitializing(false);
      return;
    }
    // Fire-and-forget: Analytics is purely opt-in instrumentation. It will
    // no-op if the measurementId or `firebase/analytics` support is missing.
    void initAppCheck();
    void initAnalytics();
    const unsub = subscribeToAuth(async (u) => {
      setUser(u);
      setInitializing(false);
      if (u) {
        try {
          await loadProfile(u.uid);
        } catch {
          // Non-fatal: profile is just metadata.
        }
      } else {
        setPlan("free");
        setSubscriptionStatus("none");
        // Wipe any in-memory résumé state so the next user doesn't briefly
        // see the previous account's data on sign-in.
        useResumeStore.getState().reset();
      }
    });
    return () => unsub();
  }, [configured, loadProfile]);

  const signOut = React.useCallback(async () => {
    if (!configured) return;
    await signOutUser();
    router.push("/sign-in");
  }, [configured, router]);

  // When the user manually changes locale in the UI we mirror it to Firestore
  // so it follows them across devices.
  const { locale } = useI18n();
  const lastSyncedLocale = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!user) {
      lastSyncedLocale.current = null;
      return;
    }
    if (lastSyncedLocale.current === locale) return;
    lastSyncedLocale.current = locale;
    updateUserLocale(user.uid, locale).catch(() => {
      // Non-fatal — locale is also persisted in localStorage.
    });
  }, [user, locale]);

  const isPro = isProAccess({ plan, subscriptionStatus });

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      plan,
      subscriptionStatus,
      isPro,
      initializing,
      configured,
      refreshProfile,
      signOut,
    }),
    [user, plan, subscriptionStatus, isPro, initializing, configured, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider />");
  }
  return ctx;
}
