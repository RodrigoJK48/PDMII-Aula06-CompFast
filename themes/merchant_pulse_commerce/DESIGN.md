---
name: Merchant Pulse Commerce
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#4b4731'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#7c775f'
  outline-variant: '#cdc7aa'
  surface-tint: '#6a5f00'
  primary: '#6a5f00'
  on-primary: '#ffffff'
  primary-container: '#ffe600'
  on-primary-container: '#726600'
  inverse-primary: '#dec800'
  secondary: '#0058bb'
  on-secondary: '#ffffff'
  secondary-container: '#1171e7'
  on-secondary-container: '#fefcff'
  tertiary: '#006d32'
  on-tertiary: '#ffffff'
  tertiary-container: '#7bff9d'
  on-tertiary-container: '#007637'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#fde400'
  primary-fixed-dim: '#dec800'
  on-primary-fixed: '#201c00'
  on-primary-fixed-variant: '#504700'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#78fc9b'
  tertiary-fixed-dim: '#5adf81'
  on-tertiary-fixed: '#00210b'
  on-tertiary-fixed-variant: '#005224'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
  metric-display:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

The design system establishes a high-velocity, utilitarian, and dependable merchant operations platform. Tailored for retail business owners, store operators, and warehouse managers running mobile and PWA administrative workflows, the system balances retail energy with administrative control. 

The aesthetic is Modern Retail Utility: functional clarity paired with deliberate focal points. It draws from retail marketplace traditions—anchored by an energetic signal yellow that evokes retail immediacy and transactional velocity—yet remains strictly focused on task efficiency, catalog accuracy, and revenue intelligence. The experience eliminates cognitive friction: dense information is organized into clear visual segments, primary calls-to-action are instantly recognizable, and critical merchant states (active sales, low inventory, urgent logistics) communicate through unambiguous, standard color signals.

## Colors

The palette delivers visual hierarchy with purpose-driven color roles:

- **Primary Yellow (`#FFE600` / Canvas Tint `#FFF159`):** Reserved for primary brand orientation, application headers, identity badges, and high-level navigational anchors. Yellow is strictly a contextual/brand container and status spotlight; it is never used for generic text or low-contrast backgrounds behind white type.
- **Action & Focus Blue (`#3483FA` / Pressed `#2968C8` / Deep Contrast `#2D3277`):** Directs the merchant's operational flow. All clickable system actions, primary interactive triggers, active tab selections, and external/navigation links leverage Blue to establish confidence and direct affordance.
- **Commercial Green (`#00A650` / Surface Light `#E6F7EE`):** Serves real-time merchant success signals—positive cash flow, completed shipments, online catalog items, and stock readiness.
- **Urgent Red (`#F23D4F` / Surface Light `#FEECEC`):** Signals stock depletion, system errors, order cancellations, and time-critical merchant alerts.
- **Neutrals & Surfaces:** Built on deep charcoal (`#333333`) for high-legibility body type, mid-gray (`#666666`) for metadata and secondary context, structured border gray (`#EBEBEB`), and soft background canvas (`#F5F5F5` and `#FFFFFF`) to prevent eye fatigue during continuous store management.

## Typography

The typography uses Inter across all levels to optimize tabular scanning, monetary values, and dense administrative data tables on compact mobile displays. 

- **Numerical & Metric Hierarchy:** Financial values and inventory counts use `metric-display` with tabular lining numbers (`tnum`) enabled by default to ensure alignment across stacked order rows.
- **Headlines:** Compact, low-tracking headlines prioritize vertical space preservation, allowing product titles and logistics metrics to fit within limited vertical viewports.
- **Micro-copy & Labels:** Status indicators, warehouse tags, and tabular badges use uppercase or medium-weight variants of `label-sm` and `label-md` to remain distinct from editable form data.

## Layout & Spacing

The layout is built for fluid mobile-first presentation, expanding gracefully to tablet viewports for in-store checkout or inventory scanning docks:

- **Vertical Grid Rhythm:** A strict 4px base increment drives layout decisions. Standard mobile views utilize a 16px (`1rem`) outer margin to maximize screen real estate while preventing edge mis-taps.
- **Fluid Administrative Canvas:** Content runs on a fluid container system constrained to a maximum width of 768px on tablets or wide screens, centering the administrative workflow to reduce horizontal eye travel.
- **Edge-to-Edge Navigation Zones:** The top administrative bar and bottom operational bar occupy persistent, fixed view positions with dedicated safe-area padding for mobile home indicators and notch areas.
- **Card-Stack Spacing:** List items, summary blocks, and orders stack with an 8px (`0.5rem`) gap, maintaining distinct interactive targets while maintaining scan density.

