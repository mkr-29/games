/**
 * WebGPURenderer: High-performance instanced quad sprite renderer for Prison Architect Web.
 * Features single-pass instanced draw calls, frustum culling on 32x32 chunks,
 * mouse-centered pan/zoom camera, and a resilient 2D Canvas fallback.
 */

import { Camera2D } from './Camera2D';
import { TextureAtlas, type AtlasUVRect } from './TextureAtlas';
import shaderSource from './shaders/instanced_sprite.wgsl?raw';

export interface RendererMetrics {
  fps: number;
  backend: 'WebGPU' | 'Canvas2D';
  visibleChunks: number;
  totalChunks: number;
  drawnInstances: number;
  cameraX: number;
  cameraY: number;
  zoom: number;
}

import type { GhostTile } from '../tools/DragBoxTool';

export interface RenderEntity {
  id: number;
  x: number;
  y: number;
  spriteIndex: number;
  statusFlags: number; // 0=idle, 1=walking, 2=carrying material, 3=building
  rotation: number;
}

export interface WorldTileDataSource {
  width: number;
  height: number;
  chunksX: number;
  chunksY: number;
  getTile(x: number, y: number): {
    terrainId: number;
    floorId: number;
    wallId: number;
    autotileIdx: number;
    health: number;
    isBlueprint?: boolean;
  } | null;
}

export class WebGPURenderer {
  public canvas: HTMLCanvasElement;
  public camera: Camera2D;
  public atlas: TextureAtlas;
  public backend: 'WebGPU' | 'Canvas2D' = 'Canvas2D';

  // WebGPU Resources
  private adapter: GPUAdapter | null = null;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private cameraUniformBuffer: GPUBuffer | null = null;
  private cameraBindGroup: GPUBindGroup | null = null;
  private instanceBuffer: GPUBuffer | null = null;
  private maxInstances = 65536; // 64K sprites per frame
  private instanceByteStride = 52; // 13 floats/uints * 4 bytes

  // CPU Instance Buffer
  private instanceDataF32 = new Float32Array(65536 * 13);
  private instanceDataU32 = new Uint32Array(this.instanceDataF32.buffer);

  // 2D Canvas Fallback Context
  private ctx2d: CanvasRenderingContext2D | null = null;

  // Frame timing & metrics
  private frameCount = 0;
  private lastFpsUpdate = performance.now();
  private currentFps = 60;
  private lastDrawnInstances = 0;
  private lastVisibleChunks = 0;

  // Mouse interaction state
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // External tile grid data
  private tileSource: WorldTileDataSource | null = null;

  // Active Drag Ghost Tiles for construction preview
  private activeGhostTiles: GhostTile[] = [];

  // Active Dynamic Simulation Entities (Workmen, Prisoners, Guards)
  private renderEntities: RenderEntity[] = [];

  // Whether left mouse button pans camera or is delegated to active construction tool
  public isPanToolActive = true;

  constructor(canvas: HTMLCanvasElement, initialZoom = 1.0) {
    this.canvas = canvas;
    this.camera = new Camera2D(
      256, // Center of 512 map
      256,
      initialZoom,
      32,
      canvas.width || 1280,
      canvas.height || 720
    );
    this.atlas = new TextureAtlas();

    this.setupEventListeners();
  }

  public setTileSource(source: WorldTileDataSource): void {
    this.tileSource = source;
  }

  public setActiveGhostTiles(ghosts: GhostTile[]): void {
    this.activeGhostTiles = ghosts;
  }

  public setRenderEntities(entities: RenderEntity[]): void {
    this.renderEntities = entities;
  }

