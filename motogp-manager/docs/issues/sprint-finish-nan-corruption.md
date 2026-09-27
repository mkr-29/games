# Issue 05: Sprint Race Finish NaN Prize Money Corruption in Moto3/Moto2

- **Status**: Resolved
- **Severity**: Critical
- **Component**: [`src/systems/RaceSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RaceSystem.js) / [`src/systems/PromotionSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/PromotionSystem.js)

---

## 📌 Problem Description

When finishing a Saturday Sprint Race (`RaceSystem.finishSprintRace()`), prize purse money is calculated from `TIERS[state.tier]`. For Tier 1 (Moto3™) and Tier 2 (Moto2™), sprint prize constants do not exist in the tier specification (`sprintTop9Prize` is `undefined`).

Evaluating `Math.floor(undefined * 0.25)` results in `NaN`. When added to `state.cash`, the entire player budget turns permanently into `NaN`, corrupting the save game irreversibly.

---

## 🔬 Root Cause Analysis (RCA)

In [`src/systems/RaceSystem.js:L1035-L1040`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RaceSystem.js#L1035-L1040):

```javascript
// src/systems/RaceSystem.js
const tierDef = TIERS[state.tier] || TIERS[1];
const prizeMoney = userPos === 1 ? tierDef.sprintWinPrize 
                 : (userPos <= 3 ? tierDef.sprintPodiumPrize 
                 : (userPos <= 9 ? tierDef.sprintTop9Prize 
                 : Math.floor(tierDef.sprintTop9Prize * 0.25))); // ❌ Evaluates to NaN if sprintTop9Prize is undefined!

state.cash += prizeMoney; // ❌ state.cash becomes NaN!
```

Looking at [`src/systems/PromotionSystem.js:L6-L43`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/PromotionSystem.js#L6-L43):
```javascript
export const TIERS = {
    1: {
        id: 1,
        name: "Tier 1: Moto3™ World Championship",
        hasSprint: false,
        gpWinPrize: 1800,
        gpPodiumPrize: 1000,
        gpTop10Prize: 500,
        // ❌ sprintWinPrize, sprintPodiumPrize, sprintTop9Prize DO NOT EXIST!
    },
    2: {
        id: 2,
        name: "Tier 2: Moto2™ World Championship",
        hasSprint: false,
        gpWinPrize: 6500,
        gpPodiumPrize: 3800,
        gpTop10Prize: 1800,
        // ❌ sprintWinPrize, sprintPodiumPrize, sprintTop9Prize DO NOT EXIST!
    },
    3: {
        id: 3,
        name: "Tier 3: Premier Class MotoGP™",
        hasSprint: true,
        sprintWinPrize: 10000,
        sprintPodiumPrize: 6000,
        sprintTop9Prize: 3000,
    }
};
```

If a player executes a sprint race in Tier 1 or Tier 2 (e.g., triggered via debug or calendar), `tierDef.sprintTop9Prize` is `undefined`:
- `Math.floor(undefined * 0.25)` $\rightarrow$ `NaN`.
- `state.cash += NaN` $\rightarrow$ `state.cash = NaN`.
- `val-cash` displays `$NaN`.
- All future affordability checks (`state.cash >= cost.cash`) fail permanently.

---

## ⚡ User Impact

Total game-breaking financial corruption. All subsequent purchases (producers, crew, technology, rider training) become impossible.

---

## 🛠️ Proposed Solution & Remediation Plan

1. **Defensive Value Fallbacks**:
   In `RaceSystem.finishSprintRace()`:
   ```javascript
   const winPrize = tierDef.sprintWinPrize || 0;
   const podPrize = tierDef.sprintPodiumPrize || 0;
   const top9Prize = tierDef.sprintTop9Prize || 0;

   const prizeMoney = userPos === 1 ? winPrize
                    : (userPos <= 3 ? podPrize
                    : (userPos <= 9 ? top9Prize
                    : Math.floor(top9Prize * 0.25)));

   state.cash = (state.cash || 0) + (prizeMoney || 0);
   ```
2. **Explicit Baseline Values in `TIERS`**:
   Add baseline sprint prize structures to Tier 1 and Tier 2 in `PromotionSystem.js` for safety:
   - Tier 1: `sprintWinPrize: 800, sprintPodiumPrize: 400, sprintTop9Prize: 200`
   - Tier 2: `sprintWinPrize: 2500, sprintPodiumPrize: 1500, sprintTop9Prize: 700`

---

## ✅ Resolution & Verification

- **Changes Applied**:
  - Defined explicit baseline sprint prize constants for Moto3 and Moto2 in [`src/systems/PromotionSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/PromotionSystem.js).
  - Added reusable static utility `RaceSystem.calculateSprintPrize(tierDef, userPos, heritagePerks)` in [`src/systems/RaceSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RaceSystem.js) with defensive validation for `userPos`, fallbacks to 0 for undefined/missing tier properties, and support for the `heritage_paddock_brand` double prize multiplier.
  - Sanitized `state.cash` updates in both `finishSprintRace()` and `finishRace()` to guarantee pre-existing or incoming `NaN` values self-heal back to finite integers.
- **Verification**:
  - Added automated test suite [`tests/systems/RaceSystem.sprint.test.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/tests/systems/RaceSystem.sprint.test.js) with 12 unit and integration tests passing cleanly.
  - Verified production build (`npm run build`) succeeds.