## Elevation & Depth

Visual hierarchy uses clean, tonal layering combined with low-contrast edge definition to prevent visual clutter in data-dense merchant dashboards:

- **Level 0 (Canvas):** The base canvas (`#F5F5F5`) remains matte and non-reflective, providing a high-contrast backing for pure white operational cards.
- **Level 1 (Card & Modular Surfaces):** Standard modules, product list entries, and metric tiles sit on `#FFFFFF`, framed with a precise 1px border (`#EBEBEB`) and an ambient, low-spread drop shadow: `0 1px 3px rgba(0, 0, 0, 0.05)`.
- **Level 2 (Dropdowns, Sheets, & Bottom Bars):** Bottom navigation bars, modal filters, and actionable search sheets introduce elevation with zero border, relying on directional upward projection: `0 -2px 8px rgba(0, 0, 0, 0.08)`.
- **Level 3 (Alert Modals & Overlays):** Full-screen critical confirmations sit over a darkened backdrop (`rgba(0, 0, 0, 0.60)`), casting a centered shadow: `0 8px 24px rgba(0, 0, 0, 0.15)`.

## Shapes

The interface balances soft, modern ergonomics with high-density utilitarian layouts:

- **Operational Cards:** Metric summaries, order previews, and catalog item cards use an 8px base radius (`0.5rem`), transitioning to 12px–16px (`rounded-lg` / `rounded-xl`) for elevated bottom-sheet modules and modal cards.
- **Pill Badges:** Status tokens (order progress, logistics state, inventory alerts) strictly utilize a full pill radius (`9999px`) to immediately distinguish them from clickable rectangular cards and form controls.
- **Form Controls & Action Buttons:** Inputs and buttons utilize standard rounded corners (8px) for comfortable touch targets without sacrificing rectangular boundary clarity.

## Components

### Top Application Bar (Branded Header)
- **Visuals:** Solid brand yellow (`#FFE600`) background, 56px fixed height, containing the store identity mark, quick-store switcher, and notification bell with an active alert dot.
- **Behavior:** Sticks to viewport top, projecting a subtle border-bottom (`#E5CF00`) into the scrolling content area.

### Bottom Navigation Bar (Mobile / PWA)
- **Visuals:** Pure white (`#FFFFFF`) surface, 64px height plus device safe area, containing 4 to 5 key views: Dashboard, Orders, Products, Metrics, Menu.
- **States:** Inactive tabs use neutral charcoal (`#666666`) at 20px icon size; active tabs transition to primary action blue (`#3483FA`) with bold weight labels and an active top-indicator micro-bar.

### Primary, Secondary, & Action Buttons
- **Primary Action (Execute / Save / Confirm):** High-contrast blue background (`#3483FA`), white text, 48px height for finger tap ergonomics, `label-lg` bold typography.
- **Secondary Action (Filter / Cancel):** Transparent fill with a 1px border (`#3483FA`), blue label, or light tint (`#F5F5F5`) for neutral dismiss actions.
- **Bulk Floating Button:** PWA floating operational buttons use a rounded pill structure with blue fill and elevated Level 2 shadow.

### Status Badges & Merchant Chips
- **Success (Delivered / Paid / In Stock):** Soft green surface (`#E6F7EE`), deep forest green text (`#00823E`), 24px height, pill radius.
- **Warning (Low Stock / Expiring):** Soft yellow surface (`#FFF9CC`), dark amber-brown text (`#7A5800`), pill radius.
- **Critical (Cancelled / Out of Stock / Delayed):** Soft red surface (`#FEECEC`), deep crimson text (`#C41829`), pill radius.
- **Informative (Processing / Transit):** Soft blue surface (`#EAF2FE`), deep blue text (`#1C54A7`), pill radius.

### Form Inputs & SKU Controls
- **Fields:** 48px height, white background, 1px solid border (`#CCCCCC`), switching to a 2px blue ring (`#3483FA`) on focus. Floating or anchored top labels use `label-sm` in dark charcoal.
- **Numerical Step Controls:** Integrated fast-increment triggers for inventory tallying with clean dividers and high-target tap zones.

### Card Modules & Order Rows
- **Layout:** Contained within 8px rounded white modules. Order cards display customer/order ID top-left, status pill top-right, thumbnail strip with line items in the center, and a single prominent blue CTA ("Prepare Dispatch", "Print Label") at the bottom.