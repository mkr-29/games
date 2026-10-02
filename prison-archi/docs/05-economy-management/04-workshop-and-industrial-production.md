# Domain 05: Economy, Management & Governance
## Feature Specification 04: Industrial Manufacturing, Workshop Labor & Forestry

---

## 1. System Overview & The Industrial Engine

In *Prison Architect Web*, the **Industrial Workshop** turns a detention facility into a profitable manufacturing enterprise. By putting prisoners to work cutting sheet metal and milling timber, the prison generates substantial export revenues that dwarf basic government housing stipends.

However, industrial manufacturing introduces an **extreme security trade-off**:
* Inmates gain direct physical access to **heavy industrial blades, saws, and blunt hammers**, significantly increasing the lethality of subsequent riots.

```
       [ FORESTRY ZONE ]                       [ SHEET METAL INTAKE ]
    Gardener cuts Tree Trunk                    Workmen unload Sheet Metal
               │                                            │
               ▼                                            ▼
      [ WORKSHOP SAW ]                             [ WORKSHOP SAW ]
   Milling: Tree -> 4 Planks                     Cutting: 1 Metal -> 2 Blanks
               │                                            │
               ▼                                            ▼
    [ CARPENTRY BENCH ]                        [ HYDRAULIC METAL PRESS ]
  (Requires Passed Program)                      Stamping: 2 Blanks -> 2 Plates
   Carves: Superior Bed ($400)                              │
               │                                            ▼
               └────────────────────┬───────────────────────┘
                                    ▼
                             [ EXPORTS ZONE ]
                                    │
                       Truck collects finished goods
                        Instant Cash Deposit to Bank
```

---

## 2. Production Pipelines & Economic Yields

### Pipeline A: License Plate Stamping (High Volume / Low Margin)
1. **Raw Material:** 1 Sheet Metal costs $\$10.00$.
2. **Saw Operation:** Inmate cuts Sheet Metal on **Workshop Saw** $\to 2$ Blank Metal Plates.
3. **Press Operation:** Inmate stamps Blanks on **Hydraulic Metal Press** $\to 2$ License Plates.
4. **Export Sale:** $2 \times \$10.00 = \$20.00$.
5. **Net Profit:** $\$10.00$ per raw metal sheet ($100\%$ return on capital).

### Pipeline B: Fine Woodworking & Carpentry (Low Volume / Massive Margin)
1. **Raw Material:** Planted Tree sapling costs $\$100.00$ (or zero if cut from wild trees).
2. **Saw Operation:** Inmate mills Tree Trunk on **Workshop Saw** $\to 4$ Wood Planks.
3. **Carpentry Crafting:** An inmate certified via the *Carpentry Apprenticeship* crafts wood at a **Carpentry Table** $\to 1$ Superior Wooden Bed.
4. **Export Sale:** $\$400.00$ per bed.
5. **Net Profit:** $\$300.00+$ per crafted bed.

---

## 3. Worker Certification & Safety Training

Inmates cannot operate industrial machinery without passing mandatory training programs led by the **Foreman**:

```rust
pub static WORKSHOP_PROGRAMS: &[ProgramDefinition] = &[
    ProgramDefinition {
        id: 201,
        name: "Workshop Safety Induction",
        instructor: StaffType::Foreman,
        classroom_required: RoomType::Workshop,
        session_hours: 2,
        total_sessions: 1,
        equipment_required: ObjectType::WorkshopSaw,
        unlocked_work_tier: WorkCertification::Metalworker,
    },
    ProgramDefinition {
        id: 202,
        name: "Carpentry Apprenticeship",
        instructor: StaffType::Foreman,
        classroom_required: RoomType::Workshop,
        session_hours: 2,
        total_sessions: 5,
        equipment_required: ObjectType::CarpentryTable,
        unlocked_work_tier: WorkCertification::MasterCarpenter,
    },
];
```

* **Pass Rate:** Inmates with high suppression, exhaustion, or low literacy have a high failure rate ($< 20\%$). Inmates with low anger and high concentration pass readily ($> 80\%$).

---

## 4. Physical Logistics & The Exports Zone

1. When a finished license plate or wooden bed is completed, it is packed into a wooden cardboard carton.
2. Unassigned Workmen or working prisoners carry cartons to the **Exports Zone** (located along the delivery roadway).
3. Every 6 in-game hours, an **Export Freight Truck** stops at the curb.
4. Workmen load boxes into the truck trailer; cash is wired to the player's account upon truck departure.

---

## 5. Security Hazards & Contraband Suppression

The workshop contains the densest concentration of weapons and escape tools in the prison:

```
[ Workshop Prop ] ───(Theft Opportunity)───► [ Contraband Looted ]
 Workshop Saw                                  Hacksaw (Cuts jail doors)
 Hydraulic Press                              Screwdriver (Escape tool)
 Wooden Timber                                Heavy Club (Blunt weapon)
 Tool Cabinet                                 Industrial Hammer / Chisel
```

### Mandatory Countermeasures:
* **Metal Detector Portals:** Must be placed directly on the entrance door of the workshop. Any inmate walking out with a hacksaw or screwdriver immediately triggers sirens.
* **Armed Guard Line-of-Sight:** Stationing a guard inside the room deters weapon thefts by $70\%$.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Industrial Amputation Accident** | Unskilled inmate attempts to use the saw without passing the safety program. | Machine Safety Interlocks: Saws cannot be powered unless operated by an inmate with the `Certified Metalworker` component; uncertified tampering rolls an immediate amputation injury requiring infirmary surgery. |
| **Exports Overflow Gridlock** | Exports zone is too small; 2,000 finished boxes spill into the roadway, blocking delivery trucks. | Dynamic Pallet Stacking: Cartons automatically stack up to 4 units high per tile; the UI alerts if Exports capacity is $> 90\%$ full. |
| **Forestry Deforestation Famine** | Gardeners cut down every tree on the map without replanting saplings. | Automated Forestry Re-seeding: The Forestry room designation automatically orders new saplings to be planted in harvested soil tiles. |
