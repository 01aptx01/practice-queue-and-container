---
name: Async Queue Monitor
description: Developer-focused dashboard for monitoring Celery tasks and Redis queues.
---

<!-- SEED: re-run $impeccable document once there's code to capture the actual tokens and components. -->

# Design System: Async Queue Monitor

## 1. Overview

**Creative North Star: "The Telemetry Console"**

The design philosophy is driven by technical precision, data density, and immediate feedback. It borrows the strictness of Linear, the density of Datadog, and the high-contrast precision of Vercel. It is built for developers who need to instantly read the state of background tasks without visual noise. This system explicitly rejects generic SaaS Bootstrap admin templates, soft rounded bubbles, and excessive whitespace.

**Key Characteristics:**
- High data density over whitespace.
- Code-native typography for all metrics and IDs.
- Responsive but strictly utilitarian motion.
- High contrast against a deep technical slate background.

## 2. Colors

**The Restrained Rule.** Tinted neutrals form the bulk of the surface area, with a single Phosphor Green accent used sparingly (≤10%) to draw the eye exclusively to active status indicators and primary actions.

### Primary
- **Phosphor Green** ([to be resolved during implementation]): Status indicators (running/success) and primary active states.

### Neutral
- **Deep Technical Slate** ([to be resolved during implementation]): The primary dark background canvas.
- **Muted Ink** ([to be resolved during implementation]): Secondary text and subtle borders.

## 3. Typography

**The Mono-Forward Rule.** All critical data (Task IDs, timestamps, durations) is set in a monospace typeface to ensure character alignment and a developer-native feel.

**Display Font:** [font pairing to be chosen at implementation]
**Body Font:** [font pairing to be chosen at implementation]
**Mono Font:** [font pairing to be chosen at implementation]

**Character:** Technical, tabular, and highly legible at small sizes.

### Hierarchy
- **Display** ([weight], [size], [line-height]): Section headers.
- **Headline** ([weight], [size], [line-height]): Card or table titles.
- **Title** ([weight], [size], [line-height]): Sub-groupings.
- **Body** ([weight], [size], [line-height]): General prose.
- **Label** ([weight], [size], [letter-spacing], [case]): Table headers, metadata, and status badges.

## 4. Elevation

**The Flat-By-Default Rule.** Surfaces are flat at rest. Elevation is used sparingly and only to clarify state (e.g., hover feedback or active focus), relying on tonal contrast rather than heavy drop shadows.

## 5. Components

*(Components to be populated once code is implemented)*

## 6. Do's and Don'ts

### Do:
- **Do** align numerical data and Task IDs strictly using monospace fonts.
- **Do** rely on tonal contrast to separate panels rather than thick borders or heavy shadows.

### Don't:
- **Don't** build a generic SaaS Bootstrap admin template.
- **Don't** use soft rounded bubbles or excessive corner radii.
- **Don't** waste screen real estate on excessive whitespace; prioritize data density.
