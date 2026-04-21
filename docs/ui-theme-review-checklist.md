# UI Theme Review Checklist

Use this checklist for every new or refactored UI module.

## Global Rules

- [ ] Uses semantic theme tokens, not hard-coded hex values
- [ ] Uses `on-surface` family for text; does not use `#000000`
- [ ] Uses 6px (`0.375rem`) radius for interactive controls
- [ ] Uses surface tiers to separate sections
- [ ] Avoids `1px solid` separators for sectioning

## Components

- [ ] Primary CTA uses 135deg gradient from `primary` to `primary-container`
- [ ] Secondary button uses `surface-container-highest` background
- [ ] Tertiary button uses transparent background with `primary` text
- [ ] Inputs default to `surface-container-lowest`
- [ ] Focused inputs switch background and show `surface-tint` glow
- [ ] Cards/lists separate with spacing or hover surface shifts (not lines)
- [ ] Floating layers use ambient shadow `0 8px 32px rgba(25, 28, 30, 0.06)`

## Special Surfaces

- [ ] Code editor zones use `inverse-surface` dark background
- [ ] Code editor zones use monospaced stack
- [ ] Syntax colors follow inverse theme tokens
