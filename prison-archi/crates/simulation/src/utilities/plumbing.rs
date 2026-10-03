use std::collections::VecDeque;
use bevy_ecs::prelude::*;

/// Pipe classification for plumbing simulation.
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PipeType {
    None = 0,
    SmallCold = 1,
    LargeCold = 2,
    SmallHot = 3,
}

impl PipeType {
    pub fn from_u8(val: u8) -> Self {
        match val {
            1 => PipeType::SmallCold,
            2 => PipeType::LargeCold,
            3 => PipeType::SmallHot,
            _ => PipeType::None,
        }
    }

    pub fn pressure_drop_per_tile(&self) -> f32 {
        match self {
            PipeType::LargeCold => 0.1,
            PipeType::SmallCold => 3.0,
            PipeType::SmallHot => 3.5,
            PipeType::None => 100.0,
        }
    }
}

/// Pipe status flags.
pub const FLAG_TUNNEL_PRESENT: u8 = 1 << 0;
pub const FLAG_BURST_LEAKING: u8 = 1 << 1;

/// Cell representation for plumbing grid.
#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FluidPipeCell {
    pub cold_pressure: u8,    // 0..100%
    pub hot_pressure: u8,     // 0..100%
    pub temperature_c: u8,    // 10°C (tap cold) to 55°C (heated)
    pub pipe_type: u8,        // 0=None, 1=SmallCold, 2=LargeCold, 3=SmallHot
    pub flags: u8,            // 1=TunnelPresent, 2=Burst/Leaking
}

impl Default for FluidPipeCell {
    fn default() -> Self {
        Self {
            cold_pressure: 0,
            hot_pressure: 0,
            temperature_c: 10,
            pipe_type: 0,
            flags: 0,
        }
    }
}

/// Calculate digging speed multiplier for escape tunnels intersecting plumbing pipes.
/// Large pipes allow crawling directly inside, reducing dig cost to 0.20 (500% speedup).
pub fn get_tunnel_dig_cost(pipe_cell: &FluidPipeCell) -> f32 {
    match pipe_cell.pipe_type {
        2 => 0.20, // Large pipe: 80% reduction in digging time!
        1 => 1.00, // Small cold pipe: Normal digging rate
        3 => 1.00, // Small hot pipe: Normal digging rate
        _ => 1.00,
    }
}

/// Water Pumping Station supplying pressurized cold water to connected pipes.
#[derive(Debug, Clone)]
pub struct PumpStation {
    pub id: u32,
    pub x: u32,
    pub y: u32,
    pub is_powered: bool,
    pub is_active: bool,
    pub output_pressure: u8,
}

impl PumpStation {
    pub fn new(id: u32, x: u32, y: u32) -> Self {
        Self {
            id,
            x,
            y,
            is_powered: true,
            is_active: true,
            output_pressure: 100,
        }
    }

    /// 3x3 footprint of the pump station.
    pub fn footprint_tiles(&self) -> Vec<(u32, u32)> {
        let mut tiles = Vec::with_capacity(9);
        for dy in 0..3 {
            for dx in 0..3 {
                tiles.push((self.x + dx, self.y + dy));
            }
        }
        tiles
    }
}

/// Water Boiler Station that heats cold water into hot water pipes.
#[derive(Debug, Clone)]
pub struct BoilerStation {
    pub id: u32,
    pub x: u32,
    pub y: u32,
    pub is_powered: bool,
    pub is_active: bool,
    pub max_radius: u32,
    pub target_temperature: u8,
    pub min_cold_intake_pressure: u8,
    pub current_intake_pressure: u8,
    pub is_heating: bool,
}

impl BoilerStation {
    pub fn new(id: u32, x: u32, y: u32) -> Self {
        Self {
            id,
            x,
            y,
            is_powered: true,
            is_active: true,
            max_radius: 15,
            target_temperature: 55,
            min_cold_intake_pressure: 20,
            current_intake_pressure: 0,
            is_heating: false,
        }
    }

    /// 3x3 footprint of the boiler station.
    pub fn footprint_tiles(&self) -> Vec<(u32, u32)> {
        let mut tiles = Vec::with_capacity(9);
        for dy in 0..3 {
            for dx in 0..3 {
                tiles.push((self.x + dx, self.y + dy));
            }
        }
        tiles
    }
}

/// Fixture archetypes consuming pressurized water.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FixtureType {
    Toilet,
    Shower,
    Sink,
    LaundryMachine,
    Sprinkler,
}

