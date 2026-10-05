import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { gameState } from '../../src/engine/GameState.js';
import { RaceSystem } from '../../src/systems/RaceSystem.js';
import { RiderSystem } from '../../src/systems/RiderSystem.js';

describe('FIM World Championship Standings System', () => {
    beforeEach(() => {
        gameState.resetState();
        const state = gameState.getState();
        state.tier = 3; // MotoGP Premier Class
        state.riders = [
            {
                id: 'bagnaia',
                name: 'F. Bagnaia',
                number: 63,
                team: 'Ducati Lenovo Team',
                overallSkill: 95,
                consistency: 90
            },
            {
                id: 'marquez_m',
                name: 'M. Marquez',
                number: 93,
                team: 'Ducati Lenovo Team',
                overallSkill: 96,
                consistency: 88
            }
        ];
        gameState.syncRiders();
    });

    it('should initialize championship standings with all grid riders and user riders', () => {
        RaceSystem.initChampionshipStandings(true);
        const state = gameState.getState();
        const standings = state.raceState.championshipStandings;

        assert.ok(Array.isArray(standings), 'Standings should be an array');
        assert.ok(standings.length >= 20, `Standings should have full grid (found ${standings.length})`);

        const user1 = standings.find(s => s.isUser && s.userSlot === 0);
        const user2 = standings.find(s => s.isUser && s.userSlot === 1);
        assert.ok(user1, 'User Rider 1 should be present in standings');
        assert.ok(user2, 'User Rider 2 should be present in standings');
        assert.equal(user1.points, 0);
        assert.equal(user2.points, 0);
    });

    it('should award sprint points (12 down to 1) to top 9 in finishSprintRace', () => {
        RaceSystem.initChampionshipStandings(true);
        const state = gameState.getState();
        const rs = state.raceState;

        // Mock sprint race leaderboard
        rs.leaderboard = [
            { id: 'user_1', name: 'F. Bagnaia', isUser: true, userSlot: 0, dnf: false }, // P1: 12 pts
            { id: 'martin_j', name: 'J. Martin', isUser: false, dnf: false },             // P2: 9 pts
            { id: 'user_2', name: 'M. Marquez', isUser: true, userSlot: 1, dnf: false },  // P3: 7 pts
            { id: 'acosta', name: 'P. Acosta', isUser: false, dnf: false },               // P4: 6 pts
            { id: 'bezzecchi', name: 'M. Bezzecchi', isUser: false, dnf: false },         // P5: 5 pts
            { id: 'binder_b', name: 'B. Binder', isUser: false, dnf: false },             // P6: 4 pts
            { id: 'bastianini', name: 'E. Bastianini', isUser: false, dnf: false },       // P7: 3 pts
            { id: 'vinales', name: 'M. Vinales', isUser: false, dnf: false },             // P8: 2 pts
            { id: 'quartararo', name: 'F. Quartararo', isUser: false, dnf: false },       // P9: 1 pt
            { id: 'morbidelli', name: 'F. Morbidelli', isUser: false, dnf: false }        // P10: 0 pts
        ];

        RaceSystem.finishSprintRace();

        const standings = rs.championshipStandings;
        const p1Standing = standings.find(s => s.isUser && s.userSlot === 0);
        const p2Standing = standings.find(s => s.name === 'J. Martin');
        const p3Standing = standings.find(s => s.isUser && s.userSlot === 1);
        const p9Standing = standings.find(s => s.name === 'F. Quartararo');
        const p10Standing = standings.find(s => s.name === 'F. Morbidelli');

        assert.equal(p1Standing.points, 12, 'P1 should receive 12 sprint points');
        assert.equal(p1Standing.sprintWins, 1, 'P1 should be credited with 1 sprint win');
        assert.equal(p2Standing.points, 9, 'P2 should receive 9 sprint points');
        assert.equal(p3Standing.points, 7, 'P3 should receive 7 sprint points');
        assert.equal(p9Standing.points, 1, 'P9 should receive 1 sprint point');
        assert.equal(p10Standing.points, 0, 'P10 should receive 0 sprint points');

        // Leader in standings should be P1
        assert.equal(standings[0].name, 'F. Bagnaia');
    });

    it('should strictly adhere to official MotoGP scoring (win capped at 25 pts, 0 bonus points for fastest lap)', () => {
        RaceSystem.initChampionshipStandings(true);
        const state = gameState.getState();
        const rs = state.raceState;

        rs.leaderboard = [
            { id: 'user_2', name: 'M. Marquez', isUser: true, userSlot: 1, dnf: false }, // P1: 25 pts (capped at 25)
            { id: 'user_1', name: 'F. Bagnaia', isUser: true, userSlot: 0, dnf: false }, // P2: 20 pts (official rules: 0 FL bonus pts)
            { id: 'martin_j', name: 'J. Martin', isUser: false, dnf: false },             // P3: 16 pts
            { id: 'acosta', name: 'P. Acosta', isUser: false, dnf: false },               // P4: 13 pts
            { id: 'bezzecchi', name: 'M. Bezzecchi', isUser: false, dnf: false },         // P5: 11 pts
            { id: 'binder_b', name: 'B. Binder', isUser: false, dnf: false },             // P6: 10 pts
            { id: 'bastianini', name: 'E. Bastianini', isUser: false, dnf: false },       // P7: 9 pts
            { id: 'vinales', name: 'M. Vinales', isUser: false, dnf: false },             // P8: 8 pts
            { id: 'quartararo', name: 'F. Quartararo', isUser: false, dnf: false },       // P9: 7 pts
            { id: 'morbidelli', name: 'F. Morbidelli', isUser: false, dnf: false },       // P10: 6 pts
            { id: 'diggia', name: 'F. Di Giannantonio', isUser: false, dnf: false },      // P11: 5 pts
            { id: 'marquez_a', name: 'A. Marquez', isUser: false, dnf: false },           // P12: 4 pts
            { id: 'zarco', name: 'J. Zarco', isUser: false, dnf: false },                 // P13: 3 pts
            { id: 'rins', name: 'A. Rins', isUser: false, dnf: false },                   // P14: 2 pts
            { id: 'mir', name: 'J. Mir', isUser: false, dnf: false },                     // P15: 1 pt
            { id: 'marini', name: 'L. Marini', isUser: false, dnf: false }                // P16: 0 pts
        ];

        rs.fastestLap = {
            riderName: 'F. Bagnaia',
            lapTimeSec: 89.421,
            lapTimeStr: '1:29.421',
            lapNum: 8
        };

        RaceSystem.finishRace();

        const standings = rs.championshipStandings;
        const marquezStanding = standings.find(s => s.isUser && s.userSlot === 1);
        const bagnaiaStanding = standings.find(s => s.isUser && s.userSlot === 0);
        const martinStanding = standings.find(s => s.name === 'J. Martin');
        const mirStanding = standings.find(s => s.name === 'J. Mir');
        const mariniStanding = standings.find(s => s.name === 'L. Marini');

        assert.equal(marquezStanding.points, 25, 'Winner should receive exactly 25 points (capped per official MotoGP rules)');
        assert.equal(marquezStanding.wins, 1, 'Winner should receive 1 GP win');
        assert.equal(marquezStanding.podiums, 1, 'Winner should receive 1 podium');

        assert.equal(bagnaiaStanding.points, 20, 'P2 should receive exactly 20 points under official MotoGP rules (no fastest lap bonus point)');
        assert.equal(bagnaiaStanding.fastestLaps, 1, 'Fastest lap count should be recorded in rider stats');
        assert.equal(bagnaiaStanding.podiums, 1, 'P2 should receive 1 podium');

        assert.equal(martinStanding.points, 16, 'P3 should receive 16 points');
        assert.equal(martinStanding.podiums, 1, 'P3 should receive 1 podium');

        assert.equal(mirStanding.points, 1, 'P15 should receive 1 point');
        assert.equal(mariniStanding.points, 0, 'P16 should receive 0 points');

        // Standings ranking
        assert.equal(standings[0].name, 'M. Marquez');
        assert.equal(standings[1].name, 'F. Bagnaia');
        assert.equal(standings[2].name, 'J. Martin');
    });

    it('should preserve existing accumulated championship points when next race weekend begins', () => {
        RaceSystem.initChampionshipStandings(true);
        const state = gameState.getState();
        const rs = state.raceState;

        // Race 1
        rs.leaderboard = [
            { id: 'user_1', name: 'F. Bagnaia', isUser: true, userSlot: 0, dnf: false }, // 25 pts
            { id: 'martin_j', name: 'J. Martin', isUser: false, dnf: false }              // 20 pts
        ];
        RaceSystem.finishRace();

        const ptsAfterRace1 = rs.championshipStandings.find(s => s.isUser && s.userSlot === 0).points;
        assert.equal(ptsAfterRace1, 25);

        // Next race FP1 begins
        rs.stage = 'FP1';
        RaceSystem.runFP1();

        const ptsDuringFP1 = rs.championshipStandings.find(s => s.isUser && s.userSlot === 0).points;
        assert.equal(ptsDuringFP1, 25, 'Championship points must not be wiped when starting the next race weekend');

        // Race 2 Finish
        rs.leaderboard = [
            { id: 'user_1', name: 'F. Bagnaia', isUser: true, userSlot: 0, dnf: false }, // +25 pts -> 50 pts total
            { id: 'martin_j', name: 'J. Martin', isUser: false, dnf: false }              // +20 pts -> 40 pts total
        ];
        RaceSystem.finishRace();

        const ptsAfterRace2 = rs.championshipStandings.find(s => s.isUser && s.userSlot === 0).points;
        assert.equal(ptsAfterRace2, 50, 'Championship points should accumulate across the season');
    });
});
