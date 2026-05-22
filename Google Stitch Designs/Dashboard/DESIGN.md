---
name: Kinetic Ledger
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#424754'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#b10e6b'
  on-tertiary: '#ffffff'
  tertiary-container: '#d23284'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffd9e4'
  tertiary-fixed-dim: '#ffb0cd'
  on-tertiary-fixed: '#3e0022'
  on-tertiary-fixed-variant: '#8c0053'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.04em
  display-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: '0'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max-width: 1440px
  gutter: 24px
  margin-desktop: 40px
  card-padding: 24px
---

## Brand & Style

The design system is engineered for a high-performance desktop expense tracking experience that feels vibrant, modern, and energetic. The brand personality is "Proactive Financial Clarity"—moving away from the stodgy, static nature of traditional accounting toward a dynamic, momentum-driven interface.

The visual style is a hybrid of **Modern Corporate** efficiency and **Glassmorphism** depth. It utilizes high-saturation accents to categorize financial data, ensuring the user remains engaged with their fiscal habits. The emotional response should be one of confidence, speed, and optimism. Whitespace is used generously to prevent "data fatigue," while subtle translucent layers provide a sense of sophisticated hierarchy.

## Colors

The palette is anchored by **Electric Blue**, used for primary actions and systemic navigation. The accent colors (Vivid Mint, Hot Pink, Vibrant Orange, and Royal Purple) are functional, not decorative; they are used to differentiate expense categories and financial goals.

**Deep Slate** is the exclusive choice for text to ensure maximum legibility against the clean **White/Light Gray** background. Gradients should be used sparingly, primarily as subtle backgrounds for glassmorphic cards to create a "glow" effect through the frosted surface.

## Typography

This design system utilizes **Plus Jakarta Sans** for its contemporary, geometric proportions and high x-height, which ensures readability in data-heavy tables. 

Headings must use **Bold or Extra Bold** weights with **tight tracking** (negative letter-spacing) to achieve a "impactful" look characteristic of modern fintech. Body text maintains standard tracking for clarity. Numerical data should always be set in semi-bold weight to ensure fiscal values stand out within the layout.

## Layout & Spacing

The layout follows a **12-column fluid grid** for the main content area, with a fixed-width sidebar (280px) for navigation. A spacious 24px gutter ensures that complex financial tables and charts have room to breathe.

Spacing follows an 8px linear scale. Horizontal layouts for expense line items should use a 16px vertical padding to maintain a "touch-friendly" feel even on desktop. Large dashboard views should employ a 40px outer margin to frame the content as a cohesive, high-end "command center."

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Glassmorphism**. 

1.  **Level 0 (Background):** Light Gray (#F9FAFB).
2.  **Level 1 (Main Surface):** Pure White cards with a 20px blur, 4% opacity black shadow.
3.  **Level 2 (Active/Glass):** Surfaces with `backdrop-filter: blur(12px)` and a 1px white semi-transparent border (inner stroke). This is reserved for modals, dropdowns, and "Featured" summary cards.

Shadows are never harsh; use "Ambient Shadows" with high blur radii (24px+) and very low opacity (0.05) to simulate natural light.

## Shapes

The shape language is overtly **rounded** to evoke a friendly and approachable feeling. 

- **Cards & Containers:** 16px (rounded-lg) to 24px (rounded-xl) for large dashboard modules.
- **Buttons & Inputs:** 12px for standard elements.
- **Status Pills:** Fully rounded (pill-shaped) for category tags and status indicators.

Avoid sharp corners entirely to maintain the "Modern Soft" aesthetic.

## Components

### Buttons
Primary buttons use a solid Electric Blue fill with white text. Hover states should utilize a slight scale-up (1.02x) and an increase in shadow spread rather than just a color darken.

### Input Fields
Inputs feature a 1px Slate-200 border. On focus, the border transitions to Electric Blue with a subtle 4px outer glow (ring) in the same color at 20% opacity.

### Glass Cards
Dashboard widgets should be styled as white cards. Key metrics (e.g., "Total Balance") should use the Glassmorphism style: a translucent white background with a thin 1px white border to catch the light.

### Chips & Tags
Use the accent colors (Mint, Pink, etc.) at 10% opacity for the background and 100% opacity for the text. This ensures high-contrast readability without overwhelming the user with saturated blocks of color.

### Progress Bars
Used for budget tracking. Use a thick 8px track height with fully rounded caps. The track background is a very light version of the neutral gray, while the fill uses the vibrant accent color assigned to that category.