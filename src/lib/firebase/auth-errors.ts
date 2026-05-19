/** Maps Firebase Auth error codes to i18n keys under `auth.*`. */
export function firebaseAuthErrorKey(code: string | undefined): string {
  switch (code) {
    case "auth/operation-not-allowed":
      return "auth.googleDisabled";
    case "auth/unauthorized-domain":
      return "auth.unauthorizedDomain";
    case "auth/popup-blocked":
      return "auth.popupBlocked";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "auth.popupClosed";
    case "auth/account-exists-with-different-credential":
      return "auth.accountExistsDifferent";
    case "auth/network-request-failed":
      return "errors.network";
    default:
      return "common.error";
  }
}

export function firebaseAuthErrorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: string }).code);
  }
  return undefined;
}
