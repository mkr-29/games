# Issue 11: Unbounded Rider Skill Scaling Exceeds Maximum Rating Ceiling

- **Status**: Identified / Medium Priority Game Balance & UI Defect
- **Severity**: Medium
- **Component**: [`src/systems/StaffSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/StaffSystem.js) / [`src/ui/Components.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/Components.js)

---

## 📌 Problem Description

In `StaffSystem.upgradeRiderSkill(skillType)`, player rider skills (`cornering`, `braking`, `consistency`, `wetSkill`) are increased by `+3` every level without any upper bound.

Because the system never enforces a maximum rating ceiling (e.g. 99 or 100), players who accumulate late-game cash can level up skills indefinitely (reaching 120, 150, or 200+).

This causes:
1. **Broken Progress Bars**: In `Components.js`, stat bar CSS widths are calculated as `(r[skill] / 100) * 100%`. When skills exceed 100, the fill bars stretch past 100% and overflow out of their card containers.
2. **Simulation Skew**: Race pace and crash logic scale off rider skill relative to AI ratings (which are fixed between 70 and 95). Uncapped skills result in unrealistic lap times 10–20 seconds faster than real-world lap records and zero crash probability under all weather conditions.

---

## 🔬 Root Cause Analysis (RCA)

In [`src/systems/StaffSystem.js:L59-L76`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/StaffSystem.js#L59-L76):

```javascript
// src/systems/StaffSystem.js
static upgradeRiderSkill(skillType) {
    const state = gameState.getState();
    const r = state.rider;
    const cost = this.getRiderSkillCost(skillType);

    if (state.cash < cost.cash) return false;

    state.cash -= cost.cash;
    const levelKey = `${skillType}Lvl`;
    r[levelKey] = (r[levelKey] || 1) + 1;
    r[skillType] += 3; // ❌ Unbounded addition without Math.min(99, ...) or level cap!

    // Recalculate overall rider skill
    r.overallSkill = Math.round((r.cornering + r.braking + r.consistency + r.wetSkill) / 4);

    gameState.addLog(`🏎️ Rider ${r.name} improved ${skillType.toUpperCase()} (Lvl ${r[levelKey]})!`);
    return true;
}
```

In [`src/ui/Components.js:L81-L84`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/Components.js#L81-L84):

```javascript
// src/ui/Components.js
this.updateWidth('bar-cornering', (rider.cornering / 100) * 100);
this.updateWidth('bar-braking', (rider.braking / 100) * 100);
this.updateWidth('bar-consistency', (rider.consistency / 100) * 100);
this.updateWidth('bar-wet', (rider.wetSkill / 100) * 100);
```

When `rider.cornering` is 135, width is set to `135%`, visually breaking the layout.

---

## 💥 Failure Scenarios & Impact

1. **UI Layout Distortion**: Progress bars overflow their parent boundaries, covering adjacent text or creating horizontal scrollbars.
2. **Trivialized Gameplay**: At 150 cornering and braking, the player rider laps the entire MotoGP grid every 5 laps, removing all strategic challenge.
3. **Crash Immunity**: Mistake and crash checks in `RaceSystem.js` scale down as consistency and cornering increase, making riders completely invulnerable to rain, tire cliff, or aggressive engine modes.

---

## 🛠️ Recommended Remediation

1. **Enforce a strict 99 or 100 rating ceiling**:
```diff
  // src/systems/StaffSystem.js
+ const MAX_RIDER_SKILL = 99;

  static upgradeRiderSkill(skillType) {
      const state = gameState.getState();
      const r = state.rider;
+     if ((r[skillType] || 0) >= MAX_RIDER_SKILL) return false;

      const cost = this.getRiderSkillCost(skillType);
      if (state.cash < cost.cash) return false;

      state.cash -= cost.cash;
      const levelKey = `${skillType}Lvl`;
      r[levelKey] = (r[levelKey] || 1) + 1;
-     r[skillType] += 3;
+     r[skillType] = Math.min(MAX_RIDER_SKILL, r[skillType] + 3);

      r.overallSkill = Math.round((r.cornering + r.braking + r.consistency + r.wetSkill) / 4);
      return true;
  }
```

2. **Clamp UI widths in `Components.js`**:
```diff
  // src/ui/Components.js
- this.updateWidth('bar-cornering', (rider.cornering / 100) * 100);
+ this.updateWidth('bar-cornering', Math.min(100, (rider.cornering / 100) * 100));
```

3. **Disable upgrade button at max skill**:
In `renderStaff()`, if `r[skillType] >= 99`, display `MAX` and disable the button.

---

## ✅ Verification & Test Plan

1. Upgrade a rider skill until reaching 99.
2. Verify that subsequent upgrade attempts are rejected.
3. Verify that the UI button displays `MAX` and progress bar width is clamped at `100%`.
4. Run a Grand Prix simulation and verify lap times remain realistic relative to AI riders.
