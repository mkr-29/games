# Domain 06: Graphics, UI & Sound
## Feature Specification 04: Spatial Audio Engine, Acoustic Occlusion & AudioWorklet

---

## 1. System Overview & The Acoustic Atmosphere

Sound design is essential for conveying the tense, claustrophobic atmosphere of an institutional penitentiary. *Prison Architect Web* implements an advanced acoustic subsystem using the **Web Audio API** and a dedicated **`AudioWorklet` processor**.

The audio engine features:
1. **Thread-Isolated Synthesis:** Audio rendering occurs off the main thread in the browser's high-priority audio thread, preventing audio glitches during intense simulation spikes.
2. **Positional Spatial Audio:** Sounds pan and attenuate based on their distance and angle relative to the active camera viewport center.
3. **Dynamic Wall Occlusion:** Sounds traveling through solid concrete walls are subjected to real-time **Low-Pass Filtering (muffling)**; opening a heavy security door clears the filter, allowing crisp sound to spill into the corridor.
4. **Adaptive Procedural Tension Score:** A dynamic soundtrack where rhythmic percussion layers fade in proportionally to the **Prison Danger Gauge**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MAIN THREAD / SIM WORKER                        │
│  - Emits Sound Events: (SoundId, WorldX, WorldY, Volume, Pitch)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Ring Buffer (AudioEventQueue)
┌───────────────────────────────────┴────────────────────────────────────┐
│                    HIGH-PRIORITY AUDIO THREAD                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. VOICE LIMITER & VIRTUALIZATION                                      │
│    Limits max concurrent voices (e.g., max 32) to prevent clipping     │
├────────────────────────────────────────────────────────────────────────┤
│ 2. POSITIONAL ATTENUATION (Inverse Distance Clamping)                  │
│    Pans sound Left/Right; calculates Euclidean volume falloff          │
├────────────────────────────────────────────────────────────────────────┤
│ 3. ACOUSTIC OCCLUSION FILTER (`BiquadFilterNode` Low-Pass)             │
│    Samples Wall Bitmask: Drops cutoff to 400Hz if wall intervenes      │
├────────────────────────────────────────────────────────────────────────┤
│ 4. REVERBERATION & ROOM IMPULSES (`ConvolverNode`)                     │
│    Adds metallic, echoing resonance to large tiled canteens & showers  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dynamic Acoustic Wall Occlusion

When an audio event triggers in the world (e.g., an inmate screaming during a fight):
1. A fast 2D Bresenham line check is cast between the sound source $(x_s, y_s)$ and the camera center $(x_c, y_c)$.
2. The number of intervening solid walls and closed doors is summed:

$$N_{\text{walls}} = \sum \text{IntersectingWalls}$$

3. The cutoff frequency of a **Biquad Low-Pass Filter** is adjusted:

$$F_{\text{cutoff}} = \max\left(350\text{ Hz}, \, 20000\text{ Hz} \times 0.4^{N_{\text{walls}}}\right)$$

* **Direct Line of Sight:** $F_{\text{cutoff}} = 20,000 \text{ Hz}$ (Crisp, sharp metal clangs).
* **1 Concrete Wall Intervening:** $F_{\text{cutoff}} \approx 8,000 \text{ Hz}$ (Slightly dampened).
* **3 Walls Intervening:** $F_{\text{cutoff}} \approx 1,280 \text{ Hz}$ (Heavy, muffled thudding).

---

## 3. Adaptive Riot Tension Score

The game soundtrack is composed of **4 synchronized stem layers**:
* **Layer 1: Ambient Drone (Always Active):** Deep sub-bass hum, fluorescent tube flicker.
* **Layer 2: Mild Agitation (Danger > 30%):** Tense cello pulses, distant metallic tapping.
* **Layer 3: Imminent Threat (Danger > 60%):** Driving snare drums, distorted basslines.
* **Layer 4: Full Riot (Danger > 80%):** Aggressive industrial drums, blaring emergency sirens.

```typescript
// AudioWorklet / Gain Node Interpolation
export function updateMusicTension(dangerNormalized: number, audioCtx: AudioContext, stems: MusicStems) {
  const now = audioCtx.currentTime;
  const rampTime = 2.0; // 2-second smooth crossfade

  stems.layer1.gain.linearRampToValueAtTime(1.0, now + rampTime);
  stems.layer2.gain.linearRampToValueAtTime(dangerNormalized > 0.3 ? 1.0 : 0.0, now + rampTime);
  stems.layer3.gain.linearRampToValueAtTime(dangerNormalized > 0.6 ? 1.0 : 0.0, now + rampTime);
  stems.layer4.gain.linearRampToValueAtTime(dangerNormalized > 0.8 ? 1.0 : 0.0, now + rampTime);
}
```

---

## 4. Voice Allocation & Polyphony Limiter

In a prison of 1,000 inmates, having 200 toilets flush simultaneously at 07:00 AM would exhaust audio voices and cause nasty digital distortion.

The engine implements a **Voice Virtualization Pool (Max 32 Active Hardware Voices)**:
* Each sound event is assigned a dynamic priority score:
  $$\text{Priority} = \frac{\text{BaseVolume}}{\text{Distance}^2} \times \text{ImportanceWeight}$$
* **Gunshots, Taser discharges, and Riot alarms** have an importance weight of $10.0$.
* **Footsteps and toilet flushes** have an importance weight of $1.0$.
* If the 32-voice limit is exceeded, the lowest-priority voice is immediately culled.

---

## 5. Web Audio Node Graph Layout

```
[ Sound Buffer Source ]
          │
          ▼
[ GainNode: Instance Volume ]
          │
          ▼
[ BiquadFilterNode: Wall Occlusion Low-Pass ]
          │
          ▼
[ StereoPannerNode: 2D Spatial Panning ]
          │
          ├──(Dry Path)──► [ Master Mixer ] ──► [ AudioContext.destination ]
          │
          └──(Wet Path)──► [ ConvolverNode: Tile Echo ] ──┘
```

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Browser Autoplay Audio Policy** | Browser blocks sound playback before user interaction; console flooded with warnings. | User Gesture Unlock: The audio context remains suspended until the player clicks `New Game` or `Load Prison` on the title screen. |
| **Tab Inactive / Background Freezes** | Browser throttles audio clock when switching tabs, causing audio desync. | AudioContext Pause Hook: Automatically suspend `AudioContext` when `document.hidden` is true, resuming smoothly on tab focus. |
| **Rapid Panning Stutter** | Player drags camera at high speed; sound sources rapidly jump across stereo channels. | Panning Smoothing: Panner node coordinates use exponential parameter ramps (`setTargetAtTime`) with a 50ms time constant. |
