use bytemuck::{Pod, Zeroable};
use std::sync::atomic::Ordering;
use wasm_bindgen::prelude::*;

use super::layout::{AtomicControlBlock, BUFFER_SLOTS};

/// Maximum circular queue elements that comfortably fit in the 64 KB partition (2048 * 20B = 40,960B <= 65,536B)
pub const COMMAND_QUEUE_CAPACITY: u32 = 2048;

/// 20-byte packed user command packet for SPSC input queue
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Pod, Zeroable)]
pub struct UserCommandPacket {
    pub command_type: u16,    // 1=PlaceWall, 2=ZoneRoom, 3=AssignGuard, 4=Lockdown...
    pub flags: u16,           // Shift-drag, immediate, cancel
    pub target_tile_x: u16,   // Target tile grid X
    pub target_tile_y: u16,   // Target tile grid Y
    pub width: u16,           // Placement drag width
    pub height: u16,          // Placement drag height
    pub payload_param: u32,   // RoomType enum / Material ID / Entity ID
    pub timestamp_ms: u32,    // Client dispatch timestamp
}

// ==========================================
// TRIPLE-BUFFER STATE SYNCHRONIZATION
// ==========================================

/// Producer (Simulation Worker): Commits the currently written snapshot slot.
/// 
/// 1. Swaps `active_slot` into `clean_slot` with Release ordering.
/// 2. Sets `write_slot` to the previous `clean_slot`, guaranteeing the worker never
///    writes into the slot currently held by the render thread.
/// 3. Increments `sim_tick` with Release ordering.
/// 
/// Returns the next available slot for writing.
pub fn commit_simulation_snapshot(ctrl: &AtomicControlBlock, active_slot: u32) -> u32 {
    assert!(
        (active_slot as usize) < BUFFER_SLOTS,
        "active_slot index exceeds BUFFER_SLOTS"
    );

    // Atomically publish active_slot as clean
    let previous_clean = ctrl.clean_slot.swap(active_slot, Ordering::Release);

    // Next writing slot will be whatever was previously clean
    ctrl.write_slot.store(previous_clean, Ordering::Relaxed);

    // Increment simulation tick
    ctrl.sim_tick.fetch_add(1, Ordering::Release);

    previous_clean
}

/// Consumer (Render / Main Thread): Samples the newest simulation snapshot.
/// 
/// If `sim_tick` has advanced beyond `last_sampled_tick`, atomically swaps `current_read_slot`
/// with `clean_slot`, updates `read_slot` in the control block, and returns true.
/// Otherwise, returns false indicating no new snapshot has been committed yet.
pub fn acquire_render_snapshot(
    ctrl: &AtomicControlBlock,
    current_read_slot: &mut u32,
    last_sampled_tick: &mut u32,
) -> bool {
    let tick = ctrl.sim_tick.load(Ordering::Acquire);

    if tick > *last_sampled_tick {
        *last_sampled_tick = tick;
        let new_read = ctrl.clean_slot.swap(*current_read_slot, Ordering::AcqRel);
        *current_read_slot = new_read;
        ctrl.read_slot.store(new_read, Ordering::Release);
        true
    } else {
        false
    }
}

// ==========================================
// SPSC CIRCULAR INPUT QUEUE
// ==========================================

/// Single-Producer (Main Thread): Pushes a command into the circular ring buffer.
/// Returns `true` if queued successfully, or `false` if the queue is full.
pub fn push_user_command(
    ctrl: &AtomicControlBlock,
    queue_slice: &mut [UserCommandPacket],
    cmd: UserCommandPacket,
) -> bool {
    let head = ctrl.input_head.load(Ordering::Relaxed);
    let tail = ctrl.input_tail.load(Ordering::Acquire);

    // Check if circular buffer is full (leave 1 empty slot to distinguish full from empty)
    let next_head = (head + 1) % COMMAND_QUEUE_CAPACITY;
    if next_head == tail {
        return false; // Queue full
    }

    let index = (head % COMMAND_QUEUE_CAPACITY) as usize;
    if index < queue_slice.len() {
        queue_slice[index] = cmd;
        ctrl.input_head.store(next_head, Ordering::Release);
        true
    } else {
        false
    }
}

/// Single-Consumer (Simulation Worker): Pops a command from the circular ring buffer.
/// Returns `Some(UserCommandPacket)` or `None` if the queue is empty.
pub fn pop_user_command(
    ctrl: &AtomicControlBlock,
    queue_slice: &[UserCommandPacket],
) -> Option<UserCommandPacket> {
    let tail = ctrl.input_tail.load(Ordering::Relaxed);
    let head = ctrl.input_head.load(Ordering::Acquire);

    if tail == head {
        return None; // Queue empty
    }

    let index = (tail % COMMAND_QUEUE_CAPACITY) as usize;
    if index < queue_slice.len() {
        let cmd = queue_slice[index];
        let next_tail = (tail + 1) % COMMAND_QUEUE_CAPACITY;
        ctrl.input_tail.store(next_tail, Ordering::Release);
        Some(cmd)
    } else {
        None
    }
}

/// Drains all currently queued commands, executing the callback for each in FIFO order.
/// Returns the number of commands consumed.
pub fn drain_user_commands<F: FnMut(UserCommandPacket)>(
    ctrl: &AtomicControlBlock,
    queue_slice: &[UserCommandPacket],
    mut handler: F,
) -> usize {
    let mut count = 0;
    while let Some(cmd) = pop_user_command(ctrl, queue_slice) {
        handler(cmd);
        count += 1;
    }
    count
}