/// Plumbing Fixture connected to the hydraulic network.
#[derive(Debug, Clone)]
pub struct PlumbingFixture {
    pub id: u32,
    pub x: u32,
    pub y: u32,
    pub fixture_type: FixtureType,
    pub is_supplied: bool,
    pub is_warm: bool,
}

impl PlumbingFixture {
    pub fn new(id: u32, x: u32, y: u32, fixture_type: FixtureType) -> Self {
        Self {
            id,
            x,
            y,
            fixture_type,
            is_supplied: false,
            is_warm: false,
        }
    }
}

/// Plumbing simulation events.
#[derive(Debug, Clone, PartialEq)]
pub enum PlumbingEvent {
    PipeBurst { x: u32, y: u32 },
    BoilerOverheated { boiler_id: u32, x: u32, y: u32 },
    LowPressureWarning { x: u32, y: u32, fixture_id: u32, pressure: u8 },
    BoilerActive { boiler_id: u32, temperature_c: u8 },
}

/// Global Plumbing Grid managing hydraulic pipes, pumps, boilers, and fixtures.
#[derive(Resource)]
pub struct PlumbingGrid {
    pub width: u32,
    pub height: u32,
    pub grid: Vec<FluidPipeCell>,
    pub pumps: Vec<PumpStation>,
    pub boilers: Vec<BoilerStation>,
    pub fixtures: Vec<PlumbingFixture>,
    pub events: Vec<PlumbingEvent>,
}

/// Bevy ECS system that executes hydraulic plumbing simulation.
pub fn solve_plumbing_system(mut plumbing: ResMut<PlumbingGrid>) {
    plumbing.solve_grid();
}

impl PlumbingGrid {
    pub fn new(width: u32, height: u32) -> Self {
        let size = (width * height) as usize;
        Self {
            width,
            height,
            grid: vec![FluidPipeCell::default(); size],
            pumps: Vec::new(),
            boilers: Vec::new(),
            fixtures: Vec::new(),
            events: Vec::new(),
        }
    }

    #[inline]
    pub fn coord_to_idx(&self, x: u32, y: u32) -> usize {
        (y * self.width + x) as usize
    }

    #[inline]
    pub fn idx_to_coord(&self, idx: usize) -> (u32, u32) {
        let idx_u32 = idx as u32;
        (idx_u32 % self.width, idx_u32 / self.width)
    }

    pub fn place_pipe(&mut self, x: u32, y: u32, pipe_type: PipeType) {
        if x < self.width && y < self.height {
            let idx = self.coord_to_idx(x, y);
            self.grid[idx].pipe_type = pipe_type as u8;
        }
    }

    pub fn remove_pipe(&mut self, x: u32, y: u32) {
        if x < self.width && y < self.height {
            let idx = self.coord_to_idx(x, y);
            self.grid[idx].pipe_type = 0;
            self.grid[idx].cold_pressure = 0;
            self.grid[idx].hot_pressure = 0;
            self.grid[idx].temperature_c = 10;
        }
    }

    pub fn get_cell(&self, x: u32, y: u32) -> Option<&FluidPipeCell> {
        if x < self.width && y < self.height {
            Some(&self.grid[self.coord_to_idx(x, y)])
        } else {
            None
        }
    }

    pub fn get_cell_mut(&mut self, x: u32, y: u32) -> Option<&mut FluidPipeCell> {
        if x < self.width && y < self.height {
            let idx = self.coord_to_idx(x, y);
            Some(&mut self.grid[idx])
        } else {
            None
        }
    }

    pub fn add_pump_station(&mut self, id: u32, x: u32, y: u32) {
        self.pumps.push(PumpStation::new(id, x, y));
    }

    pub fn add_boiler_station(&mut self, id: u32, x: u32, y: u32) {
        self.boilers.push(BoilerStation::new(id, x, y));
    }

    pub fn add_fixture(&mut self, id: u32, x: u32, y: u32, fixture_type: FixtureType) {
        self.fixtures.push(PlumbingFixture::new(id, x, y, fixture_type));
    }

