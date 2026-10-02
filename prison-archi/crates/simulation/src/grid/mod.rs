pub mod chunk;
pub mod tile;

pub use chunk::*;
pub use tile::*;

use wasm_bindgen::prelude::*;

/// WebAssembly wrapper for the 2D multi-layer orthogonal TileGrid
#[wasm_bindgen]
pub struct WasmTileGrid {
    grid: TileGrid,
}

#[wasm_bindgen]
impl WasmTileGrid {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize) -> Self {
        Self {
            grid: TileGrid::new(width, height),
        }
    }

    pub fn get_width(&self) -> usize {
        self.grid.width
    }

    pub fn get_height(&self) -> usize {
        self.grid.height
    }

    pub fn get_chunks_x(&self) -> usize {
        self.grid.chunks_x
    }

    pub fn get_chunks_y(&self) -> usize {
        self.grid.chunks_y
    }

    pub fn get_total_chunks(&self) -> usize {
        self.grid.chunks.len()
    }

    pub fn total_memory_bytes(&self) -> usize {
        self.grid.total_memory_bytes()
    }

    pub fn get_wall_id(&self, x: usize, y: usize) -> u8 {
        self.grid.get_tile(x, y).map(|t| t.wall_id).unwrap_or(0)
    }

    pub fn set_wall_id(&mut self, x: usize, y: usize, wall_id: u8) -> bool {
        if let Some(tile) = self.grid.get_tile_mut(x, y) {
            tile.wall_id = wall_id;
            true
        } else {
            false
        }
    }

    pub fn get_terrain_id(&self, x: usize, y: usize) -> u8 {
        self.grid.get_tile(x, y).map(|t| t.terrain_id).unwrap_or(0)
    }

    pub fn set_terrain_id(&mut self, x: usize, y: usize, terrain_id: u8) -> bool {
        if let Some(tile) = self.grid.get_tile_mut(x, y) {
            tile.terrain_id = terrain_id;
            true
        } else {
            false
        }
    }

    pub fn get_floor_id(&self, x: usize, y: usize) -> u8 {
        self.grid.get_tile(x, y).map(|t| t.floor_id).unwrap_or(0)
    }

    pub fn set_floor_id(&mut self, x: usize, y: usize, floor_id: u8) -> bool {
        if let Some(tile) = self.grid.get_tile_mut(x, y) {
            tile.floor_id = floor_id;
            true
        } else {
            false
        }
    }

    pub fn is_solid(&self, x: usize, y: usize) -> bool {
        self.grid.get_tile(x, y).map(|t| t.is_solid()).unwrap_or(false)
    }

    pub fn get_health(&self, x: usize, y: usize) -> u8 {
        self.grid.get_tile(x, y).map(|t| t.health).unwrap_or(0)
    }

    pub fn set_health(&mut self, x: usize, y: usize, health: u8) -> bool {
        if let Some(tile) = self.grid.get_tile_mut(x, y) {
            tile.health = health;
            true
        } else {
            false
        }
    }

    pub fn dirty_chunk_count(&self) -> usize {
        self.grid.dirty_chunk_count()
    }

    pub fn clear_chunk_dirty(&mut self, cx: usize, cy: usize) -> bool {
        if cx < self.grid.chunks_x && cy < self.grid.chunks_y {
            let idx = cy * self.grid.chunks_x + cx;
            self.grid.chunks[idx].clear_dirty();
            true
        } else {
            false
        }
    }
}
