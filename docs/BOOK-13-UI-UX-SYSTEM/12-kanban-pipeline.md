# Chapter 12 — Kanban & Pipeline Boards

**Book:** 13 — UI/UX System · **Chapter:** 12  
**Version:** 1.0.0-draft  
**Implements:** [Book 2 Part 4 — Kanban Board](../../BOOK-02-CRM/part-04-deals/04-deal-kanban-board-ui.md)

---

## 12.1 Design Intent

Kanban boards deliver **Zoho CRM-level information density** inside **Vastora visual language**. Reference inspiration: [Zoho CRM pipeline](https://www.zoho.com/crm/) — never copy layout pixel-for-pixel.

---

## 12.2 Component Tree

```
<PipelineBoard>
  <PipelineToolbar />        // filters, view toggle, + New Deal
  <PipelineFilterBar />    // chip filters
  <PipelineColumnsScroll>
    <StageColumn stage={}>
      <StageColumnHeader />  // name, count, sum, color strip
      <DealCardList>
        <DealCard deal={} draggable />
      </DealCardList>
      <AddDealButton />
    </StageColumn>
  </PipelineColumnsScroll>
  <PipelineSummaryBar />   // footer metrics
</PipelineBoard>
```

---

## 12.3 Tokens (Kanban-Specific)

| Token | Value |
|-------|-------|
| `--kanban-column-width` | 300px |
| `--kanban-column-gap` | 16px |
| `--kanban-card-radius` | 12px |
| `--kanban-card-padding` | 12px |
| `--kanban-card-gap` | 8px |
| `--kanban-header-height` | 56px |
| `--kanban-drag-shadow` | `0 12px 32px rgba(39,56,80,0.15)` |

---

## 12.4 DealCard States

| State | Classes |
|-------|---------|
| Default | `bg-surface border border-line rounded-xl shadow-sm` |
| Hover | `shadow-md -translate-y-px` |
| Dragging | `opacity-90 ring-2 ring-brand/40 shadow-lg scale-[1.02]` |
| Overdue | `border-l-[3px] border-l-danger` |
| Won | `border-l-[3px] border-l-success` |
| Lost | `opacity-80 border-l-[3px] border-l-muted` |

---

## 12.5 Motion

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Card hover lift | 150ms | ease-out |
| Drop settle | 200ms | ease-out |
| Column highlight | 150ms | ease-out |
| **No** spring bounce | — | — |

Use Framer Motion `layout` prop for smooth card reflow on drop.

---

## 12.6 Accessibility

- Drag handles keyboard-accessible: `Space` pick up, `Arrow` move column, `Space` drop
- `aria-grabbed` on dragging card
- Column headers: `role="region"` + `aria-label="{stage name}, {count} deals"`

---

## 12.7 Responsive

See Book 2 Part 4 §4.15 — mobile uses accordion, not Kanban.

---

## 12.8 Do / Don't

| ✅ Do | ❌ Don't |
|-------|---------|
| Use Vastora navy sidebar + canvas bg | Use Zoho white sidebar |
| IBM Plex Sans for amounts | Copy Zoho's exact card layout |
| 12px radius cards | Sharp 4px Zoho-style corners |
| Brand `#296CB2` accents | Zoho's proprietary blue |
| Feather icons | Zoho icon pack |

---

**Related:** [Deal Stage Stepper](./16-timeline-activity.md) in Deal 360
