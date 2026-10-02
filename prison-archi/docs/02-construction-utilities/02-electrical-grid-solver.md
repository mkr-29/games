# Domain 02: World Grid, Construction & Utilities
## Feature Specification 02: Electrical Grid Solver, Circuit Isolation & Overload Physics

---

## 1. System Overview & The Short-Circuit Rule

The electrical subsystem in *Prison Architect Web* is modeled as a set of discrete, topological circuit graphs. Power is supplied by **Power Stations**, expanded by attached **Capacitors**, and distributed via underground **Electrical Cables**.

### The Core Law of Prison Architect Electrical Circuits
**Two live Power Stations must NEVER be connected to the same electrical wire network.** 

If a player places a cable that bridges two independent active circuits, a **Catastrophic Short Circuit** occurs:
1. Both Power Stations immediately blow their fuses and shut down.
2. An electric fire arc sparks at the junction point.
3. Connected capacitors trip into a disabled state, requiring manual Workman repair.

```
       [ Power Station A ]             [ Power Station B ]
         + 3 Capacitors                  + 2 Capacitors
          (Cap: 2,500W)                   (Cap: 2,000W)
                │                               │
        [ Circuit #1 Wire ]             [ Circuit #2 Wire ]
                │                               │
                └───► [ CONNECTING WIRE ] ◄─────┘
                              │
                     💥 EXPLOSION & FIRE 💥
               Both Power Stations Overloaded
                 All connected cells black out
```

---

## 2. Mathematical Model & Capacity Equations

### Capacity Calculation
A Power Station has a base supply capacity, augmented by each directly adjacent Capacitor (up to a maximum of 16 capacitors surrounding the 3x3 station footprint):

$$\text{Capacity}_{\text{total}} = \text{Capacity}_{\text{base}} + \sum_{i=1}^{N_{\text{caps}}} \text{Capacity}_{\text{capacitor}}$$

* $\text{Capacity}_{\text{base}} = 1,000 \text{ Watts}$
* $\text{Capacity}_{\text{capacitor}} = 500 \text{ Watts}$
* $\text{Max Capacity} = 1,000 + (16 \times 500) = 9,000 \text{ Watts}$

### Load Calculation
Every connected appliance draws continuous or intermittent wattage:

$$\text{Load}_{\text{circuit}} = \sum_{a \in \text{Appliances}} \text{Wattage}(a)$$

* **CCTV Monitor:** $150 \text{ W}$
* **Metal Detector:** $250 \text{ W}$
* **Workshop Saw:** $600 \text{ W}$
* **Electric Chair:** $5,000 \text{ W}$ (Surge draw during execution)

$$\text{Load Factor} = \frac{\text{Load}_{\text{circuit}}}{\text{Capacity}_{\text{total}}}$$

If $\text{Load Factor} > 1.0$, the circuit trips: the Power Station breaker pops, and the entire circuit shuts down until load is reduced and the switch is manually reset.

---

## 3. Disjoint-Set (Union-Find) Graph Architecture

To solve multi-circuit topologies at scale, we utilize a **Disjoint-Set Forest with Path Compression and Union by Rank**:

```rust
pub struct DisjointSet {
    parent: Vec<u32>,
    rank: Vec<u8>,
}

impl DisjointSet {
    pub fn new(size: usize) -> Self {
        Self {
            parent: (0..size as u32).collect(),
            rank: vec![0; size],
        }
    }

    pub fn find(&mut self, mut i: u32) -> u32 {
        while i != self.parent[i as usize] {
            self.parent[i as usize] = self.parent[self.parent[i as usize] as usize]; // Path compression
            i = self.parent[i as usize];
        }
        i
    }

    pub fn union(&mut self, i: u32, j: u32) {
        let root_i = self.find(i);
        let root_j = self.find(j);
        if root_i == root_j { return; }

        if self.rank[root_i as usize] < self.rank[root_j as usize] {
            self.parent[root_i as usize] = root_j;
        } else if self.rank[root_i as usize] > self.rank[root_j as usize] {
            self.parent[root_j as usize] = root_i;
        } else {
            self.parent[root_j as usize] = root_i;
            self.rank[root_i as usize] += 1;
        }
    }
}
```

