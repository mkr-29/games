// TickEngine.js - Game Loop & Offline Progress Engine

import { gameState } from './GameState.js';
import { SaveManager } from './SaveManager.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { RaceSystem } from '../systems/RaceSystem.js';

export class TickEngine {
    constructor() {
        this.intervalId = null;
        this.lastTime = Date.now();
        this.autoSaveTimer = 0;
        this.tickRateMs = 100; // 10 ticks per second
        this.listeners = [];
    }

    start() {
        if (this.intervalId) return;

        // Try loading existing save
        const loaded = SaveManager.load();
        if (loaded) {
            this.calculateOfflineProgress();
        }

        this.lastTime = Date.now();
        this.intervalId = setInterval(() => this.tick(), this.tickRateMs);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    tick() {
        const now = Date.now();
        const delta = Math.min((now - this.lastTime) / 1000, 1.0); // Cap tick delta at 1.0s to avoid physics spikes
        this.lastTime = now;

        // Run core systems
        EconomySystem.tick(delta);
        RaceSystem.tick(delta);

        // Auto Save every 15 seconds
        this.autoSaveTimer += delta;
        if (this.autoSaveTimer >= 15) {
            this.autoSaveTimer = 0;
            SaveManager.save();
        }

        // Notify UI render listeners
        this.notifyUI();
    }

    calculateOfflineProgress() {
        const state = gameState.getState();
        const now = Date.now();
        const offlineSecs = Math.floor((now - state.lastSaved) / 1000);

        if (offlineSecs > 5) {
            const cappedSecs = Math.min(offlineSecs, 12 * 3600); // 12 hours max
            
            // Execute economy tick for offline duration
            const gains = EconomySystem.calculateOfflineGains(cappedSecs);
            gameState.addLog(`Welcome back! Offline gains for ${Math.floor(cappedSecs / 60)} mins: +$${gains.cash.toFixed(0)}, +${gains.telemetry.toFixed(0)} Telemetry, +${gains.science.toFixed(0)} RP.`);
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notifyUI() {
        const state = gameState.getState();
        const rates = EconomySystem.getRates();
        this.listeners.forEach(cb => cb(state, rates));
    }
}

export const tickEngine = new TickEngine();
