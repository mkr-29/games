/**
 * Domain 02: World Grid, Construction & Utilities
 * Feature 04: Room Zoning, Enclosure Detection & Validation
 */

export type RoomType =
  | 'unzoned'
  | 'cell'
  | 'canteen'
  | 'kitchen'
  | 'yard'
  | 'solitary'
  | 'holding_cell';

export const OBJECT_TYPES = {
  NONE: 0,
  BED: 10,
  TOILET: 11,
  SERVING_TABLE: 20,
  TABLE: 21,
  BENCH: 22,
  COOKER: 30,
  FRIDGE: 31,
  SINK: 32,
  WINDOW: 40,
  TV: 41,
  RADIO: 42,
  BOOKSHELF: 43,
  DESK: 44,
  CHAIR: 45,
  SHOWER: 46,
  JAIL_DOOR: 100,
  WOODEN_DOOR: 101,
  STAFF_DOOR: 102,
} as const;

export function isDoorObject(objectId: number): boolean {
  return (
    objectId === OBJECT_TYPES.JAIL_DOOR ||
    objectId === OBJECT_TYPES.WOODEN_DOOR ||
    objectId === OBJECT_TYPES.STAFF_DOOR
  );
}

export interface RoomRequirementDef {
  type: RoomType;
  name: string;
  mustBeIndoors: boolean;
  minAreaTiles: number;
  minDimensionX: number;
  minDimensionY: number;
  requiredObjects: { objectId: number; count: number }[];
}

export const ROOM_REGISTRY: Record<RoomType, RoomRequirementDef> = {
  unzoned: {
    type: 'unzoned',
    name: 'Unzoned',
    mustBeIndoors: false,
    minAreaTiles: 0,
    minDimensionX: 0,
    minDimensionY: 0,
    requiredObjects: [],
  },
  cell: {
    type: 'cell',
    name: 'Cell',
    mustBeIndoors: true,
    minAreaTiles: 6,
    minDimensionX: 2,
    minDimensionY: 3,
    requiredObjects: [
      { objectId: OBJECT_TYPES.BED, count: 1 },
      { objectId: OBJECT_TYPES.TOILET, count: 1 },
    ],
  },
  canteen: {
    type: 'canteen',
    name: 'Canteen',
    mustBeIndoors: true,
    minAreaTiles: 16,
    minDimensionX: 4,
    minDimensionY: 4,
    requiredObjects: [
      { objectId: OBJECT_TYPES.SERVING_TABLE, count: 1 },
      { objectId: OBJECT_TYPES.TABLE, count: 1 },
      { objectId: OBJECT_TYPES.BENCH, count: 1 },
    ],
  },
  kitchen: {
    type: 'kitchen',
    name: 'Kitchen',
    mustBeIndoors: true,
    minAreaTiles: 12,
    minDimensionX: 3,
    minDimensionY: 3,
    requiredObjects: [
      { objectId: OBJECT_TYPES.COOKER, count: 1 },
      { objectId: OBJECT_TYPES.FRIDGE, count: 1 },
      { objectId: OBJECT_TYPES.SINK, count: 1 },
    ],
  },
  yard: {
    type: 'yard',
    name: 'Yard',
    mustBeIndoors: false,
    minAreaTiles: 36,
    minDimensionX: 6,
    minDimensionY: 6,
    requiredObjects: [],
  },
  solitary: {
    type: 'solitary',
    name: 'Solitary',
    mustBeIndoors: true,
    minAreaTiles: 1,
    minDimensionX: 1,
    minDimensionY: 1,
    requiredObjects: [],
  },
  holding_cell: {
    type: 'holding_cell',
    name: 'Holding Cell',
    mustBeIndoors: true,
    minAreaTiles: 20,
    minDimensionX: 4,
    minDimensionY: 5,
    requiredObjects: [
      { objectId: OBJECT_TYPES.TOILET, count: 1 },
      { objectId: OBJECT_TYPES.BENCH, count: 1 },
    ],
  },
};

export type RoomValidationStatus =
  | { kind: 'valid' }
  | { kind: 'unenclosed'; leakX: number; leakY: number }
  | { kind: 'no_door' }
  | { kind: 'missing_props'; missingObjectId: number; requiredCount: number; currentCount: number }
  | { kind: 'insufficient_area'; currentArea: number; minRequired: number }
  | { kind: 'not_indoors' };

