# Issue 02: LocalStorage Quota Growth & Multi-Tab Concurrency

- **Status**: Identified / Open Architecture Consideration
- **Severity**: Low
- **Component**: [`src/engine/SaveManager.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/engine/SaveManager.js) / [`src/engine/GameState.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/engine/GameState.js)

---

## 📌 Problem Description

Standard web browser `localStorage` enforces an origin storage quota of approximately **5 Megabytes (MB)**. In MotoGP Manager, multiple telemetry feeds and event histories accumulate over multi-season careers. Without proactive bounds, serializing large arrays can degrade performance and eventually throw `QuotaExceededError`.

Additionally, if a user opens the game in multiple browser tabs simultaneously, both tabs will execute `TickEngine` auto-saves independently, resulting in last-write-wins race conditions.

---

## 🔬 Technical Analysis

### A. State Array Growth Factors
1. **Activity Logs (`state.logs`)**:
   - Guarded properly: [`src/engine/GameState.js:L163`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/engine/GameState.js#L163) enforces `if (this.state.logs.length > 50) this.state.logs.pop();`.
2. **Race Lap History (`state.raceState.lapHistory`)**:
   - Contains complete telemetry records per completed lap (Lap number, time string, S1–S4 split seconds, top speed, tire health).
   - Currently, `lapHistory` is populated during sprints and main races. If not purged when transitioning between Grand Prix rounds, it continuously appends.
3. **Save Export String**:
   - Large save strings generate massive Base64 text payloads, which can cause DOM layout lag when pasted into textareas.

### B. Multi-Tab Concurrency
- `TickEngine` auto-saves every 15 seconds.
- Tab A and Tab B both run separate `setInterval` timers.
- If Tab A completes a race while Tab B is idling on the Garage tab, Tab B will overwrite Tab A's completed race progress on its next 15-second tick.

---

## 🛠️ Proposed Solution & Remediation Plan

1. **Purge Lap History at Grand Prix Completion**:
   When `finishRace()` concludes or when moving to a new week, archive or reset `raceState.lapHistory = []` while keeping season records in a lightweight summary object (`championshipStandings`).
2. **Multi-Tab Broadcast Channel / Lock**:
   Implement a lightweight `BroadcastChannel('motogp_manager_channel')` or listen to `window.addEventListener('storage', ...)`:
   - When another tab saves, either reload state into memory via `SaveManager.load()` or display a pause banner: *"Game active in another tab."*
3. **Safe Storage Wrapper**:
   Add try/catch quota detection in `SaveManager.save()`:
   ```javascript
   if (e.name === 'QuotaExceededError' || e.code === 22) {
       console.warn("Storage quota exceeded. Pruning historical telemetry...");
       state.raceState.lapHistory = [];
       // retry save
   }
   ```
