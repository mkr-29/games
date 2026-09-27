import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { gameState } from '../../src/engine/GameState.js';
import { RaceSystem } from '../../src/systems/RaceSystem.js';
import { TIERS } from '../../src/systems/PromotionSystem.js';

describe('Sprint Race Prize Calculation and State Sanitization', () => {
    describe('TIERS Configuration', () => {
        it('should define sprint prize structures for Tier 1 (Moto3)', () => {
            const tier1 = TIERS[1];
            assert.equal(tier1.sprintWinPrize, 800);
            assert.equal(tier1.sprintPodiumPrize, 400);
            assert.equal(tier1.sprintTop9Prize, 200);
        });

        it('should define sprint prize structures for Tier 2 (Moto2)', () => {
            const tier2 = TIERS[2];
            assert.equal(tier2.sprintWinPrize, 2500);
            assert.equal(tier2.sprintPodiumPrize, 1500);
            assert.equal(tier2.sprintTop9Prize, 700);
        });

        it('should define sprint prize structures for Tier 3 (MotoGP)', () => {
            const tier3 = TIERS[3];
            assert.equal(tier3.sprintWinPrize, 10000);
            assert.equal(tier3.sprintPodiumPrize, 6000);
            assert.equal(tier3.sprintTop9Prize, 3000);
        });
    });

    describe('RaceSystem.calculateSprintPrize', () => {
        it('should calculate Tier 1 (Moto3) prizes accurately', () => {
            const tier1 = TIERS[1];
            assert.equal(RaceSystem.calculateSprintPrize(tier1, 1), 800, 'P1 win');
            assert.equal(RaceSystem.calculateSprintPrize(tier1, 2), 400, 'P2 podium');
            assert.equal(RaceSystem.calculateSprintPrize(tier1, 3), 400, 'P3 podium');
            assert.equal(RaceSystem.calculateSprintPrize(tier1, 4), 200, 'P4 top 9');
            assert.equal(RaceSystem.calculateSprintPrize(tier1, 9), 200, 'P9 top 9');
            assert.equal(RaceSystem.calculateSprintPrize(tier1, 10), 50, 'P10 consolation (25%)');
            assert.equal(RaceSystem.calculateSprintPrize(tier1, 18), 50, 'P18 consolation (25%)');
        });

        it('should calculate Tier 2 (Moto2) prizes accurately', () => {
            const tier2 = TIERS[2];
            assert.equal(RaceSystem.calculateSprintPrize(tier2, 1), 2500, 'P1 win');
            assert.equal(RaceSystem.calculateSprintPrize(tier2, 2), 1500, 'P2 podium');
            assert.equal(RaceSystem.calculateSprintPrize(tier2, 3), 1500, 'P3 podium');
            assert.equal(RaceSystem.calculateSprintPrize(tier2, 5), 700, 'P5 top 9');
            assert.equal(RaceSystem.calculateSprintPrize(tier2, 9), 700, 'P9 top 9');
            assert.equal(RaceSystem.calculateSprintPrize(tier2, 10), 175, 'P10 consolation (25%)');
        });

        it('should calculate Tier 3 (MotoGP) prizes accurately', () => {
            const tier3 = TIERS[3];
            assert.equal(RaceSystem.calculateSprintPrize(tier3, 1), 10000, 'P1 win');
            assert.equal(RaceSystem.calculateSprintPrize(tier3, 3), 6000, 'P3 podium');
            assert.equal(RaceSystem.calculateSprintPrize(tier3, 7), 3000, 'P7 top 9');
            assert.equal(RaceSystem.calculateSprintPrize(tier3, 12), 750, 'P12 consolation (25%)');
        });

        it('should double prize when heritage_paddock_brand perk is present', () => {
            const tier1 = TIERS[1];
            const perks = ['heritage_paddock_brand'];
            assert.equal(RaceSystem.calculateSprintPrize(tier1, 1, perks), 1600);
            assert.equal(RaceSystem.calculateSprintPrize(tier1, 2, perks), 800);
            assert.equal(RaceSystem.calculateSprintPrize(tier1, 5, perks), 400);
            assert.equal(RaceSystem.calculateSprintPrize(tier1, 10, perks), 100);
        });

        it('should handle edge cases safely and never return NaN', () => {
            assert.equal(RaceSystem.calculateSprintPrize(null, 1), 0);
            assert.equal(RaceSystem.calculateSprintPrize(undefined, 1), 0);
            assert.equal(RaceSystem.calculateSprintPrize({}, 1), 0);
            assert.equal(RaceSystem.calculateSprintPrize({}, 15), 0);
            assert.equal(RaceSystem.calculateSprintPrize({ sprintWinPrize: 'invalid' }, 1), 0);
            assert.equal(RaceSystem.calculateSprintPrize(TIERS[1], 0), 0);
            assert.equal(RaceSystem.calculateSprintPrize(TIERS[1], -5), 0);
            assert.equal(RaceSystem.calculateSprintPrize(TIERS[1], NaN), 0);
        });
    });

    describe('RaceSystem.finishSprintRace State Integration', () => {
        beforeEach(() => {
            gameState.resetState();
            const state = gameState.getState();
            state.raceState.championshipStandings = [];
            state.raceState.leaderboard = [
                { name: 'User Rider', isUser: true, dnf: false, points: 0, wins: 0, podiums: 0 },
                { name: 'Rival 1', isUser: false, dnf: false, points: 0, wins: 0, podiums: 0 }
            ];
            state.rider.name = 'User Rider';
        });

        it('should award finite prize money in Tier 1 without NaN', () => {
            const state = gameState.getState();
            state.tier = 1;
            state.cash = 1000;

            RaceSystem.finishSprintRace();

            assert.equal(Number.isFinite(state.cash), true);
            assert.equal(state.cash, 1800); // 1000 + 800 (P1 win)
            assert.equal(state.raceState.sprintCompleted, true);
        });

        it('should award finite consolation prize for P10+ in Tier 1', () => {
            const state = gameState.getState();
            state.tier = 1;
            state.cash = 500;

            // Setup 12 riders with user at P11
            const riders = [];
            for (let i = 1; i <= 10; i++) {
                riders.push({ name: `Rival ${i}`, isUser: false, dnf: false, points: 0, wins: 0, podiums: 0 });
            }
            riders.push({ name: 'User Rider', isUser: true, dnf: false, points: 0, wins: 0, podiums: 0 });
            state.raceState.leaderboard = riders;

            RaceSystem.finishSprintRace();

            assert.equal(Number.isFinite(state.cash), true);
            assert.equal(state.cash, 550); // 500 + 50 (P11 gets 25% of top9 prize 200 = 50)
            assert.match(state.logs[1], /\+\$50/);
        });

        it('should self-heal pre-existing NaN cash budget on sprint finish', () => {
            const state = gameState.getState();
            state.tier = 1;
            state.cash = NaN; // Corrupted cash

            RaceSystem.finishSprintRace();

            assert.equal(Number.isFinite(state.cash), true);
            assert.equal(state.cash, 800); // Heals NaN -> 0 + 800
        });

        it('should handle DNF cleanly without mutating cash or logging NaN', () => {
            const state = gameState.getState();
            state.tier = 2;
            state.cash = 5000;
            state.raceState.leaderboard[0].dnf = true;

            RaceSystem.finishSprintRace();

            assert.equal(state.cash, 5000);
            assert.match(state.logs[1], /suffered a DNF in the Sprint Race/);
        });
    });
});
