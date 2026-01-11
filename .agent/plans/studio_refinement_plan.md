# Subliminal Studio Refinement Plan

## Objective
Fix broken functionality, resolve UI redundancies, fix timeline visualization issues, and polish the interface to match a premium "Apple-style" aesthetic.

## 1. Timeline & Visualization Fixes
**Issue:** Audio waveform visualization does not adapt correctly when zooming.
**Solution:**
- Update `Timeline.tsx` to recalculate or scale the waveform SVG/Canvas based on the `zoom` level.
- Ensure the track container width calculation accurately reflects `duration * zoom`.
- Fix the horizontally scrolling layout to prevent "off-screen" bugs (already partially addressed, but needs robustness).

## 2. Properties Panel Functionality
**Issue:** Effects and properties are non-functional or static.
**Solution:**
- **Gain/Volume:** Ensure the volume slider in `PropertiesPanel` correctly updates the `tracks` state (already wired, but verify responsiveness).
- **Master Controls:** precise VU meter (simulated) and Export settings need separate state/logic.
- **Effects:**
  - Create a state structure for effects (e.g., `track.effects = []`).
  - Allow adding/removing effects in the UI.
  - "Subliminal Mask" and "Reverb" should be toggleable items in the track state.

## 3. Asset Management Strategy (Left vs. Right Panels)
**Issue:** Redundancy between "Recent Assets" (Left) and "Uploads" (Right).
**Proposal:**
- **Left Panel (Stock & Resources):** Dedicate this to system resources.
  - "AI Affirmations" (Generator).
  - "Stock Library" (Binaural Beats, Visuals, Sample Audio).
  - Remove "Recent Assets" (or rename to "Quick Start Samples").
- **Right Panel (Project Assets):** Keep as the dedicated "My Files" area (Uploads).
  - This is where user content lives.
- **Action:**
  - Refactor `MediaLibrary.tsx` to focus on categories/stock.
  - Ensure clicking a stock asset adds it to the **Uploads/Project** bin (Right) or directly to Timeline, depending on workflow. (Suggestion: Add to Project Bin first).

## 4. UI/UX Polish (Apple-Style)
**Guidance:** Deep dark theme, subtle borders, glassmorphism.
**Tasks:**
- **Typography:** Enforce consistent font weights and sizes (Inter).
- **Glassmorphism:** Add `backdrop-blur` to panels (Left/Right sidebars, Header).
- **Borders:** Use `--border-subtle` consistently (thin, `white/10`).
- **Feedback:** Add hover states and active states for all interactive elements.

## 5. Library Functionality
**Issue:** "Library" categories don't do anything.
**Solution:**
- Implement a simple view switcher in `MediaLibrary.tsx`.
- clicking "Binaural Beats" should show a list of beat assets.
- clicking "Visuals" should show video assets.

---

## Execution Steps

1.  **Fix Timeline Zoom:** Modify `renderTrackRow` and `generateWaveform` in `Timeline.tsx`.
2.  **Refactor MediaLibrary:** Update `MediaLibrary.tsx` to handle categories and reduce redundancy.
3.  **Enhance Properties:** Update `PropertiesPanel.tsx` and `types.ts` to support effects state.
4.  **Styling Pass:** Update `globals.css` and component classes for the Apple look.
