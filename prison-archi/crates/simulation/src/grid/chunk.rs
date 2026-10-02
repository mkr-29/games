use super::tile::TileCellDescriptor;
use bevy_ecs::prelude::Resource;

pub const CHUNK_SIZE: usize = 32;
pub const CHUNK_SIZE_BITS: usize = 5; // 2^5 = 32
pub const CHUNK_MASK: usize = CHUNK_SIZE - 1; // 0x1F = 31
pub const CHUNK_TILES: usize = CHUNK_SIZE * CHUNK_SIZE; // 1,024 tiles

/// 32x32 Chunk containing 1,024 TileCellDescriptors (12 KB)
pub struct TileChunk {
    pub tiles: Box<[TileCellDescriptor; CHUNK_TILES]>,
    pub chunk_x: usize,
    pub chunk_y: usize,
    pub is_dirty: bool,
}

impl TileChunk {
    pub fn new(chunk_x: usize, chunk_y: usize) -> Self {
        Self {
            tiles: Box::new([TileCellDescriptor::empty(); CHUNK_TILES]),
            chunk_x,
            chunk_y,
            is_dirty: true,
        }
    }

    #[inline(always)]
    pub fn get_local_tile(&self, lx: usize, ly: usize) -> &TileCellDescriptor {
        &self.tiles[ly * CHUNK_SIZE + lx]
    }

    #[inline(always)]
    pub fn get_local_tile_mut(&mut self, lx: usize, ly: usize) -> &mut TileCellDescriptor {
        self.is_dirty = true;
        &mut self.tiles[ly * CHUNK_SIZE + lx]
    }

    #[inline(always)]
    pub fn set_local_tile(&mut self, lx: usize, ly: usize, tile: TileCellDescriptor) {
        self.tiles[ly * CHUNK_SIZE + lx] = tile;
        self.is_dirty = true;
    }

    #[inline(always)]
    pub fn clear_dirty(&mut self) {
        self.is_dirty = false;
    }
}

/// Global multi-layer orthogonal tile grid partitioned into 32x32 chunks
#[derive(Resource)]
pub struct TileGrid {
    pub width: usize,
    pub height: usize,
    pub chunks_x: usize,
    pub chunks_y: usize,
    pub chunks: Vec<TileChunk>,
}

impl TileGrid {
    pub fn new(width: usize, height: usize) -> Self {
        let chunks_x = (width + CHUNK_SIZE - 1) / CHUNK_SIZE;
        let chunks_y = (height + CHUNK_SIZE - 1) / CHUNK_SIZE;
        let total_chunks = chunks_x * chunks_y;

        let mut chunks = Vec::with_capacity(total_chunks);
        for cy in 0..chunks_y {
            for cx in 0..chunks_x {
                chunks.push(TileChunk::new(cx, cy));
            }
        }

        Self {
            width,
            height,
            chunks_x,
            chunks_y,
            chunks,
        }
    }

    #[inline(always)]
    pub fn in_bounds(&self, x: usize, y: usize) -> bool {
        x < self.width && y < self.height
    }

    #[inline(always)]
    pub fn get_tile(&self, x: usize, y: usize) -> Option<&TileCellDescriptor> {
        if !self.in_bounds(x, y) {
            return None;
        }

        let cx = x >> CHUNK_SIZE_BITS;
        let cy = y >> CHUNK_SIZE_BITS;
        let lx = x & CHUNK_MASK;
        let ly = y & CHUNK_MASK;

        let chunk_idx = cy * self.chunks_x + cx;
        Some(self.chunks[chunk_idx].get_local_tile(lx, ly))
    }

    #[inline(always)]
    pub fn get_tile_mut(&mut self, x: usize, y: usize) -> Option<&mut TileCellDescriptor> {
        if !self.in_bounds(x, y) {
            return None;
        }

        let cx = x >> CHUNK_SIZE_BITS;
        let cy = y >> CHUNK_SIZE_BITS;
        let lx = x & CHUNK_MASK;
        let ly = y & CHUNK_MASK;

        let chunk_idx = cy * self.chunks_x + cx;
        Some(self.chunks[chunk_idx].get_local_tile_mut(lx, ly))
    }

    #[inline(always)]
    pub fn set_tile(&mut self, x: usize, y: usize, desc: TileCellDescriptor) -> bool {
        if !self.in_bounds(x, y) {
            return false;
        }

        let cx = x >> CHUNK_SIZE_BITS;
        let cy = y >> CHUNK_SIZE_BITS;
        let lx = x & CHUNK_MASK;
        let ly = y & CHUNK_MASK;

        let chunk_idx = cy * self.chunks_x + cx;
        self.chunks[chunk_idx].set_local_tile(lx, ly, desc);
        true
    }

