# Issue 13: Junior Data Analyst Telemetry Consumption Lore & Mechanics Discrepancy

- **Status**: Identified / Low Priority Logic & Description Discrepancy
- **Severity**: Low
- **Component**: [`src/systems/EconomySystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/EconomySystem.js)

---

## 📌 Problem Description

In `EconomySystem.js`, the producer item `data_analyst` (Junior Data Analyst) features the following user-facing description:

> *"Converts raw Telemetry data into Research Points (RP). Consumes 0.5 Telemetry/s."*

However, in the economy calculation loop (`EconomySystem.getRates()`), the producer simply provides:

```javascript
baseOutput: { science: 0.3 }
```

There is no code in `getRates()` or `tick()` that checks, decrements, or requires Telemetry. The producer generates Research Points unconditionally out of thin air, with zero Telemetry consumed.

---

## 🔬 Root Cause Analysis (RCA)

In [`src/systems/EconomySystem.js:L37-L45`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/EconomySystem.js#L37-L45):

```javascript
// src/systems/EconomySystem.js
{
    id: 'data_analyst',
    name: 'Junior Data Analyst',
    icon: '💻',
    desc: 'Converts raw Telemetry data into Research Points (RP). Consumes 0.5 Telemetry/s.', // ❌ Claims to consume telemetry
    baseCost: { cash: 350 },
    costMultiplier: 1.18,
    baseOutput: { science: 0.3 }, // ❌ Only defines positive science output
    unlockedAtTier: 1
},
```

In [`src/systems/EconomySystem.js:L100-L108`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/EconomySystem.js#L100-L108):

```javascript
PRODUCERS.forEach(prod => {
    const count = p[prod.id] || 0;
    if (count > 0) {
        if (prod.baseOutput.cash) cashRate += prod.baseOutput.cash * count;
        if (prod.baseOutput.telemetry) telemetryRate += prod.baseOutput.telemetry * count;
        if (prod.baseOutput.science) scienceRate += prod.baseOutput.science * count;
        if (prod.baseOutput.parts) partsRate += prod.baseOutput.parts * count;
    }
});
// ❌ Does not support negative consumption or resource dependencies
```

The producer system only supports additive outputs (`prod.baseOutput`). Negative consumption, conversion ratios, or resource prerequisite checking were never implemented.

---

## 💥 Failure Scenarios & Impact

1. **Player Hesitation & Hoarding**: Early-game players frequently avoid purchasing Junior Data Analysts because they fear it will drain their limited Telemetry stockpile (which is needed to run practice laps and test sessions).
2. **Game Design Disconnect**: The flavor text suggests an active conversion mechanic (converting Telemetry into Science), but the actual engine functions as a passive generator.
3. **Potential Negative Resource Trap**: If negative rates were naively added (`telemetryRate -= 0.5`) without an empty-stockpile cutoff, `state.telemetry` could drain into negative numbers or starve the player of telemetry when idle.

---

## 🛠️ Recommended Remediation

There are two valid approaches:

### Option A: Update Description to Match Mechanics (Recommended)
Clarify the text to represent an analytical research assistant without promising an unmodeled resource consumption penalty:

```diff
  // src/systems/EconomySystem.js
  {
      id: 'data_analyst',
      name: 'Junior Data Analyst',
      icon: '💻',
-     desc: 'Converts raw Telemetry data into Research Points (RP). Consumes 0.5 Telemetry/s.',
+     desc: 'Analyzes onboard ECU channels to generate steady Research Points (RP) for engineering development.',
      baseCost: { cash: 350 },
      costMultiplier: 1.18,
      baseOutput: { science: 0.3 },
      unlockedAtTier: 1
  },
```

### Option B: Implement True Resource Conversion
If conversion gameplay is desired, implement a conditional check in `getRates()` or `tick()`:
```javascript
// Only produce science if telemetry > 0
const telemetryNeeded = count * 0.5 * delta;
if (state.telemetry >= telemetryNeeded) {
    state.telemetry -= telemetryNeeded;
    state.science = Math.min(state.scienceMax, state.science + count * 0.3 * delta);
}
```

---

## ✅ Verification & Test Plan

1. If Option A is applied, verify the tooltip in the Paddock UI shows the updated text.
2. Confirm that purchasing 5 Junior Data Analysts increases RP generation by `+1.5 RP/s` while Telemetry remains stable.
