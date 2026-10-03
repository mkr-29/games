/**
 * Domain 02: World Grid, Construction & Utilities
 * Feature 02: Disjoint-Set Electrical Grid Solver, Circuit Isolation & Overload Physics
 */

export type PowerStatus = 'unpowered' | 'powered' | 'overloaded' | 'short_circuit';

export type ApplianceArchetype = 'cctv' | 'metal_detector' | 'workshop_saw' | 'electric_chair';

export interface ApplianceDef {
  name: string;
  wattage: number;
  icon: string;
}

export const APPLIANCE_REGISTRY: Record<ApplianceArchetype, ApplianceDef> = {
  cctv: { name: 'CCTV Monitor', wattage: 150, icon: '📹' },
  metal_detector: { name: 'Metal Detector', wattage: 250, icon: '🚪' },
  workshop_saw: { name: 'Workshop Saw', wattage: 600, icon: '🪚' },
  electric_chair: { name: 'Electric Chair', wattage: 5000, icon: '⚡' },
};

export interface PowerStationData {
  id: number;
  x: number;
  y: number;
  baseCapacity: number; // 1,000 W
  capacitorCount: number; // +500 W each, max 16
  isActive: boolean;
  isTripped: boolean;
  cooldownTicks: number;
}

export interface ApplianceData {
  id: number;
  x: number;
  y: number;
  type: ApplianceArchetype;
  wattage: number;
  isActive: boolean;
  isPowered: boolean;
}

export interface ElectricalTelemetry {
  totalCapacity: number;
  totalLoad: number;
  loadFactorPercent: number;
  activeStations: number;
  trippedBreakers: number;
  hasShortCircuit: boolean;
  poweredAppliances: number;
  totalAppliances: number;
}

export class DisjointSet {
  parent: Uint32Array;
  rank: Uint8Array;

  constructor(size: number) {
    this.parent = new Uint32Array(size);
    this.rank = new Uint8Array(size);
    this.reset();
  }

  reset(): void {
    for (let i = 0; i < this.parent.length; i++) {
      this.parent[i] = i;
      this.rank[i] = 0;
    }
  }

  find(i: number): number {
    let curr = i;
    while (curr !== this.parent[curr]) {
      this.parent[curr] = this.parent[this.parent[curr]]; // Path compression
      curr = this.parent[curr];
    }
    return curr;
  }

  union(i: number, j: number): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI === rootJ) return false;

    if (this.rank[rootI] < this.rank[rootJ]) {
      this.parent[rootI] = rootJ;
    } else if (this.rank[rootI] > this.rank[rootJ]) {
      this.parent[rootJ] = rootI;
    } else {
      this.parent[rootJ] = rootI;
      this.rank[rootI]++;
    }
    return true;
  }
}

export class ElectricityManager {
  readonly width: number;
  readonly height: number;
  readonly cables = new Set<number>();
  readonly capacitors = new Set<number>();
  readonly powerStations = new Map<number, PowerStationData>();
  readonly appliances = new Map<number, ApplianceData>();

  private ds: DisjointSet;
  circuitStatuses = new Map<number, PowerStatus>();
  circuitLoads = new Map<number, number>();
  circuitCapacities = new Map<number, number>();
  tilePowerCache = new Map<number, PowerStatus>();
  hasShortCircuitFault = false;

  constructor(width = 512, height = 512) {
    this.width = width;
    this.height = height;
    this.ds = new DisjointSet(width * height);
  }

  coordToIdx(x: number, y: number): number {
    return y * this.width + x;
  }

  idxToCoord(idx: number): [number, number] {
    return [idx % this.width, Math.floor(idx / this.width)];
  }

