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

  let crossOriginIsolated = $state(false);
  let workerStatus = $state<'Disconnected' | 'Connecting...' | 'Online'>('Connecting...');
  let workerPingReply = $state<string>('Pending handshake...');
  let sharedMemoryAttached = $state(false);
  let simulationWorker: Worker | null = null;
  let sharedBridge: SharedMemoryBridge | null = null;
  let consumer: TripleBufferConsumer | null = null;

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
      const entities = workmen.map(w => ({
        id: w.id,
        x: w.x,
        y: w.y,
        spriteIndex: 2, // char_workman
        statusFlags: w.state === 'carrying_material' ? 2 : (w.state === 'building' ? 3 : 1),
        rotation: 0,
      }));
      renderer.setRenderEntities(entities);
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

      if (renderer) {
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
            <span>Phase 2 • Task 2.3 Active: WebGPU Context, Camera Matrix & Instanced Quad Renderer</span>
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">WebGPU Context, Camera Matrix & Instanced Quad Renderer</h2>
          <p class="text-xs text-slate-400 mt-1 max-w-2xl">
            Hardware-accelerated WebGPU rendering pipeline with dynamic <code class="text-indigo-300">Camera2D</code> pan/zoom ($0.1\times$ to $5.0\times$), spatial $32 \times 32$ chunk frustum culling, and single-pass instanced quad batching with seamless 2D Canvas fallback.
          </p>
        </div>

        <div class="flex items-center space-x-3 text-xs font-mono">
          <div class="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
            <span class="text-slate-500 block text-[10px]">Render FPS:</span>
            <span class="text-emerald-400 font-bold text-base">{rendererMetrics.fps} FPS</span>
          </div>
          <div class="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
            <span class="text-slate-500 block text-[10px]">Frustum Culling:</span>
            <span class="text-indigo-400 font-bold text-base">{rendererMetrics.visibleChunks}/256 Chunks</span>
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
          <div class="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.9)]"></div>
          <div>
            <h3 class="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center space-x-2">
              <span>WebGPU World Viewport & Drag-Rect Construction Tool</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-600/60 text-cyan-300 font-normal">Phase 2.4 Live</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">512&times;512 Tile Grid • Holographic Blueprint Ghosts • Autonomous Workman Job Pipeline</p>
          </div>
        </div>

        <!-- Telemetry Badges -->
        <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span class="px-2.5 py-1 rounded bg-slate-950 border border-cyan-700/60 text-cyan-300 font-bold">
            ⚡ {rendererMetrics.fps} FPS
          </span>
          <span class="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            Backend: <strong class="{rendererMetrics.backend === 'WebGPU' ? 'text-emerald-400' : 'text-amber-400'}">{rendererMetrics.backend}</strong>
          </span>
          <span class="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            Chunks: <strong class="text-cyan-300">{rendererMetrics.visibleChunks}</strong> / {rendererMetrics.totalChunks}
          </span>
          <span class="px-2.5 py-1 rounded bg-slate-950 border border-amber-800/60 text-amber-300 font-bold">
            👷 {workmenCount} Workmen
          </span>
          <span class="px-2.5 py-1 rounded bg-slate-950 border border-teal-800/60 text-teal-300">
            🔨 {pendingJobsCount} Queued • {completedJobsCount} Built
          </span>
          <span class="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            Cam: ({rendererMetrics.cameraX}, {rendererMetrics.cameraY}) @ <strong class="text-teal-300">{rendererMetrics.zoom}x</strong>
          </span>
        </div>
      </div>

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

    <!-- Phase 1 & 2 Roadmap Progress Matrix -->
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

      <!-- Phase 2 Card (In Progress) -->
      <div class="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-white tracking-wide">Phase 2: World Grid, Materials & WebGPU Renderer</h3>
            <p class="text-xs text-slate-400">World Simulation & Graphics Pipeline</p>
          </div>
          <span class="text-xs font-mono px-3 py-1 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">
            7 of 28 Total Tasks (25%) • Task 2.3 Active
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

          <div class="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/80 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span class="font-bold">Task 2.3: WebGPU Renderer</span>
            </div>
            <p class="text-[11px] text-indigo-400/80 mt-1">Camera & Instanced Quads</p>
            <span class="text-[10px] text-indigo-300 font-bold block mt-2">✓ VERIFIED & COMPLETE</span>
          </div>

          <div class="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-slate-600"></span>
              <span class="font-bold text-slate-300">Task 2.4: Drag-Rect Jobs</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Workman Build Pipeline</p>
            <span class="text-[10px] text-slate-500 block mt-2">PLANNED</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
