# Enhancement 01: Real-Time Canvas Telemetry & Tire Thermal Heatmaps

- **Type**: Visual & Simulation Enhancement
- **Target Subsystem**: [`src/ui/TrackRadarView.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/TrackRadarView.js) / [`src/ui/LongRunSimView.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/LongRunSimView.js)
- **Status**: Proposed / High Priority

---

## 💡 Concept Overview

In professional MotoGP telemetry analysis (e.g., Magneti Marelli WinTAX4 or 2D Datarecording), race engineers analyze overlapping squiggly trace charts showing vehicle speed, throttle position percentage, front brake hydraulic pressure, and lean angle against distance.

This enhancement introduces a real-time, high-performance **HTML5 2D Canvas Telemetry Oscilloscope** and **3-Zone Tire Thermal Heatmaps** (Left Shoulder, Center Crown, Right Shoulder) for both front and rear tires.

```
       FRONT TIRE                       REAR TIRE
  [Left | Center | Right]         [Left | Center | Right]
  [ 98° |  105°  | 112° ]         [ 110°|  118°  | 126° ]
```

---

## 🛠️ Architecture & Technical Specification

### 1. Multi-Channel Canvas Trace Renderer
Rendered via a dedicated `<canvas id="telemetry-trace-canvas">` using `requestAnimationFrame`:
- **Channel 1 (Cyan Line)**: Speed trace ($0 - 360\text{ km/h}$).
- **Channel 2 (Green Bar)**: Throttle Application ($0 - 100\%$).
- **Channel 3 (Red Bar)**: Front Brake Hydraulic Pressure ($0 - 100\%$).
- **Channel 4 (Orange Line)**: Roll Lean Angle ($0° - 65°$).

### 2. Dual-Layer Asymmetric Tire Thermal Model
Circuits have asymmetric corner distributions (e.g., Sachsenring has 10 left turns and only 3 right turns; Phillip Island has massive left-hand loading through Stoner Corner):
- The model tracks **6 thermal nodes**:
  - Front: Left Shoulder, Center Crown, Right Shoulder
  - Rear: Left Shoulder, Center Crown, Right Shoulder
- Temperatures climb when cornering on the respective side and cool down on straights via convection.
- Overheating ($>125°\text{C}$) triggers blistering and rapid thermal grip drop. Underheating ($<85°\text{C}$) causes cold-tearing.

### 3. Implementation Blueprint
```javascript
export class TelemetryCanvasRenderer {
    constructor(canvasEl) {
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');
        this.history = []; // Max 300 data points (~30 seconds at 10Hz)
    }

    pushSample(speed, throttle, brake, leanAngle) {
        this.history.push({ speed, throttle, brake, leanAngle });
        if (this.history.length > 300) this.history.shift();
    }

    draw() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        // Draw grid, channels, and live scrub line
    }
}
```
