# Phase 05: Security, Contraband & Combat

**Goal:** Implement security sector clearances, the physical contraband economy and smuggling vectors, combat/riot escalation physics, and nocturnal escape tunnels.

---

## Task Matrix & Checklist

- [ ] **Task 5.1:** Security Sector Partitioning & Doorway Clearance Matrix
- [ ] **Task 5.2:** Contraband Economy, Smuggling Vectors & Sensor Detection
- [ ] **Task 5.3:** Combat Systems, Riot Escalation & Armory Breaches
- [ ] **Task 5.4:** Escape Tunnels, Subterranean Pathfinding & Nocturnal AI

---

## Detailed Task Specifications

### Task 5.1: Security Sector Partitioning & Doorway Clearance Matrix
* **Context & Specifications:** Reference [`docs/04-security-logistics/02-security-zoning-and-access-control.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/04-security-logistics/02-security-zoning-and-access-control.md).
* **Objective:** Partition the prison into clearance sectors (Shared, Min, Med, Max, SuperMax, Protective, Staff-Only), enforce door permissions, and handle trespassing violations.
* **Prerequisites:** Phase 2 and Phase 4 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/security/sectors.rs`):
    * `SectorGraph` component mapping connected walkable tiles into discrete security sectors bounded by walls and doors.
    * `evaluate_door_clearance(door, entity)` checking security classification against sector clearance.
    * `TrespassingSystem`: Detects unauthorized inmates entering Staff-Only or rival security sectors; alerts nearby guards to arrest and escort the trespasser.
* **Verification & Test Criteria:**
  1. Unit test: Minimum Security prisoner attempts to enter a Maximum Security corridor; door denies access and pathfinding routes away.
  2. Trespassing test: Force an inmate into a Staff-Only office; guard spots inmate within 12 tiles, shouts halt, handcuffs the inmate, and escorts them to Solitary.

---

### Task 5.2: Contraband Economy, Smuggling Vectors & Sensor Detection
* **Context & Specifications:** Reference [`docs/04-security-logistics/03-contraband-economy-and-smuggling.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/04-security-logistics/03-contraband-economy-and-smuggling.md).
* **Objective:** Implement physical contraband generation across the 5 smuggling vectors (trucks, mail, visitors, 10-tile fence throws, room thefts), hidden cell stashes, and sensor detection (metal detectors, K9 units).
* **Prerequisites:** Task 5.1 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/contraband/economy.rs`):
    * `ContrabandItem` component (Weapons, Tools, Narcotics, Luxuries; properties: metallic, scent, lethal damage, dig speed).
    * `smuggling_ingress_system`: Rolls contraband drops in delivery crates, incoming mailbags, visitation hand-offs, and over-the-fence throws ($<10$ tiles from boundary).
    * `sensor_detection_system`: Metal detectors check metallic items ($95\%$ trigger rate); K9 units sniff narcotics ($90\%$ trigger rate); guards conduct cell shakedowns.
* **Verification & Test Criteria:**
  1. Metal detector test: Inmate carrying a stolen metal knife walks through an active metal detector; assert siren sounds, alarm pings HUD, and guard searches inmate.
  2. Over-the-wall test: Place an outdoor yard 8 tiles from the outer fence; assert packages land in the yard. Move fence to 14 tiles; assert zero packages land.

---

### Task 5.3: Combat Systems, Riot Escalation & Armory Breaches
* **Context & Specifications:** Reference [`docs/03-simulation-ai/04-misconduct-violence-and-riots.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/03-simulation-ai/04-misconduct-violence-and-riots.md).
* **Objective:** Implement real-time combat damage calculations, weapon equip logic, riot ignition thresholds, sector capture (Red Zones), and armory looting.
* **Prerequisites:** Task 4.2 and Task 5.2 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/combat/brawl.rs`):
    * `resolve_attack()` applying weapon damage, armor mitigation, and trait modifiers (`Deadly`, `Tough`).
    * `riot_escalation_system`: Triggers full riot when Danger Bar $>80\%$ and $\ge 10$ inmates brawl in the same room.
    * Red Zone sector capture: Smashes cameras, causes unarmed staff to flee, and prompts rioters to bash into the Armory to loot shotguns and body armor.
* **Verification & Test Criteria:**
  1. Combat unit test: Inmate with Shiv (25 damage) attacks Guard with Kevlar Vest ($50\%$ mitigation); assert guard takes $12.5$ damage.
  2. Riot test: Ignite a riot in Cell Block A. Verify that guards retreat, the sector turns into a Red Zone, and rioting inmates attempt to break down the Armory door.

---

### Task 5.4: Escape Tunnels, Subterranean Pathfinding & Nocturnal AI
* **Context & Specifications:** Reference [`docs/03-simulation-ai/05-tunnel-digging-and-escape-ai.md`](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/docs/03-simulation-ai/05-tunnel-digging-and-escape-ai.md).
* **Objective:** Implement nocturnal tunnel excavation during the Sleep regime, dummy placement in beds, digging tool durability, soil flushing, and K9 detection.
* **Prerequisites:** Task 3.2 and Task 5.2 complete.
* **Deliverables:**
  * In Rust (`crates/simulation/src/ai/tunneling.rs`):
    * `TunnelDiggingState` component tracking active tool, progress, and dirt in pockets.
    * `nocturnal_digging_system`: Operates between 00:00 and 06:00; inmate places decoy dummy in bed, slips into toilet shaft, and excavates along the path of least resistance (utilizing large water pipes for $5\times$ speed).
    * `K9VibrationSystem`: Dog patrol walking over an active tunnel has a $30\%$ chance per step to flag a yellow shovel icon.
* **Verification & Test Criteria:**
  1. Tunnel progression test: Give an inmate a stolen spoon; verify they dig during the night, dummy renders in bed, and excavated dirt is flushed down the toilet.
  2. K9 alert test: Walk a dog handler unit directly over an active underground tunnel; assert dog barks and flags a vibration alert.
