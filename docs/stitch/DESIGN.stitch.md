---
name: MasterPro Real Estate
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#424754'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#727786'
  outline-variant: '#c2c6d7'
  surface-tint: '#0059c7'
  primary: '#0054bc'
  on-primary: '#ffffff'
  primary-container: '#0b6bea'
  on-primary-container: '#f6f6ff'
  inverse-primary: '#afc6ff'
  secondary: '#445c9d'
  on-secondary: '#ffffff'
  secondary-container: '#9fb7ff'
  on-secondary-container: '#2d4686'
  tertiary: '#00607e'
  on-tertiary: '#ffffff'
  tertiary-container: '#007aa0'
  on-tertiary-container: '#eef8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#afc6ff'
  on-primary-fixed: '#001943'
  on-primary-fixed-variant: '#004299'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b3c5ff'
  on-secondary-fixed: '#00184a'
  on-secondary-fixed-variant: '#2b4384'
  tertiary-fixed: '#c0e8ff'
  tertiary-fixed-dim: '#71d2ff'
  on-tertiary-fixed: '#001e2b'
  on-tertiary-fixed-variant: '#004d66'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
  navy-950: '#071737'
  navy-900: '#0A1F4D'
  navy-800: '#0D2B6B'
  navy-700: '#163A85'
  blue-700: '#0957C3'
  blue-600: '#0B6BEA'
  blue-500: '#1E88F5'
  blue-100: '#DCEBFF'
  blue-50: '#EEF5FF'
  sky-400: '#3FC1F5'
  sky-300: '#5ECFFF'
  slate-900: '#0F172A'
  slate-700: '#334155'
  slate-500: '#64748B'
  slate-300: '#CBD5E1'
  slate-200: '#E2E8F0'
  slate-100: '#F1F5F9'
  slate-50: '#F8FAFC'
  white: '#FFFFFF'
  success: '#16A34A'
  warning: '#D97706'
  danger: '#DC2626'
  whatsapp: '#25D366'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 42px
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  h1-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  h2-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  price-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  price:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '800'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  overline:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.12em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a professional, trustworthy, and modern aesthetic tailored for high-end real estate transactions. By merging deep corporate navy tones with vibrant sky and primary blues, the visual identity communicates absolute reliability balanced with energetic approachability. 

The aesthetic style is clean and content-first, utilizing generous whitespace, navy-tinted ambient shadows, and precise geometric shapes to let high-resolution property imagery take center stage.

## Colors

The color palette is meticulously structured around a core of deep navies and striking primary blues, providing high contrast and clear visual hierarchy. Neutrals span from crisp white to deep slate for optimal readability across text, borders, and backgrounds. Semantic colors provide instant status feedback for property listings and interactive elements.

## Typography

Typography pairs the modern, geometric confidence of Plus Jakarta Sans for all headings, numbers, and buttons with the exceptional legibility of Inter for body copy and forms. Numeric data, particularly property prices and financial tables, enforces `font-variant-numeric: tabular-nums` to maintain vertical alignment.

## Layout & Spacing

Built on a strict 4px base rhythm, the layout system utilizes a responsive fluid grid scaling up to a maximum container width of 1280px. Section vertical spacing adapts generously between mobile (64px) and desktop (96px) viewports to create an airy, premium browsing experience.

## Elevation & Depth

Visual hierarchy is established using sophisticated, navy-tinted ambient shadows rather than harsh black drop shadows. 
- **Standard Cards:** Soft elevation (`0 1px 2px rgb(13 43 107 / 0.06), 0 4px 12px rgb(13 43 107 / 0.06)`) grounds listing elements.
- **Hover States:** Elevated lift (`0 8px 24px rgb(13 43 107 / 0.12)`) provides immediate interactive feedback.
- **Popovers & Search Boxes:** Deep diffusion (`0 12px 32px rgb(13 43 107 / 0.16)`) separates critical floating components from the page canvas.

## Shapes

The shape language utilizes smooth, approachable curves that balance modern consumer software with architectural precision.
- **Badges & Small Inputs:** 8px (`--radius-sm`)
- **Inputs & Standard Buttons:** 12px (`--radius-md`)
- **Property Cards & Containers:** 16px (`--radius-lg`)
- **Hero Search & Banners:** 24px (`--radius-xl`)
- **Pills & Avatars:** Full roundedness

## Components

- **Buttons:** Primary actions utilize solid blue (`#0B6BEA`) with hover states in darker blue, while secondary actions use subtle slate borders. Dedicated WhatsApp triggers use brand green (`#25D366`) with high-contrast dark foreground text.
- **Property Cards:** Feature a 4:3 image aspect ratio with a subtle zoom on hover, clear typographic price hierarchy, and status badges pinned to the top corners.
- **Input Fields:** Styled with 1px `slate-300` borders, 12px corner radii, and a 2px primary blue focus ring with a white offset.
- **Chips & Badges:** Compact elements utilizing soft pastel backgrounds with matching saturated text for statuses such as *Tayang*, *Draf*, and property types.
- **Lists & Tables:** Clean rows separated by `slate-200` dividers with alternate row tinting (`blue-50`) on hover for data-dense management dashboards.