use std::collections::{HashMap, HashSet};
use bevy_ecs::prelude::*;

/// Power status for any electrical tile, cable, or appliance.
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PowerStatus {
    Unpowered = 0,
    Powered = 1,
    Overloaded = 2,
    ShortCircuit = 3,
}

/// Known electrical appliance archetypes with defined base wattage.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApplianceType {
    CctvMonitor,   // 150 W
    MetalDetector, // 250 W
    WorkshopSaw,   // 600 W
    ElectricChair, // 5,000 W surge
    Custom(u32),   // custom wattage in Watts
}

impl ApplianceType {
    pub fn wattage(&self) -> f32 {
        match self {
            ApplianceType::CctvMonitor => 150.0,
            ApplianceType::MetalDetector => 250.0,
            ApplianceType::WorkshopSaw => 600.0,
            ApplianceType::ElectricChair => 5000.0,
            ApplianceType::Custom(w) => *w as f32,
        }
    }
}

/// Disjoint-Set (Union-Find) with path compression and union by rank.
#[derive(Debug, Clone)]
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
            // Path halving/compression
            self.parent[i as usize] = self.parent[self.parent[i as usize] as usize];
            i = self.parent[i as usize];
        }
        i
    }

    pub fn union(&mut self, i: u32, j: u32) -> bool {
        let root_i = self.find(i);
        let root_j = self.find(j);
        if root_i == root_j {
            return false;
        }

        if self.rank[root_i as usize] < self.rank[root_j as usize] {
            self.parent[root_i as usize] = root_j;
        } else if self.rank[root_i as usize] > self.rank[root_j as usize] {
            self.parent[root_j as usize] = root_i;
        } else {
            self.parent[root_j as usize] = root_i;
            self.rank[root_i as usize] += 1;
        }
        true
    }

    pub fn reset(&mut self) {
        for (i, p) in self.parent.iter_mut().enumerate() {
            *p = i as u32;
        }
        self.rank.fill(0);
    }
}

/// Power Station entity supplying electrical wattage to connected circuits.
/// Base capacity is 1,000W; augmented by +500W per adjacent Capacitor (up to 16, max 9,000W).
#[derive(Debug, Clone)]
pub struct PowerStation {
    pub id: u32,
    pub x: u32,
    pub y: u32,
    pub base_capacity: f32,
    pub capacitor_count: u32,
    pub is_active: bool,
    pub is_tripped: bool,
    pub cooldown_ticks: u32,
}

impl PowerStation {
    pub fn new(id: u32, x: u32, y: u32) -> Self {
        Self {
            id,
            x,
            y,
            base_capacity: 1000.0,
            capacitor_count: 0,
            is_active: true,
            is_tripped: false,
            cooldown_ticks: 0,
        }
    }

    pub fn calculate_total_capacity(&self) -> f32 {
        if !self.is_active || self.is_tripped {
            return 0.0;
        }
        let cap_count = self.capacitor_count.min(16);
        (self.base_capacity + (cap_count as f32 * 500.0)).min(9000.0)
    }

    /// Checks if a coordinate is within or directly adjacent to the station's 3x3 footprint.
    pub fn is_adjacent_or_contained(&self, tx: u32, ty: u32) -> bool {
        // Station footprint spans [x, x+2] by [y, y+2]
        // Perimeter ring for capacitors: [x-1, x+3] by [y-1, y+3]
        let min_x = self.x.saturating_sub(1);
        let max_x = self.x + 3;
        let min_y = self.y.saturating_sub(1);
        let max_y = self.y + 3;

        tx >= min_x && tx <= max_x && ty >= min_y && ty <= max_y
    }

