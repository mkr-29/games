# Domain 04: Security, Logistics & Regime
## Feature Specification 04: Surveillance Automation, Patrol Networks & Confidential Informants

---

## 1. System Overview & The Intelligence Trinity

High-efficiency prison management requires replacing expensive human guard patrols with **Automated Electronic Surveillance** and an **Undercover Human Intelligence Network**:

```
                       [ INTELLIGENCE TRINITY ]
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      ▼                            ▼                            ▼
[ Visual Surveillance ]     [ Audio Surveillance ]      [ Human Intelligence ]
 - CCTV Cameras              - Phone Taps on Payphones   - Confidential Informants (CIs)
 - CCTV Monitor Consoles     - Reveals smuggling plans   - Unmasks hidden reputations
 - Clears Fog of War         - Flags incoming drops      - Identifies tunnel excavators
```

---

## 2. CCTV Systems & Fog of War Reveal Mechanics

* **CCTV Cameras:** Mounted on walls. Emits a $60^\circ$ motorized cone of vision that pans back and forth.
* **CCTV Monitor Console:** Located in the Security Room. 
  * Operated by a seated Guard.
  * A single console can connect to up to **8 cameras simultaneously**.
  * If the operating guard abandons their post (e.g. to grab coffee or respond to a fight), all 8 connected cameras go blind, returning their sectors into Fog of War.

```
[ CCTV Monitor Console ] (Guarded by 1 Security Officer)
          │
          ├── Cable 1 ──► Camera A: Cell Block Corridor
          ├── Cable 2 ──► Camera B: Dining Hall
          ├── Cable 3 ──► Camera C: Yard North
          └── Cable 4 ──► Camera D: Delivery Loading Dock
```

---

## 3. Remote Door Control & Servo Airlocks

To prevent guards from having to physically walk across the prison to unlock security doors, players construct **Automated Remote Airlocks**:

```
[ Door Control Console ] ───(Logic Wire)───► [ Door Servo Motor ]
           ▲                                          │
           │                                          ▼
   Stationed Guard                      Solenoid Arm physically
  flips remote switch                   pulls open Jail Door (0.5s)
```

### Components:
* **Door Servo:** Mounted directly on top of a standard or large jail door.
* **Logic Wire:** Electrical wire carrying control signals from the Security Room.
* **Pressure Pads:** Can be installed before the door to trigger automated opening for authorized staff while ignoring inmates.
* **Failsafe Mode:** If power is cut, servos lock in their current state; if set to `Fail-Secure`, doors remain bolted shut.

---

## 4. Guard Patrols & Tactical Deployment Grid

The **Deployment Screen** allows the Warden to assign personnel across space and time:

```rust
pub struct GuardDeployment {
    pub room_id: u32,
    pub guards_stationed: u8,
    pub armed_guards_stationed: u8,
    pub dog_handlers_stationed: u8,
    pub patrol_route_id: Option<u32>,
}

#[derive(Clone, Debug)]
pub struct PatrolRoute {
    pub id: u32,
    pub waypoints: Vec<(u16, u16)>,
    pub assigned_entities: Vec<Entity>,
    pub is_dog_route: bool,
}
```

* **Stationed Guards:** Remain within a designated room (e.g., 2 guards in the Canteen during meal hours).
* **Linear Patrols:** Guards pace between designated waypoints along corridors or perimeter fences.
* **Watchtowers & Snipers:** Snipers equipped with high-powered bolt-action rifles stand atop elevated watchtowers, providing a $360^\circ$ lethal perimeter over outdoor yards.

---

## 5. Confidential Informants (CIs) & Undercover Operations

The most potent weapon against covert plots (escape tunnels, gang assassinations, weapons caches) is the **Confidential Informant (CI)**:

```
[ Violent Inmate Sent to Solitary Confinement ]
                       │
                       ▼
Solitary Guard: "Interrogate / Turn Inmate into CI?"
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
 [ Inmate Accepts ]              [ Inmate Refuses ]
   (Suppression > 60%)             (Remains in Solitary)
       │
       ▼
Inmate Marked as Active CI
Returns to General Population
       │
       ▼
Summon CI to Security Office for Debriefing
       │
       ▼
Reveals Hidden Intel Across Inmate Population:
 - Unmasks all hidden traits (?)
 - Highlights active tunnel locations in bright yellow
 - Exposes upcoming gang hit targets
```

### The Suspicion vs. Coverage Calculus:
* **Coverage Metric (%):** The fraction of the prison population monitored by your active informants. Having 5 CIs across different cell blocks yields $\sim 95\%$ coverage.
* **Suspicion Metric (%):** Every time you summon a CI to the Security Office, or search a cell based on their tip, their **Suspicion Meter** climbs.
* **Assassination Risk:** If suspicion reaches $100\%$, other inmates figure out the betrayal. The CI's trait permanently converts to `Snitch`, and inmates immediately execute an assassination contract.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **CI Summoned Mid-Shift** | Guard publicly handcuffs CI in front of 50 gang members in the cafeteria. | Covert Summons: CIs are only escorted to the security office during quiet hours or under the guise of a standard disciplinary transfer. |
| **Overloaded Door Console** | Player wires 30 doors to 1 console; guard cannot press buttons fast enough, jamming queues. | Servo Controller Limits: Each console operates at maximum efficiency with $\le 10$ connected doors; above 10, a sequential door-opening queue introduces a 1.5s delay per door. |
| **Sniper Tower Blind Spots** | High perimeter walls obstruct watchtower sniper line of sight. | Elevation Line-of-Sight Checks: WebGPU compute shaders raycast from tower height ($+6\text{ m}$), ignoring low fences while acknowledging solid multi-story brick walls. |
