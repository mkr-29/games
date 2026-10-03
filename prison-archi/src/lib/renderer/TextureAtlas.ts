/**
 * TextureAtlas: Procedural texture generator for Prison Architect Web.
 * Generates high-definition pixel-crisp sprites for terrain, flooring,
 * autotile wall variants, and character uniforms.
 */

export interface AtlasUVRect {
  minU: number;
  minV: number;
  maxU: number;
  maxV: number;
}

export class TextureAtlas {
  public width = 512;
  public height = 512;
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;

  // Dictionary of registered sprite regions
  private spriteUVs: Map<string, AtlasUVRect> = new Map();

  constructor() {
    this.createAtlasCanvas();
  }

  private createAtlasCanvas(): void {
    if (typeof document === 'undefined') {
      // Server-side or non-DOM test environment
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    this.canvas = canvas;
    this.ctx = ctx;

    // Background transparent
    ctx.clearRect(0, 0, this.width, this.height);

    // Grid size: 16x16 tiles of 32x32 pixels each = 512x512
    const TILE_PX = 32;

    // Slot (0, 0): Grass Terrain
    this.drawGrassTile(ctx, 0, 0, TILE_PX);
    this.registerSprite('terrain_grass', 0, 0, TILE_PX);

    // Slot (1, 0): Dirt Ground
    this.drawDirtTile(ctx, 1 * TILE_PX, 0, TILE_PX);
    this.registerSprite('terrain_dirt', 1, 0, TILE_PX);

    // Slot (2, 0): Concrete Floor
    this.drawConcreteTile(ctx, 2 * TILE_PX, 0, TILE_PX);
    this.registerSprite('floor_concrete', 2, 0, TILE_PX);

    // Slot (3, 0): Ceramic Tile Floor
    this.drawCeramicFloorTile(ctx, 3 * TILE_PX, 0, TILE_PX);
    this.registerSprite('floor_ceramic', 3, 0, TILE_PX);

    // Slots (0..15, 1): 16 Autotile Wall variants for Brick Wall (Row 1)
    for (let mask = 0; mask < 16; mask++) {
      this.drawWallAutotileTile(ctx, mask * TILE_PX, 1 * TILE_PX, TILE_PX, mask, 'brick');
      this.registerSprite(`wall_brick_${mask}`, mask, 1, TILE_PX);
    }

    // Slots (0..15, 2): 16 Autotile Wall variants for Reinforced Concrete (Row 2)
    for (let mask = 0; mask < 16; mask++) {
      this.drawWallAutotileTile(ctx, mask * TILE_PX, 2 * TILE_PX, TILE_PX, mask, 'concrete');
      this.registerSprite(`wall_concrete_${mask}`, mask, 2, TILE_PX);
    }

    // Slots (0..15, 3): 16 Autotile Wall variants for Perimeter Wall (Row 3)
    for (let mask = 0; mask < 16; mask++) {
      this.drawWallAutotileTile(ctx, mask * TILE_PX, 3 * TILE_PX, TILE_PX, mask, 'perimeter');
      this.registerSprite(`wall_perimeter_${mask}`, mask, 3, TILE_PX);
    }

    // Row 4: Character sprites
    // (0, 4): Prisoner (Orange Jumpsuit)
    this.drawPrisonerSprite(ctx, 0 * TILE_PX, 4 * TILE_PX, TILE_PX);
    this.registerSprite('char_prisoner', 0, 4, TILE_PX);

    // (1, 4): Guard (Navy Blue Uniform)
    this.drawGuardSprite(ctx, 1 * TILE_PX, 4 * TILE_PX, TILE_PX);
    this.registerSprite('char_guard', 1, 4, TILE_PX);

    // (2, 4): Workman (Hi-Vis Vest & Hardhat)
    this.drawWorkmanSprite(ctx, 2 * TILE_PX, 4 * TILE_PX, TILE_PX);
    this.registerSprite('char_workman', 2, 4, TILE_PX);

    // (3, 4): Solitary / Cell Door
    this.drawDoorSprite(ctx, 3 * TILE_PX, 4 * TILE_PX, TILE_PX);
    this.registerSprite('object_door', 3, 4, TILE_PX);
  }

  private registerSprite(name: string, tileX: number, tileY: number, tileSize: number): void {
    const minU = (tileX * tileSize) / this.width;
    const minV = (tileY * tileSize) / this.height;
    const maxU = ((tileX + 1) * tileSize) / this.width;
    const maxV = ((tileY + 1) * tileSize) / this.height;

    this.spriteUVs.set(name, { minU, minV, maxU, maxV });
  }

  public getUV(name: string): AtlasUVRect {
    const rect = this.spriteUVs.get(name);
    if (rect) return rect;

    // Fallback: full canvas or first tile
    return { minU: 0, minV: 0, maxU: 32 / this.width, maxV: 32 / this.height };
  }

  public getWallUV(wallId: number, autotileIdx: number): AtlasUVRect {
    const clampedMask = autotileIdx & 0x0f;
    if (wallId === 2) {
      return this.getUV(`wall_concrete_${clampedMask}`);
    } else if (wallId === 3) {
      return this.getUV(`wall_perimeter_${clampedMask}`);
    } else {
      return this.getUV(`wall_brick_${clampedMask}`);
    }
  }

  // --- Procedural Texture Drawing Helpers ---

  private drawGrassTile(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
    ctx.fillStyle = '#22543d'; // Deep green
    ctx.fillRect(px, py, size, size);

    // Subtle blades of grass
    ctx.fillStyle = '#2f855a';
    for (let i = 0; i < 16; i++) {
      const rx = px + ((i * 7) % (size - 4)) + 2;
      const ry = py + ((i * 11) % (size - 6)) + 2;
      ctx.fillRect(rx, ry, 2, 3);
    }
  }

  private drawDirtTile(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
    ctx.fillStyle = '#744210'; // Warm earth brown
    ctx.fillRect(px, py, size, size);

    ctx.fillStyle = '#975a16';
    for (let i = 0; i < 12; i++) {
      const rx = px + ((i * 9) % (size - 3)) + 1;
      const ry = py + ((i * 13) % (size - 3)) + 1;
      ctx.fillRect(rx, ry, 2, 2);
    }
  }

  private drawConcreteTile(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
    ctx.fillStyle = '#4a5568'; // Industrial slate grey
    ctx.fillRect(px, py, size, size);

    // Expansion joint seams
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
  }

  private drawCeramicFloorTile(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px, py, size, size);

    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
  }

