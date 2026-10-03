<script lang="ts">
  import { onMount } from 'svelte';
  import type { WorkerInMessage, WorkerOutMessage } from './types/worker';
  import {
    SharedMemoryBridge,
    TOTAL_SHARED_MEMORY_SIZE,
    HEADER_SIZE,
    COMMAND_QUEUE_SIZE,
    TELEMETRY_SIZE,
    MAX_ENTITIES_PER_SLOT,
    CTRL,
    type SimulationMetrics,
  } from './lib/memory/SharedMemoryBridge';
  import {
    TripleBufferConsumer,
    type UserCommandInput,
  } from './lib/memory/TripleBufferConsumer';
  import {
    WebGPURenderer,
    type RendererMetrics,
  } from './lib/renderer/WebGPURenderer';
  import {
    DragBoxTool,
    type ConstructionToolMode,
    type DragRectCommand,
  } from './lib/tools/DragBoxTool';
  import {
    ElectricityManager,
    type ElectricalTelemetry,
  } from './lib/utilities/ElectricityManager';
  import {
    PlumbingManager,
    type PlumbingTelemetry,
  } from './lib/utilities/PlumbingManager';
  import {
    RoomEnclosureManager,
    OBJECT_TYPES,
  } from './lib/rooms/RoomEnclosureManager';
  import {
    evaluateCellQuality,
    evaluateCellQualityFromScan,
    type CellQualityBreakdown,
  } from './lib/rooms/CellQualityManager';
  import {
    FlowFieldManager,
    CostField,
    EntityType,
    DoorAccessPolicy,
    type NavAgent,
  } from './lib/ai/FlowFieldManager';

  let crossOriginIsolated = $state(false);
  let workerStatus = $state<'Disconnected' | 'Connecting...' | 'Online'>('Connecting...');
  let workerPingReply = $state<string>('Pending handshake...');
  let sharedMemoryAttached = $state(false);
  let simulationWorker: Worker | null = null;
  let sharedBridge: SharedMemoryBridge | null = null;
  let consumer: TripleBufferConsumer | null = null;

  // View Mode Tabs: Architecture, Electricity, Plumbing, Rooms, Navigation
  let activeViewTab = $state<'architecture' | 'electricity' | 'plumbing' | 'rooms' | 'navigation'>('architecture');

  // Task 2.3 & 2.4: WebGPU Viewport, Camera & Drag-Rect Construction State
  let canvasElement = $state<HTMLCanvasElement | null>(null);
  let renderer: WebGPURenderer | null = null;
  let dragTool = $state<DragBoxTool | null>(null);
  let activeToolMode = $state<ConstructionToolMode>('brick_wall');
  let toolHollow = $state(true);
  let activeDragSummary = $state<string>('Ready to Drag & Build');
  let pendingJobsCount = $state(0);
  let completedJobsCount = $state(0);
  let workmenCount = $state(3);
  let workmenTelemetry = $state<string>('3 Idle in Delivery Zone');

  // Task 3.1: Disjoint-Set Electrical Grid Solver & Short-Circuit Physics State
  const electricityManager = new ElectricityManager(512, 512);
  let isUtilityOverlayActive = $derived(activeViewTab === 'electricity');
  let electricalTelemetry = $state<ElectricalTelemetry>(electricityManager.getTelemetry());
  let electricalLogMessage = $state<string>('⚡ Electrical Network Initialized: 2,000W Capacity');

  // Task 3.2: Dual-Pipe BFS Hydraulic Plumbing Solver & Boiler State
  const plumbingManager = new PlumbingManager(512, 512);
  let plumbingTelemetry = $state<PlumbingTelemetry>(plumbingManager.getTelemetry());
  let plumbingLogMessage = $state<string>('💧 Hydraulic Grid Initialized: 100% Water Pump Pressure');

  // Task 3.3: Spatial Room Enclosure & Doorway Boundary Detection State
  const roomManager = new RoomEnclosureManager(512, 512);
  let roomTelemetryMessage = $state<string>('🏠 Room Enclosure Engine Ready');
  let detectedRoomStatus = $state<{ enclosed: boolean; area: number; issues: string[] }>({
    enclosed: true,
    area: 6,
    issues: [],
  });

  // Task 3.4: Dynamic Cell Quality Grading & Score Evaluator State
  let cellQuality = $state<CellQualityBreakdown>(evaluateCellQuality({
    isValidCell: true,
    areaTiles: 6,
    placedObjects: new Map([[OBJECT_TYPES.BED, 1], [OBJECT_TYPES.TOILET, 1]]),
  }));

  // Task 4.1: Flow Field Navigation & Door Weighting State
  const flowManager = new FlowFieldManager(512, 512);
  let activeNavGoal = $state<'canteen' | 'yard' | 'cells'>('canteen');
  let doorPolicy = $state<DoorAccessPolicy>(DoorAccessPolicy.PrisonersAndStaff);
  let navTelemetryMessage = $state<string>('🧭 Flow Field Engine Online: 65,536 Integration Vectors Computed in <1.2ms');
  let navInmates = $state<NavAgent[]>([]);
  let navGoalTiles = $state<Array<{ x: number; y: number }>>([{ x: 256, y: 245 }]);

  let rendererMetrics = $state<RendererMetrics>({
    fps: 120,
    backend: 'WebGPU',
    visibleChunks: 16,
    totalChunks: 256,
    drawnInstances: 16384,
    cameraX: 256,
    cameraY: 256,
    zoom: 1.0,
  });

  // Construction & Workman Data Models
  interface WallTileData {
    wallId: number;
    autotileIdx: number;
    isBlueprint: boolean;
  }

  interface ConstructionJobItem {
    id: number;
    x: number;
    y: number;
    materialId: number;
    progressTicks: number;
    totalTicks: number;
    status: 'queued' | 'fetching' | 'constructing' | 'completed';
  }

  interface WorkmanAgent {
    id: number;
    x: number;
    y: number;
    state: 'idle' | 'walking_to_delivery' | 'carrying_material' | 'building';
    targetX: number;
    targetY: number;
    jobId: number | null;
    speed: number;
  }

  const sampleWalls = new Map<string, WallTileData>();
  let constructionJobs: ConstructionJobItem[] = [];
  let nextJobId = 1;
  const deliveryX = 242;
  const deliveryY = 242;

  let workmen: WorkmanAgent[] = [
    { id: 1, x: 241.5, y: 242.0, state: 'idle', targetX: 242, targetY: 242, jobId: null, speed: 4.5 },
    { id: 2, x: 242.5, y: 242.0, state: 'idle', targetX: 242, targetY: 242, jobId: null, speed: 4.5 },
    { id: 3, x: 242.0, y: 242.5, state: 'idle', targetX: 242, targetY: 242, jobId: null, speed: 4.5 },
  ];

  function calculateAutotile(tx: number, ty: number): number {
    let mask = 0;
    if (sampleWalls.has(`${tx},${ty - 1}`)) mask |= 1;
    if (sampleWalls.has(`${tx + 1},${ty}`)) mask |= 2;
    if (sampleWalls.has(`${tx},${ty + 1}`)) mask |= 4;
    if (sampleWalls.has(`${tx - 1},${ty}`)) mask |= 8;
    return mask;
  }

  function updateAutotileWithNeighbors(tx: number, ty: number) {
    const coords = [
      [tx, ty],
      [tx, ty - 1],
      [tx + 1, ty],
      [tx, ty + 1],
      [tx - 1, ty],
    ];
    for (const [cx, cy] of coords) {
      const tile = sampleWalls.get(`${cx},${cy}`);
      if (tile) {
        tile.autotileIdx = calculateAutotile(cx, cy);
      }
    }
  }

  function setToolMode(mode: ConstructionToolMode) {
    activeToolMode = mode;
    if (dragTool) {
      dragTool.setMode(mode);
    }
    if (renderer) {
      renderer.isPanToolActive = (mode === 'navigate');
    }
  }

  function setToolHollow(hollow: boolean) {
    toolHollow = hollow;
    if (dragTool) {
      dragTool.setHollow(hollow);
    }
  }

  function spawnWorkman() {
    const id = workmen.length + 1;
    workmen.push({
      id,
      x: deliveryX + (Math.random() - 0.5) * 1.5,
      y: deliveryY + (Math.random() - 0.5) * 1.5,
      state: 'idle',
      targetX: deliveryX,
      targetY: deliveryY,
      jobId: null,
      speed: 4.5,
    });
    workmenCount = workmen.length;
    workmenTelemetry = `${workmenCount} Active in Simulation`;
  }

  function queueWallRect(cmd: DragRectCommand) {
    let count = 0;
    for (let y = cmd.minY; y <= cmd.maxY; y++) {
      for (let x = cmd.minX; x <= cmd.maxX; x++) {
        if (cmd.hollow) {
          const isBorder = x === cmd.minX || x === cmd.maxX || y === cmd.minY || y === cmd.maxY;
          if (!isBorder) continue;
        }

        const key = `${x},${y}`;
        const existing = sampleWalls.get(key);
        if (existing && !existing.isBlueprint && existing.wallId > 0) {
          continue; // Already a solid wall
        }

        // Place blueprint ghost
        sampleWalls.set(key, {
          wallId: cmd.materialId,
          autotileIdx: 0,
          isBlueprint: true,
        });

        // Queue job
        constructionJobs.push({
          id: nextJobId++,
          x,
          y,
          materialId: cmd.materialId,
          progressTicks: 0,
          totalTicks: 25, // ~0.4s build time per wall segment
          status: 'queued',
        });
        count++;
      }
    }

    pendingJobsCount = constructionJobs.filter(j => j.status !== 'completed').length;
    metrics.bankBalance = Math.max(0, metrics.bankBalance - (cmd.costEstimateCents / 100));

    // Also send user command packet to SharedArrayBuffer SPSC queue!
    dispatchCommand(1, `Place Wall (${cmd.width}x${cmd.height})`, `$${(cmd.costEstimateCents / 100).toFixed(2)}`);
  }

  function trigger10x10Demo() {
    renderer?.camera.setPosition(250, 250);
    if (renderer) renderer.camera.zoom = 1.0;

    const cmd: DragRectCommand = {
      minX: 245,
      minY: 245,
      maxX: 254,
      maxY: 254,
      width: 10,
      height: 10,
      materialId: 1, // Brick Wall
      hollow: true,
      tileCount: 36,
      costEstimateCents: 36 * 5000,
      toolMode: 'brick_wall',
    };
    queueWallRect(cmd);
  }

  function clearCustomWalls() {
    sampleWalls.clear();
    // Re-initialize default perimeter wall
    for (let x = 240; x <= 272; x++) {
      sampleWalls.set(`${x},240`, { wallId: 1, autotileIdx: 0, isBlueprint: false });
      sampleWalls.set(`${x},272`, { wallId: 1, autotileIdx: 0, isBlueprint: false });
    }
    for (let y = 240; y <= 272; y++) {
      sampleWalls.set(`240,${y}`, { wallId: 1, autotileIdx: 0, isBlueprint: false });
      sampleWalls.set(`272,${y}`, { wallId: 1, autotileIdx: 0, isBlueprint: false });
    }
    for (let y = 246; y <= 266; y += 4) {
      for (let x = 244; x <= 268; x++) {
        sampleWalls.set(`${x},${y}`, { wallId: 1, autotileIdx: 0, isBlueprint: false });
      }
    }
    // Update autotile
    for (const [key, tile] of sampleWalls.entries()) {
      const [tx, ty] = key.split(',').map(Number);
      tile.autotileIdx = calculateAutotile(tx, ty);
    }
    constructionJobs = [];
    pendingJobsCount = 0;
    completedJobsCount = 0;
    for (const w of workmen) {
      w.state = 'idle';
      w.jobId = null;
    }
    workmenTelemetry = `${workmen.length} Idle at Delivery Zone`;
  }

  // ==========================================
  // TASK 3.1: ELECTRICAL GRID & OVERLOAD CONTROL
  // ==========================================

  function setupDefaultDemoCircuit() {
    electricityManager.cables.clear();
    electricityManager.capacitors.clear();
    electricityManager.powerStations.clear();
    electricityManager.appliances.clear();

    // Power Station 1 at (242, 246) with 2 adjacent capacitors = 2,000W
    electricityManager.addPowerStation(1, 242, 246);
    electricityManager.addCapacitor(241, 246);
    electricityManager.addCapacitor(245, 246);

    // Cable line from (245, 247) across to (260, 247)
    for (let x = 245; x <= 260; x++) {
      electricityManager.placeCable(x, 247);
    }

    // Connect appliances along the cable:
    // 2 x 150W CCTV Monitors = 300W
    electricityManager.addAppliance(1, 248, 247, 'cctv');
    electricityManager.addAppliance(2, 251, 247, 'cctv');
    // 1 x 250W Metal Detector = 250W
    electricityManager.addAppliance(3, 255, 247, 'metal_detector');
    // 1 x 600W Workshop Saw = 600W
    electricityManager.addAppliance(4, 259, 247, 'workshop_saw');

    electricityManager.solve();
    electricalTelemetry = electricityManager.getTelemetry();
    electricalLogMessage = '⚡ Stable Circuit: 1,150W Load / 2,000W Capacity (57.5% Load Factor)';
  }

  function triggerElectricalOverloadDemo() {
    // Add 3 Workshop Saws (3 * 600W = 1,800W -> 2,950W total > 2,000W capacity)
    for (let x = 261; x <= 267; x++) {
      electricityManager.placeCable(x, 247);
    }
    electricityManager.addAppliance(5, 262, 247, 'workshop_saw');
    electricityManager.addAppliance(6, 264, 247, 'workshop_saw');
    electricityManager.addAppliance(7, 266, 247, 'workshop_saw');

    electricityManager.solve();
    electricalTelemetry = electricityManager.getTelemetry();
    electricalLogMessage = '⚠️ OVERLOAD: 2,950W Load exceeded 2,000W Capacity! Power Station breaker tripped!';
  }

  function triggerShortCircuitDemo() {
    // Place second live Power Station 2 at (268, 246) and bridge with cable to (267, 247)
    electricityManager.addPowerStation(2, 268, 246);
    for (let x = 260; x <= 270; x++) {
      electricityManager.placeCable(x, 247);
    }

    electricityManager.solve();
    electricalTelemetry = electricityManager.getTelemetry();
    electricalLogMessage = '💥 CATASTROPHIC SHORT CIRCUIT: 2 Live Power Stations connected! Both breakers tripped with electrical explosion!';
  }

  function resetElectricalBreakers() {
    setupDefaultDemoCircuit();
  }

  // ==========================================
  // TASK 3.2: PLUMBING & BFS PRESSURE HYDRAULICS
  // ==========================================

  function setupPlumbingDemo() {
    for (let i = 0; i < plumbingManager.cells.length; i++) {
      plumbingManager.cells[i].pipeType = 'none';
      plumbingManager.cells[i].coldPressure = 0;
      plumbingManager.cells[i].hotPressure = 0;
    }
    plumbingManager.pumps.clear();
    plumbingManager.boilers.clear();
    plumbingManager.fixtures.clear();

    // 1. Water Pumping Station at (242, 246)
    plumbingManager.addPumpStation(1, 242, 246);

    // 2. Large Cold Pipe Backbone (242..260, 246) -> 100% full pressure
    for (let x = 242; x <= 260; x++) {
      plumbingManager.placePipe(x, 246, 'large_cold');
    }

    // 3. Small Cold Pipe Distribution Branches (distance falloff 2.5%/tile)
    for (let y = 247; y <= 256; y++) {
      plumbingManager.placePipe(250, y, 'small_cold');
      plumbingManager.placePipe(258, y, 'small_cold');
    }

    // 4. Hot Water Boiler at (250, 250) + Small Hot Water Pipes
    plumbingManager.addBoilerStation(1, 250, 250);
    for (let x = 251; x <= 256; x++) {
      plumbingManager.placePipe(x, 250, 'small_hot');
    }

    // 5. Fixtures across the cell blocks
    plumbingManager.addFixture(1, 250, 256, 'toilet');
    plumbingManager.addFixture(2, 254, 250, 'shower');
    plumbingManager.addFixture(3, 258, 256, 'sink');

    plumbingManager.solve();
    plumbingTelemetry = plumbingManager.getTelemetry();
    plumbingLogMessage = `💧 Active Plumbing: ${plumbingTelemetry.suppliedFixtures}/${plumbingTelemetry.totalFixtures} Fixtures Supplied (Avg Pressure: ${plumbingTelemetry.averagePressure.toFixed(0)}%) • Large Pipe Dig Speedup: 500% (0.20x cost)`;
  }

  function triggerPressureFalloffDemo() {
    // Add a long branch of small pipe that exceeds 40 tiles to demonstrate pressure attenuation to 0%
    for (let y = 257; y <= 280; y++) {
      plumbingManager.placePipe(250, y, 'small_cold');
    }
    plumbingManager.addFixture(4, 250, 280, 'toilet');
    plumbingManager.solve();
    plumbingTelemetry = plumbingManager.getTelemetry();
    plumbingLogMessage = `⚠️ PRESSURE ATTENUATION: Branch at tile 40 reached 0% cold pressure (unsupplied fixture)!`;
  }

  // ==========================================
  // TASK 3.3 & 3.4: ROOM ENCLOSURE & CELL QUALITY GRADING
  // ==========================================

  function setupValidCellDemo() {
    roomManager.walls.clear();
    roomManager.objectMap.clear();
    roomManager.zoneMap.clear();
    roomManager.indoorTiles.clear();

    // 2x3 interior cell: x in [245..246], y in [245..247] (Area: 6)
    // Perimeter walls: x in [244..247], y in [244..248]
    for (let x = 244; x <= 247; x++) {
      roomManager.setWall(x, 244, 1);
      roomManager.setWall(x, 248, 1);
    }
    for (let y = 244; y <= 248; y++) {
      roomManager.setWall(244, y, 1);
      roomManager.setWall(247, y, 1);
    }
    // Place Jail Door at (245, 244) which acts as doorway barrier
    roomManager.setWall(245, 244, 0);
    roomManager.placeObject(245, 244, OBJECT_TYPES.JAIL_DOOR);

    // Objects inside cell
    roomManager.placeObject(245, 246, OBJECT_TYPES.BED);
    roomManager.placeObject(246, 246, OBJECT_TYPES.TOILET);

    // Zone as cell and mark as indoor
    for (let y = 245; y <= 247; y++) {
      for (let x = 245; x <= 246; x++) {
        roomManager.setZone(x, y, 'cell');
        roomManager.setIndoor(x, y, true);
      }
    }

    const scan = roomManager.scanRoomEnclosure(245, 245, 'cell');
    const val = roomManager.validateRoomRequirements('cell', scan);
    detectedRoomStatus = {
      enclosed: scan.isFullyEnclosed,
      area: scan.tiles.length,
      issues: val.kind === 'valid' ? [] : [val.kind],
    };
    cellQuality = evaluateCellQualityFromScan('cell', val, scan, false);
    roomTelemetryMessage = `🏠 Standard 2x3 Cell Verified: Area=${scan.tiles.length} tiles • Quality: Grade ${cellQuality.totalScore}/10 (Base Valid)`;
  }

  function setupLuxuryCellDemo() {
    roomManager.walls.clear();
    roomManager.objectMap.clear();
    roomManager.zoneMap.clear();
    roomManager.indoorTiles.clear();

    // 4x4 interior cell: x in [244..247], y in [244..247] (Area: 16)
    // Perimeter walls: x in [243..248], y in [243..248]
    for (let x = 243; x <= 248; x++) {
      roomManager.setWall(x, 243, 1);
      roomManager.setWall(x, 248, 1);
    }
    for (let y = 243; y <= 248; y++) {
      roomManager.setWall(243, y, 1);
      roomManager.setWall(248, y, 1);
    }
    // Place Jail Door at (245, 243)
    roomManager.setWall(245, 243, 0);
    roomManager.placeObject(245, 243, OBJECT_TYPES.JAIL_DOOR);

    // Luxury Furnishings
    roomManager.placeObject(244, 244, OBJECT_TYPES.BED);
    roomManager.placeObject(247, 244, OBJECT_TYPES.TOILET);
    roomManager.placeObject(244, 246, OBJECT_TYPES.TV);
    roomManager.placeObject(247, 246, OBJECT_TYPES.BOOKSHELF);
    roomManager.placeObject(244, 247, OBJECT_TYPES.SHOWER);
    roomManager.placeObject(247, 247, OBJECT_TYPES.WINDOW);

    // Zone as cell and mark as indoor
    for (let y = 244; y <= 247; y++) {
      for (let x = 244; x <= 247; x++) {
        roomManager.setZone(x, y, 'cell');
        roomManager.setIndoor(x, y, true);
      }
    }

    const scan = roomManager.scanRoomEnclosure(244, 244, 'cell');
    const val = roomManager.validateRoomRequirements('cell', scan);
    detectedRoomStatus = {
      enclosed: scan.isFullyEnclosed,
      area: scan.tiles.length,
      issues: val.kind === 'valid' ? [] : [val.kind],
    };
    cellQuality = evaluateCellQualityFromScan('cell', val, scan, true);
    roomTelemetryMessage = `🌟 Luxury 4x4 Cell Verified: Area=16 tiles • Quality: Grade ${cellQuality.totalScore}/10 (Area +2, Window +1, TV +1, Book +1, Shower +1, Base +1)`;
  }

  function setupUnenclosedLeakDemo() {
    // Create a hole in the perimeter wall
    roomManager.setWall(247, 246, 0);
    const scan = roomManager.scanRoomEnclosure(245, 245, 'cell');
    const val = roomManager.validateRoomRequirements('cell', scan);
    detectedRoomStatus = {
      enclosed: scan.isFullyEnclosed,
      area: scan.tiles.length,
      issues: [val.kind === 'valid' ? 'Valid' : `Unenclosed leak detected outside perimeter!`],
    };
    cellQuality = evaluateCellQualityFromScan('cell', val, scan, false);
    roomTelemetryMessage = `⚠️ UNENCLOSED ROOM DETECTED: Flood-fill leak boundary escaped into outdoor perimeter! (Quality: Grade 0)`;
  }

  // ==========================================
  // TASK 4.1: FLOW FIELD MASS NAVIGATION & DOOR WEIGHTING
  // ==========================================

  function setupCanteenMassNavDemo() {
    flowManager.costField = new CostField(512, 512, 1.0);
    flowManager.invalidate();

    navGoalTiles = [
      { x: 256, y: 245 },
      { x: 257, y: 245 },
      { x: 256, y: 246 },
      { x: 257, y: 246 },
    ];
    activeNavGoal = 'canteen';
    doorPolicy = DoorAccessPolicy.PrisonersAndStaff;

    navInmates = [];
    for (let i = 1; i <= 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const radius = 15 + Math.random() * 10;
      navInmates.push({
        id: 100 + i,
        x: 256 + Math.cos(angle) * radius,
        y: 245 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        speed: 3.5 + Math.random() * 1.0,
        entityType: EntityType.Prisoner,
        hasKeys: false,
        reachedGoal: false,
      });
    }

    flowManager.getOrCreateFlowField('canteen', navGoalTiles);
    navTelemetryMessage = `🧭 Chow Time Regime: 50 Prisoners navigating to Canteen via O(1) Flow Field lookup (<1.2ms generation)`;
  }

  function setupYardNavDemo() {
    flowManager.costField = new CostField(512, 512, 1.0);
    flowManager.invalidate();

    navGoalTiles = [
      { x: 245, y: 265 },
      { x: 246, y: 265 },
      { x: 247, y: 265 },
    ];
    activeNavGoal = 'yard';
    doorPolicy = DoorAccessPolicy.UnlockedAll;

    navInmates = [];
    for (let i = 1; i <= 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const radius = 12 + Math.random() * 8;
      navInmates.push({
        id: 100 + i,
        x: 256 + Math.cos(angle) * radius,
        y: 250 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        speed: 3.2 + Math.random() * 0.8,
        entityType: EntityType.Prisoner,
        hasKeys: false,
        reachedGoal: false,
      });
    }

    flowManager.getOrCreateFlowField('yard', navGoalTiles);
    navTelemetryMessage = `🏃 Yard Recreation Regime: 50 Prisoners streaming towards Outdoor Yard`;
  }

  function setupLockedDoorDetourDemo() {
    flowManager.costField = new CostField(512, 512, 1.0);
    // Erect a solid security wall with a locked staff-only door in middle
    for (let y = 240; y <= 260; y++) {
      flowManager.costField.setImpassable(252, y);
    }
    flowManager.invalidate();

    navGoalTiles = [{ x: 260, y: 245 }];
    activeNavGoal = 'canteen';
    doorPolicy = DoorAccessPolicy.StaffOnly;

    navInmates = [];
    for (let i = 1; i <= 30; i++) {
      navInmates.push({
        id: 100 + i,
        x: 246 + (Math.random() - 0.5) * 4,
        y: 245 + (Math.random() - 0.5) * 4,
        vx: 0,
        vy: 0,
        speed: 3.5,
        entityType: EntityType.Prisoner,
        hasKeys: false,
        reachedGoal: false,
      });
    }

    flowManager.getOrCreateFlowField('detour', navGoalTiles);
    navTelemetryMessage = `🔒 Locked Security Wall: Inmates autonomously path around 20-tile barrier via open corridor at (252, 262)`;
  }

  function triggerLockdownNavDemo() {
    doorPolicy = DoorAccessPolicy.LockedShut;
    navTelemetryMessage = `🚨 EMERGENCY LOCKDOWN: All doors sealed shut! Flow integration cost set to Infinity for all prisoner pathways`;
  }

  function stepConstructionJobs(dt: number) {
    // 1. Assign idle workmen to queued jobs
    for (const worker of workmen) {
      if (worker.state === 'idle') {
        const nextJob = constructionJobs.find(j => j.status === 'queued');
        if (nextJob) {
          nextJob.status = 'fetching';
          worker.state = 'walking_to_delivery';
          worker.jobId = nextJob.id;
          worker.targetX = deliveryX;
          worker.targetY = deliveryY;
        }
      }
    }

    // 2. Process active workmen
    let buildingCount = 0;
    let carryingCount = 0;

    for (const worker of workmen) {
      if (worker.state === 'walking_to_delivery') {
        const dx = deliveryX - worker.x;
        const dy = deliveryY - worker.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.6) {
          // Reached delivery zone! Pick up materials
          const job = constructionJobs.find(j => j.id === worker.jobId);
          if (job) {
            job.status = 'constructing';
            worker.state = 'carrying_material';
            worker.targetX = job.x + 0.5;
            worker.targetY = job.y + 0.5;
          } else {
            worker.state = 'idle';
            worker.jobId = null;
          }
        } else {
          worker.x += (dx / dist) * worker.speed * dt;
          worker.y += (dy / dist) * worker.speed * dt;
        }
      } else if (worker.state === 'carrying_material') {
        carryingCount++;
        const dx = worker.targetX - worker.x;
        const dy = worker.targetY - worker.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.6) {
          // Arrived at job site! Start erecting wall
          worker.state = 'building';
        } else {
          worker.x += (dx / dist) * worker.speed * dt;
          worker.y += (dy / dist) * worker.speed * dt;
        }
      } else if (worker.state === 'building') {
        buildingCount++;
        const job = constructionJobs.find(j => j.id === worker.jobId);
        if (job) {
          job.progressTicks += 1;
          if (job.progressTicks >= job.totalTicks) {
            // Job completed! Clear blueprint flag and commit solid autotiled wall
            job.status = 'completed';
            const wallTile = sampleWalls.get(`${job.x},${job.y}`);
            if (wallTile) {
              wallTile.isBlueprint = false;
              updateAutotileWithNeighbors(job.x, job.y);
            }
            completedJobsCount += 1;
            worker.state = 'idle';
            worker.jobId = null;
          }
        } else {
          worker.state = 'idle';
          worker.jobId = null;
        }
      }
    }

    pendingJobsCount = constructionJobs.filter(j => j.status !== 'completed').length;
    if (buildingCount > 0 || carryingCount > 0) {
      workmenTelemetry = `${workmen.length} Workmen (${buildingCount} Building, ${carryingCount} Carrying Materials)`;
    } else {
      workmenTelemetry = `${workmen.length} Workmen Idle at Delivery Zone`;
    }

    // Pass dynamic entities to renderer
    if (renderer) {
      const workmanEntities = workmen.map(w => ({
        id: w.id,
        x: w.x,
        y: w.y,
        spriteIndex: 2, // char_workman
        statusFlags: w.state === 'carrying_material' ? 2 : (w.state === 'building' ? 3 : 1),
        rotation: 0,
      }));

      const inmateEntities = navInmates.map(inmate => ({
        id: inmate.id,
        x: inmate.x,
        y: inmate.y,
        spriteIndex: 1, // char_prisoner
        statusFlags: inmate.reachedGoal ? 0 : 1,
        rotation: Math.atan2(inmate.vy, inmate.vx),
      }));

      renderer.setRenderEntities([...workmanEntities, ...inmateEntities]);
    }
  }

  function centerCamera() {
    renderer?.camera.setPosition(256, 256);
  }

  function setCameraZoom(zoom: number) {
    if (renderer) {
      renderer.camera.zoom = zoom;
    }
  }

  let metrics = $state<SimulationMetrics>({
    simTick: 0,
    simTimeMs: 0,
    readSlot: 0,
    writeSlot: 1,
    cleanSlot: 2,
    dangerLevel: 0,
    bankBalance: 40000,
    prisonerCount: 0,
    guardCount: 0,
  });

  let interpolationAlpha = $state(0.0);
  let inputHead = $state(0);
  let inputTail = $state(0);
  let commandLog = $state<Array<{ name: string; time: string; cost?: string }>>([]);

  // Task 2.2: 4-Bit Autotile Visualizer State (5x5 grid)
  let autotileGrid = $state<boolean[][]>([
    [false, false, false, false, false],
    [false, true,  true,  true,  false],
    [false, true,  false, true,  false],
    [false, true,  true,  true,  false],
    [false, false, false, false, false],
  ]);
  let dirtyChunkEvents = $state(16);

  function get4BitMask(x: number, y: number, grid: boolean[][]): number {
    if (!grid[y]?.[x]) return 0;
    let mask = 0;
    if (y > 0 && grid[y - 1]?.[x]) mask |= 1; // North: 1
    if (x < 4 && grid[y]?.[x + 1]) mask |= 2; // East: 2
    if (y < 4 && grid[y + 1]?.[x]) mask |= 4; // South: 4
    if (x > 0 && grid[y]?.[x - 1]) mask |= 8; // West: 8
    return mask;
  }

  function toggleCell(x: number, y: number) {
    const next = autotileGrid.map((row, ry) =>
      row.map((val, rx) => (rx === x && ry === y ? !val : val))
    );
    autotileGrid = next;
    dirtyChunkEvents += 1;
  }

  function setArchetype(type: 'pillar' | 'horizontal' | 'vertical' | 't-junction' | 'cross' | 'room') {
    const next: boolean[][] = Array.from({ length: 5 }, () => Array(5).fill(false));
    if (type === 'pillar') {
      next[2][2] = true;
    } else if (type === 'horizontal') {
      next[2][1] = true;
      next[2][2] = true;
      next[2][3] = true;
    } else if (type === 'vertical') {
      next[1][2] = true;
      next[2][2] = true;
      next[3][2] = true;
    } else if (type === 't-junction') {
      next[1][2] = true; // North
      next[2][2] = true; // Center
      next[3][2] = true; // South
      next[2][3] = true; // East
    } else if (type === 'cross') {
      next[1][2] = true; // N
      next[2][1] = true; // W
      next[2][2] = true; // Center
      next[2][3] = true; // E
      next[3][2] = true; // S
    } else if (type === 'room') {
      for (let y = 1; y <= 3; y++) {
        for (let x = 1; x <= 3; x++) {
          if (x === 1 || x === 3 || y === 1 || y === 3) {
            next[y][x] = true;
          }
        }
      }
    }
    autotileGrid = next;
    dirtyChunkEvents += 1;
  }

  function dispatchCommand(commandType: number, name: string, cost?: string) {
    if (!sharedBridge || !consumer) return;

    const cmd: UserCommandInput = {
      commandType,
      targetTileX: Math.floor(Math.random() * 100),
      targetTileY: Math.floor(Math.random() * 100),
      width: 1,
      height: 1,
      payloadParam: 101,
      timestampMs: performance.now(),
    };

    const success = consumer.enqueueUserCommand(sharedBridge, cmd);
    if (success) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      commandLog = [{ name, time: timeStr, cost }, ...commandLog.slice(0, 5)];
    }
  }

  onMount(() => {
    crossOriginIsolated = window.crossOriginIsolated ?? false;

    // 1. Allocate SharedArrayBuffer & initialize Atomic Control Block
    try {
      if (crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined') {
        sharedBridge = new SharedMemoryBridge();
        sharedBridge.initializeControlBlock(4_000_000); // $40,000.00
        consumer = new TripleBufferConsumer(0);
      }
    } catch (err) {
      console.error('[Main Thread] SharedMemoryBridge allocation failed:', err);
    }

    // 2. Instantiate Simulation Web Worker
    simulationWorker = new Worker(
      new URL('./workers/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    );

    simulationWorker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
      const msg = e.data;
      if (msg.type === 'READY') {
        workerStatus = 'Online';
        sharedMemoryAttached = msg.sharedMemoryAttached ?? false;

        simulationWorker?.postMessage({
          type: 'PING',
          payload: 'System Handshake & Shared Memory Verification',
        } as WorkerInMessage);
      } else if (msg.type === 'PONG') {
        workerPingReply = msg.message;
      }
    };

    // 3. Send INIT message with SharedArrayBuffer to Worker
    simulationWorker.postMessage({
      type: 'INIT',
      payload: {
        sharedBuffer: sharedBridge?.buffer,
      },
    } as WorkerInMessage);

    // 4. Initialize WebGPU Renderer, DragBoxTool & Tile Map
    if (canvasElement) {
      clearCustomWalls();
      setupDefaultDemoCircuit();
      setupPlumbingDemo();
      setupValidCellDemo();

      renderer = new WebGPURenderer(canvasElement, 1.0);
      renderer.isPanToolActive = false; // Default: Wall tool active for drag construction

      dragTool = new DragBoxTool(canvasElement, renderer.camera);
      dragTool.setMode(activeToolMode);
      dragTool.setHollow(toolHollow);

      dragTool.onGhostChange = (ghosts) => {
        renderer?.setActiveGhostTiles(ghosts);
        if (ghosts.length > 0) {
          const bounds = dragTool?.getActiveBounds();
          const cost = (ghosts.length * (dragTool?.getMaterialUnitCostCents() ?? 5000)) / 100;
          activeDragSummary = `${bounds?.width}×${bounds?.height} (${ghosts.length} tiles) • Est: $${cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        } else {
          activeDragSummary = 'Ready to Drag & Build';
        }
      };

      dragTool.onCommitRect = (cmd) => {
        queueWallRect(cmd);
      };

      renderer.setTileSource({
        width: 512,
        height: 512,
        chunksX: 16,
        chunksY: 16,
        getTile: (tx: number, ty: number) => {
          const tile = sampleWalls.get(`${tx},${ty}`);
          if (!tile) {
            return { terrainId: 1, floorId: 0, wallId: 0, autotileIdx: 0, health: 100 };
          }
          return {
            terrainId: 1,
            floorId: 0,
            wallId: tile.wallId,
            autotileIdx: tile.autotileIdx,
            health: 200,
            isBlueprint: tile.isBlueprint,
          };
        },
      });

      renderer.initialize().then(() => {
        if (renderer) rendererMetrics = renderer.getMetrics();
      });
    }

    // 5. Main Thread render sampling loop (Native Refresh Rate 60/120/144Hz)
    let animId: number;
    const renderLoop = (timestamp: number) => {
      if (sharedBridge && consumer) {
        const sample = consumer.acquireRenderSnapshot(sharedBridge, timestamp);
        interpolationAlpha = sample.alpha;
        metrics = sharedBridge.getMetrics();

        // Sample SPSC queue atomic pointers
        inputHead = Atomics.load(sharedBridge.ctrlInt32, CTRL.INPUT_HEAD);
        inputTail = Atomics.load(sharedBridge.ctrlInt32, CTRL.INPUT_TAIL);
      }

      // Step local Workman & Construction Job Simulation
      stepConstructionJobs(1 / 60);

      // Step Flow Field Navigating Inmates
      if (navInmates.length > 0) {
        const flow = flowManager.getOrCreateFlowField(activeNavGoal, navGoalTiles);
        flowManager.stepAgents(navInmates, flow, navGoalTiles, 1 / 60);
      }

      if (renderer) {
        renderer.setElectricalData({
          cables: electricityManager.cables,
          capacitors: electricityManager.capacitors,
          powerStations: electricityManager.powerStations,
          appliances: electricityManager.appliances,
          tilePowerCache: electricityManager.tilePowerCache,
          hasShortCircuit: electricityManager.hasShortCircuitFault,
          isOverlayActive: isUtilityOverlayActive,
        });
        renderer.render();
        rendererMetrics = renderer.getMetrics();
      }

      animId = requestAnimationFrame(renderLoop);
    };
    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      simulationWorker?.terminate();
    };
  });
</script>

<main class="h-full w-full flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-y-auto">
  <!-- Top Blueprint Header & Prison Status Bar -->
  <header class="h-16 border-b border-cyan-900/60 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between shadow-xl sticky top-0 z-50">
    <div class="flex items-center space-x-4">
      <div class="flex items-center space-x-2.5">
        <div class="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
        <h1 class="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 uppercase font-mono">
          Prison Architect
        </h1>
        <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 font-mono tracking-widest uppercase">
          Wasm Engine v0.1.0
        </span>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="hidden md:flex items-center space-x-6 text-xs font-mono border-l border-slate-800 pl-6">
        <div>
          <span class="text-slate-500 uppercase text-[10px] block">Cash</span>
          <span class="text-emerald-400 font-bold tracking-wide">${metrics.bankBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div>
          <span class="text-slate-500 uppercase text-[10px] block">Inmates</span>
          <span class="text-amber-400 font-bold tracking-wide">{metrics.prisonerCount}</span>
        </div>
        <div>
          <span class="text-slate-500 uppercase text-[10px] block">Guards</span>
          <span class="text-cyan-400 font-bold tracking-wide">{metrics.guardCount}</span>
        </div>
        <div>
          <span class="text-slate-500 uppercase text-[10px] block">Danger</span>
          <span class="{metrics.dangerLevel > 50 ? 'text-rose-400' : 'text-amber-400'} font-bold tracking-wide">{metrics.dangerLevel.toFixed(1)}%</span>
        </div>
        <div>
          <span class="text-slate-500 uppercase text-[10px] block">Tick (60Hz)</span>
          <span class="text-cyan-300 font-bold tracking-wide font-mono">{metrics.simTick.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <!-- System Diagnostic Badges -->
    <div class="flex items-center space-x-3 text-xs font-mono">
      <div class="flex items-center space-x-1.5 px-3 py-1 rounded-md border {crossOriginIsolated ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300' : 'bg-rose-950/60 border-rose-700/80 text-rose-300'}">
        <span class="w-2 h-2 rounded-full {crossOriginIsolated ? 'bg-emerald-400' : 'bg-rose-400'}"></span>
        <span class="hidden sm:inline">COOP/COEP:</span>
        <span class="font-bold">{crossOriginIsolated ? 'ISOLATED' : 'BLOCKED'}</span>
      </div>

      <div class="flex items-center space-x-1.5 px-3 py-1 rounded-md border {workerStatus === 'Online' ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300' : 'bg-amber-950/60 border-amber-700/80 text-amber-300'}" title={workerPingReply}>
        <span class="w-2 h-2 rounded-full {workerStatus === 'Online' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}"></span>
        <span class="hidden sm:inline">Worker:</span>
        <span class="font-bold">{workerStatus}</span>
      </div>

      <div class="flex items-center space-x-1.5 px-3 py-1 rounded-md border {sharedMemoryAttached ? 'bg-cyan-950/60 border-cyan-700/80 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'}">
        <span class="w-2 h-2 rounded-full {sharedMemoryAttached ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}"></span>
        <span class="hidden sm:inline">SAB:</span>
        <span class="font-bold">{sharedMemoryAttached ? '12.66 MB' : 'OFFLINE'}</span>
      </div>
    </div>
  </header>

  <!-- Main Blueprint Dashboard -->
  <div class="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
    <!-- Top System Verification Banner -->
    <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-indigo-950/40 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div class="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none"></div>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono mb-2">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            <span>Phase 4 • Flow Field Mass Navigation & Agent AI (13 of 28 Tasks Complete &bull; 46%)</span>
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Flow Field Vector Navigation, Dijkstra Wavefronts & Door Weighting</h2>
          <p class="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time 2D integration fields and directional vector maps for collective goals (Canteen, Yard, Cells), applying clearance costs and dynamic detours around locked doors and security barriers.
          </p>
        </div>

        <div class="flex items-center space-x-3 text-xs font-mono">
          <div class="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
            <span class="text-slate-500 block text-[10px]">Render FPS:</span>
            <span class="text-emerald-400 font-bold text-base">{rendererMetrics.fps} FPS</span>
          </div>
          <div class="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
            <span class="text-slate-500 block text-[10px]">Progress:</span>
            <span class="text-indigo-400 font-bold text-base">13 / 28 (46%)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 8-Stage ECS Pipeline Visualization -->
    <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center space-x-2">
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Bevy ECS 8-Stage Execution Pipeline (Deterministic Order)</span>
        </h3>
        <span class="text-[11px] font-mono text-slate-400">Fixed 60Hz &bull; 16.66ms per step</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs font-mono">
        <div class="p-2 rounded-lg bg-slate-950/80 border border-cyan-800/60 text-cyan-300">
          <span class="text-[9px] text-slate-500 uppercase block">Stage 1</span>
          <span class="font-bold text-[11px] block mt-0.5">Input</span>
          <span class="text-[9px] text-slate-400 block mt-0.5">SPSC Drain</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
          <span class="text-[9px] text-slate-500 uppercase block">Stage 2</span>
          <span class="font-bold text-[11px] block mt-0.5">Spatial</span>
          <span class="text-[9px] text-slate-400 block mt-0.5">Grid & Rooms</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
          <span class="text-[9px] text-slate-500 uppercase block">Stage 3</span>
          <span class="font-bold text-[11px] block mt-0.5">Perception</span>
          <span class="text-[9px] text-slate-400 block mt-0.5">Needs Decay</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
          <span class="text-[9px] text-slate-500 uppercase block">Stage 4</span>
          <span class="font-bold text-[11px] block mt-0.5">Pathfinding</span>
          <span class="text-[9px] text-slate-400 block mt-0.5">Flow Fields</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-950/80 border border-emerald-800/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
          <span class="text-[9px] text-emerald-500 uppercase block">Stage 5</span>
          <span class="font-bold text-[11px] block mt-0.5">Physics</span>
          <span class="text-[9px] text-emerald-400 block mt-0.5">Move 1,000 e</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
          <span class="text-[9px] text-slate-500 uppercase block">Stage 6</span>
          <span class="font-bold text-[11px] block mt-0.5">Combat</span>
          <span class="text-[9px] text-slate-400 block mt-0.5">Security/Alert</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
          <span class="text-[9px] text-slate-500 uppercase block">Stage 7</span>
          <span class="font-bold text-[11px] block mt-0.5">Economy</span>
          <span class="text-[9px] text-slate-400 block mt-0.5">Cash & Grants</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-950/80 border border-purple-800/60 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
          <span class="text-[9px] text-purple-400 uppercase block">Stage 8</span>
          <span class="font-bold text-[11px] block mt-0.5">Render</span>
          <span class="text-[9px] text-purple-400 block mt-0.5">Triple Commit</span>
        </div>
      </div>
    </div>

    <!-- Interactive Command Dispatch Toolbar (Main Thread -> SPSC Queue) -->
    <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center space-x-2">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Interactive SPSC Command Dispatcher</span>
        </h3>
        <div class="text-xs font-mono text-slate-400">
          Ring Pointers: Head <span class="text-amber-400 font-bold">{inputHead}</span> / Tail <span class="text-cyan-400 font-bold">{inputTail}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onclick={() => dispatchCommand(1, 'Place Perimeter Wall', '-$50.00')}
          class="px-4 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-cyan-500 text-xs font-mono text-cyan-300 font-semibold transition-all shadow-md active:scale-95 flex items-center justify-between cursor-pointer"
        >
          <span>🧱 Build Wall</span>
          <span class="text-[10px] text-slate-400">-$50</span>
        </button>

        <button
          onclick={() => dispatchCommand(2, 'Zone Cell Block', '+2 Inmates')}
          class="px-4 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-500 text-xs font-mono text-amber-300 font-semibold transition-all shadow-md active:scale-95 flex items-center justify-between cursor-pointer"
        >
          <span>🛏️ Zone Cell</span>
          <span class="text-[10px] text-slate-400">+2 Inmates</span>
        </button>

        <button
          onclick={() => dispatchCommand(3, 'Hire Security Guard', '-$500.00')}
          class="px-4 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500 text-xs font-mono text-emerald-300 font-semibold transition-all shadow-md active:scale-95 flex items-center justify-between cursor-pointer"
        >
          <span>👮 Hire Guard</span>
          <span class="text-[10px] text-slate-400">-$500</span>
        </button>

        <button
          onclick={() => dispatchCommand(4, 'Toggle Lockdown', 'Emergency')}
          class="px-4 py-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-700/80 hover:border-rose-500 text-xs font-mono text-rose-300 font-semibold transition-all shadow-md active:scale-95 flex items-center justify-between cursor-pointer"
        >
          <span>🚨 Lockdown</span>
          <span class="text-[10px] text-rose-400">Toggle</span>
        </button>
      </div>

      {#if commandLog.length > 0}
        <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center space-x-2 text-[11px] font-mono overflow-x-auto text-slate-400">
          <span class="text-slate-500 uppercase text-[10px] whitespace-nowrap">Recent Dispatches:</span>
          {#each commandLog as entry}
            <span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 whitespace-nowrap">
              {entry.name} <span class="text-cyan-400">({entry.time})</span>
            </span>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Task 2.2: Interactive 4-Bit Autotiling Laboratory -->
    <div class="p-5 rounded-xl bg-slate-900/80 border border-teal-800/60 shadow-xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-teal-400 font-mono flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span>Interactive 4-Bit Autotiling & Neighbor Connectivity Laboratory</span>
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Click any cell to toggle walls and observe real-time bitmask recalculations & dirty chunk events</p>
        </div>
        <div class="flex items-center space-x-3 text-xs font-mono">
          <span class="px-2.5 py-1 rounded bg-teal-950/80 border border-teal-700/80 text-teal-300">
            Dirty Events: <strong class="text-white">{dirtyChunkEvents}</strong>
          </span>
          <span class="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            Formula: <code class="text-teal-300">N&times;1 + E&times;2 + S&times;4 + W&times;8</code>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <!-- 5x5 Interactive Mini-Grid -->
        <div class="lg:col-span-6 flex flex-col items-center">
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 shadow-inner inline-block">
            <div class="grid grid-cols-5 gap-1.5">
              {#each autotileGrid as row, y}
                {#each row as isWall, x}
                  {@const mask = get4BitMask(x, y, autotileGrid)}
                  {@const hasN = (mask & 1) !== 0}
                  {@const hasE = (mask & 2) !== 0}
                  {@const hasS = (mask & 4) !== 0}
                  {@const hasW = (mask & 8) !== 0}
                  <button
                    onclick={() => toggleCell(x, y)}
                    class="w-14 h-14 rounded-lg relative flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-90 border {isWall ? 'bg-teal-950/90 border-teal-500 text-teal-200 shadow-[0_0_12px_rgba(20,184,166,0.3)]' : 'bg-slate-900/60 border-slate-800/80 text-slate-600 hover:border-slate-700'}"
                    title="Tile ({x}, {y}) - {isWall ? `Wall Autotile Mask: ${mask}` : 'Empty Tile'}"
                  >
                    {#if isWall}
                      <!-- Visual connection cross arms -->
                      {#if hasN}
                        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-teal-400 rounded-b"></div>
                      {/if}
                      {#if hasS}
                        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-teal-400 rounded-t"></div>
                      {/if}
                      {#if hasW}
                        <div class="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-3 bg-teal-400 rounded-r"></div>
                      {/if}
                      {#if hasE}
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-3 bg-teal-400 rounded-l"></div>
                      {/if}

                      <span class="font-mono text-xs font-black text-teal-300 z-10">{mask}</span>
                      <span class="text-[8px] font-mono text-teal-400/80 uppercase mt-0.5 z-10">
                        {hasN ? 'N' : ''}{hasE ? 'E' : ''}{hasS ? 'S' : ''}{hasW ? 'W' : ''}{mask === 0 ? 'ISO' : ''}
                      </span>
                    {:else}
                      <span class="w-1.5 h-1.5 rounded-full bg-slate-700/60"></span>
                      <span class="text-[8px] font-mono text-slate-600 mt-1">({x},{y})</span>
                    {/if}
                  </button>
                {/each}
              {/each}
            </div>
          </div>
          <span class="text-[10px] text-slate-500 font-mono mt-2">Click any grid cell to place or remove a wall</span>
        </div>

        <!-- Archetype Presets & Connectivity Breakdown -->
        <div class="lg:col-span-6 space-y-4">
          <div>
            <span class="text-xs font-mono uppercase text-slate-400 block mb-2 font-semibold">Topology Archetype Presets:</span>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <button
                onclick={() => setArchetype('pillar')}
                class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500 text-teal-300 font-medium transition-all text-left flex flex-col cursor-pointer"
              >
                <span>🏛️ Single Pillar</span>
                <span class="text-[10px] text-slate-400">Mask: 0 (Isolated)</span>
              </button>

              <button
                onclick={() => setArchetype('horizontal')}
                class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500 text-teal-300 font-medium transition-all text-left flex flex-col cursor-pointer"
              >
                <span>↔️ Horizontal Wall</span>
                <span class="text-[10px] text-slate-400">Mask: 10 (E + W)</span>
              </button>

              <button
                onclick={() => setArchetype('vertical')}
                class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500 text-teal-300 font-medium transition-all text-left flex flex-col cursor-pointer"
              >
                <span>↕️ Vertical Wall</span>
                <span class="text-[10px] text-slate-400">Mask: 5 (N + S)</span>
              </button>

              <button
                onclick={() => setArchetype('t-junction')}
                class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500 text-teal-300 font-medium transition-all text-left flex flex-col cursor-pointer"
              >
                <span>┳ T-Junction</span>
                <span class="text-[10px] text-slate-400">Mask: 7 (N + E + S)</span>
              </button>

              <button
                onclick={() => setArchetype('cross')}
                class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500 text-teal-300 font-medium transition-all text-left flex flex-col cursor-pointer"
              >
                <span>➕ Cross-Junction</span>
                <span class="text-[10px] text-slate-400">Mask: 15 (NESW)</span>
              </button>

              <button
                onclick={() => setArchetype('room')}
                class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500 text-teal-300 font-medium transition-all text-left flex flex-col cursor-pointer"
              >
                <span>🏠 Enclosed Cell</span>
                <span class="text-[10px] text-slate-400">Corners: 3, 6, 9, 12</span>
              </button>
            </div>
          </div>

          <!-- Bit Allocation Legend -->
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono space-y-1.5">
            <div class="text-[11px] text-slate-400 font-semibold uppercase flex items-center justify-between">
              <span>Cardinal Bit Weighting</span>
              <span class="text-teal-400">Atlas: 4 &times; 4 Quads</span>
            </div>
            <div class="grid grid-cols-4 gap-2 text-center pt-1">
              <div class="p-1 rounded bg-slate-900 border border-slate-800">
                <span class="text-slate-400 block text-[10px]">North</span>
                <span class="text-teal-300 font-bold">1 &bull; 2⁰</span>
              </div>
              <div class="p-1 rounded bg-slate-900 border border-slate-800">
                <span class="text-slate-400 block text-[10px]">East</span>
                <span class="text-teal-300 font-bold">2 &bull; 2¹</span>
              </div>
              <div class="p-1 rounded bg-slate-900 border border-slate-800">
                <span class="text-slate-400 block text-[10px]">South</span>
                <span class="text-teal-300 font-bold">4 &bull; 2²</span>
              </div>
              <div class="p-1 rounded bg-slate-900 border border-slate-800">
                <span class="text-slate-400 block text-[10px]">West</span>
                <span class="text-teal-300 font-bold">8 &bull; 2³</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task 2.3 & 2.4: WebGPU World Viewport, Camera & Drag-Rect Construction Tool -->
    <div class="p-5 rounded-xl bg-slate-900/80 border border-cyan-800/60 shadow-2xl relative overflow-hidden space-y-4">
      <!-- Section Header & Real-time Metrics -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div class="flex items-center space-x-3">
          <div class="w-3.5 h-3.5 rounded-full {activeViewTab === 'electricity' ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.9)]' : activeViewTab === 'plumbing' ? 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.9)]' : activeViewTab === 'rooms' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]' : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]'} animate-pulse"></div>
          <div>
            <h3 class="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center space-x-2">
              <span>WebGPU Viewport & Simulation Subsystems</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-600/60 text-cyan-300 font-normal">Phase 3 Live</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Drag-Rect Workman Jobs • Disjoint-Set Electrical Solver • BFS Hydraulic Pipes • Spatial Room Enclosure</p>
          </div>
        </div>

        <!-- View Mode Switcher -->
        <div class="flex flex-wrap items-center rounded-lg bg-slate-950 p-1 border border-slate-800 gap-1">
          <button
            onclick={() => (activeViewTab = 'architecture')}
            class="px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer {activeViewTab === 'architecture' ? 'bg-cyan-900 text-cyan-100 font-bold shadow' : 'text-slate-400 hover:text-slate-200'}"
          >
            🧱 Architecture (2.4)
          </button>
          <button
            onclick={() => (activeViewTab = 'electricity')}
            class="px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer {activeViewTab === 'electricity' ? 'bg-amber-900 text-amber-100 font-bold shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-slate-400 hover:text-slate-200'}"
          >
            ⚡ Electricity (3.1)
          </button>
          <button
            onclick={() => (activeViewTab = 'plumbing')}
            class="px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer {activeViewTab === 'plumbing' ? 'bg-blue-900 text-blue-100 font-bold shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'text-slate-400 hover:text-slate-200'}"
          >
            💧 Plumbing (3.2)
          </button>
          <button
            onclick={() => (activeViewTab = 'rooms')}
            class="px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer {activeViewTab === 'rooms' ? 'bg-emerald-900 text-emerald-100 font-bold shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'text-slate-400 hover:text-slate-200'}"
          >
            🏠 Rooms (3.3)
          </button>
          <button
            onclick={() => (activeViewTab = 'navigation')}
            class="px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer {activeViewTab === 'navigation' ? 'bg-indigo-900 text-indigo-100 font-bold shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'text-slate-400 hover:text-slate-200'}"
          >
            🧭 Navigation (4.1)
          </button>
        </div>

        <!-- Telemetry Badges -->
        <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span class="px-2.5 py-1 rounded bg-slate-950 border border-cyan-700/60 text-cyan-300 font-bold">
            ⚡ {rendererMetrics.fps} FPS
          </span>
          <span class="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            Backend: <strong class="{rendererMetrics.backend === 'WebGPU' ? 'text-emerald-400' : 'text-amber-400'}">{rendererMetrics.backend}</strong>
          </span>
          {#if activeViewTab === 'electricity'}
            <span class="px-2.5 py-1 rounded bg-slate-950 border border-amber-700/60 text-amber-300 font-bold">
              ⚡ {electricalTelemetry.totalLoad}W / {electricalTelemetry.totalCapacity}W ({electricalTelemetry.loadFactorPercent}%)
            </span>
            {#if electricalTelemetry.hasShortCircuit}
              <span class="px-2.5 py-1 rounded bg-red-950 border border-red-500 text-red-200 font-bold animate-pulse">
                💥 SHORT CIRCUIT!
              </span>
            {:else if electricalTelemetry.trippedBreakers > 0}
              <span class="px-2.5 py-1 rounded bg-amber-950 border border-amber-500 text-amber-200 font-bold">
                ⚠️ BREAKER TRIPPED
              </span>
            {/if}
          {:else if activeViewTab === 'plumbing'}
            <span class="px-2.5 py-1 rounded bg-slate-950 border border-blue-700/60 text-blue-300 font-bold">
              💧 {plumbingTelemetry.suppliedFixtures}/{plumbingTelemetry.totalFixtures} Supplied ({plumbingTelemetry.averagePressure.toFixed(0)}% Avg)
            </span>
          {:else if activeViewTab === 'rooms'}
            <span class="px-2.5 py-1 rounded bg-slate-950 border border-emerald-700/60 text-emerald-300 font-bold">
              🏠 {detectedRoomStatus.enclosed ? 'Enclosed' : 'Unenclosed'} ({detectedRoomStatus.area} tiles)
            </span>
          {:else if activeViewTab === 'navigation'}
            <span class="px-2.5 py-1 rounded bg-slate-950 border border-indigo-700/60 text-indigo-300 font-bold">
              🧭 Goal: {activeNavGoal.toUpperCase()} ({navInmates.length} Agents)
            </span>
            <span class="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
              Door Policy: <strong class="{doorPolicy === DoorAccessPolicy.LockedShut ? 'text-rose-400' : 'text-emerald-400'}">{doorPolicy === DoorAccessPolicy.LockedShut ? 'Locked Shut' : doorPolicy === DoorAccessPolicy.StaffOnly ? 'Staff Only' : 'Prisoners & Staff'}</strong>
            </span>
          {:else}
            <span class="px-2.5 py-1 rounded bg-slate-950 border border-amber-800/60 text-amber-300 font-bold">
              👷 {workmenCount} Workmen
            </span>
            <span class="px-2.5 py-1 rounded bg-slate-950 border border-teal-800/60 text-teal-300">
              🔨 {pendingJobsCount} Queued • {completedJobsCount} Built
            </span>
          {/if}
          <span class="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            Cam: ({rendererMetrics.cameraX}, {rendererMetrics.cameraY}) @ <strong class="text-teal-300">{rendererMetrics.zoom}x</strong>
          </span>
        </div>
      </div>

      {#if activeViewTab === 'electricity'}
        <!-- Task 3.1: Electrical Utility Controls & Scenario Actions -->
        <div class="p-3 rounded-lg bg-slate-950/90 border border-amber-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-amber-400 font-bold uppercase text-[10px] mr-1 flex items-center space-x-1">
              <span>⚡ Electrical Scenarios:</span>
            </span>

            <button
              onclick={setupDefaultDemoCircuit}
              class="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/80 text-emerald-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(16,185,129,0.3)] active:scale-95"
              title="Setup stable 2,000W circuit with 1 Power Station, 2 Capacitors, and 1,150W appliance load"
            >
              <span>⚡ 2,000W Stable Grid</span>
            </button>

            <button
              onclick={triggerElectricalOverloadDemo}
              class="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/80 text-amber-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(245,158,11,0.3)] active:scale-95"
              title="Connect 3 heavy Workshop Saws (+1,800W) to exceed 2,000W capacity and trip breaker"
            >
              <span>⚠️ Test Overload (+1,800W Saws)</span>
            </button>

            <button
              onclick={triggerShortCircuitDemo}
              class="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/80 text-rose-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(244,63,94,0.3)] active:scale-95"
              title="Bridge 2 live Power Stations together with a wire to trigger catastrophic short circuit"
            >
              <span>💥 Test Short-Circuit (Bridge Stations)</span>
            </button>

            <button
              onclick={resetElectricalBreakers}
              class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 transition-all cursor-pointer flex items-center space-x-1 active:scale-95"
              title="Reset tripped station breakers and restore circuit"
            >
              <span>🔄 Reset Breakers</span>
            </button>
          </div>

          <!-- Quick summary badges -->
          <div class="flex items-center space-x-2 text-[11px]">
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              🔌 {electricityManager.cables.size} Cables
            </span>
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">
              🔋 {electricityManager.capacitors.size} Capacitors
            </span>
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-300">
              📺 {electricalTelemetry.poweredAppliances}/{electricalTelemetry.totalAppliances} Powered
            </span>
          </div>
        </div>

        <!-- Electrical Event Notification Sub-banner -->
        <div class="px-3 py-1.5 rounded bg-slate-950/80 border {electricalTelemetry.hasShortCircuit ? 'border-red-600 bg-red-950/40 text-red-200 animate-pulse' : electricalTelemetry.trippedBreakers > 0 ? 'border-amber-600 bg-amber-950/40 text-amber-200' : 'border-emerald-800/60 text-emerald-300'} text-xs font-mono flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full {electricalTelemetry.hasShortCircuit ? 'bg-red-400 animate-ping' : electricalTelemetry.trippedBreakers > 0 ? 'bg-amber-400' : 'bg-emerald-400'}"></span>
            <span>{electricalLogMessage}</span>
          </div>
          <span class="text-[10px] text-slate-400">Path Compression & Union-By-Rank Disjoint Set</span>
        </div>
      {:else if activeViewTab === 'plumbing'}
        <!-- Task 3.2: Plumbing Controls & BFS Scenario Actions -->
        <div class="p-3 rounded-lg bg-slate-950/90 border border-blue-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-blue-400 font-bold uppercase text-[10px] mr-1 flex items-center space-x-1">
              <span>💧 Hydraulic Scenarios:</span>
            </span>

            <button
              onclick={setupPlumbingDemo}
              class="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-500/80 text-blue-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(59,130,246,0.3)] active:scale-95"
              title="Reset and initialize dual-pipe hydraulic network with Water Pump, Boilers, and Sinks/Showers"
            >
              <span>💧 Dual-Pipe Network Demo</span>
            </button>

            <button
              onclick={triggerPressureFalloffDemo}
              class="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/80 text-amber-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(245,158,11,0.3)] active:scale-95"
              title="Add 40-tile small pipe branch to demonstrate pressure drop below 10% operating threshold"
            >
              <span>⚠️ Test Pressure Attenuation (&gt;40 tiles)</span>
            </button>
          </div>

          <!-- Quick summary badges -->
          <div class="flex items-center space-x-2 text-[11px]">
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              🚰 {plumbingTelemetry.activePumps} Pumps
            </span>
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">
              🔥 {plumbingTelemetry.activeBoilers} Boilers
            </span>
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-blue-300">
              🚿 {plumbingTelemetry.suppliedFixtures}/{plumbingTelemetry.totalFixtures} Supplied
            </span>
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-300">
              ⛏️ Tunnel Speedup: 500% (0.20x)
            </span>
          </div>
        </div>

        <div class="px-3 py-1.5 rounded bg-slate-950/80 border border-blue-800/60 text-xs font-mono flex items-center justify-between text-blue-300">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>{plumbingLogMessage}</span>
          </div>
          <span class="text-[10px] text-slate-400">BFS Multi-Source Wavefront Propagation</span>
        </div>
        <!-- Task 3.3 & 3.4: Room Enclosure & Quality Controls -->
        <div class="p-3 rounded-lg bg-slate-950/90 border border-emerald-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-emerald-400 font-bold uppercase text-[10px] mr-1 flex items-center space-x-1">
              <span>🏠 Room & Cell Quality Scenarios:</span>
            </span>

            <button
              onclick={setupValidCellDemo}
              class="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/80 text-emerald-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(16,185,129,0.3)] active:scale-95"
              title="Enclose standard 2x3 Cell with Bed and Toilet (Grade 1 Base)"
            >
              <span>🏠 Standard Cell (Grade 1)</span>
            </button>

            <button
              onclick={setupLuxuryCellDemo}
              class="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/80 text-amber-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(245,158,11,0.3)] active:scale-95"
              title="Enclose luxury 4x4 Cell (16m²) with Window, Bookshelf, TV, and Shower (Grade 7)"
            >
              <span>🌟 Luxury Cell (Grade 7)</span>
            </button>

            <button
              onclick={setupUnenclosedLeakDemo}
              class="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/80 text-rose-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(244,63,94,0.3)] active:scale-95"
              title="Create wall breach to test leak detection"
            >
              <span>⚠️ Test Breach (Grade 0)</span>
            </button>
          </div>

          <!-- Quality Grade Badges -->
          <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span class="px-2.5 py-1 rounded bg-slate-900 border border-amber-500/80 text-amber-300 font-bold">
              ⭐ Quality: Grade {cellQuality.totalScore}/10
            </span>
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 {detectedRoomStatus.enclosed ? 'text-emerald-300' : 'text-rose-300'} font-bold">
              {detectedRoomStatus.enclosed ? '✓ ENCLOSED' : '❌ LEAK'}
            </span>
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">
              📐 {cellQuality.areaTiles}m² (+{cellQuality.areaScore})
            </span>
            {#if cellQuality.hasExteriorWindow}
              <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-blue-300">
                🪟 Window (+1)
              </span>
            {/if}
            {#if cellQuality.hasTv}
              <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-indigo-300">
                📺 TV (+1)
              </span>
            {/if}
            {#if cellQuality.hasBookshelf}
              <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-teal-300">
                📚 Books (+1)
              </span>
            {/if}
            {#if cellQuality.hasShower}
              <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                🚿 Shower (+1)
              </span>
            {/if}
          </div>
        </div>

        <div class="px-3 py-1.5 rounded bg-slate-950/80 border {detectedRoomStatus.enclosed ? 'border-emerald-800/60 text-emerald-300' : 'border-rose-700 bg-rose-950/40 text-rose-200'} text-xs font-mono flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full {detectedRoomStatus.enclosed ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'}"></span>
            <span>{roomTelemetryMessage}</span>
          </div>
          <span class="text-[10px] text-slate-400">Task 3.4 Dynamic Cell Grading Engine Active</span>
        </div>
      {:else if activeViewTab === 'navigation'}
        <!-- Task 4.1: Flow Field Navigation Controls & Mass Inmate Flow Scenarios -->
        <div class="p-3 rounded-lg bg-slate-950/90 border border-indigo-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-indigo-400 font-bold uppercase text-[10px] mr-1 flex items-center space-x-1">
              <span>🧭 Flow Field Scenarios:</span>
            </span>

            <button
              onclick={setupCanteenMassNavDemo}
              class="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/80 text-indigo-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(99,102,241,0.3)] active:scale-95"
              title="Spawn 50 inmates and stream them simultaneously towards Canteen using O(1) flow field lookups"
            >
              <span>🍽️ Canteen Mass Flow (50 Inmates)</span>
            </button>

            <button
              onclick={setupYardNavDemo}
              class="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(34,211,238,0.3)] active:scale-95"
              title="Route inmates to outdoor recreation yard"
            >
              <span>🏃 Yard Flow</span>
            </button>

            <button
              onclick={setupLockedDoorDetourDemo}
              class="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/80 text-amber-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(245,158,11,0.3)] active:scale-95"
              title="Demonstrate locked staff-only door obstacle detour around security wall"
            >
              <span>🔒 Locked Door Detour</span>
            </button>

            <button
              onclick={triggerLockdownNavDemo}
              class="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/80 text-rose-200 font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-[0_0_8px_rgba(244,63,94,0.3)] active:scale-95"
              title="Trigger emergency lockdown sealing doors shut"
            >
              <span>🚨 Emergency Lockdown</span>
            </button>
          </div>

          <!-- Flow Field Telemetry Badges -->
          <div class="flex items-center space-x-2 text-[11px]">
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              📊 262,144 Tiles
            </span>
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-indigo-300">
              ⚡ &lt;1.2 ms Gen
            </span>
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-300">
              🏃 {navInmates.filter(i => !i.reachedGoal).length} In Transit
            </span>
            <span class="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-amber-300">
              🎯 {navInmates.filter(i => i.reachedGoal).length} Arrived
            </span>
          </div>
        </div>

        <div class="px-3 py-1.5 rounded bg-slate-950/80 border border-indigo-800/60 text-xs font-mono flex items-center justify-between text-indigo-300">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>{navTelemetryMessage}</span>
          </div>
          <span class="text-[10px] text-slate-400">Dijkstra Integration & Packed 8-Bit Direction Vectors</span>
        </div>
      {:else}
        <!-- Construction Tool Selection Toolbar -->
        <div class="p-3 rounded-lg bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-slate-500 uppercase text-[10px] mr-1">Tools:</span>
            
            <button
              onclick={() => setToolMode('navigate')}
              class="px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer flex items-center space-x-1.5 {activeToolMode === 'navigate' ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'}"
              title="Pan & Inspect Camera (Hold middle or right click to pan anytime)"
            >
              <span>🖐️ Pan / Inspect</span>
            </button>

            <button
              onclick={() => setToolMode('brick_wall')}
              class="px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer flex items-center space-x-1.5 {activeToolMode === 'brick_wall' ? 'bg-amber-950 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'}"
              title="Standard Red Brick Wall ($50.00)"
            >
              <span>🧱 Brick Wall ($50)</span>
            </button>

            <button
              onclick={() => setToolMode('concrete_wall')}
              class="px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer flex items-center space-x-1.5 {activeToolMode === 'concrete_wall' ? 'bg-slate-800 border-slate-300 text-slate-100 shadow-[0_0_10px_rgba(203,213,225,0.3)]' : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'}"
              title="Reinforced Heavy Concrete Wall ($120.00)"
            >
              <span>🏢 Concrete Wall ($120)</span>
            </button>

            <button
              onclick={() => setToolMode('perimeter_wall')}
              class="px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer flex items-center space-x-1.5 {activeToolMode === 'perimeter_wall' ? 'bg-purple-950 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'}"
              title="High Security Anti-Tunnel Perimeter Wall ($350.00)"
            >
              <span>🛡️ Perimeter Wall ($350)</span>
            </button>

            <div class="h-5 w-px bg-slate-800 mx-1"></div>

            <!-- Hollow vs Solid Toggle -->
            <div class="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              <button
                onclick={() => setToolHollow(true)}
                class="px-2 py-1 rounded text-[11px] transition-all cursor-pointer {toolHollow ? 'bg-cyan-900/80 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'}"
                title="Perimeter rectangle (walls along outline only)"
              >
                Rect Perimeter
              </button>
              <button
                onclick={() => setToolHollow(false)}
                class="px-2 py-1 rounded text-[11px] transition-all cursor-pointer {!toolHollow ? 'bg-cyan-900/80 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'}"
                title="Filled solid rectangle"
              >
                Solid Block
              </button>
            </div>
          </div>

          <!-- Quick Demo & Action Buttons -->
          <div class="flex items-center gap-1.5">
            <button
              onclick={trigger10x10Demo}
              class="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/80 text-emerald-200 font-bold transition-all cursor-pointer flex items-center space-x-1 shadow-[0_0_8px_rgba(16,185,129,0.2)] active:scale-95"
              title="Queue a 10x10 brick wall foundation and watch workmen construct it in real time!"
            >
              <span>⚡ 10x10 Foundation Demo</span>
            </button>

            <button
              onclick={spawnWorkman}
              class="px-2.5 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-200 font-medium transition-all cursor-pointer active:scale-95"
              title="Hire an additional Workman at Delivery Zone"
            >
              <span>👷 +1 Workman</span>
            </button>

            <button
              onclick={clearCustomWalls}
              class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/60 border border-slate-700 hover:border-red-600 text-slate-400 hover:text-red-300 transition-all cursor-pointer"
              title="Reset walls and blueprints"
            >
              <span>🧹 Reset</span>
            </button>
          </div>
        </div>
      {/if}

      <!-- Quick Camera Controls & Telemetry Sub-bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <!-- Live Construction Status -->
        <div class="flex items-center space-x-2">
          <div class="px-2.5 py-1 rounded bg-slate-950 border border-cyan-800 text-cyan-300 font-medium flex items-center space-x-1.5">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{activeDragSummary}</span>
          </div>

          <div class="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
            {workmenTelemetry}
          </div>
        </div>

        <!-- Quick Camera Zoom & Pan Controls -->
        <div class="flex items-center space-x-2">
          <span class="text-slate-500 uppercase text-[10px]">Zoom:</span>
          <button
            onclick={centerCamera}
            class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-cyan-300 transition-all cursor-pointer"
          >
            🎯 Center
          </button>
          <button
            onclick={() => setCameraZoom(0.2)}
            class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-cyan-300 transition-all cursor-pointer"
          >
            0.2x
          </button>
          <button
            onclick={() => setCameraZoom(1.0)}
            class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-cyan-300 transition-all cursor-pointer"
          >
            1.0x
          </button>
          <button
            onclick={() => setCameraZoom(2.5)}
            class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-cyan-300 transition-all cursor-pointer"
          >
            2.5x
          </button>
        </div>
      </div>

      <!-- Canvas Viewport Container -->
      <div class="w-full h-[480px] rounded-lg bg-slate-950 border border-slate-800/80 overflow-hidden relative shadow-inner">
        <canvas
          bind:this={canvasElement}
          width={1280}
          height={480}
          onpointerdown={(e) => dragTool?.handlePointerDown(e)}
          onpointermove={(e) => dragTool?.handlePointerMove(e)}
          onpointerup={(e) => dragTool?.handlePointerUp(e)}
          oncontextmenu={(e) => e.preventDefault()}
          class="w-full h-full block {activeToolMode === 'navigate' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}"
        ></canvas>

        <!-- Watermark / Interaction hint overlay -->
        <div class="absolute bottom-2.5 right-3 px-3 py-1 rounded bg-slate-900/85 border border-slate-800 text-[11px] font-mono text-slate-400 pointer-events-none backdrop-blur-sm">
          {#if activeToolMode === 'navigate'}
            🖱️ Left Drag: Pan • Scroll: Zoom
          {:else}
            📐 Left Drag: Place {activeToolMode.replace('_', ' ').toUpperCase()} Blueprint • Right Drag: Pan • Scroll: Zoom
          {/if}
        </div>
      </div>
    </div>

    <!-- Grid of 4 Architectural Panels -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Panel 1: Contiguous Memory Layout -->
      <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Memory Partitions</span>
            </h3>
            <span class="text-xs font-mono text-slate-400">{(TOTAL_SHARED_MEMORY_SIZE / (1024 * 1024)).toFixed(2)} MB</span>
          </div>

          <!-- Partition Memory Bar -->
          <div class="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex mb-4">
            <div class="h-full bg-amber-400 w-[1%]" title="Header (1KB)"></div>
            <div class="h-full bg-purple-500 w-[2%]" title="Command Queue (64KB)"></div>
            <div class="h-full bg-teal-400 w-[1%]" title="Telemetry (16KB)"></div>
            <div class="h-full bg-cyan-500 w-[32%]" title="Snapshot Slot 0 (4MB)"></div>
            <div class="h-full bg-blue-500 w-[32%]" title="Snapshot Slot 1 (4MB)"></div>
            <div class="h-full bg-indigo-500 w-[32%]" title="Snapshot Slot 2 (4MB)"></div>
          </div>

          <div class="space-y-2 text-xs font-mono text-slate-300">
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400 flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded bg-amber-400"></span>
                <span>Header & Control:</span>
              </span>
              <span class="text-amber-400 font-semibold">{HEADER_SIZE} B (0x000000)</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400 flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded bg-purple-500"></span>
                <span>Command Queue:</span>
              </span>
              <span class="text-purple-400 font-semibold">{COMMAND_QUEUE_SIZE / 1024} KB</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400 flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded bg-teal-400"></span>
                <span>UI Telemetry:</span>
              </span>
              <span class="text-teal-400 font-semibold">{TELEMETRY_SIZE / 1024} KB</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400 flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded bg-cyan-500"></span>
                <span>Snapshot Banks:</span>
              </span>
              <span class="text-cyan-400 font-semibold">12 MB (3 x 4 MB)</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
          Max Capacity: <span class="text-cyan-300 font-bold">{MAX_ENTITIES_PER_SLOT.toLocaleString()}</span> entities / slot
        </div>
      </div>

      <!-- Panel 2: Atomic Control Block -->
      <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Atomic Control Header</span>
            </h3>
            <span class="text-xs font-mono text-emerald-400">0x50524953 ("PRIS")</span>
          </div>

          <div class="space-y-2 text-xs font-mono text-slate-300">
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Simulation Tick:</span>
              <span class="text-emerald-400 font-bold text-sm">{metrics.simTick.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Sim Elapsed Time:</span>
              <span class="text-slate-200 font-semibold">{(metrics.simTimeMs / 1000).toFixed(2)}s ({metrics.simTimeMs} ms)</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400">SPSC Queue:</span>
              <span class="text-amber-400 font-semibold font-mono">{inputHead} / {inputTail}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Command Packet:</span>
              <span class="text-cyan-300 font-semibold">20 Bytes (Packed Pod)</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
          <span>Sync Protocol: Atomic AcqRel</span>
          <span>Zero GC Invariant</span>
        </div>
      </div>

      <!-- Panel 3: Triple-Buffer State Slots & Interpolation -->
      <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-purple-400 font-mono flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-purple-400"></span>
              <span>Triple Buffer Slots</span>
            </h3>
            <span class="text-xs font-mono text-purple-300">Lock-Free SPSC</span>
          </div>

          <!-- Triple Buffer Slot Cards -->
          <div class="grid grid-cols-3 gap-2 mb-4">
            {#each [0, 1, 2] as slot}
              {@const isRead = metrics.readSlot === slot}
              {@const isWrite = metrics.writeSlot === slot}
              {@const isClean = metrics.cleanSlot === slot}
              <div class="p-2 rounded-lg border text-center font-mono {isWrite ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300' : isRead ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : isClean ? 'bg-purple-950/60 border-purple-500 text-purple-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'}">
                <span class="text-[9px] uppercase font-bold block text-slate-500">Slot {slot}</span>
                <span class="text-xs font-bold block mt-0.5">
                  {#if isWrite}
                    WRITE
                  {:else if isRead}
                    READ
                  {:else if isClean}
                    CLEAN
                  {:else}
                    STANDBY
                  {/if}
                </span>
                <span class="text-[8px] text-slate-500 block mt-0.5">4 MB</span>
              </div>
            {/each}
          </div>

          <div class="space-y-1.5 text-xs font-mono text-slate-300">
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Read Slot:</span>
              <span class="text-emerald-400 font-semibold">Slot {metrics.readSlot}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Write Slot:</span>
              <span class="text-cyan-400 font-semibold">Slot {metrics.writeSlot}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Clean Slot:</span>
              <span class="text-purple-400 font-semibold">Slot {metrics.cleanSlot}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Interpolation &alpha;:</span>
              <span class="text-amber-400 font-semibold">{interpolationAlpha.toFixed(3)}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-purple-400 flex items-center justify-between">
          <span>Interpolation Active</span>
          <span>120Hz Main / 60Hz Sim</span>
        </div>
      </div>

      <!-- Panel 4: World Tile Grid & Spatial Chunks -->
      <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-lg">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-blue-400 font-mono flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>World Grid & Chunks</span>
            </h3>
            <span class="text-xs font-mono text-blue-300">32 &times; 32 Chunks</span>
          </div>

          <div class="space-y-2 text-xs font-mono text-slate-300">
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Dimensions:</span>
              <span class="text-blue-300 font-semibold">512 &times; 512 (262,144 tiles)</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Chunk Partitions:</span>
              <span class="text-slate-200 font-semibold">16 &times; 16 (256 chunks)</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Cell Descriptor:</span>
              <span class="text-emerald-400 font-semibold">12 Bytes (Packed Pod)</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Memory Footprint:</span>
              <span class="text-emerald-400 font-semibold">3.15 MB (&lt; 4.0 MB)</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Access Latency:</span>
              <span class="text-cyan-300 font-semibold">&lt; 2.0 ns (O(1) Bit Shift)</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-blue-400 flex items-center justify-between">
          <span>Spatial Partitioning Active</span>
          <span>Zero GC Allocations</span>
        </div>
      </div>
    </div>

    <!-- Phase 1, 2 & 3 Roadmap Progress Matrix -->
    <div class="space-y-4">
      <!-- Phase 1 Card (Complete) -->
      <div class="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-white tracking-wide">Phase 1: Foundations, Threading & Memory Model</h3>
            <p class="text-xs text-slate-400">Architecture Milestone Progress</p>
          </div>
          <span class="text-xs font-mono px-3 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
            4 of 4 Tasks (100%) • Phase 1 Complete
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold">Task 1.1: Scaffolding</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">Docker, Wasm, Vite, COOP/COEP</p>
            <span class="text-[10px] text-emerald-500 font-bold block mt-2">✓ COMPLETED</span>
          </div>

          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold">Task 1.2: Memory Bridge</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">SharedArrayBuffer, Control Block</p>
            <span class="text-[10px] text-emerald-500 font-bold block mt-2">✓ COMPLETED</span>
          </div>

          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold">Task 1.3: SPSC Queue</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">Triple-Buffer Sync & Input Ring</p>
            <span class="text-[10px] text-emerald-500 font-bold block mt-2">✓ COMPLETED</span>
          </div>

          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold">Task 1.4: Bevy ECS Loop</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">60Hz Loop & 8-Stage ECS</p>
            <span class="text-[10px] text-emerald-500 font-bold block mt-2">✓ COMPLETED</span>
          </div>
        </div>
      </div>

      <!-- Phase 2 Card (Complete) -->
      <div class="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-white tracking-wide">Phase 2: World Grid, Materials & WebGPU Renderer</h3>
            <p class="text-xs text-slate-400">World Simulation & Graphics Pipeline</p>
          </div>
          <span class="text-xs font-mono px-3 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
            4 of 4 Tasks (100%) • Phase 2 Complete
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold">Task 2.1: Tile Grid</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">512x512 Grid & 32x32 Chunks</p>
            <span class="text-[10px] text-emerald-500 font-bold block mt-2">✓ COMPLETED</span>
          </div>

          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold">Task 2.2: Autotiling</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">4-Bit & 8-Bit Bitmask Rules</p>
            <span class="text-[10px] text-emerald-500 font-bold block mt-2">✓ COMPLETED</span>
          </div>

          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold">Task 2.3: WebGPU Renderer</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">Camera & Instanced Quads</p>
            <span class="text-[10px] text-emerald-500 font-bold block mt-2">✓ COMPLETED</span>
          </div>

          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold text-emerald-300">Task 2.4: Drag-Rect Jobs</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">Workman Build Pipeline</p>
            <span class="text-[10px] text-emerald-300 font-bold block mt-2">✓ VERIFIED & COMPLETE</span>
          </div>
        </div>
      </div>

      <!-- Phase 3 Card (Complete) -->
      <div class="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-white tracking-wide">Phase 3: Utilities, Hydraulics & Room Enclosures</h3>
            <p class="text-xs text-slate-400">Subsurface Infrastructure & Spatial Zoning</p>
          </div>
          <span class="text-xs font-mono px-3 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
            4 of 4 Tasks (100%) • Phase 3 Complete
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold">Task 3.1: Electricity Grid</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">Disjoint-Set & Overload Physics</p>
            <span class="text-[10px] text-emerald-500 font-bold block mt-2">✓ COMPLETED</span>
          </div>

          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold">Task 3.2: Plumbing Hydraulics</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">BFS Pressure & Dual Hot/Cold Pipes</p>
            <span class="text-[10px] text-emerald-500 font-bold block mt-2">✓ COMPLETED</span>
          </div>

          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold">Task 3.3: Room Enclosures</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">Flood-Fill & Doorway Validation</p>
            <span class="text-[10px] text-emerald-500 font-bold block mt-2">✓ COMPLETED</span>
          </div>

          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold text-emerald-300">Task 3.4: Cell Quality Grading</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">Dynamic 0-10 Quality Evaluator</p>
            <span class="text-[10px] text-emerald-300 font-bold block mt-2">✓ VERIFIED & COMPLETE</span>
          </div>
        </div>
      </div>

      <!-- Phase 4 Card (In Progress) -->
      <div class="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-white tracking-wide">Phase 4: Navigation, Agent AI & Regime</h3>
            <p class="text-xs text-slate-400">Flow Fields, 15-Need Psychology & Timetable Scheduling</p>
          </div>
          <span class="text-xs font-mono px-3 py-1 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">
            1 of 4 Tasks (25%) • Phase 4 In Progress
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold text-emerald-300">Task 4.1: Flow Fields</span>
            </div>
            <p class="text-[11px] text-emerald-400/80 mt-1">Dijkstra Vector Map & Door Clearance</p>
            <span class="text-[10px] text-emerald-300 font-bold block mt-2">✓ VERIFIED & COMPLETE</span>
          </div>

          <div class="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-slate-600"></span>
              <span class="font-semibold text-slate-300">Task 4.2: 15-Need Psychology</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Decay Curves & Global Danger Bar</p>
            <span class="text-[10px] text-slate-600 block mt-2">UPCOMING</span>
          </div>

          <div class="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-slate-600"></span>
              <span class="font-semibold text-slate-300">Task 4.3: Utility AI & HFSM</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Behavior Scoring & State Machine</p>
            <span class="text-[10px] text-slate-600 block mt-2">UPCOMING</span>
          </div>

          <div class="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-slate-600"></span>
              <span class="font-semibold text-slate-300">Task 4.4: 24-Hour Regime</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Master Timetable & Emergency Overrides</p>
            <span class="text-[10px] text-slate-600 block mt-2">UPCOMING</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

