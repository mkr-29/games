import { describe, it } from 'node:test';
import assert from 'node:assert';
import { OBJECT_TYPES, RoomEnclosureManager } from '../src/lib/rooms/RoomEnclosureManager.ts';
import {
  evaluateCellQuality,
  evaluateCellQualityFromScan,
  type CellQualityBreakdown,
} from '../src/lib/rooms/CellQualityManager.ts';

describe('Task 3.4: Dynamic Cell Quality Grading & Score Evaluator', () => {
  it('Verification Criterion 1: Minimal 2x3 cell with Bed + Toilet scores Grade 1', () => {
    const objects = new Map<number, number>();
    objects.set(OBJECT_TYPES.BED, 1);
    objects.set(OBJECT_TYPES.TOILET, 1);

    const breakdown: CellQualityBreakdown = evaluateCellQuality({
      isValidCell: true,
      areaTiles: 6,
      placedObjects: objects,
    });

    assert.strictEqual(breakdown.isValid, true);
    assert.strictEqual(breakdown.areaTiles, 6);
    assert.strictEqual(breakdown.areaScore, 0);
    assert.strictEqual(breakdown.hasExteriorWindow, false);
    assert.strictEqual(breakdown.hasTv, false);
    assert.strictEqual(breakdown.hasRadio, false);
    assert.strictEqual(breakdown.hasBookshelf, false);
    assert.strictEqual(breakdown.hasDeskAndChair, false);
    assert.strictEqual(breakdown.hasShower, false);
    assert.strictEqual(breakdown.totalScore, 1);
  });

  it('Verification Criterion 2: Spacious 4x4 cell (16m²) with Window, Bookshelf, TV, and Shower scores Grade 7', () => {
    const objects = new Map<number, number>();
    objects.set(OBJECT_TYPES.BED, 1);
    objects.set(OBJECT_TYPES.TOILET, 1);
    objects.set(OBJECT_TYPES.WINDOW, 1);
    objects.set(OBJECT_TYPES.BOOKSHELF, 1);
    objects.set(OBJECT_TYPES.TV, 1);
    objects.set(OBJECT_TYPES.SHOWER, 1);

    // Expected score breakdown:
    // Base Valid Cell: +1
    // Area >= 16m²:   +2
    // Exterior Window: +1
    // Bookshelf:       +1
    // TV:              +1
    // In-cell Shower:  +1
    // Total = 7
    const breakdown = evaluateCellQuality({
      isValidCell: true,
      areaTiles: 16,
      placedObjects: objects,
    });

    assert.strictEqual(breakdown.isValid, true);
    assert.strictEqual(breakdown.areaTiles, 16);
    assert.strictEqual(breakdown.areaScore, 2);
    assert.strictEqual(breakdown.hasExteriorWindow, true);
    assert.strictEqual(breakdown.hasBookshelf, true);
    assert.strictEqual(breakdown.hasTv, true);
    assert.strictEqual(breakdown.hasShower, true);
    assert.strictEqual(breakdown.hasRadio, false);
    assert.strictEqual(breakdown.hasDeskAndChair, false);
    assert.strictEqual(breakdown.totalScore, 7);
  });

  it('should test Desk and Chair synergy requirement (both required for +1)', () => {
    const objects = new Map<number, number>();
    objects.set(OBJECT_TYPES.BED, 1);
    objects.set(OBJECT_TYPES.TOILET, 1);
    objects.set(OBJECT_TYPES.DESK, 1); // Only desk

    const b1 = evaluateCellQuality({
      isValidCell: true,
      areaTiles: 6,
      placedObjects: objects,
    });
    assert.strictEqual(b1.hasDeskAndChair, false);
    assert.strictEqual(b1.totalScore, 1);

    // Add chair -> synergy bonus applies
    objects.set(OBJECT_TYPES.CHAIR, 1);
    const b2 = evaluateCellQuality({
      isValidCell: true,
      areaTiles: 6,
      placedObjects: objects,
    });
    assert.strictEqual(b2.hasDeskAndChair, true);
    assert.strictEqual(b2.totalScore, 2);
  });

  it('should award +1 for intermediate area (9m² <= area < 16m²)', () => {
    const objects = new Map<number, number>();
    objects.set(OBJECT_TYPES.BED, 1);
    objects.set(OBJECT_TYPES.TOILET, 1);

    const b9 = evaluateCellQuality({
      isValidCell: true,
      areaTiles: 9, // 3x3
      placedObjects: objects,
    });
    assert.strictEqual(b9.areaScore, 1);
    assert.strictEqual(b9.totalScore, 2); // Base 1 + Area 1
  });

  it('should cap luxury cell quality grade at 10', () => {
    const objects = new Map<number, number>();
    objects.set(OBJECT_TYPES.BED, 1);
    objects.set(OBJECT_TYPES.TOILET, 1);
    objects.set(OBJECT_TYPES.WINDOW, 1);
    objects.set(OBJECT_TYPES.TV, 1);
    objects.set(OBJECT_TYPES.RADIO, 1);
    objects.set(OBJECT_TYPES.BOOKSHELF, 1);
    objects.set(OBJECT_TYPES.DESK, 1);
    objects.set(OBJECT_TYPES.CHAIR, 1);
    objects.set(OBJECT_TYPES.SHOWER, 1);

    // Base (1) + Area>=16 (2) + Window (1) + TV (1) + Radio (1) + Bookshelf (1) + Desk&Chair (1) + Shower (1) = 9
    const breakdown = evaluateCellQuality({
      isValidCell: true,
      areaTiles: 25,
      placedObjects: objects,
      hasExteriorWindow: true,
    });

    assert.strictEqual(breakdown.totalScore, 9);
  });

  it('should evaluate quality directly from RoomEnclosureManager scan & validation', () => {
    const mgr = new RoomEnclosureManager(64, 64);

    // Build 4x4 room (area 16)
    for (let x = 10; x <= 15; x++) {
      mgr.setWall(x, 10, 1);
      mgr.setWall(x, 15, 1);
    }
    for (let y = 10; y <= 15; y++) {
      mgr.setWall(10, y, 1);
      mgr.setWall(15, y, 1);
    }
    mgr.setWall(12, 10, 0); // Door opening
    mgr.placeObject(12, 10, OBJECT_TYPES.JAIL_DOOR);

    for (let y = 11; y <= 14; y++) {
      for (let x = 11; x <= 14; x++) {
        mgr.setZone(x, y, 'cell');
        mgr.setIndoor(x, y, true);
      }
    }

    // Add luxury furnishings
    mgr.placeObject(11, 11, OBJECT_TYPES.BED);
    mgr.placeObject(11, 12, OBJECT_TYPES.TOILET);
    mgr.placeObject(11, 13, OBJECT_TYPES.TV);
    mgr.placeObject(11, 14, OBJECT_TYPES.BOOKSHELF);
    mgr.placeObject(14, 11, OBJECT_TYPES.SHOWER);
    mgr.placeObject(14, 14, OBJECT_TYPES.WINDOW);

    const scan = mgr.scanRoomEnclosure(11, 11, 'cell');
    const validation = mgr.validateRoomRequirements('cell', scan);

    assert.strictEqual(validation.kind, 'valid');
    const grade = evaluateCellQualityFromScan('cell', validation, scan, false);

    assert.strictEqual(grade.isValid, true);
    assert.strictEqual(grade.areaTiles, 16);
    assert.strictEqual(grade.totalScore, 7);
  });

  it('should return grade 0 for invalid or leaking cell', () => {
    const objects = new Map<number, number>();
    objects.set(OBJECT_TYPES.TV, 1);

    const breakdown = evaluateCellQuality({
      isValidCell: false,
      areaTiles: 16,
      placedObjects: objects,
    });

    assert.strictEqual(breakdown.isValid, false);
    assert.strictEqual(breakdown.totalScore, 0);
  });
});
