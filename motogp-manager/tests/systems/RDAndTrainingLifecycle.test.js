import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { gameState } from '../../src/engine/GameState.js';
import { ResearchSystem, TECH_NODES } from '../../src/systems/ResearchSystem.js';
import { StaffSystem } from '../../src/systems/StaffSystem.js';

describe('R&D Upgrades Pipeline & Timed Rider Training Lifecycle', () => {

    describe('Bike R&D 3-Phase Lifecycle (Development -> Testing -> Telemetry Refinements)', () => {
        beforeEach(() => {
            gameState.resetState();
            const state = gameState.getState();
            state.science = 500;
            state.parts = 500;
            state.cash = 50000;
            state.telemetry = 500;
        });

        it('should start development and not instantly unlock the tech', () => {
            const techId = 'pneumatic_valves';
            const started = ResearchSystem.startDevelopment(techId);
            assert.equal(started, true);

            const state = gameState.getState();
            assert.equal(state.unlockedTech.includes(techId), false, 'Tech should not be instantly unlocked');
            assert.ok(state.activeUpgrades[techId], 'Active upgrade entry should be created');
            assert.equal(state.activeUpgrades[techId].stage, 'DEVELOPING');
            assert.equal(state.activeUpgrades[techId].progress, 0);
        });

        it('should transition from DEVELOPING to TESTING once development time elapses', () => {
            const techId = 'pneumatic_valves';
            ResearchSystem.startDevelopment(techId);

            const state = gameState.getState();
            const duration = state.activeUpgrades[techId].duration;

            // Tick forward
            ResearchSystem.tick(duration + 1);

            assert.equal(state.activeUpgrades[techId].stage, 'TESTING');
            assert.equal(state.activeUpgrades[techId].isTestingActive, false);
        });

        it('should execute dyno bench testing and transition to REFINING with telemetry findings', () => {
            const techId = 'pneumatic_valves';
            ResearchSystem.startDevelopment(techId);
            const state = gameState.getState();
            ResearchSystem.tick(state.activeUpgrades[techId].duration + 1);

            // Start Dyno Testing
            const testStarted = ResearchSystem.startTesting(techId);
            assert.equal(testStarted, true);
            assert.equal(state.activeUpgrades[techId].isTestingActive, true);

            // Tick forward through testing
            const testDuration = state.activeUpgrades[techId].testDuration;
            ResearchSystem.tick(testDuration + 1);

            assert.equal(state.activeUpgrades[techId].stage, 'REFINING');
            assert.ok(state.activeUpgrades[techId].testTelemetryLog, 'Telemetry results should be captured');
        });

        it('should allow user to choose an engineering refinement and officially install on bike', () => {
            const techId = 'pneumatic_valves';
            ResearchSystem.startDevelopment(techId);
            const state = gameState.getState();
            ResearchSystem.tick(state.activeUpgrades[techId].duration + 1);
            ResearchSystem.startTesting(techId);
            ResearchSystem.tick(state.activeUpgrades[techId].testDuration + 1);

            const initialPower = state.bike.powerHP;
            const refinements = ResearchSystem.getRefinementsForTech(techId);
            assert.ok(refinements.length >= 3, 'Should provide 3 refinement options');

            // Apply first refinement choice
            const chosenRef = refinements[0];
            const applied = ResearchSystem.applyRefinement(techId, chosenRef.id);
            assert.equal(applied, true);

            // Tech should now be unlocked and fitted
            assert.ok(state.unlockedTech.includes(techId), 'Tech should now be officially unlocked');
            assert.equal(state.activeUpgrades[techId], undefined, 'Active pipeline entry should be cleared');
            assert.ok(state.refinedTechs[techId], 'Refined tech record should exist');
            assert.equal(state.refinedTechs[techId].id, chosenRef.id);
            assert.ok(state.bike.powerHP > initialPower, 'Bike performance bonuses should be applied');
        });
    });

    describe('Timed Rider Training Lifecycle', () => {
        beforeEach(() => {
            gameState.resetState();
            const state = gameState.getState();
            state.cash = 50000;
        });

        it('should start training and not instantly upgrade the skill stats', () => {
            const state = gameState.getState();
            const initialCorneringLvl = state.riders[0].corneringLvl || 1;
            const initialCorneringPts = state.riders[0].cornering || 80;

            const started = StaffSystem.startTraining('cornering', 0);
            assert.equal(started, true);

            // Stats should not be increased yet
            assert.equal(state.riders[0].corneringLvl, initialCorneringLvl);
            assert.equal(state.riders[0].cornering, initialCorneringPts);
            assert.equal(StaffSystem.isTrainingActive('cornering', 0), true);
        });

        it('should complete training and upgrade rider stats after duration ticks', () => {
            const state = gameState.getState();
            const initialCorneringLvl = state.riders[0].corneringLvl || 1;
            const initialCorneringPts = state.riders[0].cornering || 80;

            StaffSystem.startTraining('cornering', 0);
            const trainObj = StaffSystem.getActiveTraining('cornering', 0);
            assert.ok(trainObj);

            // Advance time
            StaffSystem.tick(trainObj.duration + 1);

            // Rider should now be leveled up
            assert.equal(state.riders[0].corneringLvl, initialCorneringLvl + 1);
            assert.equal(state.riders[0].cornering, initialCorneringPts + 3);
            assert.equal(StaffSystem.isTrainingActive('cornering', 0), false);
        });
    });
});
