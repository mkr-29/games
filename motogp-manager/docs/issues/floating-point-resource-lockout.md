# Issue 09: Floating-Point Imprecision Causing Resource Purchase Lockout

- **Status**: Identified / Medium Priority Usability & Logic Defect
- **Severity**: Medium
- **Component**: [`src/systems/EconomySystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/EconomySystem.js) / [`src/systems/ResearchSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/ResearchSystem.js) / [`src/ui/Components.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/Components.js)

---

## 📌 Problem Description

In `EconomySystem.tick(delta)`, continuous resource generation adds `rates * delta` directly to floating-point counters (`state.cash`, `state.telemetry`, `state.science`, `state.parts`).

Because JavaScript numbers use IEEE 754 floating-point representations, resource counters frequently accumulate values such as `49.99999999999994` instead of integer `50`.

In the UI header, values are displayed with `Math.floor()` or `Math.round()` (e.g. `val-science` displays `50 / 50`). However, purchase validation checks use strict inequality comparisons:

```javascript
if (node.cost.science && state.science < node.cost.science) return false;
```

As a result, players see their resource storage completely full in the UI (e.g. `50 / 50` RP), but when clicking "Research Tech" (cost: 50 RP), the purchase fails or the button remains disabled.

---

## 🔬 Root Cause Analysis (RCA)

In [`src/systems/EconomySystem.js:L133-L136`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/EconomySystem.js#L133-L136):

```javascript
// src/systems/EconomySystem.js
state.cash += rates.cashRate * delta;
state.telemetry = Math.min(state.telemetryMax, state.telemetry + rates.telemetryRate * delta);
state.science = Math.min(state.scienceMax, state.science + rates.scienceRate * delta);
state.parts = Math.min(state.partsMax, state.parts + rates.partsRate * delta);
```

If `state.scienceMax` is `50` and the producer generates `0.3` science per second with `delta = 0.1s` (0.03/tick), successive additions suffer floating-point round-off error. When nearing capacity, `state.science` might evaluate to `49.999999999998`.

In [`src/systems/ResearchSystem.js:L477`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/ResearchSystem.js#L477):

```javascript
// src/systems/ResearchSystem.js
if (node.cost.science && state.science < node.cost.science) return false;
```

Evaluating `49.999999999998 < 50` yields `true`, returning `false` and denying the purchase.

Meanwhile, in [`src/ui/Components.js:L70`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/Components.js#L70):

```javascript
this.updateText('val-science', `${Math.floor(state.science)} / ${state.scienceMax}`);
```

If `Math.round()` is used or if `state.science` is within an epsilon of `50`, the player believes they have reached the exact required quantity, but the system rejects the transaction with no visual feedback.

---

## 💥 Failure Scenarios & Impact

1. **Player Frustration & Perceived Bug**: A player waits for their research points to fill up to 50 for a Tier 1 upgrade. The UI displays `50 / 50`, but clicking the upgrade button does nothing because the internal float is `49.999999999997`.
2. **Cap Clamping Precision Error**: When clamping at `Math.min(state.scienceMax, val)`, if the previous step was `49.97 + 0.030000000000000002`, the float might never naturally equal exact integer bounds before operations.
3. **Producer Purchase Disabling**: In `renderProducers`, button `disabled` states depend on:
   ```javascript
   (!cost.science || state.science >= cost.science)
   ```
   A producer costing 50 remains greyed out while the storage indicator displays 50.

---

## 🛠️ Recommended Remediation

1. **Apply floating-point epsilon tolerance in purchase checks**:
In `ResearchSystem.js`, `EconomySystem.js`, and `Components.js`, use an epsilon (e.g., `0.001` or `1e-5`) when comparing floating-point resources to integer costs:

```javascript
const EPSILON = 0.001;

// ResearchSystem.js
if (node.cost.science && (state.science + EPSILON) < node.cost.science) return false;
if (node.cost.telemetry && (state.telemetry + EPSILON) < node.cost.telemetry) return false;
if (node.cost.parts && (state.parts + EPSILON) < node.cost.parts) return false;
if (node.cost.cash && (state.cash + EPSILON) < node.cost.cash) return false;
```

2. **Deduct clean amounts**:
When deducting costs, clamp the subtraction to 0 to prevent `-0.0000000001`:
```javascript
if (node.cost.science) state.science = Math.max(0, state.science - node.cost.science);
```

3. **Snap values nearing max**:
In `EconomySystem.tick`:
```javascript
if (Math.abs(state.scienceMax - state.science) < EPSILON) {
    state.science = state.scienceMax;
}
```

---

## ✅ Verification & Test Plan

1. Set `state.science = 49.999999999` and `state.scienceMax = 50`.
2. Attempt to research a node requiring `50` science.
3. Confirm the node unlocks cleanly and `state.science` drops to `0`.
