# Selection Lane

Selection lanes exist because a rail is too small to be the whole touch target.

The lane is interaction space. The rail is visual meaning. Comfort space is the
forgiving area around the rail that lets a finger miss slightly without selecting
the wrong node.

Do not use `hitSlop` to reach outside the parent view. React Native clips that
space at parent boundaries, and overlapping hit areas make it unclear which row
should win the touch.

The lane owns its width in real layout. The visible rail stays narrow, but the
pressable lane is wider and predictable.

Keep this component boring:

- change lane width here, not in individual cards
- change rail width here, not in individual cards
- use rail tone for meaning: active, completed, neutral
- do not add z-index overlays to make rails easier to hit

If the tree later gets scrub/drag selection, build it on top of this lane
contract instead of adding separate invisible touch layers.
