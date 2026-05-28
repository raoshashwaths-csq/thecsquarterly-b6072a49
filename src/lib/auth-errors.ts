// Detects Supabase / server-fn auth failures (401 / "Unauthorized" envelopes)
// so the UI can render a friendly sign-in prompt instead of a raw error.
export function isAuthError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as any;
  if (anyErr?.status === 401 || anyErr?.statusCode === 401) return true;
  const msg =
    typeof anyErr?.message === "string"
      ? anyErr.message
      : typeof anyErr === "string"
        ? anyErr
        : "";
  return /unauthor|401|jwt|not authenticated|no authorization header/i.test(msg);
}
