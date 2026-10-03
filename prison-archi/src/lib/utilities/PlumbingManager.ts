/**
 * Domain 02: World Grid, Construction & Utilities
 * Feature 03: BFS Hydraulic Plumbing Solver, Hot Water Boilers & Tunneling Mechanics
 */

export type PipeType = 'none' | 'small_cold' | 'large_cold' | 'small_hot';

export const PIPE_TYPE_MAP: Record<PipeType, number> = {
  none: 0,
  small_cold: 1,
  large_cold: 2,
  small_hot: 3,
};

export const REVERSE_PIPE_TYPE_MAP: Record<number, PipeType> = {
  0: 'none',
  1: 'small_cold',
  2: 'large_cold',
  3: 'small_hot',
};

export interface FluidPipeCellData {
  coldPressure: number;   // 0..100%
  hotPressure: number;    // 0..100%
  temperatureC: number;   // 10°C (tap cold) to 55°C (heated)
  pipeType: PipeType;
  flags: number;          // 1=TunnelPresent, 2=Burst/Leaking
}

export type FixtureArchetype = 'toilet' | 'shower' | 'sink' | 'laundry_machine' | 'sprinkler';

export interface FixtureDef {
  name: string;
  minColdPressure: number;
  requiresWarmWater: boolean;
  icon: string;
}

export const FIXTURE_REGISTRY: Record<FixtureArchetype, FixtureDef> = {
  toilet: { name: 'Toilet', minColdPressure: 10, requiresWarmWater: false, icon: '🚽' },
  shower: { name: 'Shower', minColdPressure: 10, requiresWarmWater: true, icon: '🚿' },
  sink: { name: 'Sink', minColdPressure: 10, requiresWarmWater: false, icon: '🚰' },
  laundry_machine: { name: 'Laundry Machine', minColdPressure: 10, requiresWarmWater: false, icon: '🧺' },
  sprinkler: { name: 'Fire Sprinkler', minColdPressure: 10, requiresWarmWater: false, icon: '💦' },
};

export interface PumpStationData {
  id: number;
  x: number;
  y: number;
  isActive: boolean;
  isPowered: boolean;
  outputPressure: number;
}

export interface BoilerStationData {
  id: number;
  x: number;
  y: number;
  isActive: boolean;
  isPowered: boolean;
  maxRadius: number;
  targetTemperature: number;
  minColdIntakePressure: number;
  currentIntakePressure: number;
  isHeating: boolean;
}

export interface FixtureData {
  id: number;
  x: number;
  y: number;
  type: FixtureArchetype;
  isSupplied: boolean;
  isWarm: boolean;
}

export interface PlumbingTelemetry {
  totalPumps: number;
  activePumps: number;
  totalBoilers: number;
  activeBoilers: number;
  suppliedFixtures: number;
  totalFixtures: number;
  totalPipeCells: number;
  averagePressure: number;
}

/**
 * Calculates escape tunnel digging cost multiplier through plumbing tiles.
 * Large water pipes allow inmates to crawl directly inside, reducing digging cost to 0.20 (500% speedup).
 */
export function getTunnelDigCost(pipeType: PipeType | number): number {
  const typeNum = typeof pipeType === 'string' ? PIPE_TYPE_MAP[pipeType] : pipeType;
  if (typeNum === 2) {
    return 0.20; // Large pipe
  }
  return 1.00; // Small pipe or no pipe
}

export class PlumbingManager {
  readonly width: number;
  readonly height: number;
  readonly cells: FluidPipeCellData[];
  readonly pumps = new Map<number, PumpStationData>();
  readonly boilers = new Map<number, BoilerStationData>();
  readonly fixtures = new Map<number, FixtureData>();

  constructor(width = 512, height = 512) {
    this.width = width;
    this.height = height;
    const total = width * height;
    this.cells = new Array(total);
    for (let i = 0; i < total; i++) {
      this.cells[i] = {
        coldPressure: 0,
        hotPressure: 0,
        temperatureC: 10,
        pipeType: 'none',
        flags: 0,
      };
    }
  }

  coordToIdx(x: number, y: number): number {
    return y * this.width + x;
  }

  idxToCoord(idx: number): [number, number] {
    return [idx % this.width, Math.floor(idx / this.width)];
  }

