/**
 * Domain 03: Inmate Simulation & Agent AI
 * Task 4.1: Flow Field (Dijkstra Vector Map) Generator & Door Weighting
 */

export const EntityType = {
  Prisoner: 0,
  Guard: 1,
  Workman: 2,
  Cook: 3,
  Doctor: 4,
  Visitor: 5,
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const DoorAccessPolicy = {
  UnlockedAll: 0,
  PrisonersAndStaff: 1,
  StaffOnly: 2,
  GuardsOnly: 3,
  LockedShut: 4, // Emergency lockdown
} as const;
export type DoorAccessPolicy = (typeof DoorAccessPolicy)[keyof typeof DoorAccessPolicy];

export interface DoorComponent {
  accessPolicy: DoorAccessPolicy;
  isOpen: boolean;
  isLocked: boolean;
  hasServo: boolean;
}

/**
 * Calculates door traversal cost based on clearance and key ownership
 */
export function getDoorTraversalCost(
  door: DoorComponent,
  entityType: EntityType,
  hasKeys: boolean = false
): number {
  if (door.isOpen) {
    return 1.0;
  }

  if (door.accessPolicy === DoorAccessPolicy.LockedShut) {
    return Infinity;
  }

  if (
    door.accessPolicy === DoorAccessPolicy.StaffOnly &&
    (entityType === EntityType.Prisoner || entityType === EntityType.Visitor)
  ) {
    return Infinity;
  }

  if (
    door.accessPolicy === DoorAccessPolicy.GuardsOnly &&
    (entityType === EntityType.Prisoner || entityType === EntityType.Visitor || entityType === EntityType.Cook)
  ) {
    return Infinity;
  }

  if (hasKeys || entityType === EntityType.Guard || entityType === EntityType.Workman) {
    return 4.0; // Time required to unlock with keys
  }

  if (door.accessPolicy === DoorAccessPolicy.PrisonersAndStaff) {
    if (door.isLocked) {
      return 25.0; // Inmate must wait for a guard to open
    } else {
      return 1.5; // Simple push to open
    }
  }

  if (door.accessPolicy === DoorAccessPolicy.UnlockedAll) {
    return 1.2;
  }

  return Infinity;
}

/**
 * 2D Grid Cost Field representing traversability
 */
export class CostField {
  public width: number;
  public height: number;
  public costs: Float32Array;

  constructor(width: number, height: number, defaultCost: number = 1.0) {
    this.width = width;
    this.height = height;
    this.costs = new Float32Array(width * height);
    this.costs.fill(defaultCost);
  }

  public get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return Infinity;
    }
    return this.costs[y * this.width + x];
  }

  public set(x: number, y: number, cost: number): void {
    if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
      this.costs[y * this.width + x] = cost;
    }
  }

  public setImpassable(x: number, y: number): void {
    this.set(x, y, Infinity);
  }
}

/**
 * 2D Integration Field holding distance/cost to nearest destination tile
 */
export class IntegrationField {
  public width: number;
  public height: number;
  public distances: Float32Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.distances = new Float32Array(width * height);
    this.distances.fill(Infinity);
  }

  public get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return Infinity;
    }
    return this.distances[y * this.width + x];
  }

  /**
   * Computes Dijkstra integration wavefront from multiple destination tiles
   */
  public static generate(
    width: number,
    height: number,
    destinations: Array<{ x: number; y: number }>,
    costField: CostField
  ): IntegrationField {
    const field = new IntegrationField(width, height);
    const queue: number[] = []; // Flat indices queue for Dijkstra

    for (const { x, y } of destinations) {
      if (x >= 0 && y >= 0 && x < width && y < height && costField.get(x, y) < Infinity) {
        const idx = y * width + x;
        field.distances[idx] = 0.0;
        queue.push(idx);
      }
    }

    const SQRT_2 = 1.41421356;
    let head = 0;

    // Fast Dijkstra BFS Wavefront
    while (head < queue.length) {
      const idx = queue[head++];
      const currentDist = field.distances[idx];
      const x = idx % width;
      const y = Math.floor(idx / width);

      // 4 Cardinal neighbors
      const cardinals = [
        [x, y - 1, 1.0],
        [x + 1, y, 1.0],
        [x, y + 1, 1.0],
        [x - 1, y, 1.0],
      ];

      for (let i = 0; i < cardinals.length; i++) {
        const [nx, ny, distMult] = cardinals[i];
        if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
          const nIdx = ny * width + nx;
          const tileCost = costField.costs[nIdx];
          if (tileCost < Infinity) {
            const newDist = currentDist + tileCost * distMult;
            if (newDist < field.distances[nIdx]) {
              field.distances[nIdx] = newDist;
              queue.push(nIdx);
            }
          }
        }
      }

      // 4 Diagonal neighbors
      const diagonals = [
        [x + 1, y - 1, x + 1, y, x, y - 1],
        [x + 1, y + 1, x + 1, y, x, y + 1],
        [x - 1, y + 1, x - 1, y, x, y + 1],
        [x - 1, y - 1, x - 1, y, x, y - 1],
      ];

      for (let i = 0; i < diagonals.length; i++) {
        const [nx, ny, c1x, c1y, c2x, c2y] = diagonals[i];
        if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
          const nIdx = ny * width + nx;
          const tileCost = costField.costs[nIdx];
          if (tileCost < Infinity) {
            const c1Cost = costField.costs[c1y * width + c1x];
            const c2Cost = costField.costs[c2y * width + c2x];
            if (c1Cost < Infinity || c2Cost < Infinity) {
              const newDist = currentDist + tileCost * SQRT_2;
              if (newDist < field.distances[nIdx]) {
                field.distances[nIdx] = newDist;
                queue.push(nIdx);
              }
            }
          }
        }
      }
    }

    return field;
  }
}

