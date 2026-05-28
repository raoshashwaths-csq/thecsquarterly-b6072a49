## High-Performance CSFactors Command Centre Overhaul

### 1. Global Visual Consistency (Executive Tier)

- **Class Update:** Standardize all `text-[10px]`, `text-[11px]`, and `text-[9px]` font-mono labels to `text-xs` (12px) for better executive-tier readability.
- **Ordering:** Reorder class strings as requested: `font-mono uppercase tracking-widest text-xs`.
- **Target Files:** `CSFactorsSidebar.tsx`, `AccountsGrid.tsx`, `BurningThree.tsx`, `AnalyticsHeader.tsx`, `csfactors.tsx`, `QAgentButton.tsx`, and others identified in search.

### 2. Sidebar & Navigation Enhancement

- **Operator Directory:** Add "Operator Directory" (linking to `/directory`) to the Modules section in `csfactorsNav.tsx`.
- **Active State Fix:** Ensure mobile nav correctly highlights active links using the same logic as the desktop sidebar.
- Make sure all sidebar elements have back buttons after being expanded.

### 3. Mobile Optimization Pass

- **CSFactors Header:** Reduce `h1` font size on very small screens to prevent clipping. Add more horizontal padding.
- **MetricGrid:** Switch to a standard grid with gap on mobile to prevent "cramped" borders.
- **AccountsGrid Mobile Fix:** 
  - Disable `sticky` columns on viewports `< 768px` to allow natural horizontal scrolling.
  - Reduce cell padding and font-size slightly on mobile for higher density.
- **Filter Badge:** Ensure the "Active filter" badge wraps correctly on mobile.

### 4. Functional Refinement

- **Burning Three:** Ensure "Open account" links work and have consistent styling.
- **QAgent Dock:** verify alignment and z-index on mobile.

## Technical Details

- **Tailwind:** Use `max-md:relative` on sticky columns in `AccountsGrid`.
- **Typography:** Shift from hardcoded `text-[10px]` to standard `text-xs` utility.
- **Routing:** Verify all `to` and `hash` combinations in `csfactorsNav.tsx`.