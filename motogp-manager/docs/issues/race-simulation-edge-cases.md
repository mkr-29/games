# Issue 03: Race Simulation Edge Cases & Mobile Viewport Radar

- **Status**: Identified / Minor Edge Case
- **Severity**: Low
- **Component**: [`src/systems/RaceSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RaceSystem.js) / [`src/ui/TrackRadarView.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/TrackRadarView.js)

---

## 📌 Problem Description

Two subtle runtime edge cases were observed in the racing simulation:
1. **Red Flag Restart with Rapid Weather Inversion**: If a red flag stoppage occurs simultaneously with a sudden rain incident, restarting the race can cause tire compound mismatches where AI riders remain locked on slicks on a standing-water track.
2. **Mobile Viewport SVG Scaling**: On ultra-narrow mobile viewports (<380px width), elongated circuits such as Chang International Circuit (Buriram, aspect ratio `1020:520`) scale down aggressively, making rider dot markers and turn numbers cluster together.

---

## 🔬 Technical Analysis

### A. Red Flag Weather State Synchronization
In `RaceSystem.handleRedFlagScenario(reason)`:
- The race is paused and grid order is restored.
- However, if `rs.weather` transitioned to `'wet'` during the incident lap, AI grid preparation (`prepareGridRidersForRace`) needs to verify that all AI riders evaluate track wetness and fit wet rain tires (`rs.tireCompound = 'wet'`), otherwise AI lap calculations suffer severe penalties.

### B. Dynamic SVG Marker Scaling
In `TrackRadarView.render()`:
- Rider dots have fixed SVG radii: `<circle r="4.5" />`.
- Turn labels have fixed font sizes: `font-size="8px"`.
- When an SVG viewBox is $1020 \times 520$, a radius of $4.5$ units is physically smaller than on an SVG viewBox of $500 \times 340$ (Lusail).

---

## 🛠️ Proposed Solution & Remediation Plan

1. **Grid Weather Verification Hook**:
   Add an explicit compound check in `handleRedFlagScenario()`:
   ```javascript
   if (rs.weather === 'wet') {
       rs.leaderboard.forEach(r => {
           r.tireCompound = 'wet';
       });
   }
   ```
2. **Relative SVG Marker Sizing**:
   Normalize SVG element sizes based on the viewBox diagonal:
   ```javascript
   const [, , vbWidth, vbHeight] = geo.viewBox.split(' ').map(Number);
   const scaleFactor = Math.sqrt(vbWidth * vbHeight) / 500;
   const dotRadius = (4.5 * scaleFactor).toFixed(1);
   ```
