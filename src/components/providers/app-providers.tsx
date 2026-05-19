"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "./i18n-provider";
import { AuthProvider } from "./auth-provider";
import { CommandProvider } from "@/components/command/command-provider";

/**
 * Cross-tree client providers, mounted once at the root layout.
 *
 * Order matters:
 *   I18nProvider   → must wrap AuthProvider (which syncs the user's locale)
 *   AuthProvider   → wraps everything else so any component can read the
 *                    current user and Firebase config state.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <CommandProvider>
          <TooltipProvider delayDuration={120}>
            {children}
            <Toaster />
          </TooltipProvider>
        </CommandProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
