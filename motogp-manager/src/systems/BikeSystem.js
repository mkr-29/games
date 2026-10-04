// BikeSystem.js - Machine stats & performance calculation

import { gameState } from '../engine/GameState.js';

export class BikeSystem {
    static getBikeStats() {
        const state = gameState.getState();
        const b = state.bike || {};
        const c = state.crew || {};
        const tier = state.tier || 1;

        // Base values
        let hp = b.powerHP !== undefined ? b.powerHP : 55;
        let aero = b.aeroDownforce !== undefined ? b.aeroDownforce : 10;
        let chassis = b.chassisGrip !== undefined ? b.chassisGrip : 15;
        let ecu = b.ecuIntelligence !== undefined ? b.ecuIntelligence : 5;

        // Apply staff bonuses
        if (c.aerodynamicist > 0) aero += c.aerodynamicist * 5;

        // Tier-specific baseline and scaling envelopes for authentic 0-100 Grand Prix bike rating
        let tierBaseHP = 55;
        let tierMaxHP = 95;
        let tierBaseAero = 10;
        let tierMaxAero = 40;
        let tierBaseChassis = 15;
        let tierMaxChassis = 45;
        let tierBaseECU = 5;
        let tierMaxECU = 30;

        let baseRating = 79.0; // Entry tier machine rating
        let maxRating = 92.5;  // Top factory tier machine rating

        if (tier === 2) {
            tierBaseHP = 140;
            tierMaxHP = 200;
            tierBaseAero = 25;
            tierMaxAero = 60;
            tierBaseChassis = 30;
            tierMaxChassis = 65;
            tierBaseECU = 15;
            tierMaxECU = 50;
            baseRating = 82.0;
            maxRating = 94.5;
        } else if (tier >= 3) {
            tierBaseHP = 280;
            tierMaxHP = 330;
            tierBaseAero = 60;
            tierMaxAero = 105;
            tierBaseChassis = 60;
            tierMaxChassis = 105;
            tierBaseECU = 40;
            tierMaxECU = 90;
            baseRating = 86.5;
            maxRating = 98.5;
        }

        // Relative progress within category development spec envelope [0.0 to 1.0+]
        const hpProgress = Math.max(0, (hp - tierBaseHP) / Math.max(1, tierMaxHP - tierBaseHP));
        const aeroProgress = Math.max(0, (aero - tierBaseAero) / Math.max(1, tierMaxAero - tierBaseAero));
        const chassisProgress = Math.max(0, (chassis - tierBaseChassis) / Math.max(1, tierMaxChassis - tierBaseChassis));
        const ecuProgress = Math.max(0, (ecu - tierBaseECU) / Math.max(1, tierMaxECU - tierBaseECU));

        const compositeProgress = (hpProgress * 0.40) + (aeroProgress * 0.25) + (chassisProgress * 0.25) + (ecuProgress * 0.10);
        const overallRating = Math.min(99.0, Math.max(65.0, baseRating + (compositeProgress * (maxRating - baseRating))));

        const baseTopSpeed = tier === 1 ? 220 : (tier === 2 ? 288 : 348);
        const maxSpeedGain = tier === 1 ? 16 : (tier === 2 ? 20 : 22);
        const topSpeedKmh = Math.round(baseTopSpeed + (Math.min(1.2, hpProgress) * maxSpeedGain));

        return {
            hp,
            aero,
            chassis,
            ecu,
            overallRating: Math.round(overallRating * 10) / 10,
            topSpeedKmh,
            hpProgress,
            aeroProgress,
            chassisProgress,
            ecuProgress
        };
    }
}
