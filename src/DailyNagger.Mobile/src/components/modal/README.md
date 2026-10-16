# Modal Components

This folder owns the shared sheet/modal language.

Modals can contain very different workflows, but they should still feel like the
same app. Put common sheet structure here instead of rebuilding title rows,
close buttons, footer buttons, chips, spacing, and simple controls inside each
modal.

## How To Work Here

- Use `SheetModal` as the outer frame.
- Use sheet components for common pieces: `SheetHeader`, `SheetSection`,
  `SheetFooterActions`, `SheetButton`, `SheetChip`, `SheetChipRow`,
  `SheetToggleGroup`, `SheetSegmentedControl`, `SheetWheel`, and
  `SheetHeadingBelt`.
- If a modal needs a new repeated visual primitive, add a small sheet component
  here first.
- Keep it clean and avoid modal-local styling. If a modal needs layout or
  visual structure, make a small component that can be shared in the future.
- Move repeated color, spacing, and tone decisions into `theme.ts` or into the
  shared sheet component that owns them.

## Boundaries

This folder should describe sheet behavior and sheet building blocks. It should
not explain the domain rules inside each modal.

For example, this folder can explain how a heading belt behaves. It should not
explain how schedule rules are calculated.

## Keyboard Work

`SheetModal` owns the animated keyboard lift. `SheetSearchInput` and
`SheetTextArea` report focus and layout through the shared input-focus context.
The sheet moves only as far as necessary to keep the focused field above the
keyboard with the configured gap. Its existing lift is removed from each
measurement before calculating the new target, so lift does not accumulate.

Use `SheetSection` for grouping and spacing, not keyboard behavior. Avoid
modal-local keyboard adjustments. Animation timing and native keyboard geometry
still require visual checks on a physical device.
