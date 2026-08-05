// BikeSystem.js - Machine stats & performance calculation

import { gameState } from '../engine/GameState.js';

export class BikeSystem {
    static getBikeStats() {
        const state = gameState.getState();
        const b = state.bike;
        const c = state.crew;

        // Base values
        let hp = b.powerHP;
        let aero = b.aeroDownforce;
        let chassis = b.chassisGrip;
        let ecu = b.ecuIntelligence;

        // Apply staff bonuses
        if (c.aerodynamicist > 0) aero += c.aerodynamicist * 5;

        // Overall rating calculation
        const overallRating = Math.round((hp * 0.4) + (aero * 0.25) + (chassis * 0.25) + (ecu * 0.1));
        const topSpeedKmh = Math.round(180 + (hp * 0.95));

        return {
            hp,
            aero,
            chassis,
            ecu,
            overallRating,
            topSpeedKmh
        };
    }
}
