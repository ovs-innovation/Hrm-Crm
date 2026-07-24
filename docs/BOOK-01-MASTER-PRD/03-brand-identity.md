# Chapter 3 — Brand Identity

**Book:** 1 — Master PRD  
**Chapter:** 3 of 13  
**Version:** 1.0.0-draft

---

## 3.1 Brand Architecture

| Level | Name | Usage |
|-------|------|-------|
| **Company / Platform** | Vastora | Parent brand |
| **Product** | Vastora CRM | Primary product name (marketing, login, docs) |
| **Platform Edition** | Vastora One | Full unified BOS positioning |
| **Admin App** | Vastora Admin Console | Internal operators |
| **Employee App** | Vastora Employee Portal | Staff self-service |
| **Client App** | Vastora Client Portal | External clients `[P1]` |

### Naming Rules

- Always **Vastora CRM** in user-facing login and marketing (not "Hrm-Crm" or internal repo name)
- Use **Vastora One** when emphasizing the full platform (CRM + HRM + Projects + Finance + AI)
- Module names are plain English: CRM, HR, Projects, Finance, Support, AI
- No abbreviations in UI labels (write "Human Resources" in settings, "HR" acceptable in nav)

---

## 3.2 Tagline

> **One Platform. Every Business.**

### Supporting Lines (Marketing)

- "From first lead to final payment."
- "Your business, unified."
- "CRM. People. Projects. Finance. One place."

---

## 3.3 Brand Personality

| Trait | Expression in Product |
|-------|----------------------|
| **Professional** | Clean layouts, no playful illustrations in core workflows |
| **Confident** | Strong primary blue, clear CTAs, decisive empty states |
| **Modern** | Rounded corners, soft shadows, smooth micro-interactions |
| **Trustworthy** | Consistent patterns, visible security indicators, audit trails |
| **Efficient** | Information density, keyboard shortcuts, smart defaults |

### Brand Voice (UI Copy)

- **Tone:** Direct, helpful, professional — never corporate-jargon heavy
- **Buttons:** Verb-first ("Create Deal", "Send Invoice", "Approve Leave")
- **Errors:** Explain what happened + how to fix ("Email already exists. Sign in or use a different email.")
- **Empty states:** Action-oriented ("No deals yet. Create your first deal to start tracking pipeline.")

---

## 3.4 Logo Guidelines `[Design Asset — Pending]`

### Logo Structure (Planned)

- **Wordmark:** VASTORA in custom or Inter Bold
- **Icon:** Abstract "V" monogram — geometric, not illustrative
- **Clear space:** Minimum 1× icon height on all sides

### Logo Usage

| Context | Variant |
|---------|---------|
| Sidebar (dark navy bg) | White wordmark + white icon |
| Login page (light bg) | Navy wordmark + primary blue icon |
| Favicon | Icon only |
| Email headers | Full wordmark, max width 160px |

### Logo Don'ts

- Do not stretch, rotate, or add effects
- Do not place on busy photography without overlay
- Do not use non-brand colors for the wordmark

---

## 3.5 Color System

### Primary Palette

| Token | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| **Brand Primary** | `#296CB2` | `--color-brand` | Primary buttons, links, active states, charts primary series |
| **Brand Hover** | `#215D9C` | `--color-brand-hover` | Button hover, interactive emphasis |
| **Brand Light** | `#5B93CC` | `--color-brand-light` | Accents, gradients, secondary charts |
| **Brand XLight** | `#EAF3FC` | `--color-brand-xlight` | Icon backgrounds, selected row tint, badges |

### Neutral Palette

| Token | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| **Navy / Ink** | `#273850` | `--color-navy`, `--color-ink` | Sidebar, headings, primary text |
| **Navy Hover** | `#324866` | `--color-navy-hover` | Sidebar hover states |
| **Canvas** | `#F8FBFF` | `--color-canvas` | Page background |
| **Surface** | `#FFFFFF` | `--color-surface` | Cards, panels, inputs |
| **Muted** | `#6B7280` | `--color-muted` | Secondary text, placeholders |
| **Line** | `#D8E5F4` | `--color-line` | Borders, dividers |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| **Success** | `#22C55E` | Approved, paid, completed, positive trends |
| **Warning** | `#F59E0B` | Pending, due soon, low balance |
| **Danger** | `#EF4444` | Errors, rejected, overdue, destructive actions |
| **Info** | `#5B93CC` | Informational badges, tips |

### Color Usage Rules

1. **Primary blue** is for actions and focus — not for large background fills
2. **Navy sidebar** is the app chrome signature — consistent across Admin and Employee apps
3. **Canvas background** prevents harsh white-on-white fatigue on long sessions
4. Never use pure `#000000` for text — always `#273850` (ink)
5. Destructive buttons: red outline or red fill with confirmation modal

---

## 3.6 Typography

### Font Stack

| Role | Font | Fallback | Usage |
|------|------|----------|-------|
| **Headings & UI** | Inter | system-ui, sans-serif | All interface text, headings, labels |
| **Body** | Inter | system-ui, sans-serif | Paragraphs, descriptions, table cells |
| **Numbers & Data** | IBM Plex Sans | Inter, monospace | Currency, metrics, IDs, tables `[P1]` |

