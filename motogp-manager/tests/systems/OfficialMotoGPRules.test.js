import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { gameState } from '../../src/engine/GameState.js';
import { RaceSystem, GP_CALENDAR } from '../../src/systems/RaceSystem.js';
import { TIERS } from '../../src/systems/PromotionSystem.js';
import { BikeSystem } from '../../src/systems/BikeSystem.js';
import { EconomySystem, OFFICIAL_MOTOGP_SPONSORS } from '../../src/systems/EconomySystem.js';

describe('Official FIM MotoGP™ Regulations & Scoring Verification', () => {
    beforeEach(() => {
        gameState.resetState();
    });

    describe('1. Official Grand Prix Championship Scoring System', () => {
        it('should strictly cap a Grand Prix race win at 25 points and award 0 bonus points for fastest lap', () => {
            const state = gameState.getState();
            state.tier = 3;
            state.riders = [
                { id: 'user_1', name: 'F. Bagnaia', number: 63, team: 'Ducati Lenovo Team', overallSkill: 95 },
                { id: 'user_2', name: 'M. Marquez', number: 93, team: 'Ducati Lenovo Team', overallSkill: 96 }
            ];
            gameState.syncRiders();
            RaceSystem.initChampionshipStandings(true);

            const rs = state.raceState;
            // P1 winner sets fastest lap
            rs.leaderboard = [
                { id: 'user_1', name: 'F. Bagnaia', isUser: true, userSlot: 0, dnf: false }, // P1: 25 pts
                { id: 'user_2', name: 'M. Marquez', isUser: true, userSlot: 1, dnf: false }  // P2: 20 pts
            ];

            rs.fastestLap = {
                riderName: 'F. Bagnaia',
                lapTimeSec: 89.214,
                lapTimeStr: '1:29.214',
                lapNum: 5
            };

            RaceSystem.finishRace();

            const p1Standing = rs.championshipStandings.find(s => s.isUser && s.userSlot === 0);
            const p2Standing = rs.championshipStandings.find(s => s.isUser && s.userSlot === 1);

            // CRITICAL OFFICIAL MOTOGP RULE: Win is ALWAYS capped at 25 points!
            assert.equal(p1Standing.points, 25, 'Winner points must be strictly capped at 25 points (never 26)');
            assert.equal(p1Standing.fastestLaps, 1, 'Fastest lap stat count should be incremented');
            assert.equal(p2Standing.points, 20, 'P2 receives exactly 20 points');
        });

        it('should award 0 fastest lap bonus points to non-winners as well', () => {
            const state = gameState.getState();
            state.tier = 3;
            state.riders = [
                { id: 'user_1', name: 'F. Bagnaia', number: 63, team: 'Ducati Lenovo Team', overallSkill: 95 },
                { id: 'user_2', name: 'M. Marquez', number: 93, team: 'Ducati Lenovo Team', overallSkill: 96 }
            ];
            gameState.syncRiders();
            RaceSystem.initChampionshipStandings(true);

            const rs = state.raceState;
            rs.leaderboard = [
                { id: 'user_1', name: 'F. Bagnaia', isUser: true, userSlot: 0, dnf: false }, // P1: 25 pts
                { id: 'user_2', name: 'M. Marquez', isUser: true, userSlot: 1, dnf: false }  // P2: 20 pts
            ];

            // P2 rider sets fastest lap
            rs.fastestLap = {
                riderName: 'M. Marquez',
                lapTimeSec: 89.102,
                lapTimeStr: '1:29.102',
                lapNum: 7
            };

            RaceSystem.finishRace();

            const p2Standing = rs.championshipStandings.find(s => s.isUser && s.userSlot === 1);
            assert.equal(p2Standing.points, 20, 'P2 rider with fastest lap must receive exactly 20 points, not 21');
            assert.equal(p2Standing.fastestLaps, 1, 'Fastest lap recorded in stats');
        });

        it('should strictly award official FIM Grand Prix points table (25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1)', () => {
            const state = gameState.getState();
            state.tier = 1; // Moto3
            RaceSystem.initChampionshipStandings(true);

            const rs = state.raceState;
            const officialFIMPoints = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

            // Mock full 16 rider classification
            rs.leaderboard = Array.from({ length: 16 }, (_, i) => ({
                id: `ai_${i + 1}`,
                name: `Rider ${i + 1}`,
                isUser: false,
                dnf: false
            }));

            // Make sure standings exist for all
            rs.championshipStandings = rs.leaderboard.map(r => ({
                id: r.id,
                name: r.name,
                points: 0,
                wins: 0,
                podiums: 0,
                fastestLaps: 0
            }));

            RaceSystem.finishRace();

            officialFIMPoints.forEach((expectedPts, idx) => {
                const rStanding = rs.championshipStandings.find(s => s.name === `Rider ${idx + 1}`);
                assert.equal(rStanding.points, expectedPts, `P${idx + 1} should receive ${expectedPts} points`);
            });

            const p16Standing = rs.championshipStandings.find(s => s.name === 'Rider 16');
            assert.equal(p16Standing.points, 0, 'P16 should receive 0 points');
        });
    });

    describe('2. Official Race Laps per Category (Moto3, Moto2, MotoGP, Sprint)', () => {
        it('should define official lap counts for all 22 calendar circuits', () => {
            assert.equal(GP_CALENDAR.length, 22, 'Calendar must have 22 Grand Prix rounds');

            GP_CALENDAR.forEach(gp => {
                assert.ok(gp.lapsMotoGP >= 20 && gp.lapsMotoGP <= 30, `${gp.title} MotoGP laps (${gp.lapsMotoGP}) must be between 20 and 30`);
                assert.ok(gp.lapsSprint >= 10 && gp.lapsSprint <= 15, `${gp.title} Sprint laps (${gp.lapsSprint}) must be ~50% distance`);
                assert.ok(gp.lapsMoto2 >= 16 && gp.lapsMoto2 <= 25, `${gp.title} Moto2 laps (${gp.lapsMoto2}) must be ~80-85% distance`);
                assert.ok(gp.lapsMoto3 >= 14 && gp.lapsMoto3 <= 23, `${gp.title} Moto3 laps (${gp.lapsMoto3}) must be ~70-75% distance`);

                // Sprint must be exactly half distance (or rounded as scheduled)
                assert.equal(gp.lapsSprint, Math.floor(gp.lapsMotoGP / 2), `${gp.title} sprint laps must be half of MotoGP distance`);
            });
        });

        it('should return category-specific lap counts from RaceSystem.getGPLaps', () => {
            const mugello = GP_CALENDAR.find(gp => gp.id === 'mugello');
            assert.ok(mugello, 'Mugello should exist in calendar');

            assert.equal(RaceSystem.getGPLaps(mugello, 1, 'RACE'), 17, 'Moto3 at Mugello should be 17 laps');
            assert.equal(RaceSystem.getGPLaps(mugello, 2, 'RACE'), 19, 'Moto2 at Mugello should be 19 laps');
            assert.equal(RaceSystem.getGPLaps(mugello, 3, 'RACE'), 23, 'MotoGP Grand Prix at Mugello should be 23 laps');
            assert.equal(RaceSystem.getGPLaps(mugello, 3, 'SPRINT'), 11, 'MotoGP Saturday Sprint at Mugello should be 11 laps');
        });

        it('should start race sessions with the correct totalLaps for the active tier', () => {
            const state = gameState.getState();

            // Tier 1 Moto3
            state.tier = 1;
            state.raceState.stage = 'RACE';
            state.raceState.currentGPIndex = 0; // Thailand
            RaceSystem.startGrandPrixRace();
            assert.equal(state.raceState.totalLaps, 19, 'Thailand Moto3 race should be 19 laps');
            state.raceState.raceInProgress = false;

            // Tier 2 Moto2
            state.tier = 2;
            state.raceState.stage = 'RACE';
            state.raceState.currentGPIndex = 0; // Thailand
            RaceSystem.startGrandPrixRace();
            assert.equal(state.raceState.totalLaps, 22, 'Thailand Moto2 race should be 22 laps');
            state.raceState.raceInProgress = false;

            // Tier 3 MotoGP
            state.tier = 3;
            state.raceState.stage = 'SPRINT';
            state.raceState.currentGPIndex = 0; // Thailand
            RaceSystem.startSprintRace();
            assert.equal(state.raceState.totalLaps, 13, 'Thailand MotoGP Sprint should be 13 laps');
            state.raceState.raceInProgress = false;

            state.raceState.stage = 'RACE';
            RaceSystem.startGrandPrixRace();
            assert.equal(state.raceState.totalLaps, 26, 'Thailand MotoGP Sunday Grand Prix should be 26 laps');
        });
    });

    describe('3. Official Engine Specs & Regulations', () => {
        it('should define accurate official FIM technical specifications across all tiers', () => {
            const moto3 = TIERS[1];
            assert.ok(moto3.engineSpec.includes('250cc'), 'Moto3 engine must be 250cc');
            assert.ok(moto3.revLimit.includes('13,500 RPM'), 'Moto3 rev limit must be 13,500 RPM');
            assert.ok(moto3.topSpeedKmh.includes('245–250 km/h'), 'Moto3 top speed must be 245-250 km/h');
            assert.ok(moto3.brakes.includes('Carbon Brakes Strictly Banned'), 'Moto3 carbon brakes must be banned');

            const moto2 = TIERS[2];
            assert.ok(moto2.engineSpec.includes('765cc'), 'Moto2 engine must be Triumph 765cc');
            assert.ok(moto2.revLimit.includes('14,000 RPM'), 'Moto2 rev limit must be 14,000 RPM');
            assert.ok(moto2.topSpeedKmh.includes('295–301 km/h'), 'Moto2 top speed must be 295-301 km/h');

            const motogp = TIERS[3];
            assert.ok(motogp.engineSpec.includes('1,000cc'), 'MotoGP engine must be 1,000cc');
            assert.ok(motogp.revLimit.includes('18,500+ RPM'), 'MotoGP rev limit must be 18,500+ RPM');
            assert.ok(motogp.topSpeedKmh.includes('366.1 km/h'), 'MotoGP top speed must reference official 366.1 km/h record');
            assert.ok(motogp.brakes.includes('Carbon-Carbon Discs'), 'MotoGP must specify carbon-carbon disc brakes');
        });

        it('should calculate authentic top speeds in BikeSystem', () => {
            const state = gameState.getState();

            // Tier 1 (Moto3): ~242 to 250 km/h
            state.tier = 1;
            const moto3Speed = BikeSystem.getBikeStats().topSpeedKmh;
            assert.ok(moto3Speed >= 242 && moto3Speed <= 250, `Moto3 top speed (${moto3Speed} km/h) should be 242-250 km/h`);

            // Tier 2 (Moto2): ~294 to 301 km/h
            state.tier = 2;
            state.bike.powerHP = 140;
            const moto2Speed = BikeSystem.getBikeStats().topSpeedKmh;
            assert.ok(moto2Speed >= 294 && moto2Speed <= 301, `Moto2 top speed (${moto2Speed} km/h) should be 294-301 km/h`);

            // Tier 3 (MotoGP): ~355 to 366+ km/h
            state.tier = 3;
            state.bike.powerHP = 290;
            const motogpSpeed = BikeSystem.getBikeStats().topSpeedKmh;
            assert.ok(motogpSpeed >= 355 && motogpSpeed <= 367, `MotoGP top speed (${motogpSpeed} km/h) should be 355-367 km/h`);
        });
    });

    describe('4. Official MotoGP™ Paddock Commercial Sponsors', () => {
        it('should provide authentic official paddock sponsors per tier', () => {
            const moto3Sponsors = EconomySystem.getAvailableSponsors(1);
            const moto2Sponsors = EconomySystem.getAvailableSponsors(2);
            const motogpSponsors = EconomySystem.getAvailableSponsors(3);

            assert.ok(moto3Sponsors.some(s => s.id === 'estrella_galicia'), 'Estrella Galicia 0,0 should be in Moto3');
            assert.ok(moto3Sponsors.some(s => s.id === 'liqui_moly'), 'Liqui Moly should be in Moto3');
            assert.ok(moto3Sponsors.some(s => s.id === 'dellorto_systems'), 'DellOrto should be in Moto3');

            assert.ok(moto2Sponsors.some(s => s.id === 'triumph_racing'), 'Triumph should be in Moto2');
            assert.ok(moto2Sponsors.some(s => s.id === 'kalex_engineering'), 'Kalex should be in Moto2');

            assert.ok(motogpSponsors.some(s => s.id === 'red_bull_energy'), 'Red Bull should be in MotoGP');
            assert.ok(motogpSponsors.some(s => s.id === 'monster_energy'), 'Monster Energy should be in MotoGP');
            assert.ok(motogpSponsors.some(s => s.id === 'repsol_oil'), 'Repsol should be in MotoGP');
            assert.ok(motogpSponsors.some(s => s.id === 'lenovo_tech'), 'Lenovo should be in MotoGP');
            assert.ok(motogpSponsors.some(s => s.id === 'brembo_carbon'), 'Brembo should be in MotoGP');
            assert.ok(motogpSponsors.some(s => s.id === 'michelin_motorsport'), 'Michelin should be in MotoGP');
        });

        it('should allow signing sponsors when eligible and award bonuses', () => {
            const state = gameState.getState();
            state.tier = 1;
            state.hype = 20;
            state.cash = 1000;
            state.activeSponsors = [];

            const success = EconomySystem.signSponsor('estrella_galicia');
            assert.ok(success, 'Should successfully sign Estrella Galicia');
            assert.ok(state.activeSponsors.includes('estrella_galicia'), 'Sponsor ID should be recorded in activeSponsors');
            assert.equal(state.cash, 2000, 'Cash should increase by $1,000 signing bonus');

            // Cannot re-sign duplicate
            const duplicate = EconomySystem.signSponsor('estrella_galicia');
            assert.equal(duplicate, false, 'Should reject duplicate sponsor contract');
        });

        it('should process commercial sponsor payouts upon completing a Grand Prix', () => {
            const state = gameState.getState();
            state.tier = 1;
            state.activeSponsors = ['estrella_galicia'];
            state.cash = 1000;

            const payoutResult = EconomySystem.processRaceSponsorPayouts(1); // Won race
            assert.ok(payoutResult.totalPayout > 0, 'Sponsor payout should be positive');
            assert.equal(payoutResult.count, 1, '1 active sponsor should payout');
            assert.ok(state.cash > 1000, 'Cash should increase after race sponsor payout');
        });
    });
});
