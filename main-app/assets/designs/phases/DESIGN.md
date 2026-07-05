---
name: Academic Trust
colors:
  surface: '#f7f9ff'
  surface-dim: '#cbdcee'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf4ff'
  surface-container: '#e2efff'
  surface-container-high: '#d9eafc'
  surface-container-highest: '#d4e4f6'
  on-surface: '#0d1d2a'
  on-surface-variant: '#444650'
  inverse-surface: '#223240'
  inverse-on-surface: '#e7f2ff'
  outline: '#757682'
  outline-variant: '#c5c6d2'
  surface-tint: '#435b9f'
  primary: '#00113a'
  on-primary: '#ffffff'
  primary-container: '#002366'
  on-primary-container: '#758dd5'
  inverse-primary: '#b3c5ff'
  secondary: '#2552ca'
  on-secondary: '#ffffff'
  secondary-container: '#446ce4'
  on-secondary-container: '#fffbff'
  tertiary: '#00171b'
  on-tertiary: '#ffffff'
  tertiary-container: '#002d33'
  on-tertiary-container: '#009eb0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#00174a'
  on-primary-fixed-variant: '#2a4386'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164e'
  on-secondary-fixed-variant: '#003baf'
  tertiary-fixed: '#9cf0ff'
  tertiary-fixed-dim: '#00daf3'
  on-tertiary-fixed: '#001f24'
  on-tertiary-fixed-variant: '#004f58'
  background: '#f7f9ff'
  on-background: '#0d1d2a'
  surface-variant: '#d4e4f6'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  button-text:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 24px
  gutter: 16px
  desktop-max-width: 1280px
  tablet-breakpoint: 768px
  mobile-breakpoint: 375px
---

## Brand & Style

The design system is engineered to project absolute reliability and institutional security for educational environments. The target audience includes school administrators, teachers, and students, necessitating a UI that feels both authoritative and approachable.

The aesthetic follows a **Corporate / Modern** direction with subtle **Glassmorphism** influences for secondary overlays. It prioritizes clarity and high-legibility layouts to ensure that biometric data and attendance records are processed without cognitive friction. The emotional response is one of "Professional Peace of Mind"—the system should feel like a high-end academic tool that is impossible to break and intuitive to navigate.

## Colors

This design system utilizes a hierarchical color palette to establish trust and signal biometric activity:

- **Deep Navy (#002366):** Used for primary navigation, headers, and core brand elements to signify stability and security.
- **Royal Blue (#4169E1):** The primary action color for buttons, active states, and focus indicators.
- **Bright Cyan (#00E5FF):** Reserved for "Active Biometric" states, success indicators, and highlighting modern tech features like fingerprint or face-scan animations.
- **Slate Gray (#708090):** Utilized for secondary text, metadata, and borders to provide soft contrast without the harshness of black.
- **White (#FFFFFF) & Base (#F8FAFC):** High-clarity backgrounds to keep the interface feeling spacious and academic.

## Typography

The design system employs **Manrope** as its primary typeface to strike a balance between geometric modernity and professional warmth. Its high x-height ensures legibility for student names and ID numbers across various screen sizes.

**JetBrains Mono** is introduced selectively for IDs, timestamps, and biometric data strings. This monospaced font reinforces the "Security/Data" aspect of the product, providing a technical contrast to the soft, approachable nature of the primary font. Headline weights are kept bold to establish a clear information hierarchy, while body text uses generous line-heights for academic readability.

## Layout & Spacing

The design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The spacing rhythm is based on an 8px baseline, ensuring all components align with mathematical precision.

- **Desktop:** Large containers are centered with a 1280px max-width. Use 24px margins to allow the UI to breathe.
- **Tablet:** Columns collapse to 8; margins remain at 24px.
- **Mobile:** Elements reflow into a single column. Spacing between cards is reduced to 16px to maximize screen real estate for list views.
- **Safe Zones:** Always maintain a minimum of 16px padding inside all "xl" rounded cards to prevent content from crowding the corners.

## Elevation & Depth

To achieve a modern, secure feel, this design system avoids heavy, dark shadows in favor of **Soft Ambient Shadows**.

1.  **Resting State:** Primary cards use a very subtle shadow: `0px 4px 12px rgba(0, 35, 102, 0.05)`. This adds depth while maintaining a flat, clean academic aesthetic.
2.  **Raised State (Hover):** When interacting with interactive cards or buttons, the shadow intensifies: `0px 8px 24px rgba(0, 35, 102, 0.12)`.
3.  **Biometric Overlays:** Use a backdrop blur (12px) with a semi-transparent white tint (80% opacity) for modal dialogs. This creates a "Glassmorphism" effect that focuses the user's attention on the biometric scan without losing the context of the background dashboard.

## Shapes

The design system uses a **Rounded (xl)** shape language to soften the institutional nature of the app and make it feel more accessible to students. 

- **Primary Cards:** Use the `rounded-xl` (1.5rem / 24px) setting to create large, friendly containers for student profiles and attendance summaries.
- **Buttons & Inputs:** Use the standard `rounded-lg` (1rem / 16px) for a modern, tactile feel.
- **Status Pills:** Use a fully rounded/pill shape (9999px) to distinguish them from structural elements.

## Components

- **Buttons:** Primary buttons are solid Royal Blue with white text. Secondary buttons use a Slate Gray outline. The "Scan" button should utilize a Bright Cyan glow effect when the biometric reader is active.
- **Cards:** All cards must be `rounded-xl`. They should have a 1px border in a very light Slate Gray (`#E2E8F0`) to define their boundaries on white backgrounds.
- **Inputs:** Form fields should have a background of `#F1F5F9` and a 2px bottom border that turns Royal Blue on focus.
- **Biometric Indicator:** A dedicated component featuring a pulsing Bright Cyan ring to indicate "Waiting for Scan."
- **Attendance Chips:** Small pill-shaped indicators. "Present" (Green/Cyan tint), "Absent" (Soft Red), "Late" (Amber). Use low-saturation background tints with high-saturation text for readability.
- **Lists:** Attendance lists should use generous vertical padding (16px per row) and a thin divider line. Every 5th row should have a subtle blue tint for better tracking across large data sets.