export interface EnclosureScanResult {
  isFullyEnclosed: boolean;
  hasDoor: boolean;
  tiles: [number, number][];
  doors: [number, number][];
  placedObjects: Map<number, number>;
  leakCoord: [number, number] | null;
  isEntirelyIndoors: boolean;
  width: number;
  height: number;
}

export interface RoomInstance {
  id: number;
  type: RoomType;
  status: RoomValidationStatus;
  tiles: [number, number][];
  doors: [number, number][];
  area: number;
  centerX: number;
  centerY: number;
}

export interface RoomTelemetry {
  totalRooms: number;
  validRooms: number;
  invalidRooms: number;
  totalZonedTiles: number;
  cellCount: number;
  validCellCount: number;
}

export class RoomEnclosureManager {
  readonly width: number;
  readonly height: number;
  readonly walls = new Map<number, number>(); // coordIdx -> wallId
  readonly indoorTiles = new Set<number>(); // coordIdx
  readonly zoneMap = new Map<number, RoomType>(); // coordIdx -> RoomType
  readonly objectMap = new Map<number, number>(); // coordIdx -> ObjectId
  readonly rooms: RoomInstance[] = [];

  private nextRoomId = 1;

  constructor(width = 512, height = 512) {
    this.width = width;
    this.height = height;
  }

  coordToIdx(x: number, y: number): number {
    return y * this.width + x;
  }

  idxToCoord(idx: number): [number, number] {
    return [idx % this.width, Math.floor(idx / this.width)];
  }

  setWall(x: number, y: number, wallId: number): void {
    const idx = this.coordToIdx(x, y);
    if (wallId === 0) {
      this.walls.delete(idx);
    } else {
      this.walls.set(idx, wallId);
    }
  }

  setIndoor(x: number, y: number, isIndoor: boolean): void {
    const idx = this.coordToIdx(x, y);
    if (isIndoor) {
      this.indoorTiles.add(idx);
    } else {
      this.indoorTiles.delete(idx);
    }
  }

  setZone(x: number, y: number, type: RoomType): void {
    const idx = this.coordToIdx(x, y);
    if (type === 'unzoned') {
      this.zoneMap.delete(idx);
    } else {
      this.zoneMap.set(idx, type);
    }
  }

  placeObject(x: number, y: number, objectId: number): void {
    const idx = this.coordToIdx(x, y);
    if (objectId === OBJECT_TYPES.NONE) {
      this.objectMap.delete(idx);
    } else {
      this.objectMap.set(idx, objectId);
    }
  }

  removeObject(x: number, y: number): void {
    this.objectMap.delete(this.coordToIdx(x, y));
  }

