# Primitives

Primitives are small named UI contracts.

Use them when a repeated layout idea needs a shared name, not when a component
just needs local styling.

`CardSideGutter` is the left or right breathing room owned by a card. Keep that
width here instead of scattering one-off margins through card components.

If a gutter contains selection UI, put a `SelectionLane` inside it. The gutter
owns the side space; the lane owns the touch target; the rail owns the visual
signal.