/**
 * 2D Flow Field vector map pointing down the minimal cost gradient
 */
export class FlowField {
  public width: number;
  public height: number;
  public vectors: Float32Array; // Interleaved [dx, dy, dx, dy, ...]
  public packedAngles: Uint8Array; // 0..255 packed angle [0, 2pi) (255 = stopped/unreachable)

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.vectors = new Float32Array(width * height * 2);
    this.packedAngles = new Uint8Array(width * height);
    this.packedAngles.fill(255);
  }

  public static fromIntegrationField(
    integration: IntegrationField,
    destinations: Array<{ x: number; y: number }>
  ): FlowField {
    const width = integration.width;
    const height = integration.height;
    const field = new FlowField(width, height);

    const isDestination = (x: number, y: number): boolean => {
      for (let i = 0; i < destinations.length; i++) {
        if (destinations[i].x === x && destinations[i].y === y) return true;
      }
      return false;
    };

    const NEIGHBORS = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ];

    for (let y = 0; y < height; y++) {
      const yOffset = y * width;
      for (let x = 0; x < width; x++) {
        const idx = yOffset + x;
        const currentDist = integration.distances[idx];

        if (currentDist >= Infinity || isDestination(x, y)) {
          field.vectors[idx * 2] = 0.0;
          field.vectors[idx * 2 + 1] = 0.0;
          field.packedAngles[idx] = 255;
          continue;
        }

        let bestDist = currentDist;
        let bestDx = 0.0;
        let bestDy = 0.0;

        for (let i = 0; i < NEIGHBORS.length; i++) {
          const [ox, oy] = NEIGHBORS[i];
          const nx = x + ox;
          const ny = y + oy;

          if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
            const nDist = integration.distances[ny * width + nx];
            if (nDist < bestDist) {
              bestDist = nDist;
              bestDx = ox;
              bestDy = oy;
            }
          }
        }

        const length = Math.hypot(bestDx, bestDy);
        if (length > 0.0001) {
          const normDx = bestDx / length;
          const normDy = bestDy / length;
          field.vectors[idx * 2] = normDx;
          field.vectors[idx * 2 + 1] = normDy;

          let angle = Math.atan2(normDy, normDx);
          if (angle < 0) angle += 2 * Math.PI;
          field.packedAngles[idx] = Math.round((angle / (2 * Math.PI)) * 254);
        } else {
          field.vectors[idx * 2] = 0.0;
          field.vectors[idx * 2 + 1] = 0.0;
          field.packedAngles[idx] = 255;
        }
      }
    }

    return field;
  }

  /**
   * Sample direction at world position (x, y)
   */
  public sampleDirection(x: number, y: number): { dx: number; dy: number } | null {
    if (x < 0 || y < 0) return null;
    const gx = Math.floor(x);
    const gy = Math.floor(y);

    if (gx >= this.width || gy >= this.height) return null;

    const idx = gy * this.width + gx;
    const dx = this.vectors[idx * 2];
    const dy = this.vectors[idx * 2 + 1];

    if (dx === 0.0 && dy === 0.0) return null;
    return { dx, dy };
  }

  /**
   * Sample velocity vector with maximum speed multiplier
   */
  public sampleVelocity(x: number, y: number, maxSpeed: number): { vx: number; vy: number } {
    const dir = this.sampleDirection(x, y);
    if (!dir) {
      return { vx: 0.0, vy: 0.0 };
    }
    return { vx: dir.dx * maxSpeed, vy: dir.dy * maxSpeed };
  }
}

export interface NavAgent {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  entityType: EntityType;
  hasKeys: boolean;
  reachedGoal: boolean;
}

/**
 * Manager handling collective flow field caching and mass agent navigation updates
 */
export class FlowFieldManager {
  public width: number;
  public height: number;
  public costField: CostField;
  public cachedFields: Map<string, FlowField> = new Map();

  constructor(width: number, height: number, defaultCost: number = 1.0) {
    this.width = width;
    this.height = height;
    this.costField = new CostField(width, height, defaultCost);
  }

  public getOrCreateFlowField(
    key: string,
    destinations: Array<{ x: number; y: number }>
  ): FlowField {
    if (this.cachedFields.has(key)) {
      return this.cachedFields.get(key)!;
    }

    const integration = IntegrationField.generate(
      this.width,
      this.height,
      destinations,
      this.costField
    );
    const flowField = FlowField.fromIntegrationField(integration, destinations);
    this.cachedFields.set(key, flowField);
    return flowField;
  }

  public invalidate(): void {
    this.cachedFields.clear();
  }

  /**
   * Step agents along flow field with collision and target arrival checks
   */
  public stepAgents(
    agents: NavAgent[],
    flowField: FlowField,
    destinations: Array<{ x: number; y: number }>,
    dt: number = 1.0 / 60.0
  ): void {
    const isAtGoal = (x: number, y: number): boolean => {
      const gx = Math.floor(x);
      const gy = Math.floor(y);
      return destinations.some((d) => d.x === gx && d.y === gy);
    };

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];

      if (isAtGoal(agent.x, agent.y)) {
        agent.vx = 0.0;
        agent.vy = 0.0;
        agent.reachedGoal = true;
        continue;
      }

      const { vx, vy } = flowField.sampleVelocity(agent.x, agent.y, agent.speed);
      agent.vx = vx;
      agent.vy = vy;

      agent.x += vx * dt;
      agent.y += vy * dt;
      agent.reachedGoal = false;
    }
  }
}
