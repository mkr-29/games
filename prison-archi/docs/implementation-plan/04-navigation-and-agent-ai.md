# Phase 04: Navigation, Agent AI & Regime

**Goal:** Implement Flow Field mass navigation, the 15-need inmate psychology engine, Utility AI behavior trees/state machines, and the 24-hour master regime timetable scheduler.

---

## Task Matrix & Checklist

- [ ] **Task 4.1:** Flow Field (Dijkstra Vector Map) Generator & Door Weighting
- [ ] **Task 4.2:** 15-Need Psychology Engine & Global Danger Bar Calculus
- [ ] **Task 4.3:** Utility AI Behavior Scoring & Action State Machine
- [ ] **Task 4.4:** 24-Hour Master Regime Timetable & Emergency Overrides

---

## Detailed Task Specifications

### Task 4.1: Flow Field (Dijkstra Vector Map) Generator & Door Weighting
* **Context & Specifications:** Reference [`docs/03-simulation-ai/01-pathfinding-flowfields-and-hpa.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/03-simulation-ai/01-pathfinding-flowfields-and-hpa.md).
* **Objective:** Generate real-time 2D integration fields and directional vector maps from collective destinations (Canteen, Yard, Cells), applying clearance weights to doors.
* **Prerequisites:** Phase 2 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/ai/flow_field.rs`):
    * `FlowField` struct storing a 2D array of packed 8-bit directional angles (`0..255`).
    * `generate_flow_field(destination_tiles, grid, clearance_policy)`: Flood-fill integration cost calculation, followed by local gradient descent.
    * Inmate movement system sampling vector at current $(x, y)$ position to set `Velocity`.
* **Verification & Test Criteria:**
  1. Performance benchmark: Generating a Flow Field across a $256 \times 256$ grid takes $< 1.5\text{ ms}$ on a single CPU core.
  2. Integration test: Spawn 2,000 prisoners scattered across the map. Assign collective goal to Canteen. Assert all 2,000 agents navigate into the canteen without deadlocking or dropping below 60 FPS.
  3. Locked door test: Inmates path around locked security doors; guards path straight through them.

---

### Task 4.2: 15-Need Psychology Engine & Global Danger Bar Calculus
* **Context & Specifications:** Reference [`docs/03-simulation-ai/02-inmate-needs-and-psychology.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/03-simulation-ai/02-inmate-needs-and-psychology.md).
* **Objective:** Implement the continuous 15-need decay simulation, polynomial acceleration curves, addiction withdrawal, and the aggregated Global Danger Bar.
* **Prerequisites:** Phase 1 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/ai/needs.rs`):
    * `InmateNeeds` component with 15 attributes (`Food`, `Sleep`, `Bladder`, `Bowel`, `Hygiene`, `Safety`, `Freedom`, etc.).
    * `inmate_needs_decay_system`: Polynomial decay formula, suppression dampening from armed guards, and addiction withdrawal timer.
    * `calculate_prison_danger_system`: Aggregates unmet needs ($>80\%$), recent trauma, and guard suppression into the shared atomic `danger_level` counter.
* **Verification & Test Criteria:**
  1. Unit test: Leave an inmate without food for 12 in-game hours; assert `Food` need reaches $100\%$ (Starving) and triggers high anger contribution.
  2. Danger test: In a prison with 50 well-fed inmates, danger is $< 10\%$. Deny sleep and food to all 50 inmates; assert danger bar crosses $80\%$ (Critical Riot Warning).

---

### Task 4.3: Utility AI Behavior Scoring & Action State Machine
* **Context & Specifications:** Reference [`docs/03-simulation-ai/02-inmate-needs-and-psychology.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/03-simulation-ai/02-inmate-needs-and-psychology.md).
* **Objective:** Implement the Utility AI action scoring curves that pick the highest-priority action, and the Hierarchical Finite State Machine (HFSM) that executes it.
* **Prerequisites:** Task 4.1 and Task 4.2 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/ai/utility.rs`):
    * Scoring functions for `Eat`, `Sleep`, `Shower`, `UseToilet`, `Exercise`, `Idle`.
    * Utility curves combining current need intensity, distance to nearest facility, and current regime mandate.
  * In Rust (`crates/simulation/src/ai/hfsm.rs`):
    * `AgentBehavior` state machine transitioning between: `NavigatingToTarget` $\to$ `InteractingWithObject` $\to$ `NeedSatisfied` $\to$ `SelectNextAction`.
* **Verification & Test Criteria:**
  1. Unit test: Inmate with `Bladder = 90%` and `Food = 20%` chooses toilet over canteen.
  2. Integration test: Inmate autonomously walks to toilet, plays flushing animation, resets `Bladder` to $0\%$, and returns to free time wandering.

---

### Task 4.4: 24-Hour Master Regime Timetable & Emergency Overrides
* **Context & Specifications:** Reference [`docs/04-security-logistics/01-regime-and-timetable-system.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/04-security-logistics/01-regime-and-timetable-system.md).
* **Objective:** Implement the 24-hour master clock, multi-security class staggered regime schedules, and global emergency commands (`Bangup`, `Lockdown`).
* **Prerequisites:** Task 4.3 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/regime/timetable.rs`):
    * `RegimeScheduleTable` struct ($7 \text{ tiers} \times 24 \text{ hours}$).
    * `regime_broadcast_system`: Evaluates the current hour and dispatches mandatory regime goals to all prisoners.
    * Emergency overrides:
      * `Bangup`: Overrides all current actions; sends compliant inmates to lock themselves in cells.
      * `Lockdown`: Forces all servo and solenoid doors shut across the entire facility.
* **Verification & Test Criteria:**
  1. Staggered regime test: Min-Sec scheduled to eat at 12:00, Med-Sec at 13:00. Verify Min-Sec paths to canteen at 12:00 and departs at 13:00 when Med-Sec enters.
  2. Emergency test: Trigger `Bangup` command. Verify 100% of non-rioting inmates immediately cease free-time recreation and walk into their cells.
