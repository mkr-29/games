# Domain 04: Security, Logistics & Regime
## Feature Specification 02: Security Zoning, Sector Clearance & Access Control

---

## 1. System Overview & The Sector Security Model

A prison without physical zoning degenerates rapidly into chaos. **Security Zoning** enables the Warden to divide the prison into distinct **Sectors** color-coded by authorized clearance levels.

When a prisoner enters a sector for which they lack clearance (e.g., a Medium Security inmate wandering into a `Staff Only` armory corridor, or a Maximum Security inmate entering a `Protective Custody` yard), the trespassing detection system triggers immediate guard intervention.

```
┌────────────────────────────────────────────────────────┐
│ [SHARED SECTOR] (White)                                │
│ Accessible by all prisoner security tiers & staff.     │
├────────────────────────────────────────────────────────┤
│ [MINIMUM SECURITY ONLY] (Grey)                         │
│ Medium and Max-Sec prisoners are blocked from entering.│
├────────────────────────────────────────────────────────┤
│ [MAXIMUM SECURITY ONLY] (Red)                          │
│ Only Max-Sec prisoners permitted; high guard presence. │
├────────────────────────────────────────────────────────┤
│ [PROTECTIVE CUSTODY ONLY] (Yellow)                     │
│ Strict isolation wing for Snitches and Ex-Cops.        │
├────────────────────────────────────────────────────────┤
│ [STAFF ONLY] (Blue)                                    │
│ Zero prisoner access. Any inmate caught here is        │
│ immediately handcuffed for "Trespassing".              │
└────────────────────────────────────────────────────────┘
```

---

## 2. Sector Graph Partitioning & Enclosure

A **Sector** is defined as any contiguous area of walkable tiles bounded on all sides by **Walls or Doors**:

```rust
pub struct SectorGraph {
    pub sectors: Vec<SectorNode>,
    pub tile_to_sector: Vec<u16>, // Array indexed by (y * width + x)
}

#[derive(Clone, Debug)]
pub struct SectorNode {
    pub sector_id: u16,
    pub clearance: SectorClearance,
    pub tile_count: u32,
    pub perimeter_doors: Vec<Entity>,
    pub contains_escape_route: bool, // Touches outer map boundary
}

#[repr(u8)]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum SectorClearance {
    Shared = 0,
    MinSecOnly = 1,
    MedSecOnly = 2,
    MaxSecOnly = 3,
    SuperMaxOnly = 4,
    ProtectiveCustody = 5,
    DeathRowOnly = 6,
    StaffOnly = 7,
}
```

### Automatic Re-Partitioning
Whenever a wall is erected or a door is installed, the `SectorGraphSystem` performs a connected-components traversal, splitting or merging sector nodes and updating tile lookup indices.

---

## 3. Doorway Clearance Matrix & Key Ownership

Doors act as the physical checkpoints between sectors. When an entity arrives at a closed door:

```rust
pub fn evaluate_door_clearance(
    door: &DoorComponent,
    sector_target_clearance: SectorClearance,
    entity: &EntityProfile,
) -> AccessDecision {
    // Staff always have clearance unless door is in locked shutdown
    if entity.is_staff() {
        return if door.is_lockdown_shut { AccessDecision::Denied } else { AccessDecision::GrantedWithKey };
    }

    // Prisoner evaluation
    let inmate_class = entity.security_class.unwrap();

    // Check Staff-Only restriction
    if sector_target_clearance == SectorClearance::StaffOnly {
        return AccessDecision::Trespassing;
    }

    // Check Security Class match
    match (sector_target_clearance, inmate_class) {
        (SectorClearance::Shared, _) => AccessDecision::Granted,
        (SectorClearance::MinSecOnly, SecurityClass::MinimumSecurity) => AccessDecision::Granted,
        (SectorClearance::MedSecOnly, SecurityClass::MediumSecurity) => AccessDecision::Granted,
        (SectorClearance::MaxSecOnly, SecurityClass::MaximumSecurity) => AccessDecision::Granted,
        (SectorClearance::SuperMaxOnly, SecurityClass::SuperMax) => AccessDecision::Granted,
        (SectorClearance::ProtectiveCustody, SecurityClass::ProtectiveCustody) => AccessDecision::Granted,
        _ => AccessDecision::Denied, // Inmate cannot enter
    }
}
```

---

## 4. Trespassing AI & Guard Response Escalation

If an inmate crosses into a restricted zone (e.g., slipped through a `Staff Only` door left open by a careless workman):

```
[ Inmate Enters "Staff Only" Sector ]
                 │
                 ▼
Guard Line of Sight Check (Within 12 tiles)
                 │
        ┌────────┴────────┐
        ▼                 ▼
   [ Spotted ]       [ Unspotted ]
        │                 │
  Guard Yells Halt!   Inmate steals weapon
        │             from Armory shelf
        ▼
Inmate Complies?
  ├── YES: Handcuffed & Escorted to Solitary (12 hrs)
  └── NO:  Baton Takedown / Taser Deployment
```

---

## 5. WebGPU Colorized Sector Overlay

The player can toggle the **Deployment Overlay (Key: D)**:
* A WGSL post-process shader samples the `tile_to_sector` storage buffer.
* Renders a soft, translucent color wash over each sector (e.g., Staff Only = Translucent Deep Blue with hazard diagonal striping).
* Outlines security boundaries with high-contrast glowing border lines.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Inmate Trapped in Wrong Sector** | Prisoner pushed into Staff zone during a brawl cannot path back out through the locked door. | Surrender / Hands-Up State: Trapped inmates will walk to the nearest staff door, turn around, and sit peacefully waiting for a guard to escort them out rather than breaking the door. |
| **Protective Custody Corridor Leak** | Snitch sector shares a main hallway with Max Sec; snitch gets assassinated during transit. | "Airtight Sector" Verification: The UI flags an orange warning badge if a Protective Custody sector's only path to a canteen crosses through a shared general-population sector. |
| **Workman Leaves Remote Door Open** | Worker holds open a heavy security blast door with a wooden wedge. | Automatic Door Timeout: Servos connected to the security console automatically force doors shut after 10 seconds of idle dwell time. |
