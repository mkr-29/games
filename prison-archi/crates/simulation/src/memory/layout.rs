use bytemuck::{Pod, Zeroable};
use std::sync::atomic::AtomicU32;
use wasm_bindgen::prelude::*;

pub const MAGIC_PRIS: u32 = 0x50524953; // ASCII "PRIS"
pub const PROTOCOL_VERSION: u32 = 1;

pub const BUFFER_SLOTS: usize = 3;

// Memory Partition Boundaries
pub const HEADER_OFFSET: usize = 0x000000;
pub const HEADER_SIZE: usize = 1024; // 1 KB

pub const COMMAND_QUEUE_OFFSET: usize = 0x000400;
pub const COMMAND_QUEUE_SIZE: usize = 64 * 1024; // 64 KB

pub const TELEMETRY_OFFSET: usize = 0x010400;
pub const TELEMETRY_SIZE: usize = 16 * 1024; // 16 KB

pub const SNAPSHOT_BANK_OFFSET: usize = 0x014400;
pub const SNAPSHOT_SLOT_SIZE: usize = 4 * 1024 * 1024; // 4 MB per slot
pub const TOTAL_SHARED_MEMORY_SIZE: usize = SNAPSHOT_BANK_OFFSET + (SNAPSHOT_SLOT_SIZE * BUFFER_SLOTS); // 12,665,856 B

pub const MAX_ENTITIES_PER_SLOT: usize = SNAPSHOT_SLOT_SIZE / std::mem::size_of::<RenderEntityPacked>();

/// 32-Byte packed entity representation optimized for WebGPU instance buffer upload
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq, Pod, Zeroable)]
pub struct RenderEntityPacked {
    pub entity_id: u32,       // 0..3: Unique entity ID
    pub pos_x: f32,           // 4..7: World X coordinate
    pub pos_y: f32,           // 8..11: World Y coordinate
    pub rotation: f32,        // 12..15: Heading angle in radians
    pub sprite_index: u16,    // 16..17: Texture atlas sprite ID
    pub anim_frame: u8,       // 18: Current animation frame
    pub status_flags: u8,     // 19: Bitflags (Suppressed, Handcuffed, Fighting, InSolitary)
    pub tint_rgba: u32,       // 20..23: Packed RGBA8 color overlay
    pub elevation_layer: i8,  // 24: -1=Tunnel, 0=Ground, 1=Upper/Roof
    pub _padding: [u8; 7],    // 25..31: 32-byte WebGPU alignment padding
}

/// Control header placed at the beginning of the SharedArrayBuffer (0x000000)
#[repr(C)]
pub struct AtomicControlBlock {
    pub magic: AtomicU32,             // 0x50524953 ("PRIS")
    pub version: AtomicU32,           // Protocol version
    pub sim_tick: AtomicU32,          // Monotonically increasing simulation tick
    pub sim_time_ms: AtomicU32,       // Accumulated sim elapsed time
    pub read_slot: AtomicU32,         // Index currently read by render thread (0..2)
    pub write_slot: AtomicU32,        // Index currently written by sim worker (0..2)
    pub clean_slot: AtomicU32,        // Index of most recent complete snapshot (0..2)
    pub input_head: AtomicU32,        // SPSC circular queue head (written by main)
    pub input_tail: AtomicU32,        // SPSC circular queue tail (read by worker)
    pub danger_level: AtomicU32,      // Scaled by 1000 (0..100,000)
    pub bank_balance: AtomicU32,      // Stored as integer cents
    pub prisoner_count: AtomicU32,    // Current active prisoners
    pub guard_count: AtomicU32,       // Current active guards
}

