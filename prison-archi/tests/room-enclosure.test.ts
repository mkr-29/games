import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RoomEnclosureManager,
  OBJECT_TYPES,
  ROOM_REGISTRY,
} from '../src/lib/rooms/RoomEnclosureManager.ts';

describe('Task 3.3: Connected-Components Room Enclosure Detection & Validation', () => {
  it('should verify ROOM_REGISTRY requirements match official specification', () => {
    assert.equal(ROOM_REGISTRY.cell.minAreaTiles, 6);
    assert.equal(ROOM_REGISTRY.cell.mustBeIndoors, true);
    assert.equal(ROOM_REGISTRY.cell.requiredObjects.length, 2);

    assert.equal(ROOM_REGISTRY.canteen.minAreaTiles, 16);
    assert.equal(ROOM_REGISTRY.canteen.mustBeIndoors, true);

    assert.equal(ROOM_REGISTRY.yard.minAreaTiles, 36);
    assert.equal(ROOM_REGISTRY.yard.mustBeIndoors, false);

    assert.equal(ROOM_REGISTRY.solitary.minAreaTiles, 1);
    assert.equal(ROOM_REGISTRY.solitary.mustBeIndoors, true);
  });

  it('Verification Criterion 1: Build a 2x3 walled room with a door, zoned as Cell. Place Bed and Toilet. Assert room status is VALID / ACTIVE', () => {
    const manager = new RoomEnclosureManager(32, 32);

    // 2x3 interior cell: x in 5..=6, y in 5..=7 (6 tiles)
    // Perimeter walls: x in 4..=7, y in 4..=8
    for (let x = 4; x <= 7; x++) {
      for (let y = 4; y <= 8; y++) {
        if (x === 4 || x === 7 || y === 4 || y === 8) {
          manager.setWall(x, y, 1); // Brick wall
        } else {
          manager.setIndoor(x, y, true);
          manager.setZone(x, y, 'cell');
        }
      }
    }

    // Door at (5, 8)
    manager.setWall(5, 8, 0); // Open doorway
    manager.setIndoor(5, 8, true);
    manager.placeObject(5, 8, OBJECT_TYPES.JAIL_DOOR);

    // Bed and Toilet
    manager.placeObject(5, 5, OBJECT_TYPES.BED);
    manager.placeObject(6, 7, OBJECT_TYPES.TOILET);

    manager.scanAndValidateAll();

    assert.equal(manager.rooms.length, 1);
    const cell = manager.rooms[0];
    assert.equal(cell.type, 'cell');
    assert.equal(cell.area, 6);
    assert.equal(cell.status.kind, 'valid');

    const telemetry = manager.getTelemetry();
    assert.equal(telemetry.totalRooms, 1);
    assert.equal(telemetry.validRooms, 1);
    assert.equal(telemetry.invalidRooms, 0);
    assert.equal(telemetry.cellCount, 1);
    assert.equal(telemetry.validCellCount, 1);
  });

  it('Verification Criterion 2: Demolish one wall tile to create an opening. Assert room status transitions to LEAKING / UNENCLOSED', () => {
    const manager = new RoomEnclosureManager(32, 32);

    // Build 2x3 walled room
    for (let x = 4; x <= 7; x++) {
      for (let y = 4; y <= 8; y++) {
        if (x === 4 || x === 7 || y === 4 || y === 8) {
          manager.setWall(x, y, 1);
        } else {
          manager.setIndoor(x, y, true);
          manager.setZone(x, y, 'cell');
        }
      }
    }

    // Door at (5, 8)
    manager.setWall(5, 8, 0);
    manager.setIndoor(5, 8, true);
    manager.placeObject(5, 8, OBJECT_TYPES.JAIL_DOOR);

    // Bed and Toilet
    manager.placeObject(5, 5, OBJECT_TYPES.BED);
    manager.placeObject(6, 7, OBJECT_TYPES.TOILET);

    // Demolish wall tile at (7, 6)
    manager.setWall(7, 6, 0);

    manager.scanAndValidateAll();

    assert.equal(manager.rooms.length, 1);
    const cell = manager.rooms[0];
    assert.equal(cell.status.kind, 'unenclosed');
    if (cell.status.kind === 'unenclosed') {
      assert.equal(cell.status.leakX, 7);
      assert.equal(cell.status.leakY, 6);
    }
  });

  it('Verification Criterion 3: Remove the toilet. Assert room status displays MISSING_OBJECT: Toilet', () => {
    const manager = new RoomEnclosureManager(32, 32);

    // Build 2x3 walled room
    for (let x = 4; x <= 7; x++) {
      for (let y = 4; y <= 8; y++) {
        if (x === 4 || x === 7 || y === 4 || y === 8) {
          manager.setWall(x, y, 1);
        } else {
          manager.setIndoor(x, y, true);
          manager.setZone(x, y, 'cell');
        }
      }
    }

    // Door at (5, 8)
    manager.setWall(5, 8, 0);
    manager.setIndoor(5, 8, true);
    manager.placeObject(5, 8, OBJECT_TYPES.JAIL_DOOR);

    // Place Bed only (Toilet missing)
    manager.placeObject(5, 5, OBJECT_TYPES.BED);

    manager.scanAndValidateAll();

    assert.equal(manager.rooms.length, 1);
    const cell = manager.rooms[0];
    assert.equal(cell.status.kind, 'missing_props');
    if (cell.status.kind === 'missing_props') {
      assert.equal(cell.status.missingObjectId, OBJECT_TYPES.TOILET);
      assert.equal(cell.status.requiredCount, 1);
      assert.equal(cell.status.currentCount, 0);
    }
  });

  it('should validate Canteen with serving table, table, and bench requirements', () => {
    const manager = new RoomEnclosureManager(32, 32);

    // 4x4 canteen interior: x in 10..=13, y in 10..=13 (16 tiles)
    for (let x = 9; x <= 14; x++) {
      for (let y = 9; y <= 14; y++) {
        if (x === 9 || x === 14 || y === 9 || y === 14) {
          manager.setWall(x, y, 1);
        } else {
          manager.setIndoor(x, y, true);
          manager.setZone(x, y, 'canteen');
        }
      }
    }

    // Door at (10, 14)
    manager.setWall(10, 14, 0);
    manager.placeObject(10, 14, OBJECT_TYPES.STAFF_DOOR);

    // Required objects
    manager.placeObject(10, 10, OBJECT_TYPES.SERVING_TABLE);
    manager.placeObject(11, 11, OBJECT_TYPES.TABLE);
    manager.placeObject(12, 11, OBJECT_TYPES.BENCH);

    manager.scanAndValidateAll();

    assert.equal(manager.rooms.length, 1);
    const canteen = manager.rooms[0];
    assert.equal(canteen.type, 'canteen');
    assert.equal(canteen.area, 16);
    assert.equal(canteen.status.kind, 'valid');
  });
});