    /// Station footprint tiles: 3x3
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

/// Electrical appliance that consumes wattage when connected to a live circuit.
#[derive(Debug, Clone)]
pub struct ElectricalAppliance {
    pub id: u32,
    pub x: u32,
    pub y: u32,
    pub appliance_type: ApplianceType,
    pub active_wattage: f32,
    pub is_active: bool,
    pub is_powered: bool,
}

impl ElectricalAppliance {
    pub fn new(id: u32, x: u32, y: u32, appliance_type: ApplianceType) -> Self {
        Self {
            id,
            x,
            y,
            active_wattage: appliance_type.wattage(),
            appliance_type,
            is_active: true,
            is_powered: false,
        }
    }
}

/// High-priority simulation events emitted by electrical solver.
#[derive(Debug, Clone, PartialEq)]
pub enum ElectricalEvent {
    BreakerTripped {
        station_id: u32,
        station_x: u32,
        station_y: u32,
        load: f32,
        capacity: f32,
    },
    ShortCircuit {
        root: u32,
        station_ids: Vec<u32>,
        spark_x: u32,
        spark_y: u32,
    },
}

/// Global Electrical Grid manager modeling cables, stations, capacitors, and appliances.
#[derive(Resource)]
pub struct ElectricalGrid {
    pub width: u32,
    pub height: u32,
    pub cables: HashSet<u32>,
    pub power_stations: Vec<PowerStation>,
    pub capacitors: HashSet<u32>,
    pub appliances: Vec<ElectricalAppliance>,
    pub events: Vec<ElectricalEvent>,
    pub circuit_statuses: HashMap<u32, PowerStatus>,
    pub circuit_loads: HashMap<u32, f32>,
    pub circuit_capacities: HashMap<u32, f32>,
    pub station_loads: HashMap<u32, f32>,
    pub station_capacities: HashMap<u32, f32>,
    pub tile_power_cache: HashMap<u32, PowerStatus>,
    ds: DisjointSet,
}

/// Bevy ECS system that periodically executes the topological electrical grid solver.
pub fn solve_electrical_grid_system(mut grid: ResMut<ElectricalGrid>) {
    grid.solve_grid();
}

impl ElectricalGrid {
    pub fn new(width: u32, height: u32) -> Self {
        let total = (width * height) as usize;
        Self {
            width,
            height,
            cables: HashSet::new(),
            power_stations: Vec::new(),
            capacitors: HashSet::new(),
            appliances: Vec::new(),
            events: Vec::new(),
            circuit_statuses: HashMap::new(),
            circuit_loads: HashMap::new(),
            circuit_capacities: HashMap::new(),
            station_loads: HashMap::new(),
            station_capacities: HashMap::new(),
            tile_power_cache: HashMap::new(),
            ds: DisjointSet::new(total),
        }
    }

    #[inline]
    pub fn coord_to_idx(&self, x: u32, y: u32) -> u32 {
        y * self.width + x
    }

    #[inline]
    pub fn idx_to_coord(&self, idx: u32) -> (u32, u32) {
        (idx % self.width, idx / self.width)
    }

    pub fn place_cable(&mut self, x: u32, y: u32) {
        if x < self.width && y < self.height {
            self.cables.insert(self.coord_to_idx(x, y));
        }
    }

    pub fn remove_cable(&mut self, x: u32, y: u32) {
        self.cables.remove(&self.coord_to_idx(x, y));
    }

    pub fn has_cable(&self, x: u32, y: u32) -> bool {
        self.cables.contains(&self.coord_to_idx(x, y))
    }

    pub fn add_power_station(&mut self, id: u32, x: u32, y: u32) {
        self.power_stations.push(PowerStation::new(id, x, y));
    }

    pub fn add_capacitor(&mut self, x: u32, y: u32) {
        if x < self.width && y < self.height {
            self.capacitors.insert(self.coord_to_idx(x, y));
        }
    }

    pub fn add_appliance(&mut self, id: u32, x: u32, y: u32, appliance_type: ApplianceType) {
        self.appliances.push(ElectricalAppliance::new(id, x, y, appliance_type));
    }

    pub fn reset_breaker(&mut self, station_id: u32) {
        if let Some(station) = self.power_stations.iter_mut().find(|s| s.id == station_id) {
            station.is_tripped = false;
            station.cooldown_ticks = 0;
        }
    }

