# Domain 07: Platform, Persistence & Extensibility
## Feature Specification 01: Save/Load System, OPFS Persistence & Binary Serialization

---

## 1. System Overview & The Web Storage Challenge

Traditional web storage solutions fail when applied to complex simulation games:
* **`localStorage`:** Hardcapped at $5\text{ MB}$, completely insufficient for maps containing hundreds of thousands of tiles and entities.
* **`IndexedDB` (JSON):** Stringifying 10,000 entities into JSON takes hundreds of milliseconds, freezing the browser and generating bloated $50\text{ MB}+$ files.

*Prison Architect Web* implements a **High-Performance Persistence Pipeline**:
1. **Zero-Copy Binary Serialization (`rkyv` / `bincode`):** Serializes memory structs into compact byte arrays in under **10 milliseconds**.
2. **Zstandard (Zstd) Compression:** Compresses raw simulation dumps by **$85\%$**, shrinking a 20 MB memory state into a **2–4 MB file**.
3. **Origin Private File System (OPFS):** Uses sandboxed high-speed disk I/O (`FileSystemSyncAccessHandle`) inside the Web Worker, enabling instant auto-saves without dropping a single frame on the render thread.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SIMULATION WORKER MEMORY STATE                       │
│  - Tilemap Buffer (3 MB)                                               │
│  - ECS Entity Components: Needs, Positions, Inventories (8 MB)         │
│  - Financial Ledgers, Grants DAG, Bureaucracy Tree (0.5 MB)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ bincode / rkyv serialization (< 10 ms)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    RAW BINARY SNAPSHOT (11.5 MB)                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Zstandard (Zstd) Level 3 (< 15 ms)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   COMPRESSED SAVE ARCHIVE (2.1 MB)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ OPFS FileSystemSyncAccessHandle.write()
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                BROWSER OPFS STORAGE (`/saves/prison_01.dat`)           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Save File Binary Header & Architecture

Every `.prison` save file is formatted with a strict 64-byte binary header:

```rust
#[repr(C)]
#[derive(Clone, Copy)]
pub struct SaveFileHeader {
    pub magic: [u8; 4],           // b"PRIS"
    pub format_version: u32,      // Current = 1
    pub timestamp_epoch_sec: u64, // Real-world save timestamp
    pub in_game_day: u32,
    pub in_game_hour: u8,
    pub in_game_minute: u8,
    pub prisoner_count: u32,
    pub guard_count: u32,
    pub map_width_tiles: u16,
    pub map_height_tiles: u16,
    pub uncompressed_length: u32,
    pub checksum_crc32: u32,      // Data integrity verification
    pub _reserved: [u8; 26],      // Alignment padding
}
```

---

## 3. Serialization Implementation (Rust + Bincode)

```rust
use bincode::{serialize, deserialize};
use zstd::stream::{encode_all, decode_all};

#[derive(Serialize, Deserialize)]
pub struct WorldSaveSnapshot {
    pub header: SaveFileHeader,
    pub tiles: Vec<TileCellDescriptor>,
    pub subterranean_grid: Vec<FluidPipeCell>,
    pub power_stations: Vec<PowerStationSaveData>,
    pub rooms: Vec<RoomSaveData>,
    pub prisoners: Vec<PrisonerSaveData>,
    pub staff: Vec<StaffSaveData>,
    pub bureaucracy_tree: Vec<ResearchSaveData>,
    pub financial_ledger: FinancialSaveData,
    pub grants: Vec<GrantSaveData>,
}

pub fn save_world_to_bytes(snapshot: &WorldSaveSnapshot) -> Result<Vec<u8>, SaveError> {
    // 1. Serialize into binary stream
    let raw_bytes = serialize(snapshot).map_err(|_| SaveError::SerializationFailed)?;

    // 2. Compress via Zstandard (Level 3 provides optimal speed/ratio balance)
    let compressed_bytes = encode_all(&raw_bytes[..], 3).map_err(|_| SaveError::CompressionFailed)?;

    Ok(compressed_bytes)
}

pub fn load_world_from_bytes(bytes: &[u8]) -> Result<WorldSaveSnapshot, SaveError> {
    // 1. Decompress
    let raw_bytes = decode_all(bytes).map_err(|_| SaveError::DecompressionFailed)?;

    // 2. Deserialize into memory structs
    let snapshot: WorldSaveSnapshot = deserialize(&raw_bytes).map_err(|_| SaveError::DeserializationFailed)?;

    Ok(snapshot)
}
```

---

## 4. Origin Private File System (OPFS) Worker I/O

Inside the Web Worker, files are read and written synchronously with zero main-thread blocking:

```typescript
// worker_storage.ts
export async function writeSaveFileToOPFS(filename: string, compressedData: Uint8Array) {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(filename, { create: true });
  
  // High-speed synchronous access handle (Web Worker only)
  const accessHandle = await (fileHandle as any).createSyncAccessHandle();
  
  accessHandle.truncate(0); // Clear old contents
  accessHandle.write(compressedData, { at: 0 });
  accessHandle.flush();
  accessHandle.close();
}

export async function readSaveFileFromOPFS(filename: string): Promise<Uint8Array> {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(filename);
  const file = await fileHandle.getFile();
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
```

---

## 5. Background Rolling Auto-Saves

To prevent loss of progress without interrupting gameplay:
* **The 10-Minute Cadence:** Every 10 real-world minutes, the simulation worker pauses entity updates for **$\le 5$ milliseconds** to clone active component tables into a background serialization thread.
* **Rolling Slots:** The game maintains 3 rolling auto-save slots:
  * `autosave_slot_1.dat`
  * `autosave_slot_2.dat`
  * `autosave_slot_3.dat`
* If power is lost or the browser tab crashes mid-write, the previous slot remains completely uncorrupted.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Save File Version Mismatch** | Loading a save file created in v1.0 into an updated v1.2 game engine. | Migration Pipeline: Header checks `format_version`. Sequential migration functions run on deserialized data before spawning ECS entities. |
| **Browser Storage Eviction** | Browser clears storage under low disk space pressure. | Persistent Storage Permission: Request `navigator.storage.persist()`. When granted, browser treats OPFS as critical user data and never evicts it. |
| **Disk Write Quota Exceeded** | User attempts to save on a completely full hard drive. | Pre-flight Space Verification: Check `navigator.storage.estimate()` before initiating write. If remaining space $< 10\text{ MB}$, alert player. |