// ==========================================
// WASM EXPORTS FOR WORKER SCRIPT
// ==========================================

#[wasm_bindgen]
pub fn get_command_packet_byte_size() -> usize {
    std::mem::size_of::<UserCommandPacket>()
}

#[wasm_bindgen]
pub fn get_command_queue_capacity() -> u32 {
    COMMAND_QUEUE_CAPACITY
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::memory::layout::COMMAND_QUEUE_SIZE;

    #[test]
    fn test_user_command_packet_size_and_alignment() {
        assert_eq!(
            std::mem::size_of::<UserCommandPacket>(),
            20,
            "UserCommandPacket must be exactly 20 bytes"
        );
        assert_eq!(
            std::mem::align_of::<UserCommandPacket>(),
            4,
            "UserCommandPacket must have 4-byte alignment"
        );
        assert!(
            (COMMAND_QUEUE_CAPACITY as usize) * std::mem::size_of::<UserCommandPacket>()
                <= COMMAND_QUEUE_SIZE,
            "Queue buffer must fit inside COMMAND_QUEUE_SIZE partition"
        );
    }

    #[test]
    fn test_triple_buffer_commit_and_acquire_invariants() {
        let ctrl = AtomicControlBlock::default();
        let mut render_read_slot = 0u32;
        let mut last_sampled_tick = 0u32;
        let mut active_write_slot = 1u32;

        for tick in 1..=1000 {
            // Producer commits active_write_slot
            let next_write = commit_simulation_snapshot(&ctrl, active_write_slot);

            // Invariant 1: sim_tick increments monotonically
            assert_eq!(ctrl.sim_tick.load(Ordering::SeqCst), tick);

            // Invariant 2: active write slot must NEVER equal current render read slot
            assert_ne!(
                next_write,
                ctrl.read_slot.load(Ordering::SeqCst),
                "Write slot must not collide with active read slot"
            );

            // Consumer samples snapshot
            let new_frame = acquire_render_snapshot(&ctrl, &mut render_read_slot, &mut last_sampled_tick);
            assert!(new_frame, "Consumer must observe new snapshot on tick {}", tick);
            assert_eq!(render_read_slot, active_write_slot);

            // Invariant 3: After consumer swap, active write slot must still never equal render read slot
            assert_ne!(
                next_write,
                render_read_slot,
                "Write slot must not collide with new render read slot"
            );

            // Second consumer query before next tick returns false (no stale duplicate swap)
            let stale_frame = acquire_render_snapshot(&ctrl, &mut render_read_slot, &mut last_sampled_tick);
            assert!(!stale_frame);

            active_write_slot = next_write;
        }
    }

    #[test]
    fn test_spsc_queue_fifo_order_and_wraparound() {
        let ctrl = AtomicControlBlock::default();
        let mut buffer = vec![UserCommandPacket::default(); COMMAND_QUEUE_CAPACITY as usize];

        // 1. Enqueue 150 commands
        for i in 0..150 {
            let cmd = UserCommandPacket {
                command_type: (i % 5 + 1) as u16,
                flags: 0,
                target_tile_x: (i * 2) as u16,
                target_tile_y: (i * 3) as u16,
                width: 1,
                height: 1,
                payload_param: (1000 + i) as u32,
                timestamp_ms: (i * 16) as u32,
            };
            assert!(push_user_command(&ctrl, &mut buffer, cmd));
        }

        // 2. Drain 100 commands and verify FIFO ordering
        for i in 0..100 {
            let popped = pop_user_command(&ctrl, &buffer);
            assert!(popped.is_some());
            let cmd = popped.unwrap();
            assert_eq!(cmd.command_type, (i % 5 + 1) as u16);
            assert_eq!(cmd.target_tile_x, (i * 2) as u16);
            assert_eq!(cmd.target_tile_y, (i * 3) as u16);
            assert_eq!(cmd.payload_param, (1000 + i) as u32);
        }

        // 3. Queue remaining 50 should still be intact
        // Enqueue another 100 to exercise circular wraparound
        for i in 150..250 {
            let cmd = UserCommandPacket {
                command_type: (i % 5 + 1) as u16,
                flags: 0,
                target_tile_x: (i * 2) as u16,
                target_tile_y: (i * 3) as u16,
                width: 1,
                height: 1,
                payload_param: (1000 + i) as u32,
                timestamp_ms: (i * 16) as u32,
            };
            assert!(push_user_command(&ctrl, &mut buffer, cmd));
        }

        // 4. Drain all remaining 150 commands (50 old + 100 new)
        let mut consumed_ids = Vec::new();
        let count = drain_user_commands(&ctrl, &buffer, |cmd| {
            consumed_ids.push(cmd.payload_param);
        });

        assert_eq!(count, 150);
        assert_eq!(consumed_ids.len(), 150);
        for (idx, &id) in consumed_ids.iter().enumerate() {
            let expected_id = (1000 + 100 + idx) as u32;
            assert_eq!(id, expected_id, "Commands must be strictly FIFO");
        }

        // 5. Buffer should now be empty
        assert!(pop_user_command(&ctrl, &buffer).is_none());
    }
}
