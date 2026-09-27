# Issue 12: Detached SVG Path Angle Calculation Yields NaN in Certain Browsers

- **Status**: Identified / Medium Priority Graphics Defect
- **Severity**: Medium
- **Component**: [`src/systems/TrackMapSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/TrackMapSystem.js)

---

## 📌 Problem Description

In `TrackMapSystem.js`, track telemetry and circuit coordinate positions are evaluated using cached SVG `<path>` elements generated via `document.createElementNS("http://www.w3.org/2000/svg", "path")`.

Because these path elements are never appended to an active DOM tree (e.g., inside an `<svg>` element attached to `document.body`), certain browser rendering engines (such as WebKit on iOS Safari, background tab throttled contexts, or headless testing engines) return `0` for `pathEl.getTotalLength()`.

When `totalLength === 0`:
- `curLength = 0`
- `delta = 0`
- `nextLen = (curLength + delta) % totalLength` evaluates to `0 % 0`, which is `NaN`
- `Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x)` returns `NaN`
- Bike markers fail to render or generate invalid SVG markup like `transform="rotate(NaNdeg)"`.

---

## 🔬 Root Cause Analysis (RCA)

In [`src/systems/TrackMapSystem.js:L633-L638`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/TrackMapSystem.js#L633-L638):

```javascript
// src/systems/TrackMapSystem.js
const geo = this.getCircuitGeometry(circuitId);
const svgNS = "http://www.w3.org/2000/svg";
const pathEl = document.createElementNS(svgNS, "path");
pathEl.setAttribute("d", geo.path);
this.pathCache.set(circuitId, pathEl);
return pathEl;
// ❌ pathEl is floating in memory and never mounted into an SVG element or the document DOM!
```

Then in [`src/systems/TrackMapSystem.js:L651-L663`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/TrackMapSystem.js#L651-L663):

```javascript
const totalLength = pathEl.getTotalLength(); // ❌ Returns 0 in unattached WebKit contexts!
const curLength = normT * totalLength;

const pt = pathEl.getPointAtLength(curLength);

// Sample next tiny step for tangent direction
const delta = Math.min(2.0, totalLength * 0.002);
const nextLen = (curLength + delta) % totalLength; // ❌ 0 % 0 === NaN!
const nextPt = pathEl.getPointAtLength(nextLen);

const angleRad = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x); // ❌ NaN
const angleDeg = (angleRad * 180) / Math.PI; // ❌ NaN
```

When `angleDeg` is `NaN`, rendering the bike dot in `renderCircuitMiniMap` or in canvas results in invalid transform strings:
```javascript
marker.setAttribute('transform', `translate(${pt.x}, ${pt.y}) rotate(NaN)`);
```
This causes the browser SVG renderer to discard the transform, causing the bike marker to jump to `(0, 0)` or disappear entirely.

---

## 💥 Failure Scenarios & Impact

1. **Disappearing Bike Marker on Mobile Safari**: In iOS Safari, detached SVG elements may not initialize their layout geometry until attached to a live SVG node, causing the track mini-map bike dot to vanish.
2. **Infinite NaN Propagation**: `getPointOnCircuit` returns `{ x: NaN, y: NaN, angleDeg: NaN }`, infecting any downstream visual calculations (such as radar orientation, slipstream lines, or camera follow angles).
3. **Console Warning Flooding**: The browser logs hundreds of SVG attribute errors (`Error: <g> attribute transform: Expected number, "...rotate(NaN)"`) every frame.

---

## 🛠️ Recommended Remediation

1. **Safeguard against `totalLength === 0` with a positive fallback**:
```diff
  // src/systems/TrackMapSystem.js
  const totalLength = pathEl.getTotalLength();
+ if (!totalLength || totalLength <= 0 || isNaN(totalLength)) {
+     // Fallback to circular approximation if DOM path measurement fails
+     const t = normT * Math.PI * 2;
+     return {
+         x: 250 + Math.cos(t) * 180,
+         y: 160 + Math.sin(t) * 100,
+         angleDeg: (t * 180 / Math.PI) + 90,
+         sector: 1,
+         isStraight: false
+     };
+ }
```

2. **Mount path elements into a hidden off-screen container**:
Create a persistent `<svg style="position:absolute;width:0;height:0;visibility:hidden">` appended to `document.body` to guarantee SVG geometry measurement across all browsers.

---

## ✅ Verification & Test Plan

1. Simulate WebKit detached SVG behavior by mocking `pathEl.getTotalLength = () => 0`.
2. Call `TrackMapSystem.getPointOnCircuit('buriram', 0.45)`.
3. Verify that valid numeric coordinates and angle degrees are returned without `NaN`.
4. Check that no SVG syntax warnings are emitted in the browser console.
