# Chiaro Design Source Map

Use this file to decide which project docs to read for a design task.

## Core truth

- `CLAUDE.md`
  Use first. This is the persistent design context for the product.
- `docs/business_plan.md`
  Use for product wedge, ICP, trust model, messaging, roadmap priorities, and what not to build.

## Design lenses

- `docs/practical_ui_preview.md`
  Use for interaction cost, grouping, touch targets, readability, line length, and practical UI choices that reduce friction.
- `docs/refactoring_ui.md`
  Use for hierarchy, spacing rhythm, grayscale-first thinking, composition, and avoiding generic dashboard patterns.
- `docs/basic_color_theory.md`
  Use for palette structure, contrast, emotional meaning, accent strategy, and color relationships.
- `docs/ux_strategy.md`
  Use for value proposition, validation, competitive framing, conversion, and aligning UX decisions with business outcomes.

## Current implementation touchpoints

- `app/assets/css/layers/tokens.css`
  Source of color, radius, shadow, and gradient decisions.
- `app/assets/css/layers/base.css`
  Typography and shared base primitives.
- `app/assets/css/layers/layout.css`
  High-level shell and page composition patterns.
- `app/components/`
  Reusable UI building blocks.
- `app/pages/`
  Product flows currently visible to users.

## Recommended command recipes

- New feature or new page:
  `critique` -> `distill` -> `clarify` -> `frontend-design`
- Existing screen feels inconsistent:
  `audit` -> `normalize` -> `polish`
- Mobile or responsive issues:
  `audit` -> `adapt` -> `normalize`
- Onboarding or empty states:
  `onboard` -> `clarify` -> `polish`
- Reusable design system work:
  `extract` -> `normalize` -> `polish`
- High-value enhancement after structure is solid:
  `colorize` and/or `animate`, then `polish`
