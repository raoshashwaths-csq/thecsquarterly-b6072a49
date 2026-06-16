/**
 * useHeadlineReveal — kept as a no-op for backwards compatibility.
 *
 * The headline reveal is now a pure CSS animation scoped to `.page-enter h1`
 * / `.page-enter h2` in styles.css. We no longer mutate the DOM at runtime
 * because React's reconciliation (triggered by i18n resolution, auth state
 * resolving, suspense boundaries, etc.) would fight with the injected
 * wrapper and cause the reveal animation to flash 2–3 times after landing,
 * which read as the page "hanging".
 */
export function useHeadlineReveal(_pathname: string) {
  // intentionally empty — see file header.
}
