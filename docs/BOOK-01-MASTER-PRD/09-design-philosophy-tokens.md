# Chapter 9 — Design Philosophy & Design Tokens

**Book:** 1 — Master PRD  
**Chapter:** 9 of 13  
**Version:** 1.0.0-draft

---

## 9.1 Design Philosophy

### The Vastora Design Contract

Every screen in Vastora must feel:

| Quality | Meaning | Anti-Pattern |
|---------|---------|--------------|
| **Minimal** | Only show what's needed now; progressive disclosure for the rest | Cluttered dashboards with 20 widgets |
| **Enterprise** | Professional, trustworthy, data-rich | Playful illustrations, cartoon mascots |
| **Premium** | Polished details: spacing, shadows, transitions | Generic Bootstrap look |
| **Fast** | Instant feedback, skeleton loaders, optimistic updates | Full-page reloads, spinners without context |
| **Modern** | 2026 design standards: rounded corners, soft shadows, clean type | Windows XP-era forms, sharp corners everywhere |

### The "Vastora Test"

Before shipping any screen, ask:

1. Can a user identify this as Vastora within 3 seconds? (Navy sidebar + blue accent + Inter)
2. Is the primary action obvious without reading instructions?
3. Does it feel fast? (No unnecessary animations or loading delays)
4. Would this screen exist in Zoho/HubSpot? If yes — is ours **better**, not just different?
5. Is information density appropriate? (Not too sparse like a landing page, not too cramped like legacy ERP)

---

## 9.2 Inspiration Mapping

| Quality | Inspiration | Vastora Implementation |
|---------|-------------|------------------------|
| Information density | Zoho CRM | Compact tables, inline filters, record detail with tabs |
| CRM workflows | HubSpot | Pipeline board, deal stages, activity timeline |
| Interactions | Linear | Keyboard shortcuts, command palette `[P1]`, clean detail views |
| Minimalism | Notion | Clean defaults, empty states with single CTA |
| Navigation | Slack | Collapsible sidebar sections, workspace context |
| Analytics | Stripe Dashboard | Metric cards, clean charts, generous KPI spacing |
| Typography | Vercel | Inter font, tight heading hierarchy, muted secondary text |

**Critical rule:** We take **patterns and principles**, never **visual assets, layouts, or copy**.

---

## 9.3 Complete Design Token Reference

These tokens are implemented in `Admin/src/index.css` and `Frontend/src/index.css` and must be used consistently across all new code.

### Color Tokens

```css
/* Brand */
--color-brand:        #296CB2;   /* Primary actions, links, active states */
--color-brand-hover:  #215D9C;   /* Button hover */
--color-brand-light:  #5B93CC;   /* Accents, secondary charts */
--color-brand-xlight: #EAF3FC;   /* Icon backgrounds, tints */

/* Neutrals */
--color-navy:         #273850;   /* Sidebar, headings, primary text */
--color-navy-hover:   #324866;   /* Sidebar hover */
--color-white:        #FFFFFF;   /* Surface white */
--color-canvas:       #F8FBFF;   /* Page background */
--color-surface:      #FFFFFF;   /* Cards, panels, inputs */
--color-soft:         #EEF7F3;   /* Success-tinted backgrounds */
--color-ink:          #273850;   /* Primary text */
--color-muted:        #6B7280;   /* Secondary text, placeholders */
--color-line:         #D8E5F4;   /* Borders, dividers */

/* Semantic */
--color-success:      #22C55E;
--color-warning:      #F59E0B;
--color-danger:       #EF4444;
```

### Typography Tokens

```css
--font-sans:  'Inter', system-ui, -apple-system, sans-serif;
--font-mono:  'IBM Plex Sans', 'Inter', monospace;  /* [P1] */
```

### Spacing Tokens (8pt Grid)

| Token | Value | Tailwind |
|-------|-------|----------|
| `--space-1` | 4px | `p-1`, `gap-1` |
| `--space-2` | 8px | `p-2`, `gap-2` |
| `--space-3` | 12px | `p-3`, `gap-3` |
| `--space-4` | 16px | `p-4`, `gap-4` |
| `--space-6` | 24px | `p-6`, `gap-6` |
| `--space-8` | 32px | `p-8`, `gap-8` |

### Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Badges, toasts, small buttons |
| `--radius-md` | 12px | **Default** — inputs, cards, nav items |
| `--radius-lg` | 16px | Panels, dropdowns |
| `--radius-xl` | 24px | Modals, login card |

### Shadow Tokens

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(39, 56, 80, 0.06)` |
| `--shadow-md` | `0 4px 12px rgba(39, 56, 80, 0.08)` |
| `--shadow-lg` | `0 8px 24px rgba(39, 56, 80, 0.12)` |
| `--shadow-focus` | `0 0 0 3px rgba(41, 108, 178, 0.20)` |

### Motion Tokens

| Token | Value |
|-------|-------|
| `--duration-fast` | 150ms |
| `--duration-normal` | 200ms |
| `--duration-slow` | 250ms |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` |

---

## 9.4 CSS Utility Classes (Existing)

These utility classes in `index.css` must be used instead of ad-hoc Tailwind for consistency:

