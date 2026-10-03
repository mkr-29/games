use super::chunk::TileGrid;

/// 4-Bit Cardinal Autotile Bitmask Flags (0..15)
/// Evaluates 4 cardinal neighbors to map directly to a 4x4 wall atlas.
pub const AUTOTILE_NORTH: u8 = 1 << 0; // 1
pub const AUTOTILE_EAST: u8  = 1 << 1; // 2
pub const AUTOTILE_SOUTH: u8 = 1 << 2; // 4
pub const AUTOTILE_WEST: u8  = 1 << 3; // 8

/// 8-Bit Neighbor Bitmask Flags
/// Evaluates all 8 adjacent tiles (cardinals + diagonals).
pub const NEIGHBOR_N: u8  = 1 << 0; // 1
pub const NEIGHBOR_NE: u8 = 1 << 1; // 2
pub const NEIGHBOR_E: u8  = 1 << 2; // 4
pub const NEIGHBOR_SE: u8 = 1 << 3; // 8
pub const NEIGHBOR_S: u8  = 1 << 4; // 16
pub const NEIGHBOR_SW: u8 = 1 << 5; // 32
pub const NEIGHBOR_W: u8  = 1 << 6; // 64
pub const NEIGHBOR_NW: u8 = 1 << 7; // 128

/// Determines whether a wall can visually connect to a neighboring tile.
/// Walls connect to any solid wall material (Brick, Concrete, Perimeter, etc.).
#[inline(always)]
pub fn connects_to_wall(neighbor_wall: u8, _current_wall: u8) -> bool {
    neighbor_wall != 0
}

/// Calculate 4-bit cardinal autotile index (0..15) for tile at (x, y).
/// Formula: Index = (North * 1) + (East * 2) + (South * 4) + (West * 8)
pub fn calculate_wall_autotile(grid: &TileGrid, x: usize, y: usize) -> u8 {
    let current_tile = match grid.get_tile(x, y) {
        Some(t) => t,
        None => return 0,
    };

    let current_wall = current_tile.wall_id;
    if current_wall == 0 {
        return 0;
    }

    let mut mask = 0u8;

    // North (y > 0): (x, y - 1)
    if y > 0 {
        if let Some(north) = grid.get_tile(x, y - 1) {
            if connects_to_wall(north.wall_id, current_wall) {
                mask |= AUTOTILE_NORTH;
            }
        }
    }

    // East (x + 1 < width): (x + 1, y)
    if x + 1 < grid.width {
        if let Some(east) = grid.get_tile(x + 1, y) {
            if connects_to_wall(east.wall_id, current_wall) {
                mask |= AUTOTILE_EAST;
            }
        }
    }

    // South (y + 1 < height): (x, y + 1)
    if y + 1 < grid.height {
        if let Some(south) = grid.get_tile(x, y + 1) {
            if connects_to_wall(south.wall_id, current_wall) {
                mask |= AUTOTILE_SOUTH;
            }
        }
    }

    // West (x > 0): (x - 1, y)
    if x > 0 {
        if let Some(west) = grid.get_tile(x - 1, y) {
            if connects_to_wall(west.wall_id, current_wall) {
                mask |= AUTOTILE_WEST;
            }
        }
    }

    mask
}

/// Calculate 8-bit neighbor bitmask for tile at (x, y).
pub fn calculate_autotile_8bit(grid: &TileGrid, x: usize, y: usize) -> u8 {
    let current_tile = match grid.get_tile(x, y) {
        Some(t) => t,
        None => return 0,
    };

    let current_wall = current_tile.wall_id;
    if current_wall == 0 {
        return 0;
    }

    let mut mask = 0u8;

    let has_n = y > 0 && grid.get_tile(x, y - 1).map_or(false, |t| connects_to_wall(t.wall_id, current_wall));
    let has_s = y + 1 < grid.height && grid.get_tile(x, y + 1).map_or(false, |t| connects_to_wall(t.wall_id, current_wall));
    let has_e = x + 1 < grid.width && grid.get_tile(x + 1, y).map_or(false, |t| connects_to_wall(t.wall_id, current_wall));
    let has_w = x > 0 && grid.get_tile(x - 1, y).map_or(false, |t| connects_to_wall(t.wall_id, current_wall));

    if has_n { mask |= NEIGHBOR_N; }
    if has_e { mask |= NEIGHBOR_E; }
    if has_s { mask |= NEIGHBOR_S; }
    if has_w { mask |= NEIGHBOR_W; }

    // Diagonals (only evaluated if within grid bounds)
    if y > 0 && x + 1 < grid.width && grid.get_tile(x + 1, y - 1).map_or(false, |t| connects_to_wall(t.wall_id, current_wall)) {
        mask |= NEIGHBOR_NE;
    }
    if y + 1 < grid.height && x + 1 < grid.width && grid.get_tile(x + 1, y + 1).map_or(false, |t| connects_to_wall(t.wall_id, current_wall)) {
        mask |= NEIGHBOR_SE;
    }
    if y + 1 < grid.height && x > 0 && grid.get_tile(x - 1, y + 1).map_or(false, |t| connects_to_wall(t.wall_id, current_wall)) {
        mask |= NEIGHBOR_SW;
    }
    if y > 0 && x > 0 && grid.get_tile(x - 1, y - 1).map_or(false, |t| connects_to_wall(t.wall_id, current_wall)) {
        mask |= NEIGHBOR_NW;
    }

    mask
}