    /// Solves the BFS hydraulic wave propagation for cold water and hot water boiler loops.
    pub fn solve_grid(&mut self) {
        self.events.clear();
        let total_cells = (self.width * self.height) as usize;

        // 1. Reset all pressures and set default tap cold temperature (10°C)
        for cell in self.grid.iter_mut() {
            cell.cold_pressure = 0;
            cell.hot_pressure = 0;
            cell.temperature_c = 10;
        }

        for boiler in self.boilers.iter_mut() {
            boiler.current_intake_pressure = 0;
            boiler.is_heating = false;
        }

        let width = self.width;
        let height = self.height;

        // 2. BFS for Cold Water propagation
        let mut best_cold: Vec<f32> = vec![0.0; total_cells];
        let mut cold_queue: VecDeque<(u32, u32, f32)> = VecDeque::new();

        // Enqueue all active & powered Water Pumps
        for pump in &self.pumps {
            if pump.is_powered && pump.is_active {
                let p_val = pump.output_pressure as f32;
                for (px, py) in pump.footprint_tiles() {
                    if px < width && py < height {
                        let idx = (py * width + px) as usize;
                        best_cold[idx] = p_val;
                        self.grid[idx].cold_pressure = pump.output_pressure;
                        cold_queue.push_back((px, py, p_val));
                    }
                }
            }
        }

        while let Some((x, y, curr_p)) = cold_queue.pop_front() {
            let curr_idx = (y * width + x) as usize;
            if curr_p < best_cold[curr_idx] - 0.001 {
                continue;
            }

            let neighbors = [
                (x.wrapping_sub(1), y, x > 0),
                (x + 1, y, x + 1 < width),
                (x, y.wrapping_sub(1), y > 0),
                (x, y + 1, y + 1 < height),
            ];

            for (nx, ny, valid) in neighbors {
                if !valid {
                    continue;
                }
                let n_idx = (ny * width + nx) as usize;
                let n_pipe_type = PipeType::from_u8(self.grid[n_idx].pipe_type);
                if n_pipe_type == PipeType::None {
                    continue;
                }

                let drop = n_pipe_type.pressure_drop_per_tile();
                let next_p = curr_p - drop;

                if next_p > 0.0 && next_p > best_cold[n_idx] + 0.0001 {
                    best_cold[n_idx] = next_p;
                    self.grid[n_idx].cold_pressure = next_p.round().clamp(0.0, 100.0) as u8;
                    cold_queue.push_back((nx, ny, next_p));
                }
            }
        }

        // 3. Evaluate Boilers: Check cold water intake and power status
        for boiler in &mut self.boilers {
            if !boiler.is_powered || !boiler.is_active {
                continue;
            }

            let mut max_intake: u8 = 0;
            for (bx, by) in boiler.footprint_tiles() {
                if bx < width && by < height {
                    let idx = (by * width + bx) as usize;
                    max_intake = max_intake.max(self.grid[idx].cold_pressure);

                    // Also check directly adjacent tiles to boiler footprint
                    let adj = [
                        (bx.wrapping_sub(1), by, bx > 0),
                        (bx + 1, by, bx + 1 < width),
                        (bx, by.wrapping_sub(1), by > 0),
                        (bx, by + 1, by + 1 < height),
                    ];
                    for (ax, ay, avalid) in adj {
                        if avalid {
                            let aidx = (ay * width + ax) as usize;
                            max_intake = max_intake.max(self.grid[aidx].cold_pressure);
                        }
                    }
                }
            }

            boiler.current_intake_pressure = max_intake;
            if max_intake >= boiler.min_cold_intake_pressure {
                boiler.is_heating = true;
                self.events.push(PlumbingEvent::BoilerActive {
                    boiler_id: boiler.id,
                    temperature_c: boiler.target_temperature,
                });
            }
        }

        // 4. BFS for Hot Water propagation
        let mut best_hot: Vec<f32> = vec![0.0; total_cells];
        let mut hot_queue: VecDeque<(u32, u32, f32, u32, u8)> = VecDeque::new(); // (x, y, hot_p, dist, target_temp)

        for boiler in &self.boilers {
            if boiler.is_heating {
                let init_hp = boiler.current_intake_pressure.max(100) as f32;
                for (bx, by) in boiler.footprint_tiles() {
                    if bx < width && by < height {
                        let idx = (by * width + bx) as usize;
                        best_hot[idx] = init_hp;
                        self.grid[idx].hot_pressure = init_hp.round() as u8;
                        self.grid[idx].temperature_c = boiler.target_temperature;
                        hot_queue.push_back((bx, by, init_hp, 0, boiler.target_temperature));
                    }
                }
            }
        }

        while let Some((hx, hy, curr_hp, dist, target_temp)) = hot_queue.pop_front() {
            let curr_idx = (hy * width + hx) as usize;
            if curr_hp < best_hot[curr_idx] - 0.001 {
                continue;
            }

            if dist >= 15 {
                continue;
            }

            let neighbors = [
                (hx.wrapping_sub(1), hy, hx > 0),
                (hx + 1, hy, hx + 1 < width),
                (hx, hy.wrapping_sub(1), hy > 0),
                (hx, hy + 1, hy + 1 < height),
            ];

            for (nx, ny, valid) in neighbors {
                if !valid {
                    continue;
                }
                let n_idx = (ny * width + nx) as usize;
                let n_pipe_type = PipeType::from_u8(self.grid[n_idx].pipe_type);

                // Hot water travels through SmallHot pipes (or any pipe connected to boiler loop)
                if n_pipe_type == PipeType::SmallHot || n_pipe_type == PipeType::LargeCold || n_pipe_type == PipeType::SmallCold {
                    let drop = if n_pipe_type == PipeType::SmallHot { 3.5 } else { n_pipe_type.pressure_drop_per_tile() };
                    let next_hp = curr_hp - drop;
                    let next_dist = dist + 1;

                    if next_hp > 0.0 && next_hp > best_hot[n_idx] + 0.0001 {
                        best_hot[n_idx] = next_hp;
                        self.grid[n_idx].hot_pressure = next_hp.round().clamp(0.0, 100.0) as u8;
                        self.grid[n_idx].temperature_c = target_temp;
                        hot_queue.push_back((nx, ny, next_hp, next_dist, target_temp));
                    }
                }
            }
        }

        // 5. Update Plumbing Fixtures status
        for fixture in &mut self.fixtures {
            if fixture.x < width && fixture.y < height {
                let idx = (fixture.y * width + fixture.x) as usize;
                let cell = &self.grid[idx];
                fixture.is_supplied = cell.cold_pressure >= 10 || cell.hot_pressure >= 10;
                fixture.is_warm = cell.temperature_c >= 40 && cell.hot_pressure >= 10;


                if cell.pipe_type != 0 && cell.cold_pressure < 10 {
                    self.events.push(PlumbingEvent::LowPressureWarning {
                        x: fixture.x,
                        y: fixture.y,
                        fixture_id: fixture.id,
                        pressure: cell.cold_pressure,
                    });
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hydraulic_pressure_decay_large_vs_small_pipe() {
        // Verification Criterion 1:
        // Large Pipe reaches 200 tiles with >75% pressure remaining (80%).
        // Small Pipe drops below the 10% functional threshold after 31 tiles (7%).
        let mut grid = PlumbingGrid::new(250, 50);

        // Place Water Pump at (0, 0)
        grid.add_pump_station(1, 0, 0);

        // Lay Large Pipe line of 200 tiles from (3, 0) to (203, 0)
        for x in 3..=203 {
            grid.place_pipe(x, 0, PipeType::LargeCold);
        }

        // Lay Small Pipe line of 40 tiles starting from (3, 5) connected to pump at (2, 2)
        // Let's connect pump (0,0..2,2) to small pipe at (3, 2) extending to (40, 2)
        for x in 3..=40 {
            grid.place_pipe(x, 2, PipeType::SmallCold);
        }

        grid.solve_grid();

        // 1. Large Pipe assertion: tile 202 (200th pipe tile from pump edge at x=2)
        // Starting at 100%, after 200 tiles at -0.1%/tile = 80% remaining (> 75%)
        let large_pipe_end = grid.get_cell(202, 0).unwrap();
        assert!(
            large_pipe_end.cold_pressure > 75,
            "Large pipe after 200 tiles should have >75% pressure, got {}%",
            large_pipe_end.cold_pressure
        );
        assert_eq!(large_pipe_end.cold_pressure, 80);

        // 2. Small Pipe assertion:
        // Distance 30 tiles from pump edge (x=2): tile at x=32
        // Starting at 100%, after 30 tiles at -3.0%/tile = 10%
        let small_pipe_30 = grid.get_cell(32, 2).unwrap();
        assert_eq!(small_pipe_30.cold_pressure, 10, "Small pipe at 30 tiles should be 10%");

        // Distance 31 tiles from pump edge (x=2): tile at x=33
        // Starting at 100%, after 31 tiles at -3.0%/tile = 7% (< 10% functional threshold)
        let small_pipe_31 = grid.get_cell(33, 2).unwrap();
        assert!(
            small_pipe_31.cold_pressure < 10,
            "Small pipe at 31 tiles must drop below 10% functional threshold, got {}%",
            small_pipe_31.cold_pressure
        );
        assert_eq!(small_pipe_31.cold_pressure, 7);
    }

    #[test]
    fn test_water_boiler_heating_and_unpowered_falloff() {
        // Verification Criterion 2:
        // Boiler with zero electric power outputs cold water (10°C); when powered, outputs hot water (55°C).
        let mut grid = PlumbingGrid::new(50, 50);

        // Water pump at (0, 0)
        grid.add_pump_station(1, 0, 0);

        // Cold pipe from pump to boiler at (5, 0)
        grid.place_pipe(3, 0, PipeType::LargeCold);
        grid.place_pipe(4, 0, PipeType::LargeCold);

        // Boiler at (5, 0)
        grid.add_boiler_station(10, 5, 0);

        // Hot water small pipes connected to boiler at (8, 0) extending 10 tiles to (17, 0)
        for x in 8..=17 {
            grid.place_pipe(x, 0, PipeType::SmallHot);
        }

        // Test Case A: Boiler is UNPOWERED
        grid.boilers[0].is_powered = false;
        grid.solve_grid();

        assert!(!grid.boilers[0].is_heating, "Unpowered boiler must not heat");
        let pipe_unpowered = grid.get_cell(10, 0).unwrap();
        assert_eq!(pipe_unpowered.temperature_c, 10, "Unpowered boiler pipe should be tap cold (10°C)");
        assert_eq!(pipe_unpowered.hot_pressure, 0, "Unpowered boiler pipe should have 0 hot pressure");

        // Test Case B: Boiler is POWERED
        grid.boilers[0].is_powered = true;
        grid.solve_grid();

        assert!(grid.boilers[0].is_heating, "Powered boiler with cold water must heat");
        let pipe_powered = grid.get_cell(10, 0).unwrap();
        assert_eq!(pipe_powered.temperature_c, 55, "Powered boiler pipe should heat to 55°C");
        assert!(pipe_powered.hot_pressure > 0, "Powered boiler pipe should have hot pressure");
    }

    #[test]
    fn test_tunnel_dig_cost_vulnerability() {
        // Verification Criterion 3:
        // Verify get_tunnel_dig_cost() returns 0.20 for large pipe tiles vs 1.00 for small pipes.
        let large_pipe_cell = FluidPipeCell {
            pipe_type: PipeType::LargeCold as u8,
            cold_pressure: 80,
            hot_pressure: 0,
            temperature_c: 10,
            flags: 0,
        };
        assert_eq!(
            get_tunnel_dig_cost(&large_pipe_cell),
            0.20,
            "Large pipe should have 0.20 tunnel dig cost (80% faster)"
        );

        let small_pipe_cell = FluidPipeCell {
            pipe_type: PipeType::SmallCold as u8,
            cold_pressure: 80,
            hot_pressure: 0,
            temperature_c: 10,
            flags: 0,
        };
        assert_eq!(
            get_tunnel_dig_cost(&small_pipe_cell),
            1.00,
            "Small cold pipe should have 1.00 normal tunnel dig cost"
        );

        let small_hot_cell = FluidPipeCell {
            pipe_type: PipeType::SmallHot as u8,
            cold_pressure: 0,
            hot_pressure: 80,
            temperature_c: 55,
            flags: 0,
        };
        assert_eq!(
            get_tunnel_dig_cost(&small_hot_cell),
            1.00,
            "Small hot pipe should have 1.00 normal tunnel dig cost"
        );

        let no_pipe_cell = FluidPipeCell::default();
        assert_eq!(
            get_tunnel_dig_cost(&no_pipe_cell),
            1.00,
            "No pipe tile should have 1.00 normal dig cost"
        );
    }

    #[test]
    fn test_plumbing_fixtures_toilet_and_shower_supply() {
        let mut grid = PlumbingGrid::new(50, 50);

        grid.add_pump_station(1, 0, 0);
        grid.place_pipe(3, 0, PipeType::LargeCold);
        grid.place_pipe(4, 0, PipeType::LargeCold);

        grid.add_boiler_station(10, 5, 0);
        grid.place_pipe(8, 0, PipeType::SmallHot);

        grid.add_fixture(100, 3, 0, FixtureType::Toilet);
        grid.add_fixture(200, 8, 0, FixtureType::Shower);

        grid.solve_grid();

        assert!(grid.fixtures[0].is_supplied, "Toilet should be supplied with cold water");
        assert!(grid.fixtures[1].is_supplied, "Shower should be supplied with water");
        assert!(grid.fixtures[1].is_warm, "Shower should be warm from boiler hot water");
    }
}