  /**
   * Initializes the graphics context. Attempts hardware-accelerated WebGPU first,
   * cleanly falling back to 2D Canvas if WebGPU is unsupported.
   */
  public async initialize(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator && navigator.gpu) {
      try {
        this.adapter = await navigator.gpu.requestAdapter({
          powerPreference: 'high-performance',
        });

        if (this.adapter) {
          this.device = await this.adapter.requestDevice();

          this.device.lost.then((info) => {
            console.warn('[WebGPU] Device was lost:', info.message);
            this.backend = 'Canvas2D';
            this.initializeCanvas2D();
          });

          this.context = this.canvas.getContext('webgpu');
          if (this.context) {
            const format = navigator.gpu.getPreferredCanvasFormat();
            this.context.configure({
              device: this.device,
              format,
              alphaMode: 'premultiplied',
            });

            await this.buildWebGPUPipeline(format);
            this.backend = 'WebGPU';
            console.log('[WebGPU] Initialized Hardware Accelerated Pipeline successfully');
            return true;
          }
        }
      } catch (err) {
        console.warn('[WebGPU] Hardware init failed, switching to Canvas2D fallback:', err);
      }
    }

    // Fallback to Canvas2D
    return this.initializeCanvas2D();
  }

  private initializeCanvas2D(): boolean {
    this.ctx2d = this.canvas.getContext('2d');
    this.backend = 'Canvas2D';
    console.log('[Renderer] Running with High-Performance Canvas2D Fallback Context');
    return !!this.ctx2d;
  }

  private async buildWebGPUPipeline(format: GPUTextureFormat): Promise<void> {
    if (!this.device || !this.context) return;

    // 1. Create Shader Module
    const shaderModule = this.device.createShaderModule({
      label: 'Instanced Sprite Shader',
      code: shaderSource,
    });

    // 2. Camera Uniform Buffer (64 bytes mat4 + 8 bytes vec2 + 4 bytes zoom + 4 bytes tileSize = 80 bytes)
    this.cameraUniformBuffer = this.device.createBuffer({
      size: 128, // 128 bytes aligned
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // 3. Dynamic Instance Buffer (64K instances * 52 bytes = ~3.4 MB)
    this.instanceBuffer = this.device.createBuffer({
      size: this.maxInstances * this.instanceByteStride,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    // 4. Create Texture Atlas in VRAM
    let gpuTexture: GPUTexture;
    if (this.atlas.canvas) {
      gpuTexture = this.device.createTexture({
        size: [this.atlas.width, this.atlas.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      });

      this.device.queue.copyExternalImageToTexture(
        { source: this.atlas.canvas },
        { texture: gpuTexture },
        [this.atlas.width, this.atlas.height]
      );
    } else {
      gpuTexture = this.device.createTexture({
        size: [1, 1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING,
      });
    }

    // 5. Create Sampler
    const sampler = this.device.createSampler({
      magFilter: 'nearest',
      minFilter: 'nearest',
    });

    // 6. Bind Group Layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
      ],
    });

    this.cameraBindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraUniformBuffer } },
        { binding: 1, resource: sampler },
        { binding: 2, resource: gpuTexture.createView() },
      ],
    });

    // 7. Pipeline Layout
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    // 8. Render Pipeline
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: this.instanceByteStride,
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },  // world_pos
              { shaderLocation: 1, offset: 8, format: 'float32x2' },  // scale
              { shaderLocation: 2, offset: 16, format: 'float32x4' }, // uv_rect
              { shaderLocation: 3, offset: 32, format: 'float32x4' }, // tint_color
              { shaderLocation: 4, offset: 48, format: 'uint32' },     // flags
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });
  }

  /**
   * Resizes viewport and syncs canvas resolution.
   */
  public resize(width: number, height: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.camera.setViewportSize(width, height);
    }
  }

  /**
   * Primary Render Pass: Frustum culls 32x32 chunks, builds instance buffer,
   * and dispatches a single draw call.
   */
  public render(): void {
    // Apply camera inertia
    this.camera.applyVelocity();

    // Update FPS telemetry
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    if (this.backend === 'WebGPU' && this.device && this.context && this.pipeline) {
      this.renderWebGPU();
    } else if (this.ctx2d) {
      this.renderCanvas2D();
    }
  }

  private renderWebGPU(): void {
    if (!this.device || !this.context || !this.pipeline || !this.cameraUniformBuffer || !this.cameraBindGroup || !this.instanceBuffer) {
      return;
    }

    // 1. Update Camera Uniform Buffer
    const vpMatrix = this.camera.getViewProjectionMatrix();
    this.device.queue.writeBuffer(this.cameraUniformBuffer, 0, vpMatrix.buffer, vpMatrix.byteOffset, vpMatrix.byteLength);

    const extraUniforms = new Float32Array([
      this.camera.x,
      this.camera.y,
      this.camera.zoom,
      this.camera.baseTileSize,
    ]);
    this.device.queue.writeBuffer(this.cameraUniformBuffer, 64, extraUniforms.buffer, extraUniforms.byteOffset, extraUniforms.byteLength);

    // 2. Frustum Cull Chunks & Populate Instance Buffer
    const instanceCount = this.populateInstanceBuffer();

    if (instanceCount > 0) {
      this.device.queue.writeBuffer(
        this.instanceBuffer,
        0,
        this.instanceDataF32.buffer,
        0,
        instanceCount * this.instanceByteStride
      );
    }

    // 3. Command Encoding
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.05, g: 0.07, b: 0.09, a: 1.0 }, // Dark slate prison floor
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.cameraBindGroup);
    renderPass.setVertexBuffer(0, this.instanceBuffer);

    if (instanceCount > 0) {
      // Draw 6 vertices (unit quad) across all visible instances in 1 single draw call!
      renderPass.draw(6, instanceCount, 0, 0);
    }

    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);

    this.lastDrawnInstances = instanceCount;
  }

  private renderCanvas2D(): void {
    const ctx = this.ctx2d;
    if (!ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const aabb = this.camera.getVisibleAABB(1);
    const startChunkX = Math.max(0, Math.floor(aabb.minX / 32));
    const endChunkX = Math.min(15, Math.floor(aabb.maxX / 32));
    const startChunkY = Math.max(0, Math.floor(aabb.minY / 32));
    const endChunkY = Math.min(15, Math.floor(aabb.maxY / 32));

    let visibleChunks = 0;
    let drawn = 0;

    const effectiveTilePx = this.camera.baseTileSize * this.camera.zoom;

    for (let cy = startChunkY; cy <= endChunkY; cy++) {
      for (let cx = startChunkX; cx <= endChunkX; cx++) {
        if (!this.camera.isChunkVisible(cx, cy, 32)) continue;
        visibleChunks++;

        const chunkMinX = cx * 32;
        const chunkMaxX = Math.min(512, (cx + 1) * 32);
        const chunkMinY = cy * 32;
        const chunkMaxY = Math.min(512, (cy + 1) * 32);

        for (let ty = chunkMinY; ty < chunkMaxY; ty++) {
          for (let tx = chunkMinX; tx < chunkMaxX; tx++) {
            const screen = this.camera.worldToScreen(tx, ty);

            // Terrain Base
            ctx.fillStyle = '#22543d'; // Grass
            ctx.fillRect(screen.x, screen.y, effectiveTilePx + 0.5, effectiveTilePx + 0.5);
            drawn++;

            // Wall layer
            const tile = this.tileSource?.getTile(tx, ty);
            if (tile && tile.wallId > 0) {
              const mask = tile.autotileIdx;
              if (tile.isBlueprint) {
                // Holographic Blueprint Ghost Wall
                ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
                ctx.fillRect(screen.x, screen.y, effectiveTilePx, effectiveTilePx);
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1;
                ctx.strokeRect(screen.x + 1, screen.y + 1, effectiveTilePx - 2, effectiveTilePx - 2);
              } else {
                ctx.fillStyle = tile.wallId === 2 ? '#4a5568' : (tile.wallId === 3 ? '#2d3748' : '#9b2c2c'); // Concrete, Perimeter or Brick
                ctx.fillRect(screen.x + effectiveTilePx * 0.2, screen.y + effectiveTilePx * 0.2, effectiveTilePx * 0.6, effectiveTilePx * 0.6);

                // Connectors
                if ((mask & 1) !== 0) ctx.fillRect(screen.x + effectiveTilePx * 0.2, screen.y, effectiveTilePx * 0.6, effectiveTilePx * 0.2);
                if ((mask & 4) !== 0) ctx.fillRect(screen.x + effectiveTilePx * 0.2, screen.y + effectiveTilePx * 0.8, effectiveTilePx * 0.6, effectiveTilePx * 0.2);
                if ((mask & 8) !== 0) ctx.fillRect(screen.x, screen.y + effectiveTilePx * 0.2, effectiveTilePx * 0.2, effectiveTilePx * 0.6);
                if ((mask & 2) !== 0) ctx.fillRect(screen.x + effectiveTilePx * 0.8, screen.y + effectiveTilePx * 0.2, effectiveTilePx * 0.2, effectiveTilePx * 0.6);
              }
              drawn++;
            }
          }
        }
      }
    }

    // 2. Active Drag Holographic Preview
    for (const ghost of this.activeGhostTiles) {
      const screen = this.camera.worldToScreen(ghost.x, ghost.y);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.40)';
      ctx.fillRect(screen.x, screen.y, effectiveTilePx, effectiveTilePx);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(screen.x + 1, screen.y + 1, effectiveTilePx - 2, effectiveTilePx - 2);
      drawn++;
    }

    // 3. Dynamic Simulation Entities (Workmen)
    for (const entity of this.renderEntities) {
      const screen = this.camera.worldToScreen(entity.x, entity.y);
      const size = effectiveTilePx * 0.9;
      // Workman Orange Body / Vest
      ctx.fillStyle = '#dd6b20';
      ctx.beginPath();
      ctx.arc(screen.x + size * 0.5, screen.y + size * 0.5, size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      // Yellow Hardhat
      ctx.fillStyle = '#ecc94b';
      ctx.beginPath();
      ctx.arc(screen.x + size * 0.5, screen.y + size * 0.35, size * 0.32, Math.PI, 0);
      ctx.fill();

      // If carrying material box (statusFlags === 2)
      if (entity.statusFlags === 2) {
        ctx.fillStyle = '#9b2c2c'; // Brick crate
        ctx.fillRect(screen.x + size * 0.55, screen.y + size * 0.55, size * 0.38, size * 0.38);
      }
      drawn++;
    }

    this.lastVisibleChunks = visibleChunks;
    this.lastDrawnInstances = drawn;
  }

  /**
   * Culls non-visible 32x32 chunks against camera viewport AABB,
   * writing visible tile sprite instances into the linear CPU staging buffer.
   */
  private populateInstanceBuffer(): number {
    const aabb = this.camera.getVisibleAABB(1);
    const startChunkX = Math.max(0, Math.floor(aabb.minX / 32));
    const endChunkX = Math.min(15, Math.floor(aabb.maxX / 32));
    const startChunkY = Math.max(0, Math.floor(aabb.minY / 32));
    const endChunkY = Math.min(15, Math.floor(aabb.maxY / 32));

    let visibleChunks = 0;
    let count = 0;

    const grassUV = this.atlas.getUV('terrain_grass');

    for (let cy = startChunkY; cy <= endChunkY; cy++) {
      for (let cx = startChunkX; cx <= endChunkX; cx++) {
        // Frustum culling check
        if (!this.camera.isChunkVisible(cx, cy, 32)) {
          continue;
        }

        visibleChunks++;

        const chunkMinX = cx * 32;
        const chunkMaxX = Math.min(512, (cx + 1) * 32);
        const chunkMinY = cy * 32;
        const chunkMaxY = Math.min(512, (cy + 1) * 32);

        for (let ty = chunkMinY; ty < chunkMaxY; ty++) {
          for (let tx = chunkMinX; tx < chunkMaxX; tx++) {
            if (count >= this.maxInstances - 32) break;

            // 1. Terrain Grass Base
            this.writeInstance(count++, tx, ty, 1.0, 1.0, grassUV, 1.0, 1.0, 1.0, 1.0, 0);

            // 2. Check for Walls or mounted objects
            const tile = this.tileSource?.getTile(tx, ty);
            if (tile && tile.wallId > 0) {
              const wallUV = this.atlas.getWallUV(tile.wallId, tile.autotileIdx);
              if (tile.isBlueprint) {
                // Holographic Blueprint Ghost Wall: cyan glow with semi-transparency
                this.writeInstance(count++, tx, ty, 1.0, 1.0, wallUV, 0.25, 0.75, 1.0, 0.65, tile.autotileIdx);
              } else {
                // Solid Wall
                this.writeInstance(count++, tx, ty, 1.0, 1.0, wallUV, 1.0, 1.0, 1.0, 1.0, tile.autotileIdx);
              }
            }
          }
        }
      }
    }

    // 2. Active Drag Holographic Preview
    for (const ghost of this.activeGhostTiles) {
      if (count >= this.maxInstances - 4) break;
      const wallUV = this.atlas.getWallUV(ghost.materialId, 0);
      this.writeInstance(count++, ghost.x, ghost.y, 1.0, 1.0, wallUV, 0.35, 0.90, 1.0, 0.85, 0);
    }

    // 3. Dynamic Simulation Entities (Workmen)
    const workmanUV = this.atlas.getUV('char_workman');
    const brickUV = this.atlas.getWallUV(1, 0);

    for (const entity of this.renderEntities) {
      if (count >= this.maxInstances - 4) break;
      // Draw Workman sprite
      this.writeInstance(count++, entity.x, entity.y, 0.9, 0.9, workmanUV, 1.0, 1.0, 1.0, 1.0, 0);

      // If carrying material box (statusFlags === 2), draw small crate in hands
      if (entity.statusFlags === 2) {
        this.writeInstance(count++, entity.x + 0.15, entity.y + 0.15, 0.45, 0.45, brickUV, 1.0, 1.0, 1.0, 1.0, 0);
      }
    }

    this.lastVisibleChunks = visibleChunks;
    return count;
  }

  private writeInstance(
    index: number,
    wx: number,
    wy: number,
    sx: number,
    sy: number,
    uv: AtlasUVRect,
    r: number,
    g: number,
    b: number,
    a: number,
    flags: number
  ): void {
    const baseOffset = index * 13;

    // world_pos (Float32x2)
    this.instanceDataF32[baseOffset + 0] = wx;
    this.instanceDataF32[baseOffset + 1] = wy;

    // scale (Float32x2)
    this.instanceDataF32[baseOffset + 2] = sx;
    this.instanceDataF32[baseOffset + 3] = sy;

    // uv_rect (Float32x4)
    this.instanceDataF32[baseOffset + 4] = uv.minU;
    this.instanceDataF32[baseOffset + 5] = uv.minV;
    this.instanceDataF32[baseOffset + 6] = uv.maxU;
    this.instanceDataF32[baseOffset + 7] = uv.maxV;

    // tint_color (Float32x4)
    this.instanceDataF32[baseOffset + 8] = r;
    this.instanceDataF32[baseOffset + 9] = g;
    this.instanceDataF32[baseOffset + 10] = b;
    this.instanceDataF32[baseOffset + 11] = a;

    // flags (Uint32)
    this.instanceDataU32[baseOffset + 12] = flags;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => {
      // Middle (1) or Right (2) always pan. Left (0) pans only if isPanToolActive is true.
      if (e.button === 1 || e.button === 2 || (e.button === 0 && this.isPanToolActive)) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dxPixels = e.clientX - this.lastMouseX;
      const dyPixels = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      const effectiveTilePx = this.camera.baseTileSize * this.camera.zoom;
      // Invert pan so dragging left moves camera right (world moves with cursor)
      const dxTiles = -dxPixels / effectiveTilePx;
      const dyTiles = -dyPixels / effectiveTilePx;

      this.camera.pan(dxTiles, dyTiles);
      this.camera.vx = dxTiles * 0.3;
      this.camera.vy = dyTiles * 0.3;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Mouse Wheel centered zoom
    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Smooth zoom step
        const zoomDelta = e.deltaY < 0 ? 1.15 : 0.87;
        this.camera.zoomAtScreenPoint(zoomDelta, mouseX, mouseY);
      },
      { passive: false }
    );
  }

  public getMetrics(): RendererMetrics {
    return {
      fps: this.currentFps,
      backend: this.backend,
      visibleChunks: this.lastVisibleChunks,
      totalChunks: 256, // 16x16
      drawnInstances: this.lastDrawnInstances,
      cameraX: Math.round(this.camera.x * 10) / 10,
      cameraY: Math.round(this.camera.y * 10) / 10,
      zoom: Math.round(this.camera.zoom * 100) / 100,
    };
  }
}