/// Normalizes an 8-bit neighbor bitmask by clearing corner bits whose adjacent
/// cardinal edges are not present. This reduces 256 possible masks to the 47
/// canonical blob autotile configurations.
pub const fn normalize_8bit_mask(mask: u8) -> u8 {
    let mut n = mask;
    // NE requires North (1) and East (4)
    if (n & (NEIGHBOR_N | NEIGHBOR_E)) != (NEIGHBOR_N | NEIGHBOR_E) {
        n &= !NEIGHBOR_NE;
    }
    // SE requires South (16) and East (4)
    if (n & (NEIGHBOR_S | NEIGHBOR_E)) != (NEIGHBOR_S | NEIGHBOR_E) {
        n &= !NEIGHBOR_SE;
    }
    // SW requires South (16) and West (64)
    if (n & (NEIGHBOR_S | NEIGHBOR_W)) != (NEIGHBOR_S | NEIGHBOR_W) {
        n &= !NEIGHBOR_SW;
    }
    // NW requires North (1) and West (64)
    if (n & (NEIGHBOR_N | NEIGHBOR_W)) != (NEIGHBOR_N | NEIGHBOR_W) {
        n &= !NEIGHBOR_NW;
    }
    n
}

/// Compile-time generation of the 256 -> 47 Blob Autotile lookup table.
const fn generate_blob_47_lut() -> [u8; 256] {
    let mut table = [0u8; 256];
    let mut unique = [0u8; 47];
    let mut count = 0usize;

    let mut i = 0usize;
    while i < 256 {
        let norm = normalize_8bit_mask(i as u8);
        let mut found = false;
        let mut idx = 0usize;
        while idx < count {
            if unique[idx] == norm {
                found = true;
                table[i] = idx as u8;
                break;
            }
            idx += 1;
        }
        if !found && count < 47 {
            unique[count] = norm;
            table[i] = count as u8;
            count += 1;
        }
        i += 1;
    }

    table
}

/// Precomputed $O(1)$ lookup table mapping any raw 8-bit bitmask (0..255)
/// to its canonical 47-tile blob autotile index (0..46).
pub static BLOB_47_LUT: [u8; 256] = generate_blob_47_lut();

/// Calculate the 47-tile blob autotile index (0..46) for tile at (x, y).
#[inline(always)]
pub fn calculate_blob_47(grid: &TileGrid, x: usize, y: usize) -> u8 {
    let raw = calculate_autotile_8bit(grid, x, y);
    BLOB_47_LUT[raw as usize]
}

/// Updates a tile at (x, y) with the specified wall_id (or 0 to demolish),
/// recomputes its 4-bit autotile index, recomputes autotile indices for all 4
/// cardinal neighbors, and marks all affected chunks dirty.
pub fn set_wall_and_propagate_autotile(
    grid: &mut TileGrid,
    x: usize,
    y: usize,
    wall_id: u8,
) -> bool {
    if !grid.in_bounds(x, y) {
        return false;
    }

    // 1. Update wall_id at (x, y)
    if let Some(tile) = grid.get_tile_mut(x, y) {
        tile.wall_id = wall_id;
    }

    // 2. Recompute autotile for (x, y)
    let center_autotile = calculate_wall_autotile(grid, x, y);
    if let Some(tile) = grid.get_tile_mut(x, y) {
        tile.wall_autotile_idx = center_autotile;
    }
    grid.mark_tile_dirty(x, y);

    // 3. Recompute autotiles for all 4 cardinal neighbors and mark their chunks dirty
    // North (x, y - 1)
    if y > 0 {
        let ny = y - 1;
        let north_autotile = calculate_wall_autotile(grid, x, ny);
        if let Some(north_tile) = grid.get_tile_mut(x, ny) {
            north_tile.wall_autotile_idx = north_autotile;
        }
        grid.mark_tile_dirty(x, ny);
    }

    // East (x + 1, y)
    if x + 1 < grid.width {
        let nx = x + 1;
        let east_autotile = calculate_wall_autotile(grid, nx, y);
        if let Some(east_tile) = grid.get_tile_mut(nx, y) {
            east_tile.wall_autotile_idx = east_autotile;
        }
        grid.mark_tile_dirty(nx, y);
    }

    // South (x, y + 1)
    if y + 1 < grid.height {
        let ny = y + 1;
        let south_autotile = calculate_wall_autotile(grid, x, ny);
        if let Some(south_tile) = grid.get_tile_mut(x, ny) {
            south_tile.wall_autotile_idx = south_autotile;
        }
        grid.mark_tile_dirty(x, ny);
    }

    // West (x - 1, y)
    if x > 0 {
        let nx = x - 1;
        let west_autotile = calculate_wall_autotile(grid, nx, y);
        if let Some(west_tile) = grid.get_tile_mut(nx, y) {
            west_tile.wall_autotile_idx = west_autotile;
        }
        grid.mark_tile_dirty(nx, y);
    }

    true
}

