import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { gameState } from '../../src/engine/GameState.js';
import { RaceSystem } from '../../src/systems/RaceSystem.js';

describe('Dual Rider Race Strategy & Tire Configuration', () => {
    beforeEach(() => {
        gameState.resetState();
        const state = gameState.getState();
        state.tier = 3; // MotoGP class
        state.riders = [
            {
                name: 'Francesco Bagnaia',
                number: 63,
                team: 'Ducati Lenovo Team',
                overallSkill: 92,
                consistency: 85,
                wetSkill: 80,
                braking: 90
            },
            {
                name: 'Marc Marquez',
                number: 93,
                team: 'Ducati Lenovo Team',
                overallSkill: 95,
                consistency: 82,
                wetSkill: 92,
                braking: 96
            }
        ];
        gameState.syncRiders();
    });

    it('should configure tire compounds independently for Rider 1 (Slot 0) and Rider 2 (Slot 1)', () => {
        RaceSystem.setTireCompound('soft', 0);
        RaceSystem.setTireCompound('hard', 1);

        const state = gameState.getState();
        assert.equal(state.raceState.riderCompounds[0], 'soft');
        assert.equal(state.raceState.riderCompounds[1], 'hard');
        assert.equal(state.raceState.tireCompound, 'soft', 'Slot 0 should alias to raceState.tireCompound for backward compatibility');
    });

    it('should configure engine power maps / strategies independently for Rider 1 and Rider 2', () => {
        RaceSystem.setStrategy('push', 0);
        RaceSystem.setStrategy('conserve', 1);

        const state = gameState.getState();
        assert.equal(state.raceState.riderStrategies[0], 'push');
        assert.equal(state.raceState.riderStrategies[1], 'conserve');
        assert.equal(state.raceState.strategy, 'push', 'Slot 0 should alias to raceState.strategy for backward compatibility');
    });

    it('should initialize grid with distinct tire compounds for each team rider', () => {
        RaceSystem.setTireCompound('soft', 0);
        RaceSystem.setTireCompound('hard', 1);

        const state = gameState.getState();
        const rs = state.raceState;
        rs.stage = 'RACE';
        rs.grid = [
            { name: 'Francesco Bagnaia', isUser: true, userSlot: 0, score: 92 },
            { name: 'Marc Marquez', isUser: true, userSlot: 1, score: 95 },
            { name: 'Jorge Martin', isUser: false, score: 91 }
        ];

        RaceSystem.prepareGridRidersForRace(rs);

        const rider1 = rs.leaderboard.find(r => r.isUser && r.userSlot === 0);
        const rider2 = rs.leaderboard.find(r => r.isUser && r.userSlot === 1);
        const aiRider = rs.leaderboard.find(r => !r.isUser);

        assert.ok(rider1, 'Rider 1 found in leaderboard');
        assert.ok(rider2, 'Rider 2 found in leaderboard');
        assert.equal(rider1.tireCompound, 'soft');
        assert.equal(rider2.tireCompound, 'hard');
        assert.ok(aiRider, 'AI rider found in leaderboard');
    });

    it('should simulate laps applying different tire wear rates based on individual strategy and compound', () => {
        const state = gameState.getState();
        const rs = state.raceState;
        rs.stage = 'RACE';
        rs.raceInProgress = true;
        rs.currentLap = 1;
        rs.totalLaps = 12;
        rs.weather = 'dry';

        RaceSystem.setStrategy('push', 0);
        RaceSystem.setTireCompound('soft', 0);

        RaceSystem.setStrategy('conserve', 1);
        RaceSystem.setTireCompound('hard', 1);

        rs.grid = [
            { name: 'Francesco Bagnaia', isUser: true, userSlot: 0, score: 92, tireCondition: 100 },
            { name: 'Marc Marquez', isUser: true, userSlot: 1, score: 95, tireCondition: 100 },
            { name: 'Jorge Martin', isUser: false, score: 91, tireCondition: 100 }
        ];

        RaceSystem.prepareGridRidersForRace(rs);

        // Simulate one lap
        RaceSystem.simulateCompletedLap();

        const r1 = rs.leaderboard.find(r => r.isUser && r.userSlot === 0);
        const r2 = rs.leaderboard.find(r => r.isUser && r.userSlot === 1);

        assert.ok(r1.tireCondition < 100, 'Rider 1 tire wore');
        assert.ok(r2.tireCondition < 100, 'Rider 2 tire wore');
        // Rider 1 (Push + Soft) should experience strictly higher tire wear than Rider 2 (Conserve + Hard)
        assert.ok(r1.tireCondition < r2.tireCondition, `Rider 1 condition (${r1.tireCondition}) should be lower than Rider 2 (${r2.tireCondition})`);
        assert.equal(rs.riderTireConditions[0], r1.tireCondition);
        assert.equal(rs.riderTireConditions[1], r2.tireCondition);
    });

    it('should record distinct telemetry in lapHistory for both team riders', () => {
        const state = gameState.getState();
        const rs = state.raceState;
        rs.stage = 'RACE';
        rs.raceInProgress = true;
        rs.currentLap = 1;
        rs.totalLaps = 10;
        rs.weather = 'dry';

        RaceSystem.setStrategy('push', 0);
        RaceSystem.setTireCompound('medium', 0);
        RaceSystem.setStrategy('balanced', 1);
        RaceSystem.setTireCompound('hard', 1);

        rs.grid = [
            { name: 'Francesco Bagnaia', isUser: true, userSlot: 0, score: 92, tireCondition: 100 },
            { name: 'Marc Marquez', isUser: true, userSlot: 1, score: 95, tireCondition: 100 }
        ];

        RaceSystem.prepareGridRidersForRace(rs);
        RaceSystem.simulateCompletedLap();

        assert.equal(rs.lapHistory.length, 2, 'Should record 2 telemetry entries per lap for the dual-rider team');
        const h0 = rs.lapHistory.find(h => h.riderSlot === 0 || h.riderName === 'Francesco Bagnaia');
        const h1 = rs.lapHistory.find(h => h.riderSlot === 1 || h.riderName === 'Marc Marquez');

        assert.ok(h0, 'Rider 1 telemetry recorded');
        assert.ok(h1, 'Rider 2 telemetry recorded');
        assert.equal(h0.strategy, 'PUSH');
        assert.equal(h1.strategy, 'BALANCED');
    });

    it('should handle mid-race incident resolution across both riders', () => {
        const state = gameState.getState();
        const rs = state.raceState;
        rs.activeIncident = { id: 'rain_pit' };
        rs.leaderboard = [
            { name: 'Francesco Bagnaia', isUser: true, userSlot: 0, accumulatedRaceTime: 100, tireCompound: 'medium', tireCondition: 70 },
            { name: 'Marc Marquez', isUser: true, userSlot: 1, accumulatedRaceTime: 101, tireCompound: 'hard', tireCondition: 80 }
        ];

        RaceSystem.resolveIncidentChoice('pit_wet');

        assert.equal(rs.riderCompounds[0], 'wet');
        assert.equal(rs.riderCompounds[1], 'wet');
        assert.equal(rs.riderTireConditions[0], 100);
        assert.equal(rs.riderTireConditions[1], 100);

        const r0 = rs.leaderboard.find(r => r.userSlot === 0);
        const r1 = rs.leaderboard.find(r => r.userSlot === 1);
        assert.equal(r0.tireCompound, 'wet');
        assert.equal(r1.tireCompound, 'wet');
        assert.equal(r0.tireCondition, 100);
        assert.equal(r1.tireCondition, 100);
    });
});
