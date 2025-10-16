# Running Route Planner - Design Guidelines

## Design Approach
**Reference-Based Approach** drawing from industry leaders in fitness and mapping:
- **Primary Inspirations**: Strava (route planning), Google Maps (mapping UI), AllTrails (outdoor focus)
- **Key Principles**: Map-first interface, minimal chrome, athletic professionalism, data clarity

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**
- Background Base: 220 15% 12% (Deep navy-slate for map contrast)
- Surface Elevated: 220 12% 18% (Control panels, cards)
- Surface Hover: 220 10% 22%
- Primary Brand: 210 95% 55% (Vibrant athletic blue for route lines)
- Primary Hover: 210 95% 48%
- Success/Active: 142 70% 45% (Route confirmation, completed segments)
- Text Primary: 220 8% 98%
- Text Secondary: 220 8% 70%
- Border Subtle: 220 12% 25%

**Light Mode**
- Background Base: 0 0% 100% (Clean white)
- Surface: 220 10% 97%
- Primary Brand: 210 90% 48%
- Text Primary: 220 15% 15%
- Border: 220 10% 88%

### B. Typography
**Font Stack**: 
- Primary: 'Inter', system-ui, sans-serif (clean, athletic readability)
- Monospace: 'JetBrains Mono', monospace (distance/elevation data)

**Type Scale**:
- Hero Data (distance): text-4xl/text-5xl, font-bold, tracking-tight
- Section Headers: text-lg/text-xl, font-semibold
- Body/Controls: text-sm/text-base, font-medium
- Data Values: text-base, font-mono, font-semibold
- Labels: text-xs, font-medium, uppercase, tracking-wide

### C. Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-4, p-6
- Section gaps: gap-4, gap-6
- Large spacing: mt-8, mb-12

**Map-First Layout**:
- Map occupies 100% viewport height and width as base layer
- Floating UI panels positioned absolutely with backdrop-blur-md
- Left sidebar: Route controls (w-80, fixed)
- Top bar: Map/satellite toggle, search (h-16, fixed top-0)
- Bottom drawer: Elevation profile (h-48, expandable to h-64)
- Right panel: Export/share options (w-72, slide-in)

### D. Component Library

**Core UI Elements**:
- **Route Stats Card**: Floating panel (top-left), rounded-2xl, backdrop-blur-lg bg-background/95, shadow-2xl
  - Large distance display with unit toggle (mi/km)
  - Elevation gain/loss indicators
  - Route duration estimate
  
- **Map Controls**: 
  - Rounded-full buttons with shadow-lg
  - Icon-only primary actions (zoom, locate, fit-to-route)
  - Size: 44x44px minimum for touch targets
  
- **Route Point Markers**:
  - Start: Green circle with flag icon, ring-4 ring-success/30
  - Waypoints: Blue circles, ring-2 ring-primary/40, draggable
  - End: Red circle with finish flag, ring-4 ring-red-500/30
  - Active/hover: Scale-110 transform with drop-shadow-lg

**Navigation**:
- Top toolbar: Transparent bg with backdrop-blur, border-b border-border/50
- Mode selector: Segmented control (Walking/Running/Cycling/Manual)
- Map type toggle: Pills design with active state highlight

**Forms & Inputs**:
- Search bar: Full-width, rounded-lg, h-12, with magnifying glass icon-left
- Distance unit toggle: Small badge-style toggle in stats card
- Route name input: Inline edit with ghost button appearance

**Data Displays**:
- Elevation Chart: SVG line chart with gradient fill, grid lines every 100ft/30m
- Distance markers: Small floating pills along route every 0.5mi/1km
- Turn-by-turn list: Collapsible panel with segment distances

**Overlays**:
- Export modal: Centered card, max-w-md, with GPX/KML format options
- Share dialog: Copy link input with one-click copy button
- Settings drawer: Slide-in from right, full-height

### E. Interaction Patterns

**Route Creation**:
- Click map to add points: Subtle ripple animation at click location
- Drag points: Shadow increases, cursor changes to move
- Hover segments: Highlight with thicker stroke, show insert point indicator
- Delete point: Shift-click or drag to trash zone (bottom-right corner)

**Map Navigation**:
- Scroll to zoom: Smooth easing
- Click-drag to pan: Inertia enabled
- Double-click: Zoom to location
- Pinch gestures: Standard mobile map controls

**Visual Feedback**:
- Route line: 4px stroke, rounded caps, primary color with 90% opacity
- Calculating route: Animated dashed line before route resolves
- Error state: Red dashed line if routing fails
- Completed route: Solid line with subtle drop shadow

### F. Responsive Behavior

**Desktop (lg+)**:
- All panels visible, map takes remaining space
- Elevation chart always visible at bottom

**Tablet (md)**:
- Left panel collapses to icon bar
- Elevation chart becomes overlay (tap to expand)

**Mobile (base)**:
- Full-screen map by default
- Bottom sheet for stats/controls (draggable handle)
- Elevation chart in expandable accordion
- Search and mode selector in compact top bar

## Images

**Hero/Landing Section** (if creating a marketing page):
- Hero image: Professional runner on scenic trail with GPS watch, overlay with semi-transparent gradient (from background-base/80 to transparent)
- Image placement: Full-width hero, h-screen with content overlay
- Additional imagery: Feature cards showing map interface screenshots, elevation profiles, mobile app views

**App Interface**:
- Map tiles: OpenStreetMap or satellite imagery via Leaflet/Mapbox
- No decorative images within map tool itself (maintain focus on cartography)
- Icons only: Heroicons for all UI controls

## Design Distinctions

**Unique Elements**:
- Elevation profile with interactive scrubber that highlights position on map
- Weather overlay option showing conditions along route
- Distance badges floating directly on route line
- "Snap to roads" visual indicator (dotted preview line before confirming)
- Multi-segment routes with different routing modes per segment (shown with varied line styles)

**Professional Athletic Aesthetic**:
- Sharp, precise data presentation
- High contrast for outdoor visibility
- Performance-focused interaction speeds (<100ms feedback)
- Trust-building through clean, uncluttered design
- Empowering tools presentation vs. restrictive interfaces