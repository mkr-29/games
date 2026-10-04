import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { gameState } from '../../src/engine/GameState.js';
import { BikeSystem } from '../../src/systems/BikeSystem.js';
import { RaceSystem } from '../../src/systems/RaceSystem.js';
import { RiderSystem } from '../../src/systems/RiderSystem.js';

describe('Paddock Progression, Balanced Physics Limits & AI Upgrades', () => {
    beforeEach(() => {
        gameState.resetState();
    });

    it('should normalize bike overall rating appropriately across tiers', () => {
        const state = gameState.getState();
        
        // Tier 1 (Moto3)
        state.tier = 1;
        const moto3Stats = BikeSystem.getBikeStats();
        assert.ok(moto3Stats.overallRating >= 75 && moto3Stats.overallRating <= 95, `Moto3 rating ${moto3Stats.overallRating} should be within 75-95`);

        // Tier 2 (Moto2)
        state.tier = 2;
        const moto2Stats = BikeSystem.getBikeStats();
        assert.ok(moto2Stats.overallRating >= 80 && moto2Stats.overallRating <= 96, `Moto2 rating ${moto2Stats.overallRating} should be within 80-96`);

        // Tier 3 (MotoGP)
        state.tier = 3;
        const motoGPStats = BikeSystem.getBikeStats();
        assert.ok(motoGPStats.overallRating >= 85 && motoGPStats.overallRating <= 100, `MotoGP rating ${motoGPStats.overallRating} should be within 85-100`);
    });

    it('should maintain realistic lap pace deltas and avoid runaway gaps', () => {
        const baseTrackSec = 90.0;
        const sectorRatios = [0.25, 0.25, 0.25, 0.25];

        // Score 95 (dominant factory) vs Score 85 (midfield)
        const topRiderLap = RaceSystem.simulateHotLap(95, 85, baseTrackSec, sectorRatios).bestLap;
        const midfieldRiderLap = RaceSystem.simulateHotLap(85, 80, baseTrackSec, sectorRatios).bestLap;

        const lapDelta = Math.abs(midfieldRiderLap - topRiderLap);
        // In real MotoGP, a 10-point skill/machine difference is ~0.4s to 1.0s per lap, NOT 5-10s!
        assert.ok(lapDelta >= 0.2 && lapDelta <= 1.4, `Lap delta ${lapDelta}s should be realistic (~0.2s - 1.4s), not runaway`);
    });

    it('should continuously upgrade AI teams and riders after completed races', () => {
        const state = gameState.getState();
        state.tier = 3; // MotoGP

        const initialRoster = RiderSystem.getActiveGridRoster(3);
        const bagnaiaInitial = initialRoster.find(r => r.id === 'bagnaia');
        assert.ok(bagnaiaInitial, 'Bagnaia should be in roster');

        const initialBikeRating = bagnaiaInitial.bikeRating;
        const initialSpeed = bagnaiaInitial.speed;

        // Advance paddock through 3 race weekends
        RiderSystem.advancePaddockAfterRace(3, 0);
        RiderSystem.advancePaddockAfterRace(3, 1);
        RiderSystem.advancePaddockAfterRace(3, 2);

        const updatedRoster = RiderSystem.getActiveGridRoster(3);
        const bagnaiaUpdated = updatedRoster.find(r => r.id === 'bagnaia');

        assert.ok(bagnaiaUpdated.bikeRating > initialBikeRating, 'Ducati Lenovo Team should have upgraded bike rating via R&D');
        assert.ok(bagnaiaUpdated.speed >= initialSpeed, 'Rider speed should progress with race experience');

        const paddockState = state.paddockState;
        assert.ok(paddockState.teams['Ducati Lenovo Team'].bikeBonus > 0, 'Team R&D bikeBonus should be positive');
        assert.ok(paddockState.riders['bagnaia'].speedBonus > 0, 'Rider speedBonus should be positive');
    });

    it('should maintain close competitive gaps across the race distance', () => {
        const state = gameState.getState();
        state.tier = 3;
        state.raceState.stage = 'PR';
        state.riders = [
            { id: 'u1', name: 'User Racer 1', overallSkill: 92, consistency: 85, favoriteTracks: [] },
            { id: 'u2', name: 'User Racer 2', overallSkill: 90, consistency: 80, favoriteTracks: [] }
        ];
        gameState.syncRiders();

        RaceSystem.runTimedPractice();

        const lb = state.raceState.leaderboard;
        assert.ok(lb && lb.length > 5, 'Leaderboard should have practice times');

        // Check gap from P1 to P10 in practice
        const p1Time = lb[0].bestLapSec;
        const p10Time = lb[9].bestLapSec;
        const gapP1toP10 = p10Time - p1Time;

        assert.ok(gapP1toP10 < 3.5, `P1 to P10 gap in practice (${gapP1toP10.toFixed(3)}s) should be tight and authentic (under 3.5s)`);
    });
});