---

## 4. Circuit Solver System Algorithm

The `ElectricalGridSolver` runs whenever cables are placed/destroyed or appliances turn on/off:

```rust
pub fn solve_electrical_grid(
    world_grid: &TileGrid,
    power_stations: &[PowerStationEntity],
    cables: &[CableEntity],
    appliances: &[ApplianceEntity],
) -> ElectricalSimulationResult {
    let mut ds = DisjointSet::new(world_grid.total_tiles());
    let mut circuit_loads: HashMap<u32, f32> = HashMap::new();
    let mut circuit_sources: HashMap<u32, Vec<EntityId>> = HashMap::new();

    // 1. Union adjacent connected cables
    for cable in cables {
        for neighbor in world_grid.cardinal_neighbors(cable.x, cable.y) {
            if neighbor.has_cable() {
                ds.union(cable.tile_index, neighbor.tile_index);
            }
        }
    }

    // 2. Map Power Stations into their circuit roots
    for station in power_stations {
        if !station.is_active { continue; }
        let root = ds.find(station.tile_index);
        circuit_sources.entry(root).or_default().push(station.id);
    }

    // 3. Detect Short-Circuit Violations (More than one station connected to same root)
    for (root, sources) in &circuit_sources {
        if sources.len() > 1 {
            // CATASTROPHIC SHORT DETECTED!
            trigger_electrical_explosion(*root, sources);
            return ElectricalSimulationResult::ShortCircuit { root: *root };
        }
    }

    // 4. Sum load across all appliances
    for app in appliances {
        let root = ds.find(app.tile_index);
        *circuit_loads.entry(root).or_insert(0.0) += app.active_wattage;
    }

    // 5. Evaluate Overload status per circuit
    for station in power_stations {
        let root = ds.find(station.tile_index);
        let load = circuit_loads.get(&root).copied().unwrap_or(0.0);
        let capacity = station.calculate_total_capacity();

        if load > capacity {
            trip_breaker(station.id);
        } else {
            distribute_power(root, true);
        }
    }

    ElectricalSimulationResult::Stable
}
```

---

## 5. WebGPU Visual Integration

The electrical overlay displays live voltage current pulsing through underground cables:
* **Storage Buffer:** The simulation uploads an array of bytes where each index maps to a tile's power status (`0=Unpowered`, `1=Live`, `2=Overloaded/Fault`).
* **WGSL Fragment Shader:** Samples the buffer and renders an animated scrolling sine wave along cable lines to indicate flowing electrical current:

```wgsl
@fragment
fn fs_cable_overlay(in: VertexOutput) -> @location(0) vec4<f32> {
    let tile_status = cable_status_buffer[in.tile_index];
    if (tile_status == 0u) {
        return vec4<f32>(0.2, 0.2, 0.2, 0.5); // Dormant / Unpowered Grey
    } else if (tile_status == 1u) {
        let pulse = sin(in.uv.x * 20.0 - globals.time * 6.0) * 0.5 + 0.5;
        return vec4<f32>(0.1, 0.8 * pulse + 0.2, 0.2, 0.9); // Electric Green Pulse
    } else {
        return vec4<f32>(1.0, 0.1, 0.1, 1.0); // Blown Fuse Red
    }
}
```

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Electric Chair Execution Surge** | Activating the chair instantly draws 5,000W, blowing the whole prison's light grid. | Requires dedicated circuit or industrial capacitor bank. Inmate executions notify player via Svelte UI: `Warning: Grid capacity low`. |
| **Flooding Near Live Cables** | Burst pipes soak floor containing live electrical cables. | Water puddle triggers `Electrocution Hazard` component; nearby prisoners and guards suffer electrical damage until the breaker trips. |
| **Grid Reconnection Loop** | Automated switches toggling on and off in rapid succession create infinite audio click loop. | Hysteresis delay: Once tripped, a breaker cannot be reset for 10 in-game minutes (300 simulation ticks). |