/// Recalculate autotile indices for an entire rectangular area [min_x..=max_x, min_y..=max_y]
pub fn recalculate_rect_autotile(
    grid: &mut TileGrid,
    min_x: usize,
    min_y: usize,
    max_x: usize,
    max_y: usize,
) {
    let min_x = min_x.min(grid.width.saturating_sub(1));
    let max_x = max_x.min(grid.width.saturating_sub(1));
    let min_y = min_y.min(grid.height.saturating_sub(1));
    let max_y = max_y.max(min_y).min(grid.height.saturating_sub(1));

    // First pass: compute indices
    for y in min_y..=max_y {
        for x in min_x..=max_x {
            let idx = calculate_wall_autotile(grid, x, y);
            if let Some(tile) = grid.get_tile_mut(x, y) {
                tile.wall_autotile_idx = idx;
            }
            grid.mark_tile_dirty(x, y);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_all_16_cardinal_autotile_combinations() {
        let mut grid = TileGrid::new(16, 16);

        // Center tile at (5, 5)
        let cx = 5usize;
        let cy = 5usize;

        // Verify all 16 cardinal combinations (0..15)
        for expected_mask in 0u8..16 {
            // Reset grid
            for y in 0..16 {
                for x in 0..16 {
                    grid.set_tile(x, y, TileCellDescriptor::empty());
                }
            }

            // Set center wall
            grid.set_tile(cx, cy, TileCellDescriptor {
                wall_id: 1, // Brick wall
                ..TileCellDescriptor::empty()
            });

            // Set neighbors according to bits
            let has_north = (expected_mask & AUTOTILE_NORTH) != 0;
            let has_east  = (expected_mask & AUTOTILE_EAST) != 0;
            let has_south = (expected_mask & AUTOTILE_SOUTH) != 0;
            let has_west  = (expected_mask & AUTOTILE_WEST) != 0;

            if has_north {
                grid.set_tile(cx, cy - 1, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
            }
            if has_east {
                grid.set_tile(cx + 1, cy, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
            }
            if has_south {
                grid.set_tile(cx, cy + 1, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
            }
            if has_west {
                grid.set_tile(cx - 1, cy, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
            }

            let calculated_mask = calculate_wall_autotile(&grid, cx, cy);
            assert_eq!(
                calculated_mask, expected_mask,
                "Autotile mask mismatch for N={}, E={}, S={}, W={}: expected {}, got {}",
                has_north, has_east, has_south, has_west, expected_mask, calculated_mask
            );
        }
    }

    #[test]
    fn test_named_cardinal_autotile_archetypes() {
        let mut grid = TileGrid::new(16, 16);
        let (cx, cy) = (5, 5);

        // Helper to reset and place center wall
        let setup_center = |g: &mut TileGrid| {
            for y in 0..16 {
                for x in 0..16 {
                    g.set_tile(x, y, TileCellDescriptor::empty());
                }
            }
            g.set_tile(cx, cy, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
        };

        // 1. Isolated single pillar produces index 0
        setup_center(&mut grid);
        assert_eq!(calculate_wall_autotile(&grid, cx, cy), 0);

        // 2. Horizontal line produces East-West mask 10 (East 2 + West 8 = 10)
        setup_center(&mut grid);
        grid.set_tile(cx + 1, cy, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
        grid.set_tile(cx - 1, cy, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
        assert_eq!(calculate_wall_autotile(&grid, cx, cy), 10);

        // 3. T-junction (North, East, South) produces mask 7 (North 1 + East 2 + South 4 = 7)
        setup_center(&mut grid);
        grid.set_tile(cx, cy - 1, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
        grid.set_tile(cx + 1, cy, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
        grid.set_tile(cx, cy + 1, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
        assert_eq!(calculate_wall_autotile(&grid, cx, cy), 7);

        // 4. Cross-junction (NESW) produces mask 15 (1 + 2 + 4 + 8 = 15)
        setup_center(&mut grid);
        grid.set_tile(cx, cy - 1, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
        grid.set_tile(cx + 1, cy, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
        grid.set_tile(cx, cy + 1, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
        grid.set_tile(cx - 1, cy, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
        assert_eq!(calculate_wall_autotile(&grid, cx, cy), 15);
    }

    #[test]
    fn test_dirty_chunk_propagation_across_chunk_boundary() {
        // Create 64x64 grid (2x2 chunks of 32x32)
        let mut grid = TileGrid::new(64, 64);
        grid.clear_all_dirty();
        assert_eq!(grid.dirty_chunk_count(), 0);

        // Chunk (0, 0) ends at x = 31. Chunk (1, 0) begins at x = 32.
        // Place wall on right edge of chunk (0, 0) at (31, 15)
        set_wall_and_propagate_autotile(&mut grid, 31, 15, 1);

        // Tile (31, 15) is an isolated pillar (mask 0)
        assert_eq!(grid.get_tile(31, 15).unwrap().wall_autotile_idx, 0);
        // Only chunk (0, 0) should be dirty
        assert!(grid.is_chunk_dirty(0, 0));

        grid.clear_all_dirty();
        assert_eq!(grid.dirty_chunk_count(), 0);

        // Now place wall across chunk border on left edge of chunk (1, 0) at (32, 15)
        set_wall_and_propagate_autotile(&mut grid, 32, 15, 1);

        // Both chunks (0, 0) and (1, 0) must now be dirty!
        assert!(grid.is_chunk_dirty(0, 0), "Chunk (0, 0) must be dirty due to neighbor update");
        assert!(grid.is_chunk_dirty(1, 0), "Chunk (1, 0) must be dirty due to new tile");

        // Autotile indices should be connected horizontally:
        // (31, 15) has East neighbor (32, 15) -> mask = 2 (East)
        assert_eq!(grid.get_tile(31, 15).unwrap().wall_autotile_idx, AUTOTILE_EAST);
        // (32, 15) has West neighbor (31, 15) -> mask = 8 (West)
        assert_eq!(grid.get_tile(32, 15).unwrap().wall_autotile_idx, AUTOTILE_WEST);

        // Now demolish (32, 15) by setting wall_id = 0
        grid.clear_all_dirty();
        set_wall_and_propagate_autotile(&mut grid, 32, 15, 0);

        // Both chunks should again be marked dirty
        assert!(grid.is_chunk_dirty(0, 0));
        assert!(grid.is_chunk_dirty(1, 0));

        // (31, 15) should revert to isolated pillar (mask 0)
        assert_eq!(grid.get_tile(31, 15).unwrap().wall_autotile_idx, 0);
    }

    #[test]
    fn test_8bit_autotile_and_blob_47() {
        let mut grid = TileGrid::new(16, 16);
        let (cx, cy) = (5, 5);

        // Place center tile
        grid.set_tile(cx, cy, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });

        // Place isolated diagonal NE neighbor (6, 4) without North or East
        grid.set_tile(cx + 1, cy - 1, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });

        // Raw 8-bit has NE bit set
        let raw = calculate_autotile_8bit(&grid, cx, cy);
        assert_eq!(raw, NEIGHBOR_NE);

        // Normalized mask must discard NE because N and E cardinals are missing
        let norm = normalize_8bit_mask(raw);
        assert_eq!(norm, 0, "Diagonal without adjacent cardinals must normalize to 0");

        // Canonical blob 47 index maps it to the same index as isolated tile (0)
        assert_eq!(calculate_blob_47(&grid, cx, cy), BLOB_47_LUT[0]);

        // Now add North (5, 4) and East (6, 5)
        grid.set_tile(cx, cy - 1, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });
        grid.set_tile(cx + 1, cy, TileCellDescriptor { wall_id: 1, ..TileCellDescriptor::empty() });

        let raw_corner = calculate_autotile_8bit(&grid, cx, cy);
        assert_eq!(raw_corner, NEIGHBOR_N | NEIGHBOR_NE | NEIGHBOR_E);
        assert_eq!(normalize_8bit_mask(raw_corner), NEIGHBOR_N | NEIGHBOR_NE | NEIGHBOR_E);

        // Verify total unique blob configurations equals 47
        let mut unique_set = std::collections::HashSet::new();
        for &idx in BLOB_47_LUT.iter() {
            unique_set.insert(idx);
        }
        assert_eq!(unique_set.len(), 47, "Blob LUT must contain exactly 47 unique indices");
    }
}
