## Design Context

## Documentation Source Of Truth

The canonical product documentation for Chiaro lives in Notion.

Primary hub:
- `Chiaro`: `https://www.notion.so/31ba7b154dab80df9c56e94db7fe8a7b`

Canonical subpages:
- `Business Plan 2026`: `https://www.notion.so/327a7b154dab810ab5b2c8ba43274489`
- `Current Product Documentation`: `https://www.notion.so/327a7b154dab81f5accbc5857c17ff94`
- `Plan Review & Recommended Improvements`: `https://www.notion.so/327a7b154dab81e387cccbe7969a4454`

Use Notion as the source of truth for:
- product strategy and positioning
- current architecture and product state
- major roadmap decisions
- plan revisions and strategic recommendations

Do not try to re-sync Notion on every normal coding turn. That would add unnecessary token and execution overhead.

Preferred sync policy:
1. Update Notion when a change materially affects product behavior, architecture, billing, onboarding, auth, fiscal logic, roadmap, or positioning.
2. For routine implementation churn, keep working locally and batch the Notion update later.
3. Prefer a dedicated periodic sync prompt or automation for documentation hygiene, such as weekly or at major milestones.
4. If a task explicitly changes source-of-truth product assumptions, update the relevant Notion page in the same task.

### Users
Italian freelancers in regime forfettario use this product to understand how much of their invoiced money is actually spendable. Their core job is not bookkeeping; it is making safer monthly decisions about cash, tax set-asides, and upcoming deadlines with minimal cognitive load.

The current app name in code is `Fattura Tracker`. The product direction in the business plan is `Chiaro`. Treat the interface as the operating surface for that product direction: a monthly fiscal clarity cockpit for self-managed freelancers, especially digital and knowledge workers.

### Brand Personality
Clear, trustworthy, operative.

The interface should feel calm and precise, not bureaucratic, flashy, or overly corporate. It should reduce anxiety around taxes by making consequences legible. Copy should stay in Italian and sound direct, useful, and grounded in real monthly decisions.

### Aesthetic Direction
Use the current warm-fintech direction as the base: dark mineral greens, warm light surfaces, strong typographic hierarchy, and a cockpit-like information layout. Preserve the existing preference for expressive display typography, monospaced utility labels, and tinted neutrals.

Avoid generic "AI SaaS" aesthetics, default startup gradients, cards-inside-cards, decorative charts, and anything that makes the product feel like a cheap digital accountant. The app should feel more like a decision instrument than an admin dashboard.

Reference lenses already present in `docs/`:
- `business_plan.md`: positioning, wedge, ICP, trust requirements, and product priorities
- `ux_strategy.md`: align UX choices with business outcomes and validation
- `practical_ui_preview.md`: reduce interaction cost, tighten spacing and line length, keep tasks obvious
- `refactoring_ui.md`: hierarchy-first composition, grayscale-first discipline, stronger layout decisions
- `basic_color_theory.md`: use color intentionally for hierarchy, emotion, and contrast

### Design Principles
1. Make the monthly control loop obvious: incassato, accantonare, disponibile, prossime scadenze.
2. Design for trust before delight: calculations, states, and explanations must feel legible and dependable.
3. Lower interaction cost aggressively: fewer steps, fewer choices, tighter grouping, clearer defaults.
4. Use visual intensity sparingly: emphasis belongs on spendable money, set-asides, risks, and deadlines.
5. Build from system primitives first: tokens, surface rules, spacing rhythm, and reusable information patterns before one-off page styling.
