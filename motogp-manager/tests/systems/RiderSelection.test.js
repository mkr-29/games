import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { OFFICIAL_RACERS, RiderSystem } from '../../src/systems/RiderSystem.js';
import { gameState } from '../../src/engine/GameState.js';
import { StaffSystem } from '../../src/systems/StaffSystem.js';
import { RaceSystem } from '../../src/systems/RaceSystem.js';

describe('Official Racers Database & Dual Racer Team Architecture', () => {

    describe('Official Racers & Rookies JSON Dataset Integrity', () => {
        it('should load all official racers across MotoGP, Moto2, Moto3, Legends, and Rookies', () => {
            assert.ok(Array.isArray(OFFICIAL_RACERS));
            assert.ok(OFFICIAL_RACERS.length >= 60, `Expected at least 60 racers including rookies, found ${OFFICIAL_RACERS.length}`);

            const categories = new Set(OFFICIAL_RACERS.map(r => r.category));
            assert.ok(categories.has('MotoGP'));
            assert.ok(categories.has('Moto2'));
            assert.ok(categories.has('Moto3'));
            assert.ok(categories.has('Legends & Reserves'));
            assert.ok(categories.has('Rookies'));
        });

        it('should contain complete valid properties for every racer and rookie', () => {
            OFFICIAL_RACERS.forEach(r => {
                assert.ok(r.id && typeof r.id === 'string', `Invalid ID for racer ${JSON.stringify(r)}`);
                assert.ok(r.name && typeof r.name === 'string', `Invalid Name for racer ${r.id}`);
                assert.ok(typeof r.number === 'number', `Invalid Number for racer ${r.id}`);
                assert.ok(r.country && typeof r.country === 'string', `Invalid Country for racer ${r.id}`);
                assert.ok(r.team && typeof r.team === 'string', `Invalid Team for racer ${r.id}`);
                assert.ok(typeof r.overallSkill === 'number' && r.overallSkill > 0, `Invalid overallSkill for ${r.id}`);
                assert.ok(typeof r.speed === 'number' && r.speed > 0, `Invalid speed for ${r.id}`);
                assert.ok(typeof r.racecraft === 'number' && r.racecraft > 0, `Invalid racecraft for ${r.id}`);
                assert.ok(typeof r.consistency === 'number' && r.consistency > 0, `Invalid consistency for ${r.id}`);
                assert.ok(typeof r.wetSkill === 'number' && r.wetSkill > 0, `Invalid wetSkill for ${r.id}`);
                assert.ok(Array.isArray(r.favoriteTracks), `Invalid favoriteTracks for ${r.id}`);
            });
        });

        it('should find marquee official riders', () => {
            const bagnaia = RiderSystem.getRacerById('bagnaia');
            const marquez = RiderSystem.getRacerById('marquez_m');
            const martin = RiderSystem.getRacerById('martin_j');
            const acosta = RiderSystem.getRacerById('acosta');
            const rossi = RiderSystem.getRacerById('rossi');

            assert.ok(bagnaia, 'Bagnaia should exist');
            assert.equal(bagnaia.number, 63);
            assert.ok(marquez, 'Marc Marquez should exist');
            assert.equal(marquez.number, 93);
            assert.ok(martin, 'Jorge Martin should exist');
            assert.equal(martin.number, 89);
            assert.ok(acosta, 'Pedro Acosta should exist');
            assert.ok(acosta.number === 31 || acosta.number === 37);
            assert.ok(rossi, 'Valentino Rossi should exist');
            assert.equal(rossi.number, 46);
        });

        it('should find custom rookie academy riders', () => {
            const vega = RiderSystem.getRacerById('rookie_vega');
            const rinaldi = RiderSystem.getRacerById('rookie_rinaldi');
            const dupont = RiderSystem.getRacerById('rookie_dupont');
            const tanaka = RiderSystem.getRacerById('rookie_tanaka');
            const campbell = RiderSystem.getRacerById('rookie_campbell');
            const rao = RiderSystem.getRacerById('rookie_rao');

            assert.ok(vega, 'Rookie Mateo Vega should exist');
            assert.equal(vega.category, 'Rookies');
            assert.equal(vega.number, 29);

            assert.ok(rinaldi, 'Rookie Valentin Rinaldi should exist');
            assert.equal(rinaldi.category, 'Rookies');
            assert.equal(rinaldi.number, 17);

            assert.ok(dupont, 'Rookie Lucas Dupont should exist');
            assert.equal(dupont.wetSkill, 92);

            assert.ok(tanaka, 'Rookie Hiroshi Tanaka should exist');
            assert.ok(campbell, 'Rookie Mason Campbell should exist');
            assert.ok(rao, 'Rookie Arjun Rao should exist');
        });
    });

    describe('Team 2-Racer Formatting with Rookies and GameState Sync', () => {
        beforeEach(() => {
            gameState.resetState();
        });

        it('should format rookie racer into team rider with correct initial progression levels', () => {
            const rookieData = RiderSystem.getRacerById('rookie_vega');
            const teamRider = RiderSystem.formatRiderForTeam(rookieData, 0);

            assert.equal(teamRider.id, 'rookie_vega');
            assert.equal(teamRider.name, 'Mateo Vega');
            assert.equal(teamRider.number, 29);
            assert.equal(teamRider.corneringLvl, 1);
            assert.equal(teamRider.brakingLvl, 1);
            assert.equal(teamRider.consistencyLvl, 1);
            assert.equal(teamRider.wetLvl, 1);
            assert.equal(teamRider.injury, null);
        });

        it('should maintain 2 rookie racers in state.riders and alias state.rider to slot 0', () => {
            const r1 = RiderSystem.formatRiderForTeam(RiderSystem.getRacerById('rookie_vega'), 0);
            const r2 = RiderSystem.formatRiderForTeam(RiderSystem.getRacerById('rookie_rinaldi'), 1);

            gameState.update(state => {
                state.selectedRacersChosen = true;
                state.riders = [r1, r2];
            });

            const state = gameState.getState();
            assert.equal(state.riders.length, 2);
            assert.equal(state.riders[0].id, 'rookie_vega');
            assert.equal(state.riders[1].id, 'rookie_rinaldi');
            assert.equal(state.rider.id, 'rookie_vega', 'state.rider should alias riders[0]');
        });
    });

    describe('Staff & Training for Dual Riders', () => {
        beforeEach(() => {
            gameState.resetState();
            const r1 = RiderSystem.formatRiderForTeam(RiderSystem.getRacerById('bagnaia'), 0);
            const r2 = RiderSystem.formatRiderForTeam(RiderSystem.getRacerById('marquez_m'), 1);
            gameState.update(state => {
                state.riders = [r1, r2];
                state.cash = 50000;
            });
        });

        it('should calculate individual skill costs for Rider 1 and Rider 2', () => {
            const costR1 = StaffSystem.getRiderSkillCost('cornering', 0);
            const costR2 = StaffSystem.getRiderSkillCost('cornering', 1);

            assert.ok(costR1.cash > 0);
            assert.ok(costR2.cash > 0);
        });

        it('should allow upgrading skills independently per rider slot', () => {
            const state = gameState.getState();
            const initialR1Lvl = state.riders[0].corneringLvl || 1;
            const initialR2Lvl = state.riders[1].corneringLvl || 1;

            // Start & Complete Rider 1 Cornering training
            const r1Started = StaffSystem.startTraining('cornering', 0);
            assert.equal(r1Started, true);
            StaffSystem.completeTraining(0, 'cornering');
            assert.equal(state.riders[0].corneringLvl, initialR1Lvl + 1);
            // Rider 2 level should remain unchanged
            assert.equal(state.riders[1].corneringLvl, initialR2Lvl);

            // Start & Complete Rider 2 Cornering training
            const r2Started = StaffSystem.startTraining('cornering', 1);
            assert.equal(r2Started, true);
            StaffSystem.completeTraining(1, 'cornering');
            assert.equal(state.riders[1].corneringLvl, initialR2Lvl + 1);
        });
    });

    describe('Race Grid Deduplication for Player Racers', () => {
        beforeEach(() => {
            gameState.resetState();
        });

        it('should filter out chosen player racers from the AI grid', () => {
            const state = gameState.getState();
            state.tier = 3; // MotoGP tier
            const r1 = RiderSystem.formatRiderForTeam(RiderSystem.getRacerById('bagnaia'), 0);
            const r2 = RiderSystem.formatRiderForTeam(RiderSystem.getRacerById('marquez_m'), 1);

            state.riders = [r1, r2];
            state.rider = r1;

            const grid = RaceSystem.getTierRiders(3);
            const bagnaiaInGrid = grid.find(r => r.id === 'bagnaia' || r.name === 'F. Bagnaia');
            const marquezInGrid = grid.find(r => r.id === 'marquez_m' || r.name === 'M. Marquez');

            assert.equal(bagnaiaInGrid, undefined, 'Player racer 1 should not appear as AI duplicate on grid');
            assert.equal(marquezInGrid, undefined, 'Player racer 2 should not appear as AI duplicate on grid');
        });
    });
});
