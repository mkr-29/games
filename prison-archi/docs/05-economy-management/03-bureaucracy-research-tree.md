# Domain 05: Economy, Management & Governance
## Feature Specification 03: Bureaucracy Research Tree & Administrative Staff Hierarchy

---

## 1. System Overview & The Governance Hierarchy

In *Prison Architect Web*, advanced tools, security deployments, high-tier staff, and financial relief are locked behind the **Bureaucracy Research Tree**.

Research is not an abstract laboratory slider; it requires **Physical Administrative Infrastructure**. To research an upgrade:
1. You must construct a furnished **Office** ($4 \times 4\text{ m}$, Desk, Chair, Filing Cabinet).
2. You must hire the specialized **Administrative Officer** (Warden, Chief, Foreman, Accountant, Psychologist, Lawyer).
3. The Officer must sit at their desk without being interrupted by fights, fires, or riots while research time elapses.

```
                              [ THE WARDEN ]
                       (Requires Executive Office)
                                    │
    ┌───────────────┬───────────────┼───────────────┬───────────────┐
    ▼               ▼               ▼               ▼               ▼
[ The Chief ]  [ The Foreman ] [ Accountant ]  [ Psychologist ] [ The Lawyer ]
    │               │               │               │               │
    ├── Deployment  ├── Maintenance ├── Tax Relief  ├── Needs View  ├── Legal Loophole
    ├── Patrols     ├── Cleaning    ├── Bank Loans  ├── Therapy     ├── Death Row
    ├── Dog Units   ├── Workshop    ├── Extra Grant └── Behavior    └── Small Cells
    ├── Armory      └── Forestry    └── Land Buy
    └── Tasers
```

---

## 2. Research Node Definitions & Dependencies

```rust
#[derive(Debug, Clone)]
pub struct ResearchNode {
    pub id: u32,
    pub name: &'static str,
    pub administrator_required: AdminRole,
    pub duration_in_game_hours: u16,
    pub cost_cents: u32,
    pub prerequisites: &'static [u32],
    pub unlocks_feature: UnlockedFeature,
}

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AdminRole {
    Warden = 0,
    ChiefOfPolice = 1,
    Foreman = 2,
    Accountant = 3,
    Psychologist = 4,
    CorporateLawyer = 5,
}

pub static BUREAUCRACY_TREE: &[ResearchNode] = &[
    ResearchNode {
        id: 1, name: "Warden", administrator_required: AdminRole::Warden,
        duration_in_game_hours: 0, cost_cents: 100000, prerequisites: &[],
        unlocks_feature: UnlockedFeature::HiringAdmins,
    },
    ResearchNode {
        id: 10, name: "Security & Deployment", administrator_required: AdminRole::ChiefOfPolice,
        duration_in_game_hours: 6, cost_cents: 200000, prerequisites: &[1],
        unlocks_feature: UnlockedFeature::DeploymentScreen,
    },
    ResearchNode {
        id: 11, name: "Armory & Armed Guards", administrator_required: AdminRole::ChiefOfPolice,
        duration_in_game_hours: 12, cost_cents: 500000, prerequisites: &[10],
        unlocks_feature: UnlockedFeature::ArmedGuardsAndShotguns,
    },
    ResearchNode {
        id: 12, name: "Taser Rollout", administrator_required: AdminRole::ChiefOfPolice,
        duration_in_game_hours: 24, cost_cents: 1000000, prerequisites: &[11],
        unlocks_feature: UnlockedFeature::GuardTasers,
    },
    ResearchNode {
        id: 20, name: "Prison Labor & Workshop", administrator_required: AdminRole::Foreman,
        duration_in_game_hours: 8, cost_cents: 100000, prerequisites: &[1],
        unlocks_feature: UnlockedFeature::WorkshopRoom,
    },
    ResearchNode {
        id: 30, name: "Corporate Tax Relief", administrator_required: AdminRole::Accountant,
        duration_in_game_hours: 24, cost_cents: 1000000, prerequisites: &[1],
        unlocks_feature: UnlockedFeature::TaxCut15Percent,
    },
];
```

---

## 3. Administrative Roles & Specializations

### 1. The Warden
* The foundational administrative leader. Unlocks the ability to recruit all other administrators.
* Grants access to emergency command overrides (`Lockdown`, `Bangup`, `Free Fire`).

### 2. The Chief of Police
* Oversees the security apparatus.
* Unlocks **Deployment**, **Guard Patrols**, **CCTV Surveillance**, **K9 Handlers**, **Armory**, and **Taser Certification**.

### 3. The Foreman
* Oversees construction, facilities maintenance, and inmate labor.
* Unlocks **Janitors** (cleanliness), **Gardeners**, **Forestry**, and the **Industrial Workshop**.

### 4. The Accountant
* Manages finances and corporate balance sheets.
* Unlocks **Financial Ledger HUD**, **Corporate Tax Deductions**, **Bank Credit Lines**, and **Land Purchases** (buying adjacent map tiles).

### 5. The Psychologist
* Provides mental health profiling.
* Unlocks the **Inmate Needs Gauge** on the HUD (without a Psychologist, player cannot see individual need bars).
* Unlocks **Alcoholics Anonymous** and **Behavioral Anger Therapy**.

### 6. The Corporate Lawyer
* Manipulates the legal system to bypass prison regulations.
* Unlocks:
  * **Small Cells:** Eliminates the minimum $2 \times 3\text{ m}$ legal cell size requirement, allowing $1 \times 2\text{ m}$ cages without state penalties.
  * **Permanent Solitary:** Allows sentencing violent prisoners to indefinite solitary confinement without habeas corpus lawsuits.
  * **Death Row & Execution:** Permits acceptance of condemned prisoners and execution via Electric Chair.

---

## 4. Research Progression System Algorithm

```rust
pub fn update_bureaucracy_research(
    mut active_research: ResMut<ActiveResearchState>,
    admins: Query<(&AdminStaffComponent, &Position, &AgentBehavior)>,
    time: Res<SimTimeResource>,
) {
    let Some(ref mut node) = active_research.current_node else { return };

    // Find the required administrator entity
    for (admin, pos, behavior) in admins.iter() {
        if admin.role == node.administrator_required {
            // Must be seated in an approved office
            if behavior.current_action == ActionState::WorkingAtDesk {
                node.accumulated_seconds += time.tick_delta_seconds;
                
                if node.accumulated_seconds >= (node.duration_in_game_hours as f32 * 60.0) {
                    // Research Complete!
                    unlock_bureaucracy_perk(node.unlocks_feature);
                    active_research.current_node = None;
                }
            }
        }
    }
}
```

---

## 5. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Administrator Murdered Mid-Research** | Inmates breach office and assassinate the Chief at 95% research progress. | Progress Preservation: Research progress is saved to the node; when a replacement Chief is hired and seated, research resumes from 95%. |
| **Simultaneous Branch Requests** | Player attempts to queue 5 research upgrades at once. | Department Isolation: You can conduct parallel research only if the projects belong to different administrators (e.g. Chief researching Tasers while Accountant researches Taxes). |
| **Office Condemned / Unenclosed** | Wall destroyed in riot leaves office unenclosed; administrator flees. | Research Pauses: State flags `Office Compromised`; research halts and displays a flashing office repair prompt on the HUD. |
