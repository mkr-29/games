// SaveManager.js - Handles persistence & save state serialization

import { gameState, INITIAL_STATE } from './GameState.js';

const SAVE_KEY = 'motogp_manager_save_v1';

export class SaveManager {
    static save() {
        try {
            const state = gameState.getState();
            state.lastSaved = Date.now();
            const serialized = JSON.stringify(state);
            localStorage.setItem(SAVE_KEY, serialized);
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    }

    static load() {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (!data) return false;
            const parsed = JSON.parse(data);
            
            // Merge loaded data with INITIAL_STATE schema to handle updates/new fields safely
            const merged = {
                ...INITIAL_STATE,
                ...parsed,
                producers: { ...INITIAL_STATE.producers, ...(parsed.producers || {}) },
                bike: { ...INITIAL_STATE.bike, ...(parsed.bike || {}) },
                rider: { ...INITIAL_STATE.rider, ...(parsed.rider || {}) },
                crew: { ...INITIAL_STATE.crew, ...(parsed.crew || {}) },
                raceState: { ...INITIAL_STATE.raceState, ...(parsed.raceState || {}) }
            };

            gameState.setState(merged);
            return true;
        } catch (e) {
            console.error('Failed to load save state:', e);
            return false;
        }
    }

    static exportSaveString() {
        const state = gameState.getState();
        const json = JSON.stringify(state);
        return btoa(encodeURIComponent(json));
    }

    static importSaveString(saveString) {
        try {
            const json = decodeURIComponent(atob(saveString.trim()));
            const parsed = JSON.parse(json);
            if (!parsed.version) throw new Error("Invalid save file structure");

            const merged = {
                ...INITIAL_STATE,
                ...parsed
            };

            gameState.setState(merged);
            this.save();
            return true;
        } catch (e) {
            console.error('Invalid save string:', e);
            return false;
        }
    }

    static hardReset() {
        localStorage.removeItem(SAVE_KEY);
        gameState.resetState();
    }
}
