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

`SheetSection` is the place where we can later give keyboard-aware regions a
clear name. Keyboard lift is not fully solved yet, so avoid adding one-off
keyboard hacks inside individual modals.
