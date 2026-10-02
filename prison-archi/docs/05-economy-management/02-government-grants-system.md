# Domain 05: Economy, Management & Governance
## Feature Specification 02: Government Grants System & Reactive DAG Milestones

---

## 1. System Overview & The Grant Progression Model

In *Prison Architect Web*, **Government Grants** serve as the primary catalyst for early- and mid-game expansion. Rather than forcing the player to wait days for daily prisoner stipends to accumulate, state and federal agencies offer capital contracts.

Each grant operates on a **Split Funding Structure**:
1. **Advance Payment ($60–80\%$):** Cash paid into the bank balance immediately upon accepting the grant, funding the required construction materials and staff hires.
2. **Completion Payment ($20–40\%$):** Final bonus paid once all milestone objectives pass state inspection.

```
                      [ Grant Accepted ]
                              │
                    Advance Cash Deposited
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
  Objective 1            Objective 2            Objective 3
  Build Kitchen          Hire 2 Cooks           Zone Canteen
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              ▼
                 [ All Milestones Verified ]
                              │
                    Completion Bonus Paid
                              │
                   Unlocks Successor Grants
```

---

## 2. Directed Acyclic Graph (DAG) Architecture

Grants are organized into a strict prerequisite dependency tree:

```
[ Basic Detention Center ] ──► [ Cell Block A: 50 Inmates ] ──► [ Cell Block B: 100 Inmates ]
             │                                                          │
             ▼                                                          ▼
[ Administration Center ] ──► [ Health & Well-Being ]       [ Security & Surveillance ]
             │                                                          │
             ▼                                                          ▼
  [ Prison Manufacturing ]                                    [ Max-Sec Containment ]
```

---

## 3. Core Government Grants Registry

| Grant Title | Advance | Completion | Prerequisites | Milestone Objectives |
| :--- | :--- | :--- | :--- | :--- |
| **Basic Detention Center** | $\$20,000$ | $\$10,000$ | None | - Build Holding Cell<br>- Build Shower & Yard<br>- Build Kitchen & Canteen |
| **Administration Center** | $\$5,000$ | $\$5,000$ | None | - Build 2 Offices<br>- Hire Warden<br>- Unlock Accountant via Bureaucracy |
| **Prison Health & Well-being** | $\$10,000$ | $\$10,000$ | Admin Center | - Build Infirmary<br>- Hire 2 Doctors<br>- Hire 1 Psychologist |
| **Cell Block A** | $\$20,000$ | $\$20,000$ | Basic Detention | - Expand total cell capacity to 50<br>- Maintain 0 escapes for 48 hrs |
| **Inmate Manufacturing** | $\$20,000$ | $\$10,000$ | Admin Center | - Build Workshop<br>- Install 2 Saws & 2 Presses<br>- Export 100 License Plates |

---

## 4. Reactive Event Observer Architecture (Rust Implementation)

Rather than executing costly, wasteful polling loops that re-check hundreds of grant conditions every simulation tick, the grant system is implemented via **Reactive ECS Event Observers**:

```rust
use bevy_ecs::prelude::*;

#[derive(Debug, Clone)]
pub struct GrantDefinition {
    pub id: u32,
    pub name: &'static str,
    pub advance_cents: u32,
    pub completion_cents: u32,
    pub prerequisites: &'static [u32],
    pub objectives: Vec<GrantObjective>,
}

#[derive(Debug, Clone)]
pub struct GrantObjective {
    pub description: &'static str,
    pub target_metric: MetricType,
    pub required_count: u32,
    pub current_count: u32,
    pub is_completed: bool,
}

#[derive(Event)]
pub enum PrisonEvent {
    RoomConstructed { room_type: u16, area: u16 },
    StaffHired { staff_type: u8 },
    InmateAdmitted { total_headcount: u32 },
    LicensePlateExported { count: u32 },
}

pub fn grant_event_observer_system(
    mut events: EventReader<PrisonEvent>,
    mut active_grants: ResMut<ActiveGrantsResource>,
    mut bank_balance: ResMut<BankBalanceResource>,
) {
    for event in events.read() {
        for grant in active_grants.list.iter_mut() {
            let mut all_completed = true;

            for obj in grant.objectives.iter_mut() {
                if obj.is_completed { continue; }

                match (event, obj.target_metric) {
                    (PrisonEvent::RoomConstructed { room_type, .. }, MetricType::RoomExists(r)) if *room_type == r => {
                        obj.current_count += 1;
                    }
                    (PrisonEvent::StaffHired { staff_type }, MetricType::StaffEmployed(s)) if *staff_type == s => {
                        obj.current_count += 1;
                    }
                    (PrisonEvent::InmateAdmitted { total_headcount }, MetricType::CapacityReached) => {
                        obj.current_count = *total_headcount;
                    }
                    _ => {}
                }

                if obj.current_count >= obj.required_count {
                    obj.is_completed = true;
                } else {
                    all_completed = false;
                }
            }

            if all_completed && !grant.is_fully_paid {
                grant.is_fully_paid = true;
                bank_balance.cents += grant.completion_cents;
                // Emit UI notification event to Svelte HUD
            }
        }
    }
}
```

---

## 5. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Demolishing Required Room Post-Completion** | Player receives completion bonus for Infirmary, then immediately demolishes it to pocket cash. | Persistent Milestone Audits: High-tier grants require holding capacity for a minimum continuous duration (e.g. 5 days); early demolition imposes a clawback debt fine. |
| **Simultaneous Conflicting Grants** | Player accepts 10 grants simultaneously, maxing out advance cash without completing any. | Active Grant Cap: The Department of Corrections limits concurrent active grants to 2 (expandable to 3 via the `Extra Grants` Accountant research upgrade). |
| **Bank Balance Overdraft on Failed Grant** | Player defaults on a grant with a penalty clause while having zero cash. | State Receiver / Debt Restructuring: The Governor places the prison into state trusteeship, restricting discretionary spending until debt is cleared. |