  placeCable(x: number, y: number): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.cables.add(this.coordToIdx(x, y));
    }
  }

  removeCable(x: number, y: number): void {
    this.cables.delete(this.coordToIdx(x, y));
  }

  hasCable(x: number, y: number): boolean {
    return this.cables.has(this.coordToIdx(x, y));
  }

  addPowerStation(id: number, x: number, y: number): void {
    this.powerStations.set(id, {
      id,
      x,
      y,
      baseCapacity: 1000,
      capacitorCount: 0,
      isActive: true,
      isTripped: false,
      cooldownTicks: 0,
    });
  }

  addCapacitor(x: number, y: number): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.capacitors.add(this.coordToIdx(x, y));
    }
  }

  addAppliance(id: number, x: number, y: number, type: ApplianceArchetype): void {
    const def = APPLIANCE_REGISTRY[type];
    this.appliances.set(id, {
      id,
      x,
      y,
      type,
      wattage: def ? def.wattage : 100,
      isActive: true,
      isPowered: false,
    });
  }

  resetBreaker(stationId: number): void {
    const station = this.powerStations.get(stationId);
    if (station) {
      station.isTripped = false;
      station.cooldownTicks = 0;
    }
  }

  calculateStationCapacity(station: PowerStationData): number {
    if (!station.isActive || station.isTripped) return 0;
    const cappedCapacitors = Math.min(station.capacitorCount, 16);
    return Math.min(station.baseCapacity + cappedCapacitors * 500, 9000);
  }

  solve(): void {
    this.circuitStatuses.clear();
    this.circuitLoads.clear();
    this.circuitCapacities.clear();
    this.tilePowerCache.clear();
    this.hasShortCircuitFault = false;
    this.ds.reset();

    // 1. Calculate adjacent capacitors for each power station (3x3 station footprint with perimeter ring)
    for (const station of this.powerStations.values()) {
      let capCount = 0;
      for (const capIdx of this.capacitors) {
        const [cx, cy] = this.idxToCoord(capIdx);
        const minX = Math.max(0, station.x - 1);
        const maxX = station.x + 3;
        const minY = Math.max(0, station.y - 1);
        const maxY = station.y + 3;
        if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) {
          capCount++;
        }
      }
      station.capacitorCount = capCount;
    }

    // 2. Union 3x3 footprint tiles of each power station
    for (const station of this.powerStations.values()) {
      const baseIdx = this.coordToIdx(station.x, station.y);
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const tidx = this.coordToIdx(station.x + dx, station.y + dy);
          this.ds.union(baseIdx, tidx);
        }
      }
    }

    // 3. Union adjacent cardinal connected cables
    const cardinals: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (const cableIdx of this.cables) {
      const [cx, cy] = this.idxToCoord(cableIdx);
      for (const [dx, dy] of cardinals) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          const nIdx = this.coordToIdx(nx, ny);
          if (this.cables.has(nIdx)) {
            this.ds.union(cableIdx, nIdx);
          }
        }
      }
    }

    // 4. Union power stations with adjacent cables
    for (const station of this.powerStations.values()) {
      const stationRoot = this.ds.find(this.coordToIdx(station.x, station.y));
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const sx = station.x + dx;
          const sy = station.y + dy;
          for (const [odx, ody] of cardinals) {
            const nx = sx + odx;
            const ny = sy + ody;
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
              const nIdx = this.coordToIdx(nx, ny);
              if (this.cables.has(nIdx)) {
                this.ds.union(stationRoot, nIdx);
              }
            }
          }
        }
      }
    }

    // 5. Union appliances with their tile or adjacent cables
    for (const app of this.appliances.values()) {
      const appIdx = this.coordToIdx(app.x, app.y);
      for (const [dx, dy] of cardinals) {
        const nx = app.x + dx;
        const ny = app.y + dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          const nIdx = this.coordToIdx(nx, ny);
          if (this.cables.has(nIdx)) {
            this.ds.union(appIdx, nIdx);
          }
        }
      }
    }

    // 6. Map active Power Stations to roots and detect short circuits
    const rootToStations = new Map<number, number[]>();
    for (const station of this.powerStations.values()) {
      if (!station.isActive || station.isTripped) continue;
      const root = this.ds.find(this.coordToIdx(station.x, station.y));
      const list = rootToStations.get(root) ?? [];
      list.push(station.id);
      rootToStations.set(root, list);
    }

    // 7. Check for Catastrophic Short-Circuit (2 or more live stations on same wire graph)
    const shortCircuitedRoots = new Set<number>();
    for (const [root, stationIds] of rootToStations.entries()) {
      if (stationIds.length > 1) {
        this.hasShortCircuitFault = true;
        shortCircuitedRoots.add(root);
        this.circuitStatuses.set(root, 'short_circuit');

        for (const sid of stationIds) {
          const s = this.powerStations.get(sid);
          if (s) s.isTripped = true;
        }
      }
    }

    // 8. Calculate capacity vs load for stable circuits
    for (const [root, stationIds] of rootToStations.entries()) {
      if (shortCircuitedRoots.has(root)) continue;

      const stationId = stationIds[0];
      const station = this.powerStations.get(stationId)!;
      const capacity = this.calculateStationCapacity(station);
      this.circuitCapacities.set(root, capacity);

      let totalLoad = 0;
      for (const app of this.appliances.values()) {
        if (!app.isActive) continue;
        const appRoot = this.ds.find(this.coordToIdx(app.x, app.y));
        if (appRoot === root) {
          totalLoad += app.wattage;
        }
      }
      this.circuitLoads.set(root, totalLoad);

      if (totalLoad > capacity) {
        station.isTripped = true;
        this.circuitStatuses.set(root, 'overloaded');
      } else {
        this.circuitStatuses.set(root, 'powered');
      }
    }

    // 9. Update appliance powered states
    for (const app of this.appliances.values()) {
      const appRoot = this.ds.find(this.coordToIdx(app.x, app.y));
      const status = this.circuitStatuses.get(appRoot) ?? 'unpowered';
      app.isPowered = status === 'powered';
    }

    // 10. Cache tile power statuses for cables, stations, appliances
    for (const cableIdx of this.cables) {
      const root = this.ds.find(cableIdx);
      this.tilePowerCache.set(cableIdx, this.circuitStatuses.get(root) ?? 'unpowered');
    }
    for (const station of this.powerStations.values()) {
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const sIdx = this.coordToIdx(station.x + dx, station.y + dy);
          const root = this.ds.find(sIdx);
          this.tilePowerCache.set(sIdx, this.circuitStatuses.get(root) ?? 'unpowered');
        }
      }
    }
    for (const app of this.appliances.values()) {
      const appIdx = this.coordToIdx(app.x, app.y);
      const root = this.ds.find(appIdx);
      this.tilePowerCache.set(appIdx, this.circuitStatuses.get(root) ?? 'unpowered');
    }
  }

  getTilePowerStatus(x: number, y: number): PowerStatus {
    const idx = this.coordToIdx(x, y);
    return this.tilePowerCache.get(idx) ?? 'unpowered';
  }

  getTelemetry(): ElectricalTelemetry {
    let totalCap = 0;
    let totalLoad = 0;
    let activeStations = 0;
    let trippedBreakers = 0;

    for (const s of this.powerStations.values()) {
      if (s.isTripped) trippedBreakers++;
      if (s.isActive && !s.isTripped) {
        activeStations++;
        totalCap += this.calculateStationCapacity(s);
      }
    }

    for (const load of this.circuitLoads.values()) {
      totalLoad += load;
    }

    let poweredApps = 0;
    for (const a of this.appliances.values()) {
      if (a.isPowered) poweredApps++;
    }

    const loadFactor = totalCap > 0 ? (totalLoad / totalCap) * 100 : 0;

    return {
      totalCapacity: totalCap,
      totalLoad,
      loadFactorPercent: Math.round(loadFactor * 10) / 10,
      activeStations,
      trippedBreakers,
      hasShortCircuit: this.hasShortCircuitFault,
      poweredAppliances: poweredApps,
      totalAppliances: this.appliances.size,
    };
  }
}
