# Chiaro Design Closure + Editorial Variant Plan

## Summary

Finish the unfinished design-system rework first, then add a second full-app visual system inspired by `dev-setup.html` without replacing the current Chiaro look. The current style remains the default. The new editorial system is activated manually via `?ui=editorial` and persisted locally, with no random rollout, no backend changes, and no build execution by the agent.

## Implementation Changes

### 1. Close the previous rework properly

- Finish the semantic theme migration in [tokens.css](D:/projects/MY PROJECTS/fattura-tracker/app/assets/css/layers/tokens.css) so theme switching is driven only by semantic tokens.
- Remove the remaining `.light` selectors from `base.css`, `layout.css`, `surfaces.css`, and `forms.css`; the only theme override block left should be the token source of truth.
- Add missing semantic tokens for:
  - shell ambient/background treatment
  - sidebar and mobile dock surfaces
  - gradient/stage text colors
  - login CTA surface/border/shadow states
  - date panel and outside-view calendar cell styling
- Keep `layout.css` focused on shared layout primitives and shell behavior only; do not add new editorial styling there.
- Move variant-specific styling into a new dedicated CSS layer, imported last from [main.css](D:/projects/MY PROJECTS/fattura-tracker/app/assets/css/main.css), so the classic system gets simpler instead of accumulating more overrides.

### 2. Add non-destructive variant infrastructure

- Introduce a UI variant resolver in the app shell using [app.vue](D:/projects/MY PROJECTS/fattura-tracker/app/app.vue).
- Support `ui=classic|editorial` query param:
  - if present, apply immediately and persist locally
  - if absent, load the last persisted value
  - invalid values fall back to `classic`
- Persist the choice in local storage under a single stable key, e.g. `chiaro-ui-variant`.
- Apply the resolved variant as a root attribute, e.g. `data-ui-variant="classic|editorial"` on `body` or the top shell wrapper.
- Do not add a visible toggle in the UI.
- Keep all business logic, routes, server APIs, Prisma models, and data flow unchanged.

### 3. Define the editorial system as a real second visual language

- Keep the same product jobs and data hierarchy, but allow a full visual reinterpretation across the whole app.
- Editorial typography:
  - display/headlines: `Fraunces`
  - utility labels and numeric meta: existing mono family
  - body/form copy: keep readable sans body copy; do not switch body text to a mono-only system
- Editorial surface language:
  - paper/ink contrast instead of glossy fintech glow
  - stronger top rules, section dividers, and ledger-like row treatments
  - reduced glassmorphism and reduced ambient glow
  - warmer neutrals in light mode and darker inked surfaces in dark mode
- Editorial component rules should be driven by variant tokens first, then selective variant CSS for structure where tokens are not enough.

### 4. Reinterpret the whole app under `editorial`

- Shell/navigation:
  - restyle sidebar, mobile header, and dock into a calmer editorial chrome
  - active nav should read as a marked section, not a glowing pill
  - keep current route structure and interaction behavior
- Shared surfaces:
  - update `SurfaceCard`, stat cards, section headers, list shells, KV rows, and payment/entry rows so they can render both `classic` and `editorial` cleanly from the same components
- Login:
  - turn the page into an editorial entry spread with stronger title treatment, ruled feature cards, and a paper/ink access panel
- Home:
  - make the main number feel like an editorial “decision total”
  - recast the hero, composer preview, stat grid, and focus block into one coherent report-like composition
- Month:
  - convert the monthly summary, provision breakdown, and entry list into a ledger/report treatment with clearer scan lines
- Annual:
  - reinterpret annual overview, chart sections, tax split, deadlines, and month-by-month rows as an annual report rather than glossy dashboard cards
- Settings:
  - turn fiscal model and payment sections into a worksheet/manual aesthetic with stronger section framing and less decorative surface stacking

## Public Interfaces / Contract Changes

- New query interface: `?ui=classic` and `?ui=editorial`
- New client persistence key: `chiaro-ui-variant`
- New root styling contract: `data-ui-variant="classic|editorial"`
- No backend/API/schema changes

## Test Plan

- Variant resolution:
  - `?ui=editorial` enables editorial mode immediately
  - `?ui=classic` restores classic mode
  - reload preserves the last chosen mode without needing the query param again
  - unknown `ui` values fall back to classic
- Theme matrix:
  - verify `classic + dark`, `classic + light`, `editorial + dark`, `editorial + light`
- Page coverage:
  - login, home, month, annual, settings all render correctly in both variants
- Responsive checks:
  - mobile shell/dock
  - tablet layouts
  - desktop sidebar layouts
- Edge cases:
  - long euro values
  - empty states
  - modal/detail views
  - date picker
  - payment rows and entry rows
  - chart containers in annual view
- Architecture checks:
  - no remaining `.light` selectors outside `tokens.css`
  - no duplicate page templates created only to support the editorial look
- Build/check policy:
  - do not run `npm run build` during implementation
  - after implementation, you will run the build locally and report any failures back

## Assumptions / Defaults

- The current Chiaro system remains the default and must look unchanged unless `ui=editorial` is active.
- This is a manual comparison mode, not a true randomized experiment.
- The editorial variant is whole-app and visually substantial, but it does not change product logic or route structure.
- `Fraunces` is added only for editorial display usage; body readability stays prioritized over strict imitation of `dev-setup.html`.
- Variant-specific CSS lives in a dedicated layer/file rather than expanding the already large shared layout file.
