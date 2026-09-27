# MotoGP Manager - Known Issues & Technical Debt

This directory tracks identified architectural limitations, edge cases, session persistence gotchas, and technical debt across the entire **MotoGP Manager** codebase.

---

## 📋 Comprehensive Issues Index

| Issue ID | Title | Severity | Impact Area | Core Description |
| :--- | :--- | :---: | :--- | :--- |
| **[ISSUE-01](paddock-state-persistence.md)** | **Global In-Memory `_motogpPaddockState` Session Volatility** | Medium | `src/systems/RiderSystem.js` | AI competitor form and injury statuses reside on `window._motogpPaddockState` rather than inside `gameState.state`, causing AI injuries to reset upon browser page reload. |
| **[ISSUE-02](storage-quota-and-lap-history.md)** | **LocalStorage Quota Growth & Multi-Tab Concurrency** | Low | `src/managers/SaveManager.js`, `src/state/GameState.js` | Unbounded growth of `lapHistory` across multi-season playthroughs risks reaching browser 5MB `localStorage` limits. Lack of cross-tab locks allows concurrent tab writes. |
| **[ISSUE-03](race-simulation-edge-cases.md)** | **Race Simulation Edge Cases & Mobile Viewport Radar** | Low | `src/systems/RaceSystem.js`, `src/ui/TrackRadarView.js` | Red flag restart edge cases when rain starts immediately prior to red flag, and responsive scaling challenges for ultra-wide circuits on small mobile screens. |
| **[ISSUE-04](round-index-calendar-desync.md)** | **Round Index & Calendar Synchronization Key Desynchronization** | High | `src/systems/CalendarSystem.js`, `src/systems/RaceSystem.js` | `CalendarSystem` updates `currentGPRound` instead of canonical `currentGPIndex`, causing calendar race week launches to load outdated tracks. |
| **[ISSUE-05](sprint-finish-nan-corruption.md)** | **Sprint Race Finish NaN Prize Money Corruption in Moto3/Moto2** | Critical | `src/systems/RaceSystem.js`, `src/systems/PromotionSystem.js` | Sprint finish evaluates `Math.floor(undefined * 0.25)` in Moto3/Moto2, turning `state.cash` permanently into `NaN` and corrupting the save game. |
| **[ISSUE-06](red-flag-restart-tire-wipe.md)** | **Red Flag Quick Restart Fails to Reset Leaderboard User Rider Tire Wear** | High | `src/systems/RaceSystem.js` | Quick restart sets `rs.tireCondition = 100`, but fails to reset user entry in `rs.leaderboard`. Old wear is re-applied on the next lap, immediately wiping fresh tires. |
| **[ISSUE-07](preseason-and-longrun-reward-exploit.md)** | **Pre-Season Prototype & Long-Run Sim Infinite Reward Stacking Exploit** | High | `src/systems/PreSeasonTestSystem.js`, `src/systems/LongRunSimSystem.js` | Lack of idempotency checks allows repeated clicks on prototype confirmation and debrief reports to grant infinite Telemetry, RP, and Hype. |
| **[ISSUE-08](promotion-hub-dom-thrashing.md)** | **Promotion Hub 10Hz DOM Re-rendering Thrash & Event Listener Re-creation** | Medium | `src/ui/Components.js` | `renderPromotionHub()` ignores `forceRebuild`, wiping `innerHTML` and attaching new event listeners 10 times a second, causing dropped clicks and GC spikes. |
| **[ISSUE-09](floating-point-resource-lockout.md)** | **Floating-Point Imprecision Causing Resource Purchase Lockout** | Medium | `src/systems/EconomySystem.js`, `src/systems/ResearchSystem.js` | IEEE 754 precision accumulation leaves resources at `49.999999999998`. Strict `< 50` checks reject purchases despite the UI displaying `50 / 50`. |
| **[ISSUE-10](promotion-calendar-desync.md)** | **Category Promotion Desynchronizes Calendar Week and Activity State** | High | `src/systems/PromotionSystem.js`, `src/systems/CalendarSystem.js` | `promoteTeam()` resets `currentGPIndex = 0` but leaves `cal.currentWeekIndex` and completed activities at end-of-season, breaking pre-season and early-round schedules. |
| **[ISSUE-11](unbounded-rider-skill-scaling.md)** | **Unbounded Rider Skill Scaling Exceeds Maximum Rating Ceiling** | Medium | `src/systems/StaffSystem.js`, `src/ui/Components.js` | Rider skill upgrades lack a 99/100 ceiling, allowing stats to reach 150+, breaking UI progress bar widths past 100% and warping race simulation pace. |
| **[ISSUE-12](detached-svg-path-angle-nan.md)** | **Detached SVG Path Angle Calculation Yields NaN in Certain Browsers** | Medium | `src/systems/TrackMapSystem.js` | Unmounted SVG path elements return 0 length in WebKit/headless contexts, leading to `0 % 0 = NaN` tangent calculations and broken bike map markers. |
| **[ISSUE-13](producer-lore-discrepancy.md)** | **Junior Data Analyst Telemetry Consumption Lore & Mechanics Discrepancy** | Low | `src/systems/EconomySystem.js` | Flavor text states Junior Data Analyst "Consumes 0.5 Telemetry/s", but the economy loop generates RP passively without requiring or consuming Telemetry. |

