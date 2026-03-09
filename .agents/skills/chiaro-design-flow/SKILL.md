---
name: chiaro-design-flow
description: Turn Fattura Tracker/Chiaro product strategy and local design books into concrete UI decisions and implementation steps. Use when redesigning screens, adding new product flows, choosing which Impeccable commands to chain, aligning the UI with `docs/business_plan.md`, or translating the local design references in `docs/` into actionable frontend changes.
---

# Chiaro Design Flow

## Overview

Use this skill to keep design work tied to Chiaro's business wedge: monthly fiscal clarity for Italian freelancers in forfettario. Load only the docs relevant to the task, then run a deliberate Impeccable sequence instead of mixing commands randomly.

Read `references/source-map.md` first for the doc-to-problem mapping.

## Workflow

### 1. Anchor on product truth

Read `CLAUDE.md` and `docs/business_plan.md` before making visual decisions.

Extract the part of the loop the screen supports:
- capture an income event
- understand net disposable money
- understand how much to set aside
- understand future deadlines
- configure tax assumptions
- teach a new user how the system works

If a proposal does not strengthen one of those jobs, cut it or defer it.

### 2. Load only the relevant design source

Do not bulk-read all books. Use this routing:
- Interaction cost, grouping, readability, line length: `docs/practical_ui_preview.md`
- hierarchy, spacing system, grayscale-first composition, restraint: `docs/refactoring_ui.md`
- color emotion, palette logic, contrast: `docs/basic_color_theory.md`
- value proposition, conversion, validation, business fit: `docs/ux_strategy.md`

### 3. Inspect the real UI system

Before proposing changes, inspect:
- `app/assets/css/layers/tokens.css`
- `app/assets/css/layers/base.css`
- `app/assets/css/layers/layout.css`
- the specific page/component being changed

Prefer system-level improvements over per-page exceptions. If a pattern repeats, update tokens, utilities, or shared components first.

### 4. Choose the Impeccable chain

Start from the problem, not the command:

For diagnosis:
- use `audit` when the issue is broad, production-facing, or quality-related
- use `critique` when the issue is about hierarchy, clarity, tone, or product feel

For core product shaping:
- use `distill` to remove noise from finance screens
- use `clarify` to rewrite labels, hints, onboarding, and warnings
- use `normalize` to align pages to one system
- use `adapt` when dashboard density breaks on mobile

For finishing:
- use `polish` after functionality is complete
- use `harden` for empty, loading, error, and long-text states
- use `extract` when a pattern is ready to become reusable

For selective enhancement only after clarity is solved:
- use `colorize` to reinforce hierarchy, status, and trust
- use `animate` only for state change and orientation
- use `delight` sparingly in onboarding or positive confirmation moments
- use `bolder` only when the screen feels too flat after the above
- use `quieter` when the UI starts feeling like a fintech marketing site

### 5. Apply Chiaro-specific heuristics

- Make the main number the decision number, not the vanity number.
- Prefer "quanto puoi usare" over generic revenue celebration.
- Use color semantically: available money, set-asides, risk, deadlines.
- Keep copy in Italian and avoid accountant jargon unless explained.
- Do not hide critical financial information behind tabs, hovers, or dense modals.
- Avoid card-on-card stacking when one strong surface can do the job.
- Prefer asymmetric, intentional layouts over dashboard sameness, but keep the task path obvious.

### 6. Ship with proof

When implementing, verify:
- the monthly control loop is easier to understand
- hierarchy still works in light and dark mode
- important actions remain obvious on mobile
- long labels, euro values, and tax terms do not break layout
- new styling reuses existing tokens or introduces new ones intentionally