  private drawWallAutotileTile(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    mask: number,
    style: 'brick' | 'concrete' | 'perimeter'
  ): void {
    // Wall core colors
    let coreColor = '#9b2c2c'; // Brick red
    let trimColor = '#c53030';
    let borderColor = '#4a0e0e';

    if (style === 'concrete') {
      coreColor = '#2d3748';
      trimColor = '#4a5568';
      borderColor = '#1a202c';
    } else if (style === 'perimeter') {
      coreColor = '#1a202c';
      trimColor = '#2d3748';
      borderColor = '#000000';
    }

    const half = size / 2;
    const thickness = 8; // Half thickness
    const minC = half - thickness;
    const maxC = half + thickness;

    // Draw central pillar
    ctx.fillStyle = coreColor;
    ctx.fillRect(px + minC, py + minC, thickness * 2, thickness * 2);

    // Connectors
    const hasN = (mask & 1) !== 0;
    const hasE = (mask & 2) !== 0;
    const hasS = (mask & 4) !== 0;
    const hasW = (mask & 8) !== 0;

    if (hasN) ctx.fillRect(px + minC, py, thickness * 2, minC);
    if (hasS) ctx.fillRect(px + minC, py + maxC, thickness * 2, size - maxC);
    if (hasW) ctx.fillRect(px, py + minC, minC, thickness * 2);
    if (hasE) ctx.fillRect(px + maxC, py + minC, size - maxC, thickness * 2);

    // Bevel highlight
    ctx.fillStyle = trimColor;
    ctx.fillRect(px + minC + 2, py + minC + 2, thickness * 2 - 4, 3);

    // Perimeter border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + minC + 0.5, py + minC + 0.5, thickness * 2 - 1, thickness * 2 - 1);
  }

  private drawPrisonerSprite(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
    const cx = px + size / 2;
    const cy = py + size / 2;

    // Orange prison jumpsuit body
    ctx.fillStyle = '#dd6b20';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fbd38d';
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGuardSprite(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
    const cx = px + size / 2;
    const cy = py + size / 2;

    // Navy guard body
    ctx.fillStyle = '#2b6cb0';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();

    // Guard peaked cap
    ctx.fillStyle = '#1a365d';
    ctx.fillRect(cx - 5, cy - 8, 10, 4);
  }

  private drawWorkmanSprite(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
    const cx = px + size / 2;
    const cy = py + size / 2;

    // Hi-vis orange/yellow vest
    ctx.fillStyle = '#ecc94b';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();

    // Hardhat
    ctx.fillStyle = '#d69e2e';
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 6, Math.PI, 0);
    ctx.fill();
  }

  private drawDoorSprite(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
    ctx.fillStyle = '#718096';
    ctx.fillRect(px + 4, py + 2, size - 8, size - 4);

    // Steel security bars
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;
    for (let x = px + 8; x < px + size - 8; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, py + 4);
      ctx.lineTo(x, py + size - 4);
      ctx.stroke();
    }
  }
}
