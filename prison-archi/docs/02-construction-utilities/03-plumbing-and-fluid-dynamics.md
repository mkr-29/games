# Domain 02: World Grid, Construction & Utilities
## Feature Specification 03: Plumbing, Fluid Pressure Dynamics & Tunneling Vulnerability

---

## 1. System Overview & The Plumbing Dilemma

The plumbing subsystem supplies pressurized water to sanitation facilities (toilets, showers, sinks, laundry machines, sprinkler heads). Unlike electricity, which operates instantaneously across any wire length, **water experiences hydraulic pressure drop** over distance.

Furthermore, plumbing introduces a critical **security trade-off**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ LARGE WATER PIPES:                                                     │
│  - Carries high water pressure across long distances (up to 500 tiles) │
│  - CRITICAL VULNERABILITY: Inmates can crawl directly inside them,     │
│    accelerating escape tunnel digging speed by 500%!                   │
├────────────────────────────────────────────────────────────────────────┤
│ SMALL WATER PIPES:                                                     │
│  - Impermeable to tunneling (inmates cannot crawl inside)              │
│  - SEVERE LIMITATION: Rapid pressure falloff; maximum reach of only   │
│    30 tiles from the nearest Large Pipe or Pump Station!               │
└────────────────────────────────────────────────────────────────────────┘
```

The optimal architectural strategy is to route Large Pipes only along central, heavily guarded corridors, branching into Small Pipes before entering prisoner cell blocks.

---

## 2. Hydraulic Pressure Model & Falloff Formula

Water networks originate from **Water Pumping Stations** (which require continuous electricity from the electrical grid).

```
                      [ Water Pumping Station ]
                           Pressure = 100%
                                 │
                   [ Large Pipe Trunk: -0.1%/tile ]
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
      [ Large Pipe Endpoint ]         [ Hot Water Boiler ]
          Pressure = 85%                 Pressure = 80%
                 │                               │
        [ Small Pipe Branch ]           [ Hot Water Small Pipe ]
         Drop: -3.0%/tile                Drop: -3.5%/tile
                 │                               │
                 ▼                               ▼
          [ Cell Toilet ]                 [ Cell Shower ]
       Pressure = 25% (OK)             Temperature = Warm (OK)
```

### Pressure Decay Formula
At each step $k$ along a pipe line from the nearest source:

$$P_{k} = P_{k-1} - \Delta P_{\text{type}}$$

Where:
* $\Delta P_{\text{large}} = 0.1\%$ per tile (Effective range: $\sim 500$ tiles)
* $\Delta P_{\text{small}} = 3.0\%$ per tile (Effective range: $\sim 30$ tiles)
* Minimum functional threshold: $P_{\text{min}} = 10.0\%$. Below this value, toilets fail to flush and showers emit only a trickle, triggering hygiene crises.

---

## 3. Hot Water Boilers & Temperature Thermodynamics

Warm showers are essential for prisoner morale. Inmates forced to bathe in ice-cold water receive the `Freezing` status effect, generating an instant $+30\%$ spike in volatility and violence.

```rust
#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct FluidPipeCell {
    pub cold_pressure: u8,    // 0..100%
    pub hot_pressure: u8,     // 0..100%
    pub temperature_c: u8,    // 10°C (tap cold) to 55°C (heated)
    pub pipe_type: u8,        // 0=None, 1=SmallCold, 2=LargeCold, 3=SmallHot
    pub flags: u8,            // 1=TunnelPresent, 2=Burst/Leaking
}
```

### Boiler Logic
1. A **Water Boiler** must be connected to an active cold water line (Pressure $> 20\%$) and an active electrical cable.
2. The boiler outputs hot water into specialized **Hot Water Pipes** that radiate warmth within a 15-tile radius.
3. If the boiler loses power, output temperature decays linearly over 120 seconds.

---

## 4. Breadth-First Fluid Propagation Algorithm

The fluid simulation runs on a dedicated sub-tick (every 1.0 second):

```rust
pub fn solve_water_network(
    pumps: &[PumpStation],
    boilers: &[BoilerStation],
    pipe_grid: &mut [FluidPipeCell],
    width: usize,
    height: usize,
) {
    let mut queue = VecDeque::new();

    // 1. Reset all pipe pressures
    for cell in pipe_grid.iter_mut() {
        cell.cold_pressure = 0;
    }

    // 2. Enqueue all active, powered Water Pumps
    for pump in pumps {
        if pump.is_powered {
            let idx = pump.y * width + pump.x;
            pipe_grid[idx].cold_pressure = 100;
            queue.push_back((pump.x, pump.y, 100u8));
        }
    }

    // 3. BFS Breadth-First Search Pressure Decay
    while let Some((x, y, current_p)) = queue.pop_front() {
        let current_cell = pipe_grid[y * width + x];
        
        for (nx, ny) in get_cardinal_neighbors(x, y, width, height) {
            let neighbor_idx = ny * width + nx;
            let neighbor_cell = &mut pipe_grid[neighbor_idx];
            
            if neighbor_cell.pipe_type == 0 { continue; } // No pipe

            let drop = if neighbor_cell.pipe_type == 2 { 1 } else { 3 }; // Large vs Small
            if current_p > drop {
                let next_p = current_p - drop;
                if next_p > neighbor_cell.cold_pressure {
                    neighbor_cell.cold_pressure = next_p;
                    queue.push_back((nx, ny, next_p));
                }
            }
        }
    }
}
```

---

## 5. Tunneling Vulnerability Mechanics

Escape tunnels intersecting plumbing infrastructure calculate path costs differently:

```rust
pub fn get_tunnel_dig_cost(pipe_cell: &FluidPipeCell) -> f32 {
    match pipe_cell.pipe_type {
        2 => 0.20, // Large pipe: 80% reduction in digging time!
        1 => 1.00, // Small pipe: Normal dirt digging rate
        _ => 1.00,
    }
}
```

* **Guard Inspection Clue:** Guards searching a cell with an active tunnel inside a large pipe roll an automatic $+40\%$ detection bonus during shakedowns if they inspect the toilet, as muddy water backs up into the bowl.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Pipe Burst Flooding** | Workman demolishing a wall hits a pressurized pipe, soaking cells. | Spawns `WaterPuddle` entities that spread dynamically via cellular automata. Shuts down adjacent electronics and slips moving inmates. Requires Workman `Fix Burst Pipe` emergency priority task. |
| **Boiler Overheating Explosion** | Hot water pipe loops with no outlet build excessive pressure. | Boilers include an automatic pressure relief valve; if hot water loops without cold intake, the boiler shuts down and emits a steam hiss audio event. |
| **Sub-zero Winter Freezing** | External uninsulated pipes freeze in cold weather climates. | Outside pipes must be buried deep or enclosed in indoor foundations; frozen pipes drop flow to zero until thawed. |