  placePipe(x: number, y: number, pipeType: PipeType): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const cell = this.cells[this.coordToIdx(x, y)];
      cell.pipeType = pipeType;
    }
  }

  removePipe(x: number, y: number): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const cell = this.cells[this.coordToIdx(x, y)];
      cell.pipeType = 'none';
      cell.coldPressure = 0;
      cell.hotPressure = 0;
      cell.temperatureC = 10;
    }
  }

  getPipe(x: number, y: number): FluidPipeCellData | null {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.cells[this.coordToIdx(x, y)];
    }
    return null;
  }

  addPumpStation(id: number, x: number, y: number): void {
    this.pumps.set(id, {
      id,
      x,
      y,
      isActive: true,
      isPowered: true,
      outputPressure: 100,
    });
  }

  addBoilerStation(id: number, x: number, y: number): void {
    this.boilers.set(id, {
      id,
      x,
      y,
      isActive: true,
      isPowered: true,
      maxRadius: 15,
      targetTemperature: 55,
      minColdIntakePressure: 20,
      currentIntakePressure: 0,
      isHeating: false,
    });
  }

  addFixture(id: number, x: number, y: number, type: FixtureArchetype): void {
    this.fixtures.set(id, {
      id,
      x,
      y,
      type,
      isSupplied: false,
      isWarm: false,
    });
  }

  getTunnelDigCostAt(x: number, y: number): number {
    const pipe = this.getPipe(x, y);
    return pipe ? getTunnelDigCost(pipe.pipeType) : 1.00;
  }

  solve(): void {
    const total = this.width * this.height;

    // 1. Reset all pipe pressures and set default tap cold temperature (10°C)
    for (let i = 0; i < total; i++) {
      const cell = this.cells[i];
      cell.coldPressure = 0;
      cell.hotPressure = 0;
      cell.temperatureC = 10;
    }

    for (const boiler of this.boilers.values()) {
      boiler.currentIntakePressure = 0;
      boiler.isHeating = false;
    }

    const width = this.width;
    const height = this.height;

    // 2. BFS for Cold Water propagation
    const bestCold = new Float32Array(total);
    const coldQueue: [number, number, number][] = []; // [x, y, pressure]

    for (const pump of this.pumps.values()) {
      if (!pump.isActive || !pump.isPowered) continue;
      const pVal = pump.outputPressure;
      // 3x3 footprint
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const px = pump.x + dx;
          const py = pump.y + dy;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = this.coordToIdx(px, py);
            bestCold[idx] = pVal;
            this.cells[idx].coldPressure = pVal;
            coldQueue.push([px, py, pVal]);
          }
        }
      }
    }

    let head = 0;

    const cardinals = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    while (head < coldQueue.length) {
      const [cx, cy, currP] = coldQueue[head++];
      const currIdx = this.coordToIdx(cx, cy);
      if (currP < bestCold[currIdx] - 0.001) continue;

      for (let c = 0; c < cardinals.length; c++) {
        const dx = cardinals[c][0];
        const dy = cardinals[c][1];
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;


        const nIdx = this.coordToIdx(nx, ny);
        const cell = this.cells[nIdx];
        if (cell.pipeType === 'none') continue;

        // Pressure drop per tile: Large=0.1%, Small=3.0%, Hot=3.5%
        const drop = cell.pipeType === 'large_cold' ? 0.1 : (cell.pipeType === 'small_cold' ? 3.0 : 3.5);
        const nextP = currP - drop;

        if (nextP > 0.0 && nextP > bestCold[nIdx] + 0.0001) {
          bestCold[nIdx] = nextP;
          cell.coldPressure = Math.min(100, Math.max(0, Math.round(nextP)));
          coldQueue.push([nx, ny, nextP]);
        }
      }
    }



    // 3. Evaluate Boilers
    for (const boiler of this.boilers.values()) {
      if (!boiler.isActive || !boiler.isPowered) continue;

      let maxCold = 0;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const bx = boiler.x + dx;
          const by = boiler.y + dy;
          if (bx >= 0 && bx < width && by >= 0 && by < height) {
            const idx = this.coordToIdx(bx, by);
            maxCold = Math.max(maxCold, this.cells[idx].coldPressure);

            // Adjacent perimeter check
            for (let c = 0; c < cardinals.length; c++) {
              const odx = cardinals[c][0];
              const ody = cardinals[c][1];
              const ax = bx + odx;
              const ay = by + ody;
              if (ax >= 0 && ax < width && ay >= 0 && ay < height) {
                const aidx = this.coordToIdx(ax, ay);
                maxCold = Math.max(maxCold, this.cells[aidx].coldPressure);
              }
            }
          }
        }
      }

      boiler.currentIntakePressure = maxCold;
      if (maxCold >= boiler.minColdIntakePressure) {
        boiler.isHeating = true;
      }
    }

    // 4. BFS for Hot Water & Temperature propagation
    const bestHot = new Float32Array(total);
    const hotQueue: [number, number, number, number, number][] = []; // [x, y, pressure, dist, targetTemp]

    for (const boiler of this.boilers.values()) {
      if (!boiler.isHeating) continue;
      const initHp = Math.max(100, boiler.currentIntakePressure);

      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const bx = boiler.x + dx;
          const by = boiler.y + dy;
          if (bx >= 0 && bx < width && by >= 0 && by < height) {
            const idx = this.coordToIdx(bx, by);
            bestHot[idx] = initHp;
            this.cells[idx].hotPressure = Math.round(initHp);
            this.cells[idx].temperatureC = boiler.targetTemperature;
            hotQueue.push([bx, by, initHp, 0, boiler.targetTemperature]);
          }
        }
      }
    }

    let hotHead = 0;
    while (hotHead < hotQueue.length) {
      const [hx, hy, currHp, dist, targetTemp] = hotQueue[hotHead++];
      const currIdx = this.coordToIdx(hx, hy);
      if (currHp < bestHot[currIdx] - 0.001) continue;
      if (dist >= 15) continue;

      for (let c = 0; c < cardinals.length; c++) {
        const dx = cardinals[c][0];
        const dy = cardinals[c][1];
        const nx = hx + dx;
        const ny = hy + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;


        const nIdx = this.coordToIdx(nx, ny);
        const cell = this.cells[nIdx];
        if (cell.pipeType === 'none') continue;

        const drop = cell.pipeType === 'small_hot' ? 3.5 : 3.0;
        const nextHp = currHp - drop;
        const nextDist = dist + 1;

        if (nextHp > 0.0 && nextHp > bestHot[nIdx] + 0.0001) {
          bestHot[nIdx] = nextHp;
          cell.hotPressure = Math.min(100, Math.max(0, Math.round(nextHp)));
          cell.temperatureC = targetTemp;
          hotQueue.push([nx, ny, nextHp, nextDist, targetTemp]);
        }
      }
    }


    // 5. Update fixtures
    for (const fixture of this.fixtures.values()) {
      if (fixture.x >= 0 && fixture.x < width && fixture.y >= 0 && fixture.y < height) {
        const cell = this.cells[this.coordToIdx(fixture.x, fixture.y)];
        fixture.isSupplied = cell.coldPressure >= 10 || cell.hotPressure >= 10;
        fixture.isWarm = cell.temperatureC >= 40 && cell.hotPressure >= 10;
      }
    }

  }

  getTelemetry(): PlumbingTelemetry {
    let totalPipes = 0;
    let sumPressure = 0;
    for (const cell of this.cells) {
      if (cell.pipeType !== 'none') {
        totalPipes++;
        sumPressure += cell.coldPressure;
      }
    }

    let activeP = 0;
    for (const p of this.pumps.values()) {
      if (p.isActive && p.isPowered) activeP++;
    }

    let activeB = 0;
    for (const b of this.boilers.values()) {
      if (b.isHeating) activeB++;
    }

    let suppliedFix = 0;
    for (const f of this.fixtures.values()) {
      if (f.isSupplied) suppliedFix++;
    }

    return {
      totalPumps: this.pumps.size,
      activePumps: activeP,
      totalBoilers: this.boilers.size,
      activeBoilers: activeB,
      suppliedFixtures: suppliedFix,
      totalFixtures: this.fixtures.size,
      totalPipeCells: totalPipes,
      averagePressure: totalPipes > 0 ? Math.round((sumPressure / totalPipes) * 10) / 10 : 0,
    };
  }
}
