# Design System Specification: The Cognitive Architect

## 1. Overview & Creative North Star
This design system is built for the next generation of AI orchestration. Moving beyond the "standard" enterprise template, we are adopting a Creative North Star we call **"The Cognitive Architect."** 

The Cognitive Architect represents the intersection of developer precision and executive clarity. It rejects the "flat and boxy" nature of traditional B2B platforms in favor of **Tonal Fluidity.** We achieve this by replacing rigid structural lines with sophisticated layering and intentional asymmetry. The UI should feel like a high-end physical workspace: a clean, organized desk where tools are nested in logical tiers, using depth and light—rather than ink—to define boundaries.

### Design Principles
*   **Precision over Padding:** Maintain high information density suitable for an IDE, but use whitespace as a functional tool to prevent cognitive overload.
*   **Layered Logic:** Importance is defined by elevation and surface shifts, not by borders.
*   **The "Human-in-the-Loop" Polish:** Use glassmorphism and subtle gradients to remind the user that while the data is cold, the experience is premium and intuitive.

---

## 2. Color & Surface Philosophy
The palette is anchored in **Deep Tech Blue**, but its soul lies in the neutral `surface-container` tiers.

### The "No-Line" Rule
To achieve a signature editorial feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through background shifts.
*   **Navigation & Sidebars:** Use `surface_container_low` (#f2f4f7) against a `surface` background (#f7f9fc).
*   **Content Areas:** Use `surface_container_lowest` (#ffffff) for main workbenches to draw the eye to the active task.

### Surface Hierarchy & Nesting
Treat the UI as physical layers.
1.  **Base Layer:** `surface` (#f7f9fc) — The "floor" of the application.
2.  **Infrastructure Layer:** `surface_container_low` — Sidebars and utility panels.
3.  **Active Workspace:** `surface_container_lowest` — The primary canvas or editor.
4.  **Floating Utility:** `surface_container_high` — Modals and popovers.

### The "Glass & Gradient" Rule
To move beyond a "generic" feel:
*   **Primary Actions:** CTAs should use a subtle linear gradient from `primary` (#0057c2) to `primary_container` (#006ef2) at a 135° angle.
*   **Floating Navigation:** Use semi-transparent `surface_container_lowest` (85% opacity) with a `20px` backdrop-blur for a "frosted glass" effect on headers.

---

## 3. Typography
We utilize the **Inter** stack for its mechanical perfection and high readability at small scales.

| Role | Token | Weight | Size | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Metric** | `display-md` | 700 | 2.75rem | -0.02em |
| **Section Header** | `headline-sm` | 600 | 1.5rem | -0.01em |
| **Panel Title** | `title-sm` | 600 | 1rem | 0 |
| **Primary UI Text** | `body-md` | 400 | 0.875rem | 0 |
| **Metadata/Code** | `label-md` | 500 (Mono) | 0.75rem | +0.02em |

**Editorial Note:** Use `display-sm` for empty states and onboarding headers. Large, high-contrast typography creates an authoritative voice that counters the high density of the data-heavy views.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering**, not structure.

*   **Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section to create a soft, natural lift.
*   **Ambient Shadows:** For floating elements (Modals/Dropdowns), use an extra-diffused shadow: `0 8px 32px rgba(25, 28, 30, 0.06)`. Note the shadow color uses a tint of `on_surface` (#191c1e) to mimic natural light.
*   **The Ghost Border Fallback:** If a border is required for accessibility in complex data tables, use the `outline_variant` token (#c1c6d7) at **20% opacity**. Never use 100% opaque lines.

---

## 5. Components

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. White text. `0.375rem` (md) corner radius.
*   **Secondary:** `surface_container_highest` background with `on_surface` text. No border.
*   **Tertiary:** Transparent background, `primary` text. No border.

### The Agent Editor (IDE Style)
The code editor (for Skill/Prompt editing) is the heart of the platform. 
*   **Background:** `inverse_surface` (#2d3133) for a dark-mode focus area within a light-mode app.
*   **Monospaced Stack:** `JetBrains Mono, Fira Code, monospace`.
*   **Syntax Highlighting:** 
    *   Keywords: `inverse_primary` (#afc6ff)
    *   Strings: `tertiary_fixed_dim` (#ffb695)
    *   Functions: `secondary_container` (#a3befe)

### Cards & Lists
*   **Rule:** Forbid divider lines. 
*   **Implementation:** Separate list items using `8px` of vertical white space or a hover state that shifts the background to `surface_container_high`.
*   **Nesting:** Cards should always be one "tier" higher than the surface they sit on (e.g., a `surface_container_lowest` card on a `surface_container_low` background).

### Input Fields
*   **State:** Default background should be `surface_container_lowest`. 
*   **Focus:** Transition the background to `surface_container_high` and apply a `2px` `surface_tint` (#0059c7) outer glow with 10% opacity.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `0.375rem` (6px) rounded corners for all interactive elements to maintain the "Modern Professional" aesthetic.
*   **Do** favor asymmetric layouts. A wide workbench on the left with a narrow, dense utility rail on the right creates a focused editorial feel.
*   **Do** use `tertiary` (#9e3d00) for "Attention" moments that aren't quite errors, like AI processing warnings.

### Don't
*   **Don't** use standard black (#000000) for text. Always use `on_surface` (#191c1e) to maintain tonal softness.
*   **Don't** use 1px dividers to separate header from body. Use a `surface_container_low` background for the header and `surface_container_lowest` for the body.
*   **Don't** clutter the UI with icons. Use icons only for primary navigation and distinct actions to keep the "Minimalist" promise.