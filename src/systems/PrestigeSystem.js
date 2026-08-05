// PrestigeSystem.js - Rebirth, Heritage Tokens & Permanent Upgrades

import { gameState, INITIAL_STATE } from '../engine/GameState.js';

export const HERITAGE_PERKS = [
    {
        id: 'heritage_paddock_brand',
        name: 'Iconic Brand Power',
        icon: '👑',
        desc: 'Doubles all Cash income from sponsors and race prize money permanently.',
        cost: 1
    },
    {
        id: 'heritage_fast_rnd',
        name: 'Factory R&D Heritage',
        icon: '🧪',
        desc: 'Doubles Research Points (RP) generation speed permanently across all playthroughs.',
        cost: 2
    },
    {
        id: 'heritage_legendary_engineer',
        name: 'Legendary Chief Engineer',
        icon: '👨‍🔧',
        desc: 'Start all future runs with +20 Engine HP and +15 Aero Downforce unlocked from Day 1.',
        cost: 3
    },
    {
        id: 'heritage_telemetry_supercomputer',
        name: 'Paddock Quantum Server',
        icon: '🖥️',
        desc: 'Increases maximum Telemetry data storage by +500 permanently.',
        cost: 5
    }
];

export class PrestigeSystem {
    static getPendingHeritageTokens() {
        const state = gameState.getState();
        const base = Math.floor((state.hype * 0.2) + (state.tier * 3) + (state.raceState.seasonPoints * 0.05));
        return Math.max(0, base);
    }

    static canPrestige() {
        return this.getPendingHeritageTokens() >= 1;
    }

    static performPrestige() {
        if (!this.canPrestige()) return false;

        const state = gameState.getState();
        const pendingHT = this.getPendingHeritageTokens();

        const totalHT = state.heritageTokens + pendingHT;
        const savedPerks = [...state.heritagePerks];
        const resets = state.totalPrestigeResets + 1;

        // Reset to Initial state but keep Heritage Tokens & Perks
        const newState = JSON.parse(JSON.stringify(INITIAL_STATE));
        newState.heritageTokens = totalHT;
        newState.heritagePerks = savedPerks;
        newState.totalPrestigeResets = resets;

        // Apply Legendary Engineer start boost if owned
        if (savedPerks.includes('heritage_legendary_engineer')) {
            newState.bike.powerHP += 20;
            newState.bike.aeroDownforce += 15;
        }

        // Apply Quantum Server storage boost if owned
        if (savedPerks.includes('heritage_telemetry_supercomputer')) {
            newState.telemetryMax += 500;
        }

        gameState.setState(newState);
        gameState.addLog(`🏆 LEGACY REBIRTH COMPLETED! Gained +${pendingHT} Heritage Tokens. Total HT: ${totalHT}.`);
        return true;
    }

    static buyHeritagePerk(perkId) {
        const state = gameState.getState();
        if (state.heritagePerks.includes(perkId)) return false;

        const perk = HERITAGE_PERKS.find(p => p.id === perkId);
        if (!perk) return false;

        if (state.heritageTokens < perk.cost) return false;

        state.heritageTokens -= perk.cost;
        state.heritagePerks.push(perkId);

        // Instant effects
        if (perkId === 'heritage_telemetry_supercomputer') {
            state.telemetryMax += 500;
        }

        gameState.addLog(`🏛️ Unlocked Heritage Perk: ${perk.name}!`);
        return true;
    }
}