impl Default for AtomicControlBlock {
    fn default() -> Self {
        Self {
            magic: AtomicU32::new(MAGIC_PRIS),
            version: AtomicU32::new(PROTOCOL_VERSION),
            sim_tick: AtomicU32::new(0),
            sim_time_ms: AtomicU32::new(0),
            read_slot: AtomicU32::new(0),
            write_slot: AtomicU32::new(1),
            clean_slot: AtomicU32::new(0),
            input_head: AtomicU32::new(0),
            input_tail: AtomicU32::new(0),
            danger_level: AtomicU32::new(0),
            bank_balance: AtomicU32::new(4000000), // Default $40,000.00
            prisoner_count: AtomicU32::new(0),
            guard_count: AtomicU32::new(0),
        }
    }
}

pub fn validate_memory_layout() -> bool {
    assert_eq!(std::mem::size_of::<RenderEntityPacked>(), 32);
    assert_eq!(std::mem::align_of::<RenderEntityPacked>(), 4);
    assert!(std::mem::size_of::<AtomicControlBlock>() <= HEADER_SIZE);
    assert_eq!(MAX_ENTITIES_PER_SLOT, 131_072);
    true
}

// ==========================================
// WASM EXPORTS FOR TYPESCRIPT INITIALIZATION
// ==========================================

#[wasm_bindgen]
pub fn get_total_shared_memory_size() -> usize {
    TOTAL_SHARED_MEMORY_SIZE
}

#[wasm_bindgen]
pub fn get_header_offset() -> usize {
    HEADER_OFFSET
}

#[wasm_bindgen]
pub fn get_command_queue_offset() -> usize {
    COMMAND_QUEUE_OFFSET
}

#[wasm_bindgen]
pub fn get_telemetry_offset() -> usize {
    TELEMETRY_OFFSET
}

#[wasm_bindgen]
pub fn get_snapshot_slot_offset(slot_index: usize) -> usize {
    assert!(slot_index < BUFFER_SLOTS, "Slot index out of bounds");
    SNAPSHOT_BANK_OFFSET + (slot_index * SNAPSHOT_SLOT_SIZE)
}

#[wasm_bindgen]
pub fn get_max_entities_per_slot() -> usize {
    MAX_ENTITIES_PER_SLOT
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::Ordering;

    #[test]
    fn test_render_entity_packed_size_and_alignment() {
        assert_eq!(
            std::mem::size_of::<RenderEntityPacked>(),
            32,
            "RenderEntityPacked must be exactly 32 bytes for WebGPU instanced buffer alignment"
        );
        assert_eq!(
            std::mem::align_of::<RenderEntityPacked>(),
            4,
            "RenderEntityPacked alignment must be 4 bytes"
        );
    }

    #[test]
    fn test_memory_layout_partition_bounds() {
        assert_eq!(HEADER_OFFSET, 0);
        assert_eq!(HEADER_OFFSET + HEADER_SIZE, COMMAND_QUEUE_OFFSET);
        assert_eq!(COMMAND_QUEUE_OFFSET + COMMAND_QUEUE_SIZE, TELEMETRY_OFFSET);
        assert_eq!(TELEMETRY_OFFSET + TELEMETRY_SIZE, SNAPSHOT_BANK_OFFSET);
        assert_eq!(
            SNAPSHOT_BANK_OFFSET + (SNAPSHOT_SLOT_SIZE * BUFFER_SLOTS),
            TOTAL_SHARED_MEMORY_SIZE
        );
        assert!(validate_memory_layout());
    }

    #[test]
    fn test_atomic_control_block_initialization() {
        let ctrl = AtomicControlBlock::default();
        assert_eq!(ctrl.magic.load(Ordering::SeqCst), MAGIC_PRIS);
        assert_eq!(ctrl.version.load(Ordering::SeqCst), PROTOCOL_VERSION);
        assert_eq!(ctrl.read_slot.load(Ordering::SeqCst), 0);
        assert_eq!(ctrl.write_slot.load(Ordering::SeqCst), 1);
        assert_eq!(ctrl.clean_slot.load(Ordering::SeqCst), 0);
        assert_eq!(ctrl.bank_balance.load(Ordering::SeqCst), 4_000_000); // $40k
    }
}