| Class | Purpose |
|-------|---------|
| `.app-shell` | Page wrapper (canvas bg, ink text) |
| `.app-sidebar` | Navy sidebar |
| `.app-header` | Top header bar |
| `.app-panel` | Bordered panel (rounded-lg) |
| `.app-card` | Card with shadow-sm |
| `.app-card-icon` | Circular icon container (brand-xlight bg) |
| `.app-input` | Standard text input |
| `.app-label` | Form label |
| `.app-muted` | Muted secondary text |
| `.app-nav-item` | Sidebar nav item (inactive) |
| `.app-nav-active` | Sidebar nav item (active) |
| `.app-btn-primary` | Primary brand button |
| `.app-btn-secondary` | Secondary outline button |
| `.app-btn-danger` | Destructive action button |
| `.app-table` | Standard data table |
| `.app-badge` | Status badge |

**Rule:** New pages must use these classes. Do not invent new button or input styles per page.

---

## 9.5 Component Design Specifications

Detailed component specs will expand in the dedicated Design System document. Summary standards:

### Button

| Variant | Background | Text | Border | Radius |
|---------|------------|------|--------|--------|
| Primary | `#296CB2` | White | None | 12px |
| Secondary | White | `#273850` | `#D8E5F4` | 12px |
| Danger | `#EF4444` | White | None | 12px |
| Ghost | Transparent | `#296CB2` | None | 12px |
| Disabled | `#EAF3FC` | `#6B7280` | None | 12px |

Sizes: `sm` (32px height), `md` (40px default), `lg` (48px).

### Input

- Height: 40px (md)
- Border: 1px `#D8E5F4`
- Focus: border `#296CB2` + focus ring
- Error: border `#EF4444` + error message below
- Radius: 12px

### Table

- Header: `label-md`, muted, sticky top
- Row hover: `#EAF3FC` tint
- Row height: 48px (compact), 56px (comfortable)
- Pagination: bottom-right
- Empty state: centered with CTA

### Modal

- Overlay: `rgba(39, 56, 80, 0.5)` + backdrop-blur
- Panel: white, radius 24px, shadow-lg
- Max-width: 560px (sm), 720px (md), 960px (lg)
- Close: X button top-right + Escape key

### Toast

- Position: top-right
- Background: `#273850`
- Text: white
- Duration: 3 seconds (success), 5 seconds (error)
- Radius: 8px

---

## 9.6 Layout System

### App Shell Structure

```
┌──────────────────────────────────────────────────┐
│ ┌────────┐ ┌──────────────────────────────────┐ │
│ │        │ │ Header (64px)                     │ │
│ │ Side   │ ├──────────────────────────────────┤ │
│ │ bar    │ │                                   │ │
│ │ (256px)│ │ Content Area                      │ │
│ │        │ │ (padding: 24px)                   │ │
│ │        │ │                                   │ │
│ └────────┘ └──────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Page Layout Patterns

| Pattern | Usage | Structure |
|---------|-------|-----------|
| **List Page** | Leads, Employees, Tasks | Title + filters + action button → table → pagination |
| **Detail Page** | Deal detail, Employee profile | Breadcrumb → header card → tabs → content |
| **Dashboard** | Role dashboards | Metric cards row → charts → activity feed |
| **Form Page** | Create/edit records | Breadcrumb → form sections → sticky footer actions |
| **Board Page** | Kanban, Pipeline | Title + filters → horizontal columns → cards |
| **Settings Page** | Module settings | Side tabs → setting groups → save button |

---

## 9.7 Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 768px | Sidebar hidden (hamburger), single column, stacked cards |
| Tablet | 768–1024px | Sidebar collapsible, 2-column grids |
| Desktop | 1024–1440px | Full sidebar, standard layouts |
| Wide | > 1440px | Content max-width 1440px, centered |

Desktop-first development. Mobile adaptations in `[P1]`.

---

## 9.8 Accessibility Standards

| Requirement | Target |
|-------------|--------|
| Color contrast (text) | WCAG AA — 4.5:1 minimum |
| Color contrast (large text) | WCAG AA — 3:1 minimum |
| Focus indicators | Visible focus ring on all interactive elements |
| Keyboard navigation | Tab order logical; Enter/Space activate buttons |
| Screen reader | aria-labels on icon buttons; role attributes on modals |
| Form labels | Every input has visible label or aria-label |
| Error messages | Associated with inputs via aria-describedby |
| Motion | `prefers-reduced-motion` disables animations |

---

## 9.9 Dark Mode Token Map `[P1]`

| Light | Dark |
|-------|------|
| `--color-canvas: #F8FBFF` | `--color-canvas: #0F1724` |
| `--color-surface: #FFFFFF` | `--color-surface: #1A2332` |
| `--color-ink: #273850` | `--color-ink: #E8EDF5` |
| `--color-muted: #6B7280` | `--color-muted: #8899AA` |
| `--color-line: #D8E5F4` | `--color-line: #2A3A4F` |
| Sidebar stays navy | Sidebar stays navy (already dark) |

---

## 9.10 Design System Deliverables (Book 1 Extension)

The following will be expanded into a standalone **Design System Book** (~50 pages):

- [ ] Complete component library documentation (all 20+ components)
- [ ] Figma component library file
- [ ] Storybook or component playground `[P1]`
- [ ] Icon inventory and usage guide
- [ ] Chart and data visualization standards
- [ ] Email template designs
- [ ] Print/PDF templates (invoices, payslips, reports)

---

**Previous:** [08 — User Roles & Permissions](./08-user-roles-permissions.md)  
**Next:** [10 — UX Principles](./10-ux-principles.md)
