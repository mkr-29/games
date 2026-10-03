/**
 * Domain 02: World Grid, Construction & Utilities
 * Feature 04: Room Zoning, Enclosure Detection & Dynamic Cell Quality Grading (Task 3.4)
 */

import { OBJECT_TYPES, type EnclosureScanResult, type RoomValidationStatus } from './RoomEnclosureManager.ts';

export interface CellQualityBreakdown {
  isValid: boolean;
  areaTiles: number;
  areaScore: number;
  hasExteriorWindow: boolean;
  hasTv: boolean;
  hasRadio: boolean;
  hasBookshelf: boolean;
  hasDeskAndChair: boolean;
  hasShower: boolean;
  totalScore: number;
}

export interface EvaluateCellQualityParams {
  isValidCell: boolean;
  areaTiles: number;
  placedObjects: Map<number, number> | Record<number, number>;
  hasExteriorWindow?: boolean;
}

/**
 * Evaluates the dynamic quality grade (0 to 10) for a validated prison cell.
 *
 * Scoring Rules:
 * - Base valid cell (Bed, Toilet, enclosed, min 6m²): 1 point
 * - Area >= 9m² (e.g. 3x3): +1 point
 * - Area >= 16m² (e.g. 4x4): +2 points (replaces the 9m² bonus)
 * - Window with outdoor sightline: +1 point
 * - Television (TV): +1 point
 * - Radio: +1 point
 * - Bookshelf: +1 point
 * - Desk AND Chair: +1 point
 * - In-cell Shower: +1 point
 *
 * Total score is clamped to 0..10.
 */
export function evaluateCellQuality(params: EvaluateCellQualityParams): CellQualityBreakdown {
  const { isValidCell, areaTiles, placedObjects, hasExteriorWindow = false } = params;

  if (!isValidCell) {
    return {
      isValid: false,
      areaTiles,
      areaScore: 0,
      hasExteriorWindow: false,
      hasTv: false,
      hasRadio: false,
      hasBookshelf: false,
      hasDeskAndChair: false,
      hasShower: false,
      totalScore: 0,
    };
  }

  const getCount = (objId: number): number => {
    if (placedObjects instanceof Map) {
      return placedObjects.get(objId) ?? 0;
    }
    return (placedObjects as Record<number, number>)[objId] ?? 0;
  };

  let score = 1; // Base valid cell = 1

  // Area scoring
  let areaScore = 0;
  if (areaTiles >= 16) {
    score += 2;
    areaScore = 2;
  } else if (areaTiles >= 9) {
    score += 1;
    areaScore = 1;
  }

  // Window
  const windowCount = getCount(OBJECT_TYPES.WINDOW);
  const windowPresent = hasExteriorWindow || windowCount > 0;
  if (windowPresent) {
    score += 1;
  }

  // TV
  const hasTv = getCount(OBJECT_TYPES.TV) > 0;
  if (hasTv) {
    score += 1;
  }

  // Radio
  const hasRadio = getCount(OBJECT_TYPES.RADIO) > 0;
  if (hasRadio) {
    score += 1;
  }

  // Bookshelf
  const hasBookshelf = getCount(OBJECT_TYPES.BOOKSHELF) > 0;
  if (hasBookshelf) {
    score += 1;
  }

  // Desk AND Chair
  const hasDesk = getCount(OBJECT_TYPES.DESK) > 0;
  const hasChair = getCount(OBJECT_TYPES.CHAIR) > 0;
  const hasDeskAndChair = hasDesk && hasChair;
  if (hasDeskAndChair) {
    score += 1;
  }

  // Shower
  const hasShower = getCount(OBJECT_TYPES.SHOWER) > 0;
  if (hasShower) {
    score += 1;
  }

  const totalScore = Math.min(10, score);

  return {
    isValid: true,
    areaTiles,
    areaScore,
    hasExteriorWindow: windowPresent,
    hasTv,
    hasRadio,
    hasBookshelf,
    hasDeskAndChair,
    hasShower,
    totalScore,
  };
}

/**
 * Evaluates cell quality from a room scan result and validation status.
 */
export function evaluateCellQualityFromScan(
  roomType: string,
  validation: RoomValidationStatus,
  scan: EnclosureScanResult,
  hasExteriorWindow = false
): CellQualityBreakdown {
  if (roomType !== 'cell' || validation.kind !== 'valid') {
    return {
      isValid: false,
      areaTiles: scan.tiles.length,
      areaScore: 0,
      hasExteriorWindow: false,
      hasTv: false,
      hasRadio: false,
      hasBookshelf: false,
      hasDeskAndChair: false,
      hasShower: false,
      totalScore: 0,
    };
  }

  return evaluateCellQuality({
    isValidCell: true,
    areaTiles: scan.tiles.length,
    placedObjects: scan.placedObjects,
    hasExteriorWindow,
  });
}