### Type Scale (8pt-aligned)

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| `display-lg` | 32px | 700 | 40px | Dashboard hero metrics |
| `display-sm` | 24px | 600 | 32px | Page titles |
| `heading-lg` | 20px | 600 | 28px | Section headers, modal titles |
| `heading-md` | 16px | 600 | 24px | Card titles, tab labels |
| `body-md` | 14px | 400 | 20px | Default body, table content |
| `body-sm` | 13px | 400 | 18px | Secondary info, metadata |
| `label-md` | 14px | 500 | 20px | Form labels |
| `caption` | 11px | 600 | 16px | Sidebar section labels, uppercase tracking |
| `metric` | 28px | 600 | 36px | KPI numbers (IBM Plex Sans) |

### Typography Rules

- Page titles: `display-sm`, ink color
- Table headers: `label-md`, muted color, uppercase optional for dense tables
- Minimum body size: 13px (never 12px for readable content)
- `-webkit-font-smoothing: antialiased` on all surfaces

---

## 3.7 Iconography

| Attribute | Specification |
|-----------|---------------|
| **Library** | Feather Icons (`react-icons/fi`) — consistent stroke style |
| **Size** | 16px (inline), 20px (nav), 24px (empty states) |
| **Stroke** | 1.5–2px visual weight |
| **Color** | `text-white/50` inactive nav, `text-brand` active, `text-muted` secondary |

### Icon Rules

- One icon style across the product — no mixing filled and outline sets
- Icons always paired with text labels in navigation (accessibility)
- Icon-only buttons require `aria-label`

---

## 3.8 Spacing & Layout Grid

### 8pt Grid System

All spacing values are multiples of 8px (4px allowed for fine adjustments within components).

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon-to-text gap, tight padding |
| `space-2` | 8px | Inline element spacing |
| `space-3` | 12px | Input padding, compact lists |
| `space-4` | 16px | Card padding, form gaps |
| `space-5` | 20px | — |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Page section gaps |
| `space-10` | 40px | Large section breaks |
| `space-12` | 48px | Page top padding |

### Layout Constants

| Element | Value |
|---------|-------|
| Sidebar width | 256px (`w-64`) |
| Header height | 64px |
| Content max-width | 1440px (dashboard), fluid (data tables) |
| Page padding | 24px desktop, 16px mobile |

---

## 3.9 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Buttons (small), badges, toasts |
| `radius-md` | 12px | **Default** — inputs, cards, nav items |
| `radius-lg` | 16px | Panels, large cards, dropdowns |
| `radius-xl` | 24px | Modals, drawers, login card |
| `radius-full` | 9999px | Avatars, status dots, pill badges |

---

## 3.10 Shadows

Enterprise-soft shadows — visible depth without Material Design heaviness.

| Token | CSS | Usage |
|-------|-----|-------|
| `shadow-sm` | `0 1px 2px rgba(39, 56, 80, 0.06)` | Cards at rest |
| `shadow-md` | `0 4px 12px rgba(39, 56, 80, 0.08)` | Dropdowns, popovers |
| `shadow-lg` | `0 8px 24px rgba(39, 56, 80, 0.12)` | Modals, drawers |
| `shadow-focus` | `0 0 0 3px rgba(41, 108, 178, 0.20)` | Focus ring (brand) |

---

## 3.11 Dark Mode `[P1]`

Dark mode is planned but not MVP-blocking. Token architecture must support it from day one:

| Light Token | Dark Equivalent (Planned) |
|-------------|---------------------------|
| `--color-canvas` `#F8FBFF` | `#0F1724` |
| `--color-surface` `#FFFFFF` | `#1A2332` |
| `--color-ink` `#273850` | `#E8EDF5` |
| `--color-line` `#D8E5F4` | `#2A3A4F` |

Implementation: CSS custom properties toggled via `data-theme="dark"` on `<html>`.

---

## 3.12 Motion & Animation

| Attribute | Value |
|-----------|-------|
| **Library** | Framer Motion |
| **Duration** | 150ms (micro), 200ms (default), 250ms (panel/modal) |
| **Easing** | `ease-out` for enter, `ease-in` for exit |
| **Principles** | No bounce, no spring overshoot, no parallax |

### Animated Elements

- Sidebar slide (mobile): 300ms
- Modal enter/exit: 200ms fade + scale(0.98 → 1)
- Toast: slide from top-right, 200ms
- Skeleton shimmer: 1.5s loop
- Page transitions: none (instant route change — speed over flash)

---

## 3.13 Brand vs. Inspiration (Legal & Design Boundary)

| Inspiration Source | What We Take | What We Do NOT Copy |
|--------------------|--------------|---------------------|
| Zoho CRM | Information density, filter bars, record detail layouts | Color scheme, icons, exact table column patterns, copy |
| HubSpot | CRM workflow stages, deal pipeline UX patterns | Orange branding, specific card designs, marketing UI |
| Linear | Keyboard shortcuts, clean issue/detail views, command palette concept | Dark-only theme, purple accent, exact sidebar |
| Notion | Minimal defaults, block-style content areas | Block editor, slash commands (unless `[P2]`) |
| Slack | Collapsible nav sections, workspace switcher pattern | Purple branding, message bubble UI |
| Stripe Dashboard | Metric cards, chart styling, generous whitespace | Exact dashboard layout, Stripe typography |

**Every screen must pass the "Vastora test":** Could a user identify this as Vastora within 3 seconds? Navy sidebar + primary blue + Inter + 12px radius = yes.

---

**Previous:** [02 — Vision & Mission](./02-vision-and-mission.md)  
**Next:** [04 — Target Users & Personas](./04-target-users-personas.md)