---

## 🎯 Severity Breakdown

### 🔴 Critical Severity (Immediate Save Corruption / Game Halting)
- **[ISSUE-05: Sprint Race Finish NaN Prize Money Corruption](sprint-finish-nan-corruption.md)**

### 🟠 High Severity (Logic Desync / Exploit / Simulation Invalidation)
- **[ISSUE-04: Round Index & Calendar Synchronization Key Desynchronization](round-index-calendar-desync.md)**
- **[ISSUE-06: Red Flag Quick Restart Fails to Reset Leaderboard User Rider Tire Wear](red-flag-restart-tire-wipe.md)**
- **[ISSUE-07: Pre-Season Prototype & Long-Run Sim Infinite Reward Stacking Exploit](preseason-and-longrun-reward-exploit.md)**
- **[ISSUE-10: Category Promotion Desynchronizes Calendar Week and Activity State](promotion-calendar-desync.md)**

### 🟡 Medium Severity (Performance, Usability, Layout, and Session Volatility)
- **[ISSUE-01: Global In-Memory `_motogpPaddockState` Session Volatility](paddock-state-persistence.md)**
- **[ISSUE-08: Promotion Hub 10Hz DOM Re-rendering Thrash & Event Listener Re-creation](promotion-hub-dom-thrashing.md)**
- **[ISSUE-09: Floating-Point Imprecision Causing Resource Purchase Lockout](floating-point-resource-lockout.md)**
- **[ISSUE-11: Unbounded Rider Skill Scaling Exceeds Maximum Rating Ceiling](unbounded-rider-skill-scaling.md)**
- **[ISSUE-12: Detached SVG Path Angle Calculation Yields NaN in Certain Browsers](detached-svg-path-angle-nan.md)**

### 🟢 Low Severity (Minor Edge Cases, Storage Limits, Polish)
- **[ISSUE-02: LocalStorage Quota Growth & Multi-Tab Concurrency](storage-quota-and-lap-history.md)**
- **[ISSUE-03: Race Simulation Edge Cases & Mobile Viewport Radar](race-simulation-edge-cases.md)**
- **[ISSUE-13: Junior Data Analyst Telemetry Consumption Lore & Mechanics Discrepancy](producer-lore-discrepancy.md)**

---

## 🔍 Investigation & Triage Methodology

All issues documented in this section contain:
1. **Root Cause Analysis (RCA)**: Exact code snippets and runtime execution traces with clickable file links and line numbers.
2. **Failure Scenarios & Impact**: How the game behaves in the current release and what breaks for the user.
3. **Recommended Remediation**: Step-by-step technical patch proposals adhering to the project's zero-dependency vanilla ES module architecture.
4. **Verification & Test Plan**: Concrete steps to reproduce, verify, and validate fixes.
