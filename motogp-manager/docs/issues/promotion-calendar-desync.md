# Issue 10: Category Promotion Desynchronizes Calendar Week and Activity State

- **Status**: Identified / High Priority State Desync
- **Severity**: High
- **Component**: [`src/systems/PromotionSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/PromotionSystem.js) / [`src/systems/CalendarSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/CalendarSystem.js)

---

## 📌 Problem Description

When a player fulfills tier advancement criteria and promotes their team from Moto3™ to Moto2™, or Moto2™ to MotoGP™ via `PromotionSystem.promoteTeam()`, the system resets `state.raceState.currentGPIndex = 0` to begin the new season at Round 1 (Thailand).

However, `PromotionSystem.promoteTeam()` completely ignores `CalendarSystem`.
- `cal.currentWeekIndex` remains at whatever late season week the team reached before promoting (e.g. Week 24 / Valencia).
- `cal.completedActivities` is not cleared, retaining the completed flags of all previous season activities.

This creates a state desynchronization: the race engine expects Round 1, while the calendar view is stuck at the end of the previous year with all activities marked already completed, preventing the player from participating in the pre-season tests or Round 1 race weekend activities.

---

## 🔬 Root Cause Analysis (RCA)

In [`src/systems/PromotionSystem.js:L128-L137`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/PromotionSystem.js#L128-L137):

```javascript
// src/systems/PromotionSystem.js
// Re-initialize championship for the new tier
RaceSystem.initChampionshipStandings(true);
state.raceState.currentGPIndex = 0;
state.raceState.stage = 'FP1';
state.raceState.fpCompleted = false;
state.raceState.practiceCompleted = false;
state.raceState.q1Completed = false;
state.raceState.q2Completed = false;
state.raceState.sprintCompleted = false;

// ❌ Does not reset CalendarSystem state!
// cal.currentWeekIndex is still e.g. 23 (Valencia)
// cal.completedActivities still has old completed activity keys!
```

When the user navigates to the Calendar tab:
1. `CalendarSystem.getCurrentWeek()` returns `cal.seasonWeeks[23]` (Valencia), despite `state.raceState.currentGPIndex` being `0` (Thailand).
2. The user sees "Round 22: Valencia" on the calendar header, but clicking "Launch GP" attempts to load Buriram.
3. Pre-season testing for the new tier (`w1_test_main` and `w1_long_run`) is completely skipped because `currentWeekIndex` is 23.
4. If `cal.currentWeekIndex` wraps around on the next manual week advance, `cal.completedActivities['th_fp1']` is already `'completed'`, locking the player out of Friday practice.

---

## 💥 Failure Scenarios & Impact

1. **Missing Pre-Season for New Class**: Players upgrading from Moto3 to Moto2 never get to test the 765cc Triumph engine in pre-season tests or select their chassis prototype.
2. **Calendar / Race Navigation Disconnect**: The calendar UI displays Valencia or off-season, while the race navigation banner displays Buriram, confusing the player.
3. **Ghost Completed Activities**: Activity cards for race sessions display green checkmarks and disabled buttons even though the new season has not started.

---

## 🛠️ Recommended Remediation

Update `PromotionSystem.promoteTeam()` to reset and reinitialize `CalendarSystem`:

```diff
  // src/systems/PromotionSystem.js
  RaceSystem.initChampionshipStandings(true);
  state.raceState.currentGPIndex = 0;
  state.raceState.stage = 'FP1';
  state.raceState.fpCompleted = false;
  state.raceState.practiceCompleted = false;
  state.raceState.q1Completed = false;
  state.raceState.q2Completed = false;
  state.raceState.sprintCompleted = false;

+ // Reinitialize Calendar to Week 1 for the new season
+ const cal = CalendarSystem.getCalendarState();
+ if (cal) {
+     cal.currentWeekIndex = 0;
+     cal.completedActivities = {};
+ }
+ // Increment season count
+ state.season = (state.season || 1) + 1;
```

Also, expose a dedicated `CalendarSystem.resetNewSeason()` method rather than directly mutating calendar properties from external systems.

---

## ✅ Verification & Test Plan

1. In Moto3, complete all 22 rounds until reaching Week 24.
2. Upgrade team to Moto2 via the Promotion modal.
3. Verify that `state.tier === 2` and `state.raceState.currentGPIndex === 0`.
4. Open the Calendar tab and verify it displays **Week 1: Pre-Season Testing (Sepang)**.
5. Verify `cal.completedActivities` is empty and Week 1 activities are available.