    /// Solves the topological electrical networks, checks capacity vs load, and enforces
    /// the Short-Circuit rule (never connect 2 live Power Stations to the same wire network).
    pub fn solve_grid(&mut self) {
        self.events.clear();
        self.circuit_statuses.clear();
        self.circuit_loads.clear();
        self.circuit_capacities.clear();
        self.ds.reset();

        let width = self.width;

        // 1. Calculate adjacent capacitor counts for each power station
        for station in &mut self.power_stations {
            let mut cap_count = 0;
            for &cap_idx in &self.capacitors {
                let cx = cap_idx % width;
                let cy = cap_idx / width;
                if station.is_adjacent_or_contained(cx, cy) {
                    cap_count += 1;
                }
            }
            station.capacitor_count = cap_count;
        }

        // 2. Union internal 3x3 footprint tiles of each power station into a unified node
        for station in &self.power_stations {
            let base_idx = self.coord_to_idx(station.x, station.y);
            for dy in 0..3 {
                for dx in 0..3 {
                    let tile_idx = self.coord_to_idx(station.x + dx, station.y + dy);
                    self.ds.union(base_idx, tile_idx);
                }
            }
        }

        // 3. Union adjacent connected cables
        let cardinal_offsets: [(i32, i32); 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];
        for &cable_idx in &self.cables {
            let (cx, cy) = self.idx_to_coord(cable_idx);

            for (dx, dy) in cardinal_offsets {
                let nx = cx as i32 + dx;
                let ny = cy as i32 + dy;
                if nx >= 0 && nx < self.width as i32 && ny >= 0 && ny < self.height as i32 {
                    let n_idx = self.coord_to_idx(nx as u32, ny as u32);
                    if self.cables.contains(&n_idx) {
                        self.ds.union(cable_idx, n_idx);
                    }
                }
            }
        }

        // 4. Union power stations with directly adjacent cables
        for station in &self.power_stations {
            let station_root = self.ds.find(self.coord_to_idx(station.x, station.y));
            for dy in 0..3 {
                for dx in 0..3 {
                    let sx = station.x + dx;
                    let sy = station.y + dy;
                    for (odx, ody) in cardinal_offsets {
                        let nx = sx as i32 + odx;
                        let ny = sy as i32 + ody;
                        if nx >= 0 && nx < self.width as i32 && ny >= 0 && ny < self.height as i32 {
                            let n_idx = self.coord_to_idx(nx as u32, ny as u32);
                            if self.cables.contains(&n_idx) {
                                self.ds.union(station_root, n_idx);
                            }
                        }
                    }
                }
            }
        }

        // 5. Union appliances with their tile or adjacent cables
        for app in &self.appliances {
            let app_idx = self.coord_to_idx(app.x, app.y);
            // Check direct cable on tile
            if self.cables.contains(&app_idx) {
                self.ds.union(app_idx, app_idx);
            }
            // Check cardinal adjacent cables
            for (dx, dy) in cardinal_offsets {
                let nx = app.x as i32 + dx;
                let ny = app.y as i32 + dy;
                if nx >= 0 && nx < self.width as i32 && ny >= 0 && ny < self.height as i32 {
                    let n_idx = self.coord_to_idx(nx as u32, ny as u32);
                    if self.cables.contains(&n_idx) {
                        self.ds.union(app_idx, n_idx);
                    }
                }
            }
        }

        // 6. Map active Power Stations to their circuit roots and detect Short Circuits
        let mut root_to_stations: HashMap<u32, Vec<u32>> = HashMap::new();
        for station in &self.power_stations {
            if !station.is_active || station.is_tripped {
                continue;
            }
            let root = self.ds.find(self.coord_to_idx(station.x, station.y));
            root_to_stations.entry(root).or_default().push(station.id);
        }

        // 7. Check for Catastrophic Short-Circuit (2 or more live stations on the same wire graph)
        let mut short_circuited_roots = HashSet::new();
        for (&root, station_ids) in &root_to_stations {
            if station_ids.len() > 1 {
                // Short Circuit violation!
                short_circuited_roots.insert(root);
                self.circuit_statuses.insert(root, PowerStatus::ShortCircuit);

                // Trip all participating stations
                let mut spark_pos = (0, 0);
                for &sid in station_ids {
                    if let Some(s) = self.power_stations.iter_mut().find(|st| st.id == sid) {
                        s.is_tripped = true;
                        spark_pos = (s.x, s.y);
                    }
                }

                self.events.push(ElectricalEvent::ShortCircuit {
                    root,
                    station_ids: station_ids.clone(),
                    spark_x: spark_pos.0,
                    spark_y: spark_pos.1,
                });
            }
        }

        // 8. For valid circuits, calculate capacity vs sum of appliance loads
        for (&root, station_ids) in &root_to_stations {
            if short_circuited_roots.contains(&root) {
                continue;
            }

            let station_id = station_ids[0];
            let (station_x, station_y, capacity) = {
                let s = self
                    .power_stations
                    .iter()
                    .find(|s| s.id == station_id)
                    .unwrap();
                (s.x, s.y, s.calculate_total_capacity())
            };
            self.circuit_capacities.insert(root, capacity);

            // Sum load of all active appliances in this circuit
            let mut total_load = 0.0f32;
            for app in &self.appliances {
                if !app.is_active {
                    continue;
                }
                let app_idx = app.y * width + app.x;
                let app_root = self.ds.find(app_idx);
                if app_root == root {
                    total_load += app.active_wattage;
                }
            }
            self.circuit_loads.insert(root, total_load);

            self.station_loads.insert(station_id, total_load);
            self.station_capacities.insert(station_id, capacity);

            // Evaluate Overload
            if total_load > capacity {
                // Overloaded! Trip the breaker
                if let Some(s) = self.power_stations.iter_mut().find(|st| st.id == station_id) {
                    s.is_tripped = true;
                }
                self.circuit_statuses.insert(root, PowerStatus::Overloaded);
                self.events.push(ElectricalEvent::BreakerTripped {
                    station_id,
                    station_x,
                    station_y,
                    load: total_load,
                    capacity,
                });
            } else {
                // Circuit is stable and powered
                self.circuit_statuses.insert(root, PowerStatus::Powered);
            }
        }

        // 9. Update appliance powered states
        let circuit_statuses = &self.circuit_statuses;
        let ds = &mut self.ds;
        for app in &mut self.appliances {
            let app_idx = app.y * width + app.x;
            let app_root = ds.find(app_idx);
            let status = circuit_statuses
                .get(&app_root)
                .copied()
                .unwrap_or(PowerStatus::Unpowered);

            app.is_powered = status == PowerStatus::Powered;
        }

        // 10. Cache tile power statuses for cables, stations, and appliances
        self.tile_power_cache.clear();
        for &cable_idx in &self.cables {
            let root = self.ds.find(cable_idx);
            let status = self
                .circuit_statuses
                .get(&root)
                .copied()
                .unwrap_or(PowerStatus::Unpowered);
            self.tile_power_cache.insert(cable_idx, status);
        }
        for station in &self.power_stations {
            for (sx, sy) in station.footprint_tiles() {
                let s_idx = self.coord_to_idx(sx, sy);
                let root = self.ds.find(s_idx);
                let status = self
                    .circuit_statuses
                    .get(&root)
                    .copied()
                    .unwrap_or(PowerStatus::Unpowered);
                self.tile_power_cache.insert(s_idx, status);
            }
        }
        for app in &self.appliances {
            let app_idx = self.coord_to_idx(app.x, app.y);
            let root = self.ds.find(app_idx);
            let status = self
                .circuit_statuses
                .get(&root)
                .copied()
                .unwrap_or(PowerStatus::Unpowered);
            self.tile_power_cache.insert(app_idx, status);
        }
    }

