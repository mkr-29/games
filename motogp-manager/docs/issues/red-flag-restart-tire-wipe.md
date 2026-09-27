# Issue 06: Red Flag Quick Restart Fails to Reset Leaderboard User Rider Tire Wear

- **Status**: Identified / High Priority Defect
- **Severity**: High
- **Component**: [`src/systems/RaceSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RaceSystem.js)

---

## 📌 Problem Description

When a Red Flag incident occurs and the player chooses a Quick Restart option (`restart_soft`, `restart_med`, or `restart_hard`), the system resets `rs.tireCondition = 100` and assigns the new compound `rs.tireCompound`.

However, the handler neglects to update the corresponding player rider entry (`r.isUser`) inside `rs.leaderboard`. On the very next completed lap, the simulation loop calculates lap degradation against `r.tireCondition` (which still retains the heavily worn, pre-red-flag tire state, e.g., 28%), and executes:

```javascript
if (r.isUser) rs.tireCondition = r.tireCondition;
```

This immediately overwrites the brand new fresh restart tire with the pre-incident worn tire value, instantly nullifying the restart tire replacement.

---

## 🔬 Root Cause Analysis (RCA)

In [`src/systems/RaceSystem.js:L628-L635`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RaceSystem.js#L628-L635):

```javascript
// src/systems/RaceSystem.js
} else if (choiceAction === 'restart_soft' || choiceAction === 'restart_med' || choiceAction === 'restart_hard') {
    const comp = choiceAction.replace('restart_', '');
    rs.tireCompound = comp;
    rs.tireCondition = 100;
    rs.raceInProgress = true;
    this.setFlag('GREEN', null, 0, 'Quick Restart underway');
    gameState.addLog(`🚀 QUICK RESTART! Race resumed from the grid with fresh ${comp.toUpperCase()} tires!`);
    // ❌ Fails to update userRider.compound and userRider.tireCondition in rs.leaderboard!
}
```

Contrast this with the wet pit stop handler at [`src/systems/RaceSystem.js:L611-L618`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RaceSystem.js#L611-L618):

```javascript
} else if (choiceAction === 'pit_wets') {
    rs.tireCompound = 'wet';
    rs.tireCondition = 100;
    rs.playerGapToLeader = (rs.playerGapToLeader || 0) + 18.5;
    const userRider = rs.leaderboard.find(r => r.isUser);
    if (userRider) {
        userRider.compound = 'wet';
        userRider.tireCondition = 100; // ✅ Correctly resets user rider on leaderboard
    }
    // ...
```

Because `rs.leaderboard` user rider was not updated in the restart branch, on the next simulation tick where a lap is completed ([`src/systems/RaceSystem.js:L740-L741`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RaceSystem.js#L740-L741)):

```javascript
r.tireCondition = Math.max(0, (r.tireCondition || 100) - lapWear);
if (r.isUser) rs.tireCondition = r.tireCondition; // ❌ Overwrites rs.tireCondition with stale, degraded wear!
```

---

## 💥 Failure Scenarios & Impact

1. **Immediate Pace Cliff After Restart**: If the red flag occurred on lap 18 of 24 when tires were worn down to 30%, the player selects fresh Medium tires for the 6-lap sprint. After 1 lap, their tire wear plunges from 100% to 26%, hitting the tire cliff immediately.
2. **Sudden Post-Restart Highside Crash**: Because `r.tireCondition` drops below 15%, the rider suffers an unfair post-restart crash (`'Worn tire rear highside'`) on what the UI displayed as brand-new tires.
3. **Compound Misalignment**: `rs.tireCompound` is changed to `'soft'`, but `userRider.compound` remains `'hard'`. The pace calculation at line 733 uses `TIRE_COMPOUNDS[r.compound || 'med']`, applying the characteristics of the old compound rather than the chosen restart compound.

---

## 🛠️ Recommended Remediation

Update `resolveIncidentChoice` in [`src/systems/RaceSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RaceSystem.js) so the quick restart handler finds and resets the user rider in `rs.leaderboard`:

```diff
  } else if (choiceAction === 'restart_soft' || choiceAction === 'restart_med' || choiceAction === 'restart_hard') {
      const comp = choiceAction.replace('restart_', '');
      rs.tireCompound = comp;
      rs.tireCondition = 100;
+     const userRider = rs.leaderboard?.find(r => r.isUser);
+     if (userRider) {
+         userRider.compound = comp;
+         userRider.tireCondition = 100;
+     }
      rs.raceInProgress = true;
      this.setFlag('GREEN', null, 0, 'Quick Restart underway');
      gameState.addLog(`🚀 QUICK RESTART! Race resumed from the grid with fresh ${comp.toUpperCase()} tires!`);
  }
```

---

## ✅ Verification & Test Plan

1. Simulate a race until lap 15 with Hard tires (wear ~ 50%).
2. Trigger a Red Flag incident and select `Quick Restart (Soft Tires)`.
3. Verify that `rs.tireCondition === 100` and `userRider.tireCondition === 100`.
4. Advance the simulation by 1 full lap.
5. Confirm `rs.tireCondition` and `userRider.tireCondition` decrease normally (e.g. from 100% to ~95%), rather than collapsing to ~45%.
