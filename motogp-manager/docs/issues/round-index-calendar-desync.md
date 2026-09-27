# Issue 04: Calendar vs Race Stage Round Index Desynchronization

- **Status**: Identified / High Priority Defect
- **Severity**: High
- **Component**: [`src/systems/CalendarSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/CalendarSystem.js) / [`src/systems/RaceSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RaceSystem.js)

---

## 📌 Problem Description

The property controlling the active Grand Prix circuit and round index has two different names in the codebase:
- `state.raceState.currentGPIndex`: Used throughout `RaceSystem.js`, `RaceView.js`, `GameState.js`, and `PromotionSystem.js`.
- `state.raceState.currentGPRound`: Used in `CalendarSystem.js` (`proceedToNextWeek()` and `rewindToPreviousWeek()`).

Because `CalendarSystem` sets `currentGPRound` instead of `currentGPIndex`, advancing the week on the season calendar does not update the active Grand Prix track in the race simulation.

---

## 🔬 Root Cause Analysis (RCA)

In [`src/systems/CalendarSystem.js:L723-L727`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/CalendarSystem.js#L723-L727):

```javascript
// src/systems/CalendarSystem.js
const newWeek = this.getCurrentWeek();
if (newWeek.type === 'race_week' && typeof newWeek.roundIndex === 'number') {
    state.raceState.currentGPRound = newWeek.roundIndex; // ❌ Sets non-standard property
    state.raceState.stage = 'FP1';
}
```

And in [`src/systems/CalendarSystem.js:L762-L766`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/CalendarSystem.js#L762-L766):
```javascript
if (targetWeek.type === 'race_week' && typeof targetWeek.roundIndex === 'number') {
    state.raceState.currentGPRound = targetWeek.roundIndex; // ❌ Does not rewind currentGPIndex
    state.raceState.stage = 'FP1';
    state.raceState.raceInProgress = false;
}
```

Meanwhile, in [`src/systems/RaceSystem.js:L80-L84`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RaceSystem.js#L80-L84):
```javascript
// src/systems/RaceSystem.js
static getCurrentGP() {
    const state = gameState.getState();
    const idx = state.raceState.currentGPIndex % GP_CALENDAR.length; // ✅ Reads currentGPIndex
    return GP_CALENDAR[idx];
}
```

And in [`src/ui/RaceView.js:L65`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/RaceView.js#L65):
```javascript
this.updateText('championship-season-lbl', `Season ${state.season} - Round ${(rs.currentGPIndex % GP_CALENDAR.length) + 1} of ${GP_CALENDAR.length}`);
```

---

## ⚡ User Impact

1. When a player advances the season on the Calendar tab to Round 2 (Argentina), navigating to the Race tab displays Round 1 (Chang International Circuit, Thailand) instead.
2. In developer mode, clicking `⏪ Prev Week [DEV]` does not rewind the active race circuit.
3. Healthcare telemetry calls (`RiderSystem.advancePaddockAfterRace(tier, rs.currentGPRound)`) pass `undefined` if `currentGPRound` is not yet populated.

---

## 🛠️ Proposed Solution & Remediation Plan

In [`src/systems/CalendarSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/CalendarSystem.js):
1. In `proceedToNextWeek()`:
   ```javascript
   if (newWeek.type === 'race_week' && typeof newWeek.roundIndex === 'number') {
       state.raceState.currentGPIndex = newWeek.roundIndex; // Synchronize canonical index
       state.raceState.stage = 'FP1';
       state.raceState.raceInProgress = false;
   }
   ```
2. In `rewindToPreviousWeek()`:
   ```javascript
   if (targetWeek.type === 'race_week' && typeof targetWeek.roundIndex === 'number') {
       state.raceState.currentGPIndex = targetWeek.roundIndex;
       state.raceState.stage = 'FP1';
       state.raceState.raceInProgress = false;
   }
   ```
3. Update line 720 to pass `state.raceState.currentGPIndex`:
   ```javascript
   RiderSystem.advancePaddockAfterRace(state.tier, state.raceState.currentGPIndex);
   ```