  scanRoomEnclosure(startX: number, startY: number, targetType: RoomType, maxScanLimit = 5000): EnclosureScanResult {
    const visited = new Set<number>();
    const queue: [number, number][] = [];
    const tiles: [number, number][] = [];
    const doors: [number, number][] = [];
    const placedObjects = new Map<number, number>();
    let isEnclosed = true;
    let leakCoord: [number, number] | null = null;
    let allIndoors = true;

    const startIdx = this.coordToIdx(startX, startY);
    visited.add(startIdx);
    queue.push([startX, startY]);

    let minX = startX;
    let maxX = startX;
    let minY = startY;
    let maxY = startY;

    let head = 0;
    const cardinals = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    while (head < queue.length) {
      const [cx, cy] = queue[head++];
      if (tiles.length > maxScanLimit) {
        return {
          isFullyEnclosed: false,
          hasDoor: doors.length > 0,
          tiles,
          doors,
          placedObjects,
          leakCoord: [cx, cy],
          isEntirelyIndoors: false,
          width: 0,
          height: 0,
        };
      }

      tiles.push([cx, cy]);
      minX = Math.min(minX, cx);
      maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy);
      maxY = Math.max(maxY, cy);

      const currIdx = this.coordToIdx(cx, cy);
      if (!this.indoorTiles.has(currIdx)) {
        allIndoors = false;
      }

      const objId = this.objectMap.get(currIdx);
      if (objId !== undefined) {
        placedObjects.set(objId, (placedObjects.get(objId) ?? 0) + 1);
      }

      for (let c = 0; c < cardinals.length; c++) {
        const dx = cardinals[c][0];
        const dy = cardinals[c][1];
        const nx = cx + dx;
        const ny = cy + dy;

        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
          isEnclosed = false;
          if (!leakCoord) leakCoord = [cx, cy];
          continue;
        }

        const nIdx = this.coordToIdx(nx, ny);
        if (visited.has(nIdx)) continue;

        // Check if wall seals perimeter
        if (this.walls.has(nIdx)) {
          continue;
        }

        // Check if door seals perimeter
        const nObj = this.objectMap.get(nIdx);
        if (nObj !== undefined && isDoorObject(nObj)) {
          doors.push([nx, ny]);
          continue;
        }

        // If neighbor is not zoned with the same room type, leak!
        const nZone = this.zoneMap.get(nIdx);
        if (nZone !== targetType) {
          isEnclosed = false;
          if (!leakCoord) leakCoord = [nx, ny];
          continue;
        }

        visited.add(nIdx);
        queue.push([nx, ny]);
      }
    }

    return {
      isFullyEnclosed: isEnclosed,
      hasDoor: doors.length > 0,
      tiles,
      doors,
      placedObjects,
      leakCoord,
      isEntirelyIndoors: allIndoors,
      width: tiles.length > 0 ? maxX - minX + 1 : 0,
      height: tiles.length > 0 ? maxY - minY + 1 : 0,
    };
  }

  validateRoomRequirements(type: RoomType, scan: EnclosureScanResult): RoomValidationStatus {
    const def = ROOM_REGISTRY[type];
    if (!def) return { kind: 'valid' };

    if (!scan.isFullyEnclosed) {
      const [lx, ly] = scan.leakCoord ?? [0, 0];
      return { kind: 'unenclosed', leakX: lx, leakY: ly };
    }

    if (type !== 'yard' && !scan.hasDoor) {
      return { kind: 'no_door' };
    }

    if (def.mustBeIndoors && !scan.isEntirelyIndoors) {
      return { kind: 'not_indoors' };
    }

    if (scan.tiles.length < def.minAreaTiles) {
      return {
        kind: 'insufficient_area',
        currentArea: scan.tiles.length,
        minRequired: def.minAreaTiles,
      };
    }

    for (const req of def.requiredObjects) {
      const current = scan.placedObjects.get(req.objectId) ?? 0;
      if (current < req.count) {
        return {
          kind: 'missing_props',
          missingObjectId: req.objectId,
          requiredCount: req.count,
          currentCount: current,
        };
      }
    }

    return { kind: 'valid' };
  }

  scanAndValidateAll(): void {
    this.rooms.length = 0;
    const processed = new Set<number>();

    for (const [idx, roomType] of this.zoneMap.entries()) {
      if (processed.has(idx)) continue;

      const [x, y] = this.idxToCoord(idx);
      const scan = this.scanRoomEnclosure(x, y, roomType);

      for (const [tx, ty] of scan.tiles) {
        processed.add(this.coordToIdx(tx, ty));
      }

      const status = this.validateRoomRequirements(roomType, scan);
      const id = this.nextRoomId++;

      let sumX = 0;
      let sumY = 0;
      for (const [tx, ty] of scan.tiles) {
        sumX += tx;
        sumY += ty;
      }
      const centerX = scan.tiles.length > 0 ? sumX / scan.tiles.length : x;
      const centerY = scan.tiles.length > 0 ? sumY / scan.tiles.length : y;

      this.rooms.push({
        id,
        type: roomType,
        status,
        tiles: scan.tiles,
        doors: scan.doors,
        area: scan.tiles.length,
        centerX,
        centerY,
      });
    }
  }

  getTelemetry(): RoomTelemetry {
    let valid = 0;
    let cells = 0;
    let validCells = 0;

    for (const room of this.rooms) {
      if (room.status.kind === 'valid') valid++;
      if (room.type === 'cell') {
        cells++;
        if (room.status.kind === 'valid') validCells++;
      }
    }

    return {
      totalRooms: this.rooms.length,
      validRooms: valid,
      invalidRooms: this.rooms.length - valid,
      totalZonedTiles: this.zoneMap.size,
      cellCount: cells,
      validCellCount: validCells,
    };
  }
}
