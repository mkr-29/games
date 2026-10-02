# Phase 06: Economy, Logistics & Governance

**Goal:** Implement the physical food and laundry loops, financial balance sheets, reactive DAG government grants, bureaucracy research tree, workshop manufacturing, and the execution protocol.

---

## Task Matrix & Checklist

- [ ] **Task 6.1:** Food Service Supply Chain & Laundry Distribution Loops
- [ ] **Task 6.2:** Financial Ledger, Cashflow Dynamics & Corporate Taxation
- [ ] **Task 6.3:** Government Grants System & Reactive DAG Milestone Engine
- [ ] **Task 6.4:** Bureaucracy Tech Tree, Workshop Industry & Execution Protocol

---

## Detailed Task Specifications

### Task 6.1: Food Service Supply Chain & Laundry Distribution Loops
* **Context & Specifications:** Reference [`docs/04-security-logistics/05-supply-chains-and-room-logistics.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/04-security-logistics/05-supply-chains-and-room-logistics.md).
* **Objective:** Implement closed-loop logistics for food (crates $\to$ fridge $\to$ stove $\to$ serving table $\to$ consumption $\to$ dirty trays $\to$ sink) and uniforms (laundry basket $\to$ washer $\to$ iron $\to$ cell bed).
* **Prerequisites:** Phase 3 and Phase 4 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/logistics/kitchen.rs`):
    * `KitchenLogisticsSystem`: Orders daily ingredients, directs Cooks to prepare meals on Cooker stoves, and stocks Serving Tables ahead of scheduled meal regimes.
    * Tray recycling: Consumed meals produce Dirty Trays; Cooks wash them at Sinks to restock clean trays.
  * In Rust (`crates/simulation/src/logistics/laundry.rs`):
    * `LaundrySystem`: Collects dirty uniforms in wheeled carts, runs 30s washing cycles, irons clean uniforms, and delivers them to assigned inmate beds.
* **Verification & Test Criteria:**
  1. Food loop test: Schedule 50 inmates to eat at 12:00. Verify Kitchen stocks 50 hot meals, inmates eat and clear hunger to $0\%$, and dirty trays are washed at sinks.
  2. Laundry test: Verify clean uniforms delivered to cell beds grant $+15\%$ comfort bonus when worn.

---

### Task 6.2: Financial Ledger, Cashflow Dynamics & Corporate Taxation
* **Context & Specifications:** Reference [`docs/05-economy-management/01-financial-model-and-cashflow.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/05-economy-management/01-financial-model-and-cashflow.md).
* **Objective:** Implement daily prisoner stipends by security class, hourly staff wage payroll, corporate income tax deductions, and bank loans.
* **Prerequisites:** Phase 1 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/economy/ledger.rs`):
    * `FinancialLedgerResource` tracking bank balance (cents) and 24-hour revenue/expense breakdown.
    * `hourly_payroll_system`: Deducts wages for guards ($100/day), cooks ($80/day), workmen ($100/day).
    * `daily_tax_system`: Assesses $30\%$ tax on net profits at midnight (reducible to $15\%$ and $1\%$ via Accountant/Lawyer research).
* **Verification & Test Criteria:**
  1. Unit test: Prison housing 100 Medium Security prisoners ($150/day each) generates $\$15,000$ gross daily revenue.
  2. Payroll test: Hiring 10 Guards correctly deducts $\$41.66$ per hour from cash balance.

---

### Task 6.3: Government Grants System & Reactive DAG Milestone Engine
* **Context & Specifications:** Reference [`docs/05-economy-management/02-government-grants-system.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/05-economy-management/02-government-grants-system.md).
* **Objective:** Build the reactive milestone evaluation engine that advances grant dependencies via ECS event observers with zero per-tick polling overhead.
* **Prerequisites:** Task 6.2 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/economy/grants.rs`):
    * `GrantDefinition` registry (Basic Detention, Admin Center, Health & Well-being, Inmate Manufacturing, Cell Block A).
    * `grant_event_observer_system`: Listens to `RoomConstructed`, `StaffHired`, `InmateAdmitted`, and `ItemExported` events, updating objective counters and disbursing advance and completion payouts.
* **Verification & Test Criteria:**
  1. Accept `Basic Detention Center` grant: Verify $\$20,000$ advance is deposited immediately.
  2. Build required Holding Cell, Shower, Kitchen, and Canteen: Verify completion payment of $\$10,000$ triggers automatically upon completion of the final room.

---

### Task 6.4: Bureaucracy Tech Tree, Workshop Industry & Execution Protocol
* **Context & Specifications:** Reference [`docs/05-economy-management/03-bureaucracy-research-tree.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/05-economy-management/03-bureaucracy-research-tree.md), [`docs/05-economy-management/04-workshop-and-industrial-production.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/05-economy-management/04-workshop-and-industrial-production.md), and [`docs/05-economy-management/06-death-row-and-execution-protocol.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/05-economy-management/06-death-row-and-execution-protocol.md).
* **Objective:** Implement administrative office research, workshop manufacturing (saws, metal presses, license plates, carpentry), and the 5-step capital punishment execution protocol.
* **Prerequisites:** Task 6.3 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/economy/bureaucracy.rs`):
    * Administrator office validation (Desk, Chair, Filing Cabinet).
    * Bureaucracy DAG timer advancement when administrators sit at desks.
  * In Rust (`crates/simulation/src/workshop/manufacturing.rs`):
    * Sheet metal stamping pipeline (raw sheet $\to$ saw blank $\to$ press license plate $\to$ exports truck sale: $\$10$ profit/sheet).
  * In Rust (`crates/simulation/src/justice/execution.rs`):
    * Death Row appeals cycle (clemency chance decay).
    * Execution protocol: Lockdown, witness march, 5,000W electric chair surge, medical pronouncement.
* **Verification & Test Criteria:**
  1. Bureaucracy test: Hire Chief in a valid office; research `Armory & Armed Guards` (12 hours). Verify Armed Guards become unlockable upon completion.
  2. Workshop test: Inmate cuts metal and stamps license plates; verify boxes are moved to Exports and sold to departing freight truck.
  3. Execution test: Execute an inmate with clemency $<5\%$; assert 5,000W drawn from circuit and $\$10,000$ state bounty awarded.