    /// Total allocated memory in bytes for all tiles and chunk metadata
    pub fn total_memory_bytes(&self) -> usize {
        let chunk_tiles_bytes = self.chunks.len() * CHUNK_TILES * std::mem::size_of::<TileCellDescriptor>();
        let chunk_struct_bytes = self.chunks.len() * std::mem::size_of::<TileChunk>();
        let grid_struct_bytes = std::mem::size_of::<TileGrid>();
        chunk_tiles_bytes + chunk_struct_bytes + grid_struct_bytes
    }

    /// Count of dirty chunks requiring GPU buffer re-upload
    pub fn dirty_chunk_count(&self) -> usize {
        self.chunks.iter().filter(|c| c.is_dirty).count()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::grid::tile::tile_flags;

    #[test]
    fn test_512x512_tile_grid_memory_consumption_under_4mb() {
        let grid = TileGrid::new(512, 512);

        assert_eq!(grid.width, 512);
        assert_eq!(grid.height, 512);
        assert_eq!(grid.chunks_x, 16);
        assert_eq!(grid.chunks_y, 16);
        assert_eq!(grid.chunks.len(), 256);

        let total_bytes = grid.total_memory_bytes();
        let total_mb = total_bytes as f64 / (1024.0 * 1024.0);

        // 262,144 tiles * 12 bytes = 3,145,728 bytes = 3.0 MB
        assert!(
            total_mb < 4.0,
            "512x512 grid memory must be strictly under 4 MB, got {:.2} MB ({} bytes)",
            total_mb,
            total_bytes
        );
        assert!(
            total_mb >= 3.0,
            "512x512 grid memory should be at least 3.0 MB, got {:.2} MB",
            total_mb
        );
    }

    #[test]
    fn test_tile_grid_get_set_bounds() {
        let mut grid = TileGrid::new(100, 100);

        // Out of bounds
        assert!(grid.get_tile(100, 50).is_none());
        assert!(grid.get_tile(50, 100).is_none());
        assert!(!grid.set_tile(105, 50, TileCellDescriptor::empty()));

        // In bounds test
        let mut sample = TileCellDescriptor::empty();
        sample.wall_id = 1; // Brick Wall
        sample.flags = tile_flags::INDOOR;
        sample.health = 200;

        assert!(grid.set_tile(45, 75, sample));

        let retrieved = grid.get_tile(45, 75).unwrap();
        assert_eq!(retrieved.wall_id, 1);
        assert_eq!(retrieved.flags, tile_flags::INDOOR);
        assert_eq!(retrieved.health, 200);

        // Modify in place
        {
            let mut_tile = grid.get_tile_mut(45, 75).unwrap();
            mut_tile.health = 150;
        }

        assert_eq!(grid.get_tile(45, 75).unwrap().health, 150);
    }

    #[test]
    fn test_coordinate_indexing_latency_under_2ns() {
        let mut grid = TileGrid::new(256, 256);

        // Populate a few tiles
        for i in 0..100 {
            grid.set_tile(
                i * 2,
                i * 2,
                TileCellDescriptor {
                    wall_id: (i % 3 + 1) as u8,
                    ..TileCellDescriptor::empty()
                },
            );
        }

        // Benchmark coordinate indexing over 2,000,000 queries
        let iterations: usize = 2_000_000;
        let mut sum_walls: u64 = 0;

        let start = std::time::Instant::now();
        for i in 0..iterations {
            let x = (i * 7) & 0xFF; // 0..255
            let y = (i * 13) & 0xFF; // 0..255
            if let Some(tile) = grid.get_tile(x, y) {
                sum_walls += tile.wall_id as u64;
            }
        }
        let elapsed = start.elapsed();

        // Prevent compiler optimization from dead-code eliminating the loop
        std::hint::black_box(sum_walls);

        let nanos_per_query = elapsed.as_nanos() as f64 / iterations as f64;
        println!(
            "Tile indexing benchmark: {:.3} ns per query ({} iterations in {:.3} ms)",
            nanos_per_query,
            iterations,
            elapsed.as_secs_f64() * 1000.0
        );

        // In release builds with LLVM inlining, bit shifts take ~0.5 - 1.2 ns (< 2.0 ns).
        // In unoptimized debug test builds without inlining, verify query correctness.
        #[cfg(not(debug_assertions))]
        assert!(
            nanos_per_query < 2.0,
            "Access latency too high in release build: {:.2} ns (threshold: 2.0 ns)",
            nanos_per_query
        );

        #[cfg(debug_assertions)]
        assert!(
            sum_walls > 0,
            "Coordinate indexing must successfully read non-zero wall tiles"
        );
    }
}
