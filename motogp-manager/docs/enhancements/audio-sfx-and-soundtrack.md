# Enhancement 03: Web Audio API Engine & Pit Wall Soundscape

- **Type**: Audio / Immersion Enhancement
- **Target Subsystem**: New `src/engine/AudioEngine.js`
- **Status**: Proposed / Medium Priority

---

## 💡 Concept Overview

Motorsport management games benefit heavily from immersive auditory feedback—the unmistakable roar of 300-horsepower V4 engines screaming down straightaways, pneumatic air-wrenches spinning titanium axle nuts in pit stops, radio static click-bursts, and tension-building podium music.

This enhancement introduces an autonomous, zero-dependency **Web Audio API Engine** that generates synthesized sound effects procedurally and streams lightweight audio assets without external libraries.

---

## 🔊 Sound Design Architecture

### 1. Procedural Audio Synthesis via Web Audio API
Using `AudioContext`, `OscillatorNode`, and `BiquadFilterNode`:
- **Pit Lane Click Feedback**: Pleasant high-frequency tactile beep on manual clicks.
- **Pneumatic Pit Gun**: Rapid white-noise burst modulated with low-pass filters to simulate wheel nut changes.
- **Team Radio Squelch**: Authentic band-pass filtered walkie-talkie chirp preceding pit wall radio notes.
- **Chequered Flag Air Horn**: Horn blast at race finish.

### 2. Live Engine Sound Simulation
- Modulate an oscillator frequency linked directly to `trackProgress` and `speed`:
  - Frequency sweeps up through gears 1 to 6 down straightaways.
  - Abrupt drops on downshifts into heavy braking hairpins.

```javascript
// Example: Procedural Team Radio Chirp
export class AudioEngine {
    static init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    static playRadioBeep() {
        if (!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }
}
```
