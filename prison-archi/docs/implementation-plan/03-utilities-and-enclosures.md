# Phase 03: Utilities & Room Enclosures

**Goal:** Implement the disjoint-set electrical solver, hydraulic plumbing pressure simulation, connected-components room enclosure detection, and cell quality grading.

---

## Task Matrix & Checklist

- [x] **Task 3.1:** Disjoint-Set Electrical Grid Solver & Short-Circuit Physics
- [x] **Task 3.2:** BFS Hydraulic Plumbing Solver & Hot Water Boiler Loops
- [x] **Task 3.3:** Connected-Components Room Enclosure Detection & Validation
- [x] **Task 3.4:** Dynamic Cell Quality Grading & Score Evaluator



---

## Detailed Task Specifications

### Task 3.1: Disjoint-Set Electrical Grid Solver & Short-Circuit Physics
* **Context & Specifications:** Reference [`docs/02-construction-utilities/02-electrical-grid-solver.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/02-construction-utilities/02-electrical-grid-solver.md).
* **Objective:** Implement topological graph partitioning for electrical networks, calculate capacity vs. load, trip overloaded breakers, and detect catastrophic cross-station short circuits.
* **Prerequisites:** Phase 2 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/utilities/electricity.rs`):
    * `DisjointSet` data structure with path compression and union by rank.
    * `PowerStation` component (base capacity: 1,000W; $+500\text{W}$ per adjacent capacitor; max 9,000W).
    * `solve_electrical_grid_system`: Traverses cable connections, unions roots, detects if $>1$ live station share the same root (spawning short-circuit fire), and compares sum of appliance wattage against capacity.
* **Verification & Test Criteria:**
  1. Unit test: Build 1 Power Station with 2 capacitors ($2,000\text{W}$). Connect $10 \times 150\text{W}$ CCTV monitors ($1,500\text{W}$). Assert circuit is stable and all monitors powered.
  2. Overload test: Connect $5 \times 600\text{W}$ workshop saws ($3,000\text{W}$). Assert breaker trips and all connected tiles lose power.
  3. Short-circuit test: Connect two separate live Power Stations with a single wire. Assert both trip and a fire/spark event is emitted.

---

### Task 3.2: BFS Hydraulic Plumbing Solver & Hot Water Boiler Loops
* **Context & Specifications:** Reference [`docs/02-construction-utilities/03-plumbing-and-fluid-dynamics.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/02-construction-utilities/03-plumbing-and-fluid-dynamics.md).
* **Objective:** Implement breadth-first search hydraulic pressure falloff, hot water boiler loops, and tunneling vulnerability flags on large pipes.
* **Prerequisites:** Task 3.1 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/utilities/plumbing.rs`):
    * `FluidPipeCell` struct with cold pressure, hot pressure, and temperature.
    * `solve_plumbing_system`: BFS wave propagation starting at powered Water Pumps (decay: $-0.1\%$/tile for Large Pipes; $-3.0\%$/tile for Small Pipes).
    * `WaterBoilerSystem`: Heats water in adjacent hot water pipes up to $55^\circ\text{C}$ within a 15-tile radius if supplied with cold water and electricity.
* **Verification & Test Criteria:**
  1. Unit test: Large Pipe reaches 200 tiles with $>75\%$ pressure remaining. Small Pipe drops below the $10\%$ functional threshold after 31 tiles.
  2. Boiler test: Boiler with zero electric power outputs cold water ($10^\circ\text{C}$); when powered, outputs hot water ($55^\circ\text{C}$).
  3. Tunnel vulnerability test: Verify `get_tunnel_dig_cost()` returns $0.20$ for large pipe tiles vs $1.00$ for small pipes.

---

### Task 3.3: Connected-Components Room Enclosure Detection & Validation
* **Context & Specifications:** Reference [`docs/02-construction-utilities/04-room-zoning-and-enclosure.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/02-construction-utilities/04-room-zoning-and-enclosure.md).
* **Objective:** Scan player-zoned tiles using flood-fill to verify physical enclosure, minimum dimensions, indoor foundation status, and mandatory furniture props.
* **Prerequisites:** Task 2.4 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/rooms/enclosure.rs`):
    * `scan_room_enclosure(start_x, start_y)` implementing BFS queue flood-fill bounded by walls and doors.
    * `validate_room_requirements(room)` matching against `ROOM_REGISTRY` (Cell, Canteen, Kitchen, Solitary, Yard).
    * Emit room state events (`RoomEnclosureValid`, `RoomEnclosureLeaking`, `RoomMissingProps`).
* **Verification & Test Criteria:**
  1. Build a $3 \times 3$ walled room with a door, zoned as `Cell`. Place Bed and Toilet. Assert room status is `VALID / ACTIVE`.
  2. Demolish one wall tile to create an opening. Assert room status transitions to `LEAKING / UNENCLOSED` and renders red alert icon.
  3. Remove the toilet. Assert room status displays `MISSING_OBJECT: Toilet`.

---

### Task 3.4: Dynamic Cell Quality Grading & Score Evaluator
* **Context & Specifications:** Reference [`docs/02-construction-utilities/04-room-zoning-and-enclosure.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/02-construction-utilities/04-room-zoning-and-enclosure.md).
* **Objective:** Calculate a quality rating from 0 to 10 for every validated cell based on square meterage, exterior windows, and luxury furnishings.
* **Prerequisites:** Task 3.3 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/rooms/cell_grading.rs`):
    * `CellQualityScore` component.
    * `evaluate_cell_grade_system`: Evaluates area ($\ge 6\text{m}^2 = 1$, $\ge 9\text{m}^2 = +1$, $\ge 16\text{m}^2 = +2$), windows with outdoor sightlines ($+1$), TV/Radio ($+1$), desk/chair ($+1$), and in-cell shower ($+1$).
* **Verification & Test Criteria:**
  1. Unit test: Minimal $2 \times 3$ cell with Bed + Toilet scores Grade 1.
  2. Unit test: Spacious $4 \times 4$ cell ($16\text{m}^2$) with Window, Bookshelf, TV, and Shower scores Grade 7.
