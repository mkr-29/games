/**
 * DragBoxTool.ts
 * 
 * Interactive drag-to-box construction tool for Prison Architect Web.
 * Translates pointer drag interactions into grid bounding rectangles,
 * produces holographic blueprint ghost previews, and emits construction command packets.
 */

import type { Camera2D } from '../renderer/Camera2D';

export type ConstructionToolMode =
  | 'navigate'
  | 'brick_wall'
  | 'concrete_wall'
  | 'perimeter_wall'
  | 'demolish';

export interface DragRectCommand {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  materialId: number;
  hollow: boolean;
  tileCount: number;
  costEstimateCents: number;
  toolMode: ConstructionToolMode;
}

export interface GhostTile {
  x: number;
  y: number;
  materialId: number;
  isBorder: boolean;
}

export class DragBoxTool {
  public activeMode: ConstructionToolMode = 'brick_wall';
  public hollow = true; // By default, dragging walls creates a rectangular perimeter
  public isDragging = false;

  private canvas: HTMLCanvasElement;
  private camera: Camera2D;
  private dragStartTile: { x: number; y: number } | null = null;
  private dragCurrentTile: { x: number; y: number } | null = null;

  public onCommitRect?: (cmd: DragRectCommand) => void;
  public onGhostChange?: (ghosts: GhostTile[]) => void;

  constructor(canvas: HTMLCanvasElement, camera: Camera2D) {
    this.canvas = canvas;
    this.camera = camera;
  }

  public setMode(mode: ConstructionToolMode): void {
    this.activeMode = mode;
    this.cancelDrag();
  }

  public setHollow(hollow: boolean): void {
    this.hollow = hollow;
  }

  /**
   * Maps active construction tool mode to material ID.
   * 1 = Brick Wall ($50.00)
   * 2 = Reinforced Concrete ($120.00)
   * 3 = Perimeter Wall ($350.00)
   */
  public getMaterialId(): number {
    switch (this.activeMode) {
      case 'brick_wall':
        return 1;
      case 'concrete_wall':
        return 2;
      case 'perimeter_wall':
        return 3;
      case 'demolish':
        return 0;
      default:
        return 1;
    }
  }

  public getMaterialUnitCostCents(): number {
    switch (this.activeMode) {
      case 'brick_wall':
        return 5000; // $50.00
      case 'concrete_wall':
        return 12000; // $120.00
      case 'perimeter_wall':
        return 35000; // $350.00
      default:
        return 0;
    }
  }

  /**
   * Converts client mouse event into tile coordinates.
   */
  public clientToTileCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const world = this.camera.screenToWorld(screenX, screenY);
    return {
      x: Math.floor(world.x),
      y: Math.floor(world.y),
    };
  }

  /**
   * Handles pointer down. Returns true if handled (initiating a drag), or false if navigation mode.
   */
  public handlePointerDown(event: MouseEvent | PointerEvent): boolean {
    if (this.activeMode === 'navigate' || event.button !== 0) {
      return false; // Leave to standard pan
    }

    const tile = this.clientToTileCoords(event.clientX, event.clientY);
    this.isDragging = true;
    this.dragStartTile = { ...tile };
    this.dragCurrentTile = { ...tile };

    if (this.onGhostChange) {
      this.onGhostChange(this.getActiveGhostTiles());
    }

    return true;
  }

  /**
   * Handles pointer move during drag.
   */
  public handlePointerMove(event: MouseEvent | PointerEvent): boolean {
    if (!this.isDragging || !this.dragStartTile) {
      return false;
    }

    const tile = this.clientToTileCoords(event.clientX, event.clientY);
    if (!this.dragCurrentTile || this.dragCurrentTile.x !== tile.x || this.dragCurrentTile.y !== tile.y) {
      this.dragCurrentTile = { ...tile };
      if (this.onGhostChange) {
        this.onGhostChange(this.getActiveGhostTiles());
      }
    }

    return true;
  }

  /**
   * Handles pointer up and dispatches command if a valid rectangle was dragged.
   */
  public handlePointerUp(_event?: MouseEvent | PointerEvent): DragRectCommand | null {
    if (!this.isDragging || !this.dragStartTile || !this.dragCurrentTile) {
      this.cancelDrag();
      return null;
    }

    const minX = Math.min(this.dragStartTile.x, this.dragCurrentTile.x);
    const maxX = Math.max(this.dragStartTile.x, this.dragCurrentTile.x);
    const minY = Math.min(this.dragStartTile.y, this.dragCurrentTile.y);
    const maxY = Math.max(this.dragStartTile.y, this.dragCurrentTile.y);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    let tileCount = 0;
    if (this.hollow && width > 2 && height > 2) {
      tileCount = (width * 2) + ((height - 2) * 2);
    } else {
      tileCount = width * height;
    }

    const command: DragRectCommand = {
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
      materialId: this.getMaterialId(),
      hollow: this.hollow,
      tileCount,
      costEstimateCents: tileCount * this.getMaterialUnitCostCents(),
      toolMode: this.activeMode,
    };

    if (this.onCommitRect) {
      this.onCommitRect(command);
    }

    this.cancelDrag();
    return command;
  }

  /**
   * Cancels the active drag operation.
   */
  public cancelDrag(): void {
    this.isDragging = false;
    this.dragStartTile = null;
    this.dragCurrentTile = null;
    if (this.onGhostChange) {
      this.onGhostChange([]);
    }
  }

  /**
   * Computes list of active holographic ghost tiles currently spanned by the drag box.
   */
  public getActiveGhostTiles(): GhostTile[] {
    if (!this.isDragging || !this.dragStartTile || !this.dragCurrentTile) {
      return [];
    }

    const minX = Math.min(this.dragStartTile.x, this.dragCurrentTile.x);
    const maxX = Math.max(this.dragStartTile.x, this.dragCurrentTile.x);
    const minY = Math.min(this.dragStartTile.y, this.dragCurrentTile.y);
    const maxY = Math.max(this.dragStartTile.y, this.dragCurrentTile.y);

    const ghosts: GhostTile[] = [];
    const matId = this.getMaterialId();

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const isBorder = x === minX || x === maxX || y === minY || y === maxY;
        if (this.hollow && !isBorder) {
          continue;
        }
        ghosts.push({
          x,
          y,
          materialId: matId,
          isBorder,
        });
      }
    }

    return ghosts;
  }

  public getActiveBounds(): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } | null {
    if (!this.isDragging || !this.dragStartTile || !this.dragCurrentTile) {
      return null;
    }

    const minX = Math.min(this.dragStartTile.x, this.dragCurrentTile.x);
    const maxX = Math.max(this.dragStartTile.x, this.dragCurrentTile.x);
    const minY = Math.min(this.dragStartTile.y, this.dragCurrentTile.y);
    const maxY = Math.max(this.dragStartTile.y, this.dragCurrentTile.y);

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }
}