    /// Queries the power status of a specific tile coordinate.
    pub fn get_tile_power_status(&self, x: u32, y: u32) -> PowerStatus {
        if x >= self.width || y >= self.height {
            return PowerStatus::Unpowered;
        }
        let idx = self.coord_to_idx(x, y);
        self.tile_power_cache
            .get(&idx)
            .copied()
            .unwrap_or(PowerStatus::Unpowered)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_disjoint_set_union_and_path_compression() {
        let mut ds = DisjointSet::new(10);
        assert_eq!(ds.find(1), 1);
        assert_eq!(ds.find(2), 2);

        ds.union(1, 2);
        assert_eq!(ds.find(1), ds.find(2));

        ds.union(2, 3);
        assert_eq!(ds.find(1), ds.find(3));

        ds.reset();
        assert_ne!(ds.find(1), ds.find(2));
    }

    #[test]
    fn test_electrical_grid_stable_circuit_with_capacitors() {
        let mut grid = ElectricalGrid::new(100, 100);

        // 1. Build 1 Power Station at (10, 10) with 2 adjacent capacitors
        // Base capacity: 1,000W + 2 * 500W = 2,000W
        grid.add_power_station(1, 10, 10);
        grid.add_capacitor(9, 10);
        grid.add_capacitor(13, 10);

        // Run line of 15 cables from (13, 11) to (27, 11)
        for x in 13..=27 {
            grid.place_cable(x, 11);
        }

        // Connect 10 x 150W CCTV monitors (1,500W load)
        for i in 0..10 {
            grid.add_appliance(100 + i, 15 + i, 11, ApplianceType::CctvMonitor);
        }

        grid.solve_grid();

        // Assert capacity is 2,000W and load is 1,500W
        let station = &grid.power_stations[0];
        assert_eq!(station.capacitor_count, 2);
        assert_eq!(station.calculate_total_capacity(), 2000.0);
        assert!(!station.is_tripped);

        // Assert all 10 CCTV monitors are powered
        for app in &grid.appliances {
            assert!(app.is_powered, "Appliance {} should be powered", app.id);
        }

        // Assert tile status along cable line is Powered
        assert_eq!(grid.get_tile_power_status(20, 11), PowerStatus::Powered);
        assert!(grid.events.is_empty(), "No breaker trip or short circuit should occur");
    }

    #[test]
    fn test_electrical_grid_overload_breaker_trip() {
        let mut grid = ElectricalGrid::new(100, 100);

        // Power Station at (20, 20) with 2 capacitors = 2,000W capacity
        grid.add_power_station(1, 20, 20);
        grid.add_capacitor(19, 20);
        grid.add_capacitor(23, 20);

        // Cable line
        for x in 23..=30 {
            grid.place_cable(x, 21);
        }

        // Connect 5 x 600W workshop saws = 3,000W load (> 2,000W capacity)
        for i in 0..5 {
            grid.add_appliance(200 + i, 24 + i, 21, ApplianceType::WorkshopSaw);
        }

        grid.solve_grid();

        // Breaker should trip
        let station = &grid.power_stations[0];
        assert!(station.is_tripped, "Station breaker should trip on overload");

        // Assert all appliances unpowered
        for app in &grid.appliances {
            assert!(!app.is_powered, "Appliance {} should lose power", app.id);
        }

        // Circuit status should be Overloaded
        assert_eq!(grid.get_tile_power_status(25, 21), PowerStatus::Overloaded);

        // Assert BreakerTripped event emitted
        assert_eq!(grid.events.len(), 1);
        match &grid.events[0] {
            ElectricalEvent::BreakerTripped { station_id, load, capacity, .. } => {
                assert_eq!(*station_id, 1);
                assert_eq!(*load, 3000.0);
                assert_eq!(*capacity, 2000.0);
            }
            _ => panic!("Expected BreakerTripped event"),
        }
    }

    #[test]
    fn test_electrical_grid_catastrophic_short_circuit() {
        let mut grid = ElectricalGrid::new(100, 100);

        // Power Station A at (10, 10)
        grid.add_power_station(1, 10, 10);

        // Power Station B at (30, 10)
        grid.add_power_station(2, 30, 10);

        // Connect both stations together with a single wire bridging them
        for x in 13..=29 {
            grid.place_cable(x, 11);
        }

        grid.solve_grid();

        // The Short-Circuit Law: Both stations must trip!
        assert!(grid.power_stations[0].is_tripped, "Station 1 must trip on short circuit");
        assert!(grid.power_stations[1].is_tripped, "Station 2 must trip on short circuit");

        // Circuit status should be ShortCircuit
        assert_eq!(grid.get_tile_power_status(20, 11), PowerStatus::ShortCircuit);

        // Assert ShortCircuit event emitted with both station IDs
        assert_eq!(grid.events.len(), 1);
        match &grid.events[0] {
            ElectricalEvent::ShortCircuit { station_ids, .. } => {
                assert!(station_ids.contains(&1));
                assert!(station_ids.contains(&2));
            }
            _ => panic!("Expected ShortCircuit event"),
        }
    }
}
