# Domain 03: Inmate Simulation & Agent AI
## Feature Specification 05: Escape Tunnels, Subterranean Pathfinding & Nocturnal AI

---

## 1. System Overview & The Great Escape Architecture

Escape tunnel excavation in *Prison Architect Web* is one of the most covert and emergent simulation subsystems. Rather than bursting through security gates in open combat, intelligent inmates with long sentences collaborate to **excavate underground tunnels** leading beyond the outer boundary of the map.

Tunneling requires a multi-faceted operational pipeline:
1. **Tool Acquisition:** Stealing digging implements (spoons, screwdrivers, shovels, pickaxes) from kitchens and workshops.
2. **The Nocturnal Window:** Digging exclusively during the `Sleep` regime block (00:00 to 06:00).
3. **Decoy Dummies:** Placing rolled-up blankets and pillows in the cell bed to deceive patrolling guards.
4. **Soil Disposal:** Transporting excavated dirt and flushing it down toilets or dumping it in outdoor yard gardens.
5. **Multi-Cell Collaboration:** Inmates from adjacent cells digging toward each other to merge their tunnels into a single collective highway.

```
┌────────────────────────────────────────────────────────┐
│ CELL A (Inmate Digging)      CELL B (Inmate Digging)   │
│  [Decoy Dummy in Bed]         [Decoy Dummy in Bed]     │
│        │                             │                 │
│        ▼ [Toilet Opening]            ▼ [Toilet Opening]│
│  ══════╪═════════════════════════════╪════════════════ │
│   UNDERGROUND TUNNEL (Merges into collective path)     │
│        │                                               │
│        ▼ Follows Large Water Pipe for 5x Speed         │
│  ═════════════════════════════════════════════════════ │
│   Breaches Perimeter Fence -> Inmates Emerge at 04:00  │
│        │                                               │
│        ▼ Sprints into Forest Border -> ESCAPE SUCCESS  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Nocturnal Digging State Machine & Tool Physics

```rust
#[derive(Component, Debug, Clone)]
pub struct TunnelDiggingState {
    pub active_tool: Option<DiggingTool>,
    pub tunnel_shaft_id: u32,
    pub dirt_in_pockets_kg: f32, // Max capacity: 5.0 kg before disposal needed
    pub has_placed_dummy: bool,
    pub fatigue: f32,
}

#[derive(Debug, Clone)]
pub struct DiggingTool {
    pub item_id: u16,
    pub name: &'static str,
    pub dig_speed_m_per_tick: f32,
    pub durability_uses_remaining: u16,
    pub noise_level_db: f32,
}

pub static SPOON: DiggingTool = DiggingTool {
    item_id: 101, name: "Stolen Spoon",
    dig_speed_m_per_tick: 0.005, durability_uses_remaining: 50, noise_level_db: 5.0,
};

pub static SHOVEL: DiggingTool = DiggingTool {
    item_id: 102, name: "Gardener Shovel",
    dig_speed_m_per_tick: 0.040, durability_uses_remaining: 300, noise_level_db: 15.0,
};

pub static PICKAXE: DiggingTool = DiggingTool {
    item_id: 103, name: "Industrial Pickaxe",
    dig_speed_m_per_tick: 0.120, durability_uses_remaining: 800, noise_level_db: 35.0,
};
```

---

## 3. Subterranean Pathfinding & Soil Displacement

When digging underground, the pathfinding engine calculates the path of least resistance from the inmate's toilet to the map border:

$$\text{Tile Dig Resistance} = \text{MaterialCost} \times \text{DepthModifier} \times \text{PlumbingBonus}$$

* **Dirt / Sand:** Base cost $= 1.0$
* **Large Water Pipe:** Base cost $= 0.2$ ($80\%$ speed bonus; inmate crawls through pipe)
* **Small Water Pipe:** Base cost $= 1.0$ (Must dig around it)
* **Reinforced Concrete Foundation:** Base cost $= 3.5$
* **Perimeter Wall:** Base cost $= 10.0$ (Digging beneath deep foundation takes days)

```rust
pub fn step_tunnel_digging(
    inmate: &mut TunnelDiggingState,
    current_tile: (u16, u16),
    tunnel_grid: &mut SubterraneanGrid,
    map_bounds: (u16, u16),
) -> bool {
    let Some(ref mut tool) = inmate.active_tool else { return false; };

    let resistance = tunnel_grid.get_dig_resistance(current_tile.0, current_tile.1);
    let advance = tool.dig_speed_m_per_tick / resistance;

    tunnel_grid.progress_excavation(current_tile.0, current_tile.1, advance);
    tool.durability_uses_remaining = tool.durability_uses_remaining.saturating_sub(1);
    inmate.dirt_in_pockets_kg += advance * 0.8;

    // Check if tool shattered
    if tool.durability_uses_remaining == 0 {
        inmate.active_tool = None; // Inmate must steal another tool
    }

    // Check if tunnel reached the map border
    current_tile.0 == 0 || current_tile.0 >= map_bounds.0 - 1 ||
    current_tile.1 == 0 || current_tile.1 >= map_bounds.1 - 1
}
```

---

## 4. Soil Disposal & Deception Logistics

Digging produces dirt piles that must be eliminated to prevent discovery:
1. **Toilet Flushing:** Prisoners flush soil in batches of $2.0 \text{ kg}$. If an inmate flushes too rapidly, the toilet backs up and creates a `Muddy Puddle` on the cell floor, alerting guards.
2. **Yard Scattering:** During Yard Time, inmates walk to flower beds and discreetly dump dirt from their trouser cuffs (similar to classic prisoner-of-war escapes).
3. **Decoy Bed Dummies:** While digging underground, an entity flag `DummyPlaced` renders a silhouette in the cell bed. A guard walking down the hall will assume the inmate is asleep unless they physically enter the cell, shine a flashlight, and shake the bed.

---

## 5. Detection & Countermeasures

```
[ Inmate Digging Underground ]
               │
      ┌────────┴────────┐
      ▼                 ▼
[ K9 Patrol Dog ]  [ Guard Shakedown ]
      │                 │
Sniffs Subsurface       Dismantles Toilet
Vibration Flag          Rolls Detection Check
      │                 │
      ▼                 ▼
"Digging Alert!"   Reveals Entire Tunnel Network!
Barks & Flags Pit  Escaping Inmates Trapped & Arrested
```

### Detection Probability Matrix
* **K9 Sniffer Patrol:** Dogs walking over an active tunnel have a $30\%$ chance per step to flag a yellow shovel icon (vibration alert). A second dog confirming the same tile permanently reveals the tunnel entrance.
* **Cell Shakedown:** Searching a cell has an intrinsic detection formula:

$$\text{Detection Chance} = 25\% + (50\% \text{ if toilet searched}) + (20\% \text{ if muddy puddle present})$$

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Cave-in Collapse** | Inmates dig a massive tunnel network without wooden support planks. | Tunnels exceeding 20 tiles in soft dirt roll a $5\%$ cave-in chance per night, killing trapped inmates and exposing the trench above ground. |
| **Tunnel Meets Electric Fence** | Inmates surface directly under an electrified fence. | Electrocution shockwave: Inmates touching the live fence base are paralyzed or killed, triggering an electrical surge alarm. |
| **Guard Spots Empty Bed During Roll Call** | Patrolling guard inspects cell and discovers dummy. | Guard immediately blows emergency whistle, sound the alarm, and runs to the toilet to seal the tunnel shaft. |
