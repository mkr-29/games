/**
 * Camera2D: Top-down 2D camera with sub-pixel pan, clamped zoom (0.1x to 5.0x),
 * mouse-centered zooming, view-projection matrix calculation, and spatial chunk frustum culling.
 */

export interface CameraUniformBufferData {
  viewProjMatrix: Float32Array; // 16 floats (mat4x4)
  cameraPos: Float32Array;      // 2 floats
  zoom: number;
  tileSize: number;
}

export interface ViewportAABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class Camera2D {
  public x: number;
  public y: number;
  public zoom: number;
  public baseTileSize: number;
  public viewportWidth: number;
  public viewportHeight: number;

  public minZoom: number = 0.1;
  public maxZoom: number = 5.0;

  // Pan inertia/velocity
  public vx: number = 0;
  public vy: number = 0;
  public damping: number = 0.88;

  // Cached matrix buffer
  private matrixBuffer: Float32Array = new Float32Array(16);

  constructor(
    initialX = 256,
    initialY = 256,
    initialZoom = 1.0,
    baseTileSize = 32,
    viewportWidth = 1280,
    viewportHeight = 720
  ) {
    this.x = initialX;
    this.y = initialY;
    this.zoom = Math.min(Math.max(initialZoom, this.minZoom), this.maxZoom);
    this.baseTileSize = baseTileSize;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public setViewportSize(width: number, height: number): void {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
  }

  public pan(dxTiles: number, dyTiles: number): void {
    this.x += dxTiles;
    this.y += dyTiles;
  }

  public applyVelocity(): void {
    if (Math.abs(this.vx) > 0.001 || Math.abs(this.vy) > 0.001) {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= this.damping;
      this.vy *= this.damping;
    } else {
      this.vx = 0;
      this.vy = 0;
    }
  }

  /**
   * Zooms in or out centered at a specific screen pixel coordinate (e.g. cursor position).
   * Ensures the world point under the cursor remains invariant before and after zoom.
   */
  public zoomAtScreenPoint(factor: number, screenX: number, screenY: number): void {
    const worldBefore = this.screenToWorld(screenX, screenY);
    const targetZoom = Math.min(Math.max(this.zoom * factor, this.minZoom), this.maxZoom);
    this.zoom = targetZoom;

    // Adjust camera position so world point remains invariant
    const effectiveTilePixels = this.baseTileSize * this.zoom;
    this.x = worldBefore.x - (screenX - this.viewportWidth / 2) / effectiveTilePixels;
    this.y = worldBefore.y - (screenY - this.viewportHeight / 2) / effectiveTilePixels;
  }

  /**
   * Converts screen pixel coordinates (0, 0 top-left) to world tile coordinates.
   */
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const effectiveTilePixels = this.baseTileSize * this.zoom;
    const dxPixels = screenX - this.viewportWidth / 2;
    const dyPixels = screenY - this.viewportHeight / 2;

    return {
      x: this.x + dxPixels / effectiveTilePixels,
      y: this.y + dyPixels / effectiveTilePixels,
    };
  }

  /**
   * Converts world tile coordinates to screen pixel coordinates.
   */
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const effectiveTilePixels = this.baseTileSize * this.zoom;
    return {
      x: this.viewportWidth / 2 + (worldX - this.x) * effectiveTilePixels,
      y: this.viewportHeight / 2 + (worldY - this.y) * effectiveTilePixels,
    };
  }

  /**
   * Calculates the current visible world-space AABB bounding box.
   */
  public getVisibleAABB(marginTiles = 2): ViewportAABB {
    const effectiveTilePixels = this.baseTileSize * this.zoom;
    const halfWidthTiles = this.viewportWidth / (2 * effectiveTilePixels) + marginTiles;
    const halfHeightTiles = this.viewportHeight / (2 * effectiveTilePixels) + marginTiles;

    return {
      minX: this.x - halfWidthTiles,
      minY: this.y - halfHeightTiles,
      maxX: this.x + halfWidthTiles,
      maxY: this.y + halfHeightTiles,
    };
  }

  /**
   * Frustum Culling Test: Determines whether a 32x32 spatial chunk intersects the viewport.
   */
  public isChunkVisible(chunkX: number, chunkY: number, chunkSize = 32): boolean {
    const aabb = this.getVisibleAABB(0);

    const chunkMinX = chunkX * chunkSize;
    const chunkMaxX = chunkMinX + chunkSize;
    const chunkMinY = chunkY * chunkSize;
    const chunkMaxY = chunkMinY + chunkSize;

    return (
      chunkMaxX >= aabb.minX &&
      chunkMinX <= aabb.maxX &&
      chunkMaxY >= aabb.minY &&
      chunkMinY <= aabb.maxY
    );
  }

  /**
   * Computes the 4x4 View-Projection matrix for WebGPU vertex shaders.
   * Maps world space (0..512) directly to WebGPU Normalized Device Coordinates (-1..1).
   */
  public getViewProjectionMatrix(): Float32Array {
    const effectiveTilePixels = this.baseTileSize * this.zoom;
    const sx = (2 * effectiveTilePixels) / this.viewportWidth;
    const sy = (-2 * effectiveTilePixels) / this.viewportHeight; // Invert Y for top-down grid

    // Column-major 4x4 orthographic matrix
    this.matrixBuffer[0] = sx;
    this.matrixBuffer[1] = 0;
    this.matrixBuffer[2] = 0;
    this.matrixBuffer[3] = 0;

    this.matrixBuffer[4] = 0;
    this.matrixBuffer[5] = sy;
    this.matrixBuffer[6] = 0;
    this.matrixBuffer[7] = 0;

    this.matrixBuffer[8] = 0;
    this.matrixBuffer[9] = 0;
    this.matrixBuffer[10] = 1;
    this.matrixBuffer[11] = 0;

    this.matrixBuffer[12] = -this.x * sx;
    this.matrixBuffer[13] = -this.y * sy;
    this.matrixBuffer[14] = 0;
    this.matrixBuffer[15] = 1;

    return this.matrixBuffer;
  }
}
