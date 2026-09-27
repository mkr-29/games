# Issue 01: Global In-Memory `_motogpPaddockState` Session Volatility

- **Status**: Identified / Open Technical Debt
- **Severity**: Medium
- **Component**: [`src/systems/RiderSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RiderSystem.js) / [`src/engine/SaveManager.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/engine/SaveManager.js)

---

## 📌 Problem Description

When an AI competitor rider sustains an injury or experiences dynamic form fluctuations (e.g., Pecco Bagnaia suffering a collarbone fracture or Jorge Martin gaining peak form), this information is recorded in the paddock healthcare state.

However, if the player refreshes the browser page or closes and re-opens the game, all AI rider injuries and form multipliers **reset back to their default baseline states**, while the player's own rider injury (stored in `gameState.state.rider.injury`) remains properly persisted.

---

## 🔬 Root Cause Analysis (RCA)

In [`src/systems/RiderSystem.js:L153-L162`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RiderSystem.js#L153-L162), `RiderSystem.getPaddockState()` initializes and references a global variable attached to `window` or `globalThis`:

```javascript
// src/systems/RiderSystem.js
static getPaddockState() {
    const root = typeof window !== 'undefined' ? window : globalThis;
    if (!root._motogpPaddockState) {
        root._motogpPaddockState = {
            riders: {},
            lastRoundIndex: -1
        };
    }
    return root._motogpPaddockState;
}
```

Meanwhile, in [`src/engine/SaveManager.js:L8-L14`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/engine/SaveManager.js#L8-L14), `SaveManager.save()` only serializes `gameState.getState()`:

```javascript
// src/engine/SaveManager.js
static save() {
    try {
        const state = gameState.getState();
        state.lastSaved = Date.now();
        const serialized = JSON.stringify(state);
        localStorage.setItem(SAVE_KEY, serialized);
        return true;
    } ...
}
```

Because `_motogpPaddockState` is attached directly to the browser window rather than `state.paddock` inside `gameState`, it is completely bypassed during JSON serialization and lost on page reload.

---

## ⚡ User Impact

1. **AI Medical Inconsistency**: If an AI rider suffers a 2-race concussion stand-down or collarbone break, reloading the page allows them to instantly return to racing without missing rounds.
2. **Wildcard / Reserve Rider Disappearance**: Reserve replacement riders (such as Dani Pedrosa or Cal Crutchlow) will disappear from the grid upon reload because the regular rider is no longer marked as sidelined.

---

## 🛠️ Proposed Solution & Remediation Plan

Migrate paddock AI health state into `INITIAL_STATE` in [`src/engine/GameState.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/engine/GameState.js):

1. **Add `paddock` property to `INITIAL_STATE`**:
   ```javascript
   // src/engine/GameState.js
   paddock: {
       riders: {}, // { [riderId]: { form: 1.0, injury: null } }
       lastRoundIndex: -1
   }
   ```
2. **Update `RiderSystem.getPaddockState()`** to reference `gameState.getState().paddock`:
   ```javascript
   static getPaddockState() {
       const state = gameState.getState();
       if (!state.paddock) {
           state.paddock = { riders: {}, lastRoundIndex: -1 };
       }
       return state.paddock;
   }
   ```
3. **Update `SaveManager.load()`** to include `paddock` in its deep merge dictionary so older saves migrate safely.
