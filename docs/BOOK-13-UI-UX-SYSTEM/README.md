# Book 13 — UI/UX System

**Product:** Vastora CRM / Vastora One  
**Document Version:** 1.0.0-draft  
**Status:** ⚪ Planned (starts after Book 2 Part 4)  
**Estimated Size:** ~80–100 pages equivalent

---

## Purpose

Book 13 is the **definitive design handoff document** for UI/UX designers and frontend engineers. While Book 1 Chapter 9 covers design tokens at PRD level, Book 13 expands into **implementation-ready specifications** for every visual and interaction pattern.

**Goal:** Any designer or developer can build consistent Vastora UI without guessing — directly handoff-ready for Figma and React components.

---

## Audience

- UI/UX Designers (Figma library)
- Frontend Engineers (React + Tailwind)
- QA (visual regression benchmarks)
- Design reviewers

---

## Relationship to Other Books

| Book | Relationship |
|------|--------------|
| Book 1 — Master PRD | Brand identity, high-level tokens |
| Book 2+ Module PRDs | Screen-specific layouts reference Book 13 patterns |
| `frontendrequiremnts.md` | Engineering rules; Book 13 is visual spec |
| Figma Library | Generated from Book 13 |

**Rule:** Module PRDs reference Book 13 components by name (e.g., "Use `DataTable` per Book 13 §4") — do not redefine component specs in module docs.

---

## Table of Contents (Planned)

| # | Chapter | Est. Pages |
|---|---------|------------|
| 1 | [Design Principles & Vastora Test](./01-design-principles.md) | 6 |
| 2 | [Design Tokens & Figma Variables](./02-design-tokens-figma.md) | 10 |
| 3 | [Layout System & App Shell](./03-layout-system.md) | 8 |
| 4 | [Sidebar & Navigation](./04-sidebar-navigation.md) | 6 |
| 5 | [Header & Command Palette](./05-header-command-palette.md) | 6 |
| 6 | [Typography & Data Display](./06-typography-data-display.md) | 5 |
| 7 | [Buttons & Actions](./07-buttons-actions.md) | 5 |
| 8 | [Forms & Inputs](./08-forms-inputs.md) | 8 |
| 9 | [Data Tables](./09-data-tables.md) | 8 |
| 10 | [Cards & Panels](./10-cards-panels.md) | 5 |
| 11 | [Modals, Drawers & Sheets](./11-modals-drawers.md) | 6 |
| 12 | [Kanban & Pipeline Boards](./12-kanban-pipeline.md) | 8 |
| 13 | [Calendar & Date Pickers](./13-calendar-date-pickers.md) | 6 |
| 14 | [Filters, Search & Views](./14-filters-search.md) | 6 |
| 15 | [Charts & Dashboards](./15-charts-dashboards.md) | 8 |
| 16 | [Timeline & Activity Feed](./16-timeline-activity.md) | 5 |
| 17 | [Empty, Loading & Error States](./17-states-feedback.md) | 6 |
| 18 | [Toast, Badge & Status Indicators](./18-toast-badge-status.md) | 4 |
| 19 | [Motion & Animation System](./19-motion-system.md) | 5 |
| 20 | [Responsive & Breakpoint Rules](./20-responsive-rules.md) | 6 |
| 21 | [Accessibility (WCAG 2.1 AA)](./21-accessibility.md) | 6 |
| 22 | [Dark Mode](./22-dark-mode.md) | 4 |
| 23 | [Component Inventory & Storybook](./23-component-inventory.md) | 6 |

**Total:** ~137 pages equivalent

---

## Mandatory Per-Component Spec Format

Every component chapter includes:

```
Component: DataTable
├── Anatomy (diagram)
├── Variants (size, density, style)
├── States (default, hover, focus, disabled, loading, error)
├── Props / API (React)
├── Tailwind / CSS classes
├── Do's and Don'ts
├── Accessibility (ARIA, keyboard)
├── Responsive behavior
├── Code example
└── Figma component link
```

---

## Writing Order

1. Tokens + Layout (Ch 1–3) — foundation
2. Navigation (Ch 4–5)
3. Core components (Ch 7–11)
4. CRM-specific (Ch 12–16) — aligns with Book 2 Parts 3–4
5. States + Motion (Ch 17–19)
6. Responsive + A11y (Ch 20–21)
7. Component inventory (Ch 23)

---

## Figma Deliverables (Linked)

- [ ] Vastora Design System — Figma file `[To Create]`
- [ ] Component library with variants
- [ ] Icon set (Feather-based)
- [ ] CRM screen templates (Contact 360, Pipeline Board)
- [ ] Mobile responsive frames

---

**Depends on:** Book 1 (Brand), Book 2 Part 3–4 (screen references)
