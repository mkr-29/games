// RaceSystem.js - Official 2026 Grand Prix Weekend Format with FIM Flags & Realistic Crash Engine

import { gameState } from '../engine/GameState.js';
import { BikeSystem } from './BikeSystem.js';
import { TIERS } from './PromotionSystem.js';
import { RiderSystem } from './RiderSystem.js';
import { CalendarSystem } from './CalendarSystem.js';

// Official 2026 FIM MotoGP™ World Championship Calendar (22 Rounds)
export const GP_CALENDAR = [
    { id: 'thailand', title: "Thai Grand Prix (Chang International Circuit)", flag: "🇹🇭", lengthKm: 4.554, type: "1km Slipstream Straight & Heavy Hairpins", favors: "hp", laps: 12, baseSec: 90.5, sectorRatios: [0.24, 0.26, 0.26, 0.24] },
    { id: 'argentina', title: "Argentine Grand Prix (Termas de Río Hondo)", flag: "🇦🇷", lengthKm: 4.806, type: "Fast Flowing Sweepers", favors: "aero", laps: 12, baseSec: 98.1, sectorRatios: [0.25, 0.27, 0.23, 0.25] },
    { id: 'americas', title: "Grand Prix of the Americas (COTA Austin)", flag: "🇺🇸", lengthKm: 5.513, type: "Technical & Heavy Bumps", favors: "chassis", laps: 12, baseSec: 122.3, sectorRatios: [0.27, 0.25, 0.26, 0.22] },
    { id: 'qatar', title: "Qatar Grand Prix (Lusail)", flag: "🇶🇦", lengthKm: 5.380, type: "High Speed & Night Straight", favors: "hp", laps: 12, baseSec: 108.2, sectorRatios: [0.24, 0.26, 0.26, 0.24] },
    { id: 'jerez', title: "Gran Premio de España (Jerez)", flag: "🇪🇸", lengthKm: 4.423, type: "Hard Braking & Trail Entry", favors: "chassis", laps: 12, baseSec: 96.6, sectorRatios: [0.25, 0.25, 0.25, 0.25] },
    { id: 'france', title: "French Grand Prix (Le Mans)", flag: "🇫🇷", lengthKm: 4.185, type: "Stop-and-Go & Sudden Rain", favors: "ecu", laps: 12, baseSec: 90.6, sectorRatios: [0.23, 0.27, 0.25, 0.25] },
    { id: 'silverstone', title: "British Grand Prix (Silverstone)", flag: "🇬🇧", lengthKm: 5.900, type: "Ultra High-Speed Sweeps", favors: "hp", laps: 12, baseSec: 118.2, sectorRatios: [0.25, 0.26, 0.24, 0.25] },
    { id: 'aragon', title: "Gran Premio de Aragón (MotorLand)", flag: "🇪🇸", lengthKm: 5.077, type: "Carbon Discs Heavy Braking & Corkscrew", favors: "hp", laps: 12, baseSec: 106.2, sectorRatios: [0.26, 0.24, 0.26, 0.24] },
    { id: 'mugello', title: "Gran Premio d'Italia (Mugello)", flag: "🇮🇹", lengthKm: 5.245, type: "1.1km Main Straight Speed", favors: "hp", laps: 12, baseSec: 105.1, sectorRatios: [0.27, 0.23, 0.26, 0.24] },
    { id: 'assen', title: "TT Assen (Cathedral of Speed)", flag: "🇳🇱", lengthKm: 4.542, type: "Fast Flowing Chicanes", favors: "aero", laps: 12, baseSec: 91.6, sectorRatios: [0.24, 0.26, 0.25, 0.25] },
    { id: 'sachsenring', title: "German Grand Prix (Sachsenring)", flag: "🇩🇪", lengthKm: 3.671, type: "Tight Left-Hand Waterfall", favors: "chassis", laps: 12, baseSec: 80.3, sectorRatios: [0.25, 0.25, 0.25, 0.25] },
    { id: 'brno', title: "Czech Republic Grand Prix (Automotodrom Brno)", flag: "🇨🇿", lengthKm: 5.403, type: "Natural Hillside Amphitheater", favors: "chassis", laps: 12, baseSec: 114.5, sectorRatios: [0.25, 0.25, 0.25, 0.25] },
    { id: 'spielberg', title: "Austrian Grand Prix (Red Bull Ring)", flag: "🇦🇹", lengthKm: 4.348, type: "Steep Uphill Acceleration", favors: "hp", laps: 12, baseSec: 88.6, sectorRatios: [0.24, 0.28, 0.24, 0.24] },
    { id: 'balaton', title: "Hungarian Grand Prix (Balaton Park)", flag: "🇭🇺", lengthKm: 4.115, type: "Technical Chicane Rhythm", favors: "chassis", laps: 12, baseSec: 92.1, sectorRatios: [0.25, 0.25, 0.25, 0.25] },
    { id: 'catalunya', title: "Gran Premio de Catalunya (Barcelona)", flag: "🇪🇸", lengthKm: 4.657, type: "High Tire Wear & Long Straight", favors: "aero", laps: 12, baseSec: 98.6, sectorRatios: [0.26, 0.24, 0.25, 0.25] },
    { id: 'misano', title: "San Marino Grand Prix (Misano)", flag: "🇸🇲", lengthKm: 4.226, type: "High Lean Cornering Speed & Curvone", favors: "chassis", laps: 12, baseSec: 91.1, sectorRatios: [0.24, 0.26, 0.25, 0.25] },
    { id: 'motegi', title: "Grand Prix of Japan (Mobility Resort Motegi)", flag: "🇯🇵", lengthKm: 4.801, type: "Hard Braking & Acceleration", favors: "ecu", laps: 12, baseSec: 104.2, sectorRatios: [0.24, 0.26, 0.26, 0.24] },
    { id: 'mandalika', title: "Indonesian Grand Prix (Pertamina Mandalika)", flag: "🇮🇩", lengthKm: 4.313, type: "Fast Coastal Sweeps", favors: "aero", laps: 12, baseSec: 90.1, sectorRatios: [0.25, 0.25, 0.25, 0.25] },
    { id: 'phillip_island', title: "Australian Grand Prix (Phillip Island)", flag: "🇦🇺", lengthKm: 4.448, type: "Ocean Sweeps & High Tire Wear", favors: "aero", laps: 12, baseSec: 87.6, sectorRatios: [0.23, 0.27, 0.26, 0.24] },
    { id: 'sepang', title: "Petronas Grand Prix of Malaysia (Sepang)", flag: "🇲🇾", lengthKm: 5.543, type: "Twin Straights & Tropical Heat", favors: "ecu", laps: 12, baseSec: 117.7, sectorRatios: [0.26, 0.25, 0.25, 0.24] },
    { id: 'portugal', title: "Portuguese Grand Prix (Portimão)", flag: "🇵🇹", lengthKm: 4.592, type: "Elevation Rollercoaster", favors: "chassis", laps: 12, baseSec: 98.4, sectorRatios: [0.25, 0.25, 0.26, 0.24] },
    { id: 'valencia', title: "Gran Premio de Valencia (Ricardo Tormo Finale)", flag: "🇪🇸", lengthKm: 4.005, type: "Tight Stadium Arena Finale", favors: "chassis", laps: 12, baseSec: 89.9, sectorRatios: [0.24, 0.26, 0.25, 0.25] }
];

// Tire Compound Specs
export const TIRE_COMPOUNDS = {
    soft: {
        id: 'soft',
        name: 'Soft Compound',
        shortName: 'SOFT',
        badge: 'S',
        color: '#ff334b',
        paceDelta: -0.35,
        wearRate: 7.5,
        cliffWear: 28
    },
    medium: {
        id: 'medium',
        name: 'Medium Compound',
        shortName: 'MED',
        badge: 'M',
        color: '#ffb700',
        paceDelta: 0.00,
        wearRate: 4.5,
        cliffWear: 22
    },
    hard: {
        id: 'hard',
        name: 'Hard Compound',
        shortName: 'HARD',
        badge: 'H',
        color: '#e0e0e0',
        paceDelta: 0.28,
        wearRate: 2.6,
        cliffWear: 18
    },
    wet: {
        id: 'wet',
        name: 'Michelin Wet Rain',
        shortName: 'WET',
        badge: 'W',
        color: '#00d2ff',
        paceDelta: 4.20,
        wearRate: 3.8,
        cliffWear: 20
    }
};

export class RaceSystem {
    static getCurrentGP() {
        const state = gameState.getState();
        const idx = state.raceState.currentGPIndex % GP_CALENDAR.length;
        return GP_CALENDAR[idx];
    }

    static getTierRiders(tier) {
        const state = gameState.getState();
        const userRiders = (state.riders || [state.rider]).filter(Boolean);
        const userIds = userRiders.map(r => r.id).filter(Boolean);
        const userNames = userRiders.map(r => r.name).filter(Boolean);
        const allRiders = RiderSystem.getActiveGridRoster(tier);
        return allRiders.filter(r => !userIds.includes(r.id) && !userNames.includes(r.name));
    }

    static getTierSpeedMultiplier(tier) {
        if (tier === 1) return 1.080;
        if (tier === 2) return 1.035;
        return 1.000;
    }

    static formatLapTime(lapSec) {
        if (!lapSec || isNaN(lapSec) || lapSec >= 900) return '--:--.---';
        const mins = Math.floor(lapSec / 60);
        const secs = (lapSec % 60).toFixed(3).padStart(6, '0');
        return `${mins}:${secs}`;
    }

    static formatSectorTime(sec) {
        if (!sec || isNaN(sec)) return '--.---';
        return sec.toFixed(3);
    }

    static setFlag(status, sector = null, laps = 1, reason = 'Track clear') {
        const state = gameState.getState();
        const rs = state.raceState;
        rs.flagState = {
            status, // 'GREEN', 'YELLOW', 'RED', 'WHITE_CROSS'
            sector, // 1, 2, 3, 4 or null
            lapsRemaining: laps,
            reason
        };

        if (status === 'YELLOW') {
            gameState.addLog(`🟨 YELLOW FLAG in Sector ${sector || 1}! ${reason}. Overtaking forbidden in sector.`);
        } else if (status === 'RED') {
            gameState.addLog(`🚩 RED FLAG! Race stopped: ${reason}!`);
        } else if (status === 'WHITE_CROSS') {
            gameState.addLog(`🏳️ WHITE FLAG WITH RED CROSS: Rain drops reported! Pit lane open for bike swaps.`);
        } else if (status === 'GREEN') {
            gameState.addLog(`🟩 GREEN FLAG: Track clear, full racing speed resumes!`);
        }
    }

    static initChampionshipStandings(force = false) {
        const state = gameState.getState();
        const rs = state.raceState;
        const tierRiders = this.getTierRiders(state.tier);
        const userRiders = (state.riders && state.riders.length >= 2) ? state.riders : [state.rider];
        const expectedCount = tierRiders.length + userRiders.length;

        if (force || !rs.championshipStandings || rs.championshipStandings.length !== expectedCount || rs.championshipTier !== state.tier) {
            const standings = tierRiders.map(ai => ({
                id: ai.id,
                name: ai.name,
                team: ai.team,
                isUser: false,
                points: 0,
                wins: 0,
                sprintWins: 0,
                podiums: 0,
                fastestLaps: 0
            }));

            userRiders.forEach((u, idx) => {
                standings.push({
                    id: `user_${idx + 1}`,
                    name: u.name,
                    number: u.number,
                    team: u.team || "Your Team",
                    isUser: true,
                    userSlot: idx,
                    points: 0,
                    wins: 0,
                    sprintWins: 0,
                    podiums: 0,
                    fastestLaps: 0
                });
            });

            rs.championshipStandings = standings;
            rs.championshipTier = state.tier;
        }
    }

    // ==========================================
    // 1. FREE PRACTICE 1 (FP1)
    // ==========================================
    static runFP1() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.stage !== 'FP1' && rs.stage !== 'FP') return false;

        this.initChampionshipStandings();

        const bikeStats = BikeSystem.getBikeStats();
        const gp = this.getCurrentGP();
        const tierRiders = this.getTierRiders(state.tier);
        const userRiders = (state.riders && state.riders.length >= 2) ? state.riders : [state.rider];

        const setupMatch = Math.min(99, 72 + Math.floor(bikeStats.overallRating * 0.35) + Math.floor(Math.random() * 8));
        rs.setupMatch = setupMatch;

        state.telemetry = Math.min(state.telemetryMax, state.telemetry + 35);
        state.science = Math.min(state.scienceMax, state.science + 12);

        rs.fpCompleted = true;
        rs.stage = 'PR';
        this.setFlag('GREEN', null, 0, 'Track clear');
        this.syncCalendarActivity('race_fp1');

        gameState.addLog(`🏁 Free Practice 1 Complete at ${gp.title}! Setup Dialed In: ${setupMatch}%. Telemetry +35, RP +12.`);

        userRiders.forEach((r, idx) => {
            const numStr = r.number ? `#${r.number}` : `Racer ${idx + 1}`;
            gameState.addLog(`🎙️ Pit Telemetry (${r.name} ${numStr}): "Bike balance feels responsive across Sectors 1 & 2."`);
        });

        const favsAtThisTrack = tierRiders.filter(r => r.favoriteTracks && r.favoriteTracks.includes(gp.id));
        if (favsAtThisTrack.length > 0) {
            const favNames = favsAtThisTrack.slice(0, 3).map(f => f.name).join(', ');
            gameState.addLog(`⭐ SPECIALIST FOCUS: ${gp.title} is a favorite circuit for ${favNames}! Expect fierce lap times.`);
        }

        return true;
    }

    static syncCalendarActivity(actionType) {
        try {
            const cal = CalendarSystem.getCalendarState();
            const currentWeek = CalendarSystem.getCurrentWeek();
            if (currentWeek && currentWeek.activities) {
                const act = currentWeek.activities.find(a => a.actionType === actionType);
                if (act) {
                    cal.completedActivities[act.id] = 'completed';
                }
            }
        } catch (e) {}
    }

    static getAISkillRange(tier) {
        if (tier === 1) return { min: 42, max: 62 };
        if (tier === 2) return { min: 58, max: 74 };
        if (tier === 3) return { min: 72, max: 86 };
        return { min: 86, max: 98 };
    }

    static simulateHotLap(score, consistency = 75, baseTrackSec, sectorRatios) {
        const paceOffset = (92 - score) * (baseTrackSec * 0.0018);
        let bestLap = 999;
        let bestSectors = [];

        for (let lap = 1; lap <= 3; lap++) {
            const variance = ((Math.random() - 0.5) * 2) * ((105 - consistency) * 0.006);
            const lapSec = baseTrackSec + paceOffset + variance;
            if (lapSec < bestLap) {
                bestLap = lapSec;
                const s1 = bestLap * sectorRatios[0] + (Math.random() * 0.1 - 0.05);
                const s2 = bestLap * sectorRatios[1] + (Math.random() * 0.1 - 0.05);
                const s3 = bestLap * sectorRatios[2] + (Math.random() * 0.1 - 0.05);
                const s4 = bestLap - (s1 + s2 + s3);
                bestSectors = [s1, s2, s3, s4];
            }
        }
        return { bestLap, bestSectors };
    }

    // ==========================================
    // 2. TIMED PRACTICE (PR - Decides Direct Q2 Cut)
    // ==========================================
    static runTimedPractice() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.stage !== 'PR') return false;

        const bikeStats = BikeSystem.getBikeStats();
        const gp = this.getCurrentGP();
        const tierMult = this.getTierSpeedMultiplier(state.tier);
        const baseTrackSec = gp.baseSec * tierMult;

        let trackBonus = 0;
        if (gp.favors === 'hp') trackBonus = (bikeStats.hp - 55) * 0.30;
        if (gp.favors === 'aero') trackBonus = (bikeStats.aero - 10) * 0.65;
        if (gp.favors === 'chassis') trackBonus = (bikeStats.chassis - 15) * 0.65;
        if (gp.favors === 'ecu') trackBonus = (bikeStats.ecu - 5) * 0.90;

        const setupBonus = ((rs.setupMatch || 75) - 70) * 0.15;
        const tierRiders = this.getTierRiders(state.tier);

        const practiceList = tierRiders.map(ai => {
            const aiScore = RiderSystem.calculateRiderPerformanceScore(ai, gp.id, rs.weather, state.tier);
            const aiConsistency = ai.consistency || 75;
            const { bestLap, bestSectors } = this.simulateHotLap(aiScore, aiConsistency, baseTrackSec, gp.sectorRatios);

            return {
                id: ai.id,
                name: ai.name,
                team: ai.team,
                isUser: false,
                isReplacement: ai.isReplacement || false,
                favoriteTracks: ai.favoriteTracks || [],
                isFavTrack: ai.favoriteTracks ? ai.favoriteTracks.includes(gp.id) : false,
                speed: ai.speed || 80,
                racecraft: ai.racecraft || 80,
                tireMgmt: ai.tireMgmt || 80,
                injury: ai.injury || null,
                score: aiScore,
                consistency: aiConsistency,
                bestLapSec: bestLap,
                lastLapSec: bestLap,
                lastLapStr: this.formatLapTime(bestLap),
                bestLapStr: this.formatLapTime(bestLap),
                lastSectors: bestSectors,
                lastSectorColors: ['yellow', 'yellow', 'yellow', 'yellow'],
                personalBestSectors: [...bestSectors],
                dnf: false
            };
        });

        const userRiders = (state.riders && state.riders.length >= 2) ? state.riders : [state.rider];
        userRiders.forEach((uRider, uIdx) => {
            let riderSkill = uRider.overallSkill || 80;
            if (uRider.injury) riderSkill = Math.max(20, riderSkill - uRider.injury.penalty);

            let uTrackBonus = trackBonus;
            if (uRider.favoriteTracks && uRider.favoriteTracks.includes(gp.id)) {
                uTrackBonus += 3.5;
            }
            if (rs.weather === 'wet') {
                uTrackBonus += ((uRider.wetSkill || 75) - 75) * 0.25;
            }

            const userScore = (bikeStats.overallRating * 0.45) + (riderSkill * 0.45) + uTrackBonus + setupBonus;
            const userConsistency = uRider.consistency || 70;
            const { bestLap: userBestLap, bestSectors: userBestSectors } = this.simulateHotLap(userScore, userConsistency, baseTrackSec, gp.sectorRatios);

            practiceList.push({
                id: `user_${uIdx + 1}`,
                name: uRider.name,
                number: uRider.number,
                team: uRider.team || "Your Team",
                isUser: true,
                userSlot: uIdx,
                favoriteTracks: uRider.favoriteTracks || [],
                isFavTrack: uRider.favoriteTracks ? uRider.favoriteTracks.includes(gp.id) : false,
                speed: uRider.speed || 80,
                racecraft: uRider.racecraft || 80,
                tireMgmt: uRider.tireMgmt || 80,
                injury: uRider.injury || null,
                score: userScore,
                consistency: userConsistency,
                bestLapSec: userBestLap,
                lastLapSec: userBestLap,
                lastLapStr: this.formatLapTime(userBestLap),
                bestLapStr: this.formatLapTime(userBestLap),
                lastSectors: userBestSectors,
                lastSectorColors: ['yellow', 'yellow', 'yellow', 'yellow'],
                personalBestSectors: [...userBestSectors],
                dnf: false
            });
        });

        practiceList.sort((a, b) => a.bestLapSec - b.bestLapSec);

        const practiceLeader = practiceList[0].bestLapSec;
        practiceList.forEach((r, idx) => {
            r.gapSeconds = idx === 0 ? 0 : r.bestLapSec - practiceLeader;
            r.intervalSeconds = idx === 0 ? 0 : r.bestLapSec - practiceList[idx - 1].bestLapSec;
        });

        rs.leaderboard = practiceList;

        // Official Direct Q2 Cut: Top 14 in 26+ grid (or top 10 in smaller grids)
        const directQ2Count = practiceList.length >= 20 ? 14 : 10;
        const topDirect = practiceList.slice(0, directQ2Count);
        const bottomQ1 = practiceList.slice(directQ2Count);

        rs.q2DirectRiders = topDirect;
        rs.q1Riders = bottomQ1;

        rs.practiceCompleted = true;
        rs.stage = 'Q1';
        this.syncCalendarActivity('race_pr');

        userRiders.forEach((uRider, uIdx) => {
            const pos = practiceList.findIndex(r => r.isUser && r.userSlot === uIdx) + 1;
            const direct = pos <= directQ2Count;
            const uEntry = practiceList.find(r => r.isUser && r.userSlot === uIdx);
            if (direct) {
                gameState.addLog(`🌟 TIMED PRACTICE SUCCESS: ${uRider.name} (#${uRider.number || (uIdx + 1)}) finished P${pos} and qualified DIRECTLY into Q2! (Time: ${this.formatLapTime(uEntry?.bestLapSec)})`);
            } else {
                gameState.addLog(`⚠️ TIMED PRACTICE: ${uRider.name} (#${uRider.number || (uIdx + 1)}) finished P${pos}. Must fight in Q1 Shootout for top spots into Q2!`);
            }
        });

        rs.directQ2 = practiceList.findIndex(r => r.isUser && r.userSlot === 0) < directQ2Count;

        return true;
    }

    // ==========================================
    // 3. QUALIFYING 1 (Q1 Shootout)
    // ==========================================
    static runQ1() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.stage !== 'Q1') return false;

        const gp = this.getCurrentGP();
        const tierMult = this.getTierSpeedMultiplier(state.tier);
        const baseTrackSec = gp.baseSec * tierMult;

        const directQ2Count = (rs.q2DirectRiders && rs.q2DirectRiders.length) || 14;
        const q1Grid = rs.q1Riders || rs.leaderboard.slice(directQ2Count);

        q1Grid.forEach(r => {
            const { bestLap, bestSectors } = this.simulateHotLap(r.score, r.consistency, baseTrackSec, gp.sectorRatios);
            r.q1LapSec = bestLap;
            r.q1Sectors = bestSectors;
            r.lastLapSec = bestLap;
            r.lastLapStr = this.formatLapTime(bestLap);
            r.bestLapSec = bestLap;
            r.bestLapStr = r.lastLapStr;
            r.lapTimeStr = r.lastLapStr;
            r.lastSectors = bestSectors;
            r.lastSectorColors = ['yellow', 'yellow', 'yellow', 'yellow'];
            r.personalBestSectors = [...bestSectors];
        });

        q1Grid.sort((a, b) => a.q1LapSec - b.q1LapSec);

        const q1Leader = q1Grid[0].q1LapSec;
        q1Grid.forEach((r, idx) => {
            r.gapSeconds = idx === 0 ? 0 : r.q1LapSec - q1Leader;
            r.lapTimeStr = this.formatLapTime(r.q1LapSec);
        });

        // Top 4 promote into Q2 (or top 2 in smaller grids)
        const q1GraduateCount = q1Grid.length >= 10 ? 4 : 2;
        const q1Graduates = q1Grid.slice(0, q1GraduateCount);
        const q1Eliminated = q1Grid.slice(q1GraduateCount);

        rs.q1Graduates = q1Graduates;
        rs.q1Eliminated = q1Eliminated;
        rs.q1Completed = true;
        rs.stage = 'Q2';
        rs.leaderboard = q1Grid;

        const userInQ1List = q1Grid.filter(r => r.isUser);
        if (userInQ1List.length > 0) {
            userInQ1List.forEach(userInQ1 => {
                const q1Pos = q1Grid.indexOf(userInQ1) + 1;
                if (q1Pos <= q1GraduateCount) {
                    gameState.addLog(`🔥 Q1 GRADUATION! ${userInQ1.name} finished P${q1Pos} in Q1 and advanced to Q2! (Time: ${this.formatLapTime(userInQ1.q1LapSec)})`);
                } else {
                    const finalGridPos = directQ2Count + q1GraduateCount + (q1Pos - q1GraduateCount);
                    gameState.addLog(`⏱️ Q1 COMPLETE: ${userInQ1.name} knocked out in Q1 (P${q1Pos}). Starting grid locked at P${finalGridPos}.`);
                }
            });
        } else {
            const gradNames = q1Graduates.map(g => `${g.name} (${g.lapTimeStr})`).join(', ');
            gameState.addLog(`⏱️ Q1 Shootout finished! Graduates to Q2: ${gradNames}.`);
        }

        return true;
    }

    // ==========================================
    // 4. QUALIFYING 2 (Q2 Pole Position Shootout)
    // ==========================================
    static runQ2() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.stage !== 'Q2') return false;

        const gp = this.getCurrentGP();
        const tierMult = this.getTierSpeedMultiplier(state.tier);
        const baseTrackSec = gp.baseSec * tierMult;

        const directList = rs.q2DirectRiders || rs.leaderboard.slice(0, 14);
        const gradList = rs.q1Graduates || [];
        const q2List = [...directList, ...gradList];

        q2List.forEach(r => {
            const { bestLap, bestSectors } = this.simulateHotLap(r.score, r.consistency, baseTrackSec, gp.sectorRatios);
            r.q2LapSec = bestLap;
            r.q2Sectors = bestSectors;
            r.bestLapSec = bestLap;
            r.bestLapStr = this.formatLapTime(bestLap);
            r.lastLapSec = bestLap;
            r.lastLapStr = r.bestLapStr;
            r.lapTimeStr = r.bestLapStr;
            r.lastSectors = bestSectors;
            r.lastSectorColors = ['yellow', 'yellow', 'yellow', 'yellow'];
            r.personalBestSectors = [...bestSectors];
        });

        q2List.sort((a, b) => a.q2LapSec - b.q2LapSec);

        const lockedEliminatedQ1 = rs.q1Eliminated || [];
        const finalGrid = [...q2List, ...lockedEliminatedQ1];

        const poleTime = q2List[0].q2LapSec;
        finalGrid.forEach((r, idx) => {
            r.gridPosition = idx + 1;
            const lapSec = r.q2LapSec || r.q1LapSec || r.bestLapSec;
            r.gapSeconds = idx === 0 ? 0 : lapSec - poleTime;
            r.lapTimeStr = this.formatLapTime(lapSec);
            r.accumulatedRaceTime = 0;
            r.tireCondition = 100;
        });

        rs.grid = finalGrid;
        rs.leaderboard = finalGrid;

        const userRiders = (state.riders && state.riders.length >= 2) ? state.riders : [state.rider];
        const userPositions = userRiders.map((u, uIdx) => {
            const pos = finalGrid.findIndex(r => r.isUser && r.userSlot === uIdx) + 1;
            return `${u.name} (#${u.number || (uIdx + 1)}) starts P${pos}`;
        });
        const userPos = finalGrid.findIndex(r => r.isUser) + 1;
        rs.qpGridPosition = userPos;
        rs.q2Completed = true;
        this.syncCalendarActivity('race_quali');

        const hasSprint = state.tier >= 3; // Only Premier Class MotoGP features Saturday Sprints
        rs.stage = hasSprint ? 'SPRINT' : 'RACE';

        const poleRider = finalGrid[0];
        const sessionLabel = hasSprint ? 'Saturday Sprint & Sunday Grand Prix' : 'Sunday Grand Prix';
        gameState.addLog(`👑 POLE POSITION! ${poleRider.name} takes POLE with ${this.formatLapTime(poleTime)}! Team Lineup: ${userPositions.join(' | ')} for the ${sessionLabel}!`);
        return true;
    }

    static setTireCompound(compoundId, riderSlot = 0) {
        const state = gameState.getState();
        if (!TIRE_COMPOUNDS[compoundId]) return;
        const slot = Number(riderSlot) || 0;

        if (!Array.isArray(state.raceState.riderCompounds) || state.raceState.riderCompounds.length < 2) {
            state.raceState.riderCompounds = ['medium', 'medium'];
        }
        state.raceState.riderCompounds[slot] = compoundId;

        if (slot === 0) {
            state.raceState.tireCompound = compoundId;
            state.raceState.tireType = compoundId === 'wet' ? 'wet' : 'slicks';
        }

        // Update live rider on the grid / leaderboard if active
        if (state.raceState.leaderboard && state.raceState.leaderboard.length > 0) {
            const userRider = state.raceState.leaderboard.find(r => r.isUser && (r.userSlot === slot || (r.userSlot === undefined && slot === 0)));
            if (userRider) {
                userRider.tireCompound = compoundId;
            }
        }

        const rObj = (state.riders && state.riders[slot]) || (slot === 0 ? state.rider : null);
        const riderLabel = rObj ? `${rObj.name} (#${rObj.number || (slot + 1)})` : `Rider ${slot + 1}`;
        gameState.addLog(`🛞 [${riderLabel}] Tire compound selected: ${TIRE_COMPOUNDS[compoundId].name} (${TIRE_COMPOUNDS[compoundId].badge})`);
    }

    // ==========================================
    // 5. SATURDAY SPRINT RACE (MotoGP Premier Class Only - 50% Distance)
    // ==========================================
    static startSprintRace() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (state.tier < 3) {
            gameState.addLog("⚠️ Sprint races are exclusive to the Premier Class MotoGP™.");
            return false;
        }
        if (rs.stage !== 'SPRINT' || rs.raceInProgress) return false;

        rs.sessionType = 'SPRINT';
        rs.raceInProgress = true;
        rs.currentLap = 1;
        rs.trackProgress = 0;
        rs.weather = (Math.random() < 0.20) ? "wet" : "dry";
        rs.trackTempC = rs.weather === 'wet' ? 20 : Math.floor(27 + Math.random() * 10);
        rs.tireCondition = 100;
        rs.riderTireConditions = [100, 100];
        rs.activeIncident = null;
        rs.lapHistory = [];
        rs.fastestLap = null;
        rs.sessionFastestSectors = [999, 999, 999, 999];
        rs.totalDnfsInRace = 0;
        rs.redFlagged = false;
        this.setFlag('GREEN', null, 0, 'Track clear - Sprint Start');

        const gp = this.getCurrentGP();
        rs.totalLaps = Math.max(4, Math.floor(gp.laps / 2));

        this.prepareGridRidersForRace(rs);

        gameState.addLog(`⚡ LIGHTS OUT! Saturday Sprint Race underway at ${gp.title} (${rs.totalLaps} Laps, Flat-Out Sprint Pace)!`);
        return true;
    }

    // ==========================================
    // 6. SUNDAY MAIN GRAND PRIX (100% Distance)
    // ==========================================
    static startGrandPrixRace() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.stage !== 'RACE' || rs.raceInProgress) return false;

        rs.sessionType = 'RACE';
        rs.raceInProgress = true;
        rs.currentLap = 1;
        rs.trackProgress = 0;
        rs.weather = (Math.random() < 0.22) ? "wet" : "dry";
        rs.trackTempC = rs.weather === 'wet' ? 19 : Math.floor(26 + Math.random() * 12);
        rs.tireCondition = 100;
        rs.riderTireConditions = [100, 100];
        rs.activeIncident = null;
        rs.lapHistory = [];
        rs.fastestLap = null;
        rs.sessionFastestSectors = [999, 999, 999, 999];
        rs.totalDnfsInRace = 0;
        rs.redFlagged = false;
        this.setFlag('GREEN', null, 0, 'Track clear - GP Start');

        const gp = this.getCurrentGP();
        rs.totalLaps = gp.laps;

        this.prepareGridRidersForRace(rs);

        gameState.addLog(`🏆 LIGHTS OUT! Sunday Grand Prix Race underway at ${gp.title} (${rs.totalLaps} Laps)!`);
        return true;
    }

    static prepareGridRidersForRace(rs) {
        if (!Array.isArray(rs.riderCompounds) || rs.riderCompounds.length < 2) {
            rs.riderCompounds = ['medium', 'medium'];
        }

        if (rs.weather === 'wet') {
            rs.riderCompounds = ['wet', 'wet'];
            rs.tireCompound = 'wet';
            rs.tireType = 'wet';
        } else if (rs.weather === 'dry') {
            if (rs.riderCompounds[0] === 'wet') rs.riderCompounds[0] = 'medium';
            if (rs.riderCompounds[1] === 'wet') rs.riderCompounds[1] = 'medium';
            if (rs.tireCompound === 'wet') rs.tireCompound = 'medium';
            rs.tireType = 'slicks';
        }

        const sourceGrid = rs.grid && rs.grid.length > 0 ? rs.grid : rs.leaderboard;
        const dryCompounds = ['medium', 'medium', 'soft', 'hard'];

        rs.leaderboard = sourceGrid.map((r, idx) => {
            const riderCopy = { ...r };
            riderCopy.dnf = false;
            riderCopy.dnfReason = '';
            riderCopy.accumulatedRaceTime = 0;
            riderCopy.lastLapSec = 0;
            riderCopy.lastLapStr = '--:--.---';
            riderCopy.bestLapSec = 999;
            riderCopy.bestLapStr = '--:--.---';
            riderCopy.lastSectors = [0, 0, 0, 0];
            riderCopy.lastSectorColors = ['yellow', 'yellow', 'yellow', 'yellow'];
            riderCopy.personalBestSectors = [999, 999, 999, 999];
            riderCopy.tireCondition = 100;

            if (!riderCopy.isUser) {
                if (rs.weather === 'wet') {
                    riderCopy.tireCompound = 'wet';
                } else {
                    riderCopy.tireCompound = (rs.sessionType === 'SPRINT' && Math.random() < 0.4) ? 'soft' : dryCompounds[Math.floor(Math.random() * dryCompounds.length)];
                }
            } else {
                const uSlot = riderCopy.userSlot !== undefined ? riderCopy.userSlot : 0;
                riderCopy.tireCompound = rs.riderCompounds?.[uSlot] || (uSlot === 0 ? rs.tireCompound : 'medium');
            }

            riderCopy.gapSeconds = idx === 0 ? 0 : idx * 0.05;
            return riderCopy;
        });
    }

    static setStrategy(strategy, riderSlot = 0) {
        const state = gameState.getState();
        const slot = Number(riderSlot) || 0;

        if (!Array.isArray(state.raceState.riderStrategies) || state.raceState.riderStrategies.length < 2) {
            state.raceState.riderStrategies = ['balanced', 'balanced'];
        }
        state.raceState.riderStrategies[slot] = strategy;

        if (slot === 0) {
            state.raceState.strategy = strategy;
        }

        // Update active rider in leaderboard if present
        if (state.raceState.leaderboard && state.raceState.leaderboard.length > 0) {
            const userRider = state.raceState.leaderboard.find(r => r.isUser && (r.userSlot === slot || (r.userSlot === undefined && slot === 0)));
            if (userRider) {
                userRider.strategy = strategy;
            }
        }

        const labels = { push: "PUSH HARD (PWR 1)", balanced: "BALANCED (PWR 2)", conserve: "TIRE SAVER (PWR 3)" };
        const rObj = (state.riders && state.riders[slot]) || (slot === 0 ? state.rider : null);
        const riderLabel = rObj ? `${rObj.name} (#${rObj.number || (slot + 1)})` : `Rider ${slot + 1}`;
        gameState.addLog(`🔧 [${riderLabel}] Engine mapping changed to: ${labels[strategy] || strategy.toUpperCase()}`);
    }

    static resolveIncidentChoice(choiceAction) {
        const state = gameState.getState();
        const rs = state.raceState;
        const inc = rs.activeIncident;

        if (!inc) return;

        if (choiceAction === 'pit_wet') {
            rs.riderCompounds = ['wet', 'wet'];
            rs.tireCompound = 'wet';
            rs.tireType = 'wet';
            rs.riderTireConditions = [100, 100];
            rs.tireCondition = 100;
            const userRiders = rs.leaderboard.filter(r => r.isUser);
            userRiders.forEach(userRider => {
                userRider.tireCompound = 'wet';
                userRider.tireCondition = 100;
                userRider.accumulatedRaceTime += 18.5;
            });
            gameState.addLog(`🛠️ BOX BOX! Both team riders switched to WET Michelin tires (+18.5s pit lane transit). Full rain grip restored!`);
        } else if (choiceAction === 'stay_slicks') {
            gameState.addLog(`⚠️ PIT WALL: Staying on slick tires on a wet track! Extreme slide and crash risk!`);
        } else if (choiceAction === 'eco_map') {
            rs.riderStrategies = ['conserve', 'conserve'];
            rs.strategy = 'conserve';
            gameState.addLog(`🔧 Switched both team bikes to Eco Map (PWR 3). Engine coolant temperatures stabilized.`);
        } else if (choiceAction === 'risk_push') {
            gameState.addLog(`🔥 PUSHING POWER MAP: Maintaining full power. High risk of engine failure!`);
        } else if (choiceAction === 'restart_soft' || choiceAction === 'restart_med' || choiceAction === 'restart_hard') {
            const comp = choiceAction.replace('restart_', '');
            rs.riderCompounds = [comp, comp];
            rs.tireCompound = comp;
            rs.riderTireConditions = [100, 100];
            rs.tireCondition = 100;
            rs.leaderboard.filter(r => r.isUser).forEach(ur => {
                ur.tireCompound = comp;
                ur.tireCondition = 100;
            });
            rs.raceInProgress = true;
            this.setFlag('GREEN', null, 0, 'Quick Restart underway');
            gameState.addLog(`🚀 QUICK RESTART! Race resumed from the grid with fresh ${comp.toUpperCase()} tires for both riders!`);
        }

        rs.activeIncident = null;
    }

    static tick(delta) {
        const state = gameState.getState();
        const rs = state.raceState;

        if (!rs.raceInProgress) return;

        let lapProgressRate = rs.sessionType === 'SPRINT' ? 22.0 : 18.0;
        if (rs.strategy === 'push') lapProgressRate *= 1.12;
        if (rs.strategy === 'conserve') lapProgressRate *= 0.90;

        if (rs.weather === 'wet' && rs.tireType === 'slicks') {
            lapProgressRate *= 0.65;
        }

        rs.trackProgress += lapProgressRate * delta;

        if (rs.trackProgress >= 100) {
            rs.trackProgress = 0;
            this.simulateCompletedLap();

            rs.currentLap += 1;
            if (rs.currentLap > rs.totalLaps) {
                if (rs.sessionType === 'SPRINT') {
                    this.finishSprintRace();
                } else {
                    this.finishRace();
                }
            } else {
                this.processMidRaceIncidents();
            }
        }
    }

    static simulateCompletedLap() {
        const state = gameState.getState();
        const rs = state.raceState;
        const gp = this.getCurrentGP();
        const tierMult = this.getTierSpeedMultiplier(state.tier);
        const baseBenchmarkSec = gp.baseSec * tierMult;
        const currentLap = rs.currentLap;
        const totalLaps = rs.totalLaps;

        if (!rs.leaderboard || rs.leaderboard.length === 0) return;

        // Flag state countdown
        if (rs.flagState && rs.flagState.status === 'YELLOW') {
            rs.flagState.lapsRemaining -= 1;
            if (rs.flagState.lapsRemaining <= 0) {
                this.setFlag('GREEN', null, 0, 'Track clear - Green Flag');
            }
        }

        const bikeStats = BikeSystem.getBikeStats();
        const trackEvolution = -Math.min(0.25, (currentLap / totalLaps) * 0.25);
        const fuelWeightDelta = ((totalLaps - currentLap + 1) / totalLaps) * (rs.sessionType === 'SPRINT' ? 0.40 : 0.75);

        let crashesThisLap = 0;

        rs.leaderboard.forEach(r => {
            if (r.dnf) return;

            let riderScore = r.score;
            let consistency = r.consistency || 70;
            let strategy = 'balanced';
            let compoundKey = r.tireCompound || 'medium';

            if (r.isUser) {
                const uSlot = r.userSlot !== undefined ? r.userSlot : 0;
                strategy = (rs.riderStrategies && rs.riderStrategies[uSlot]) || (uSlot === 0 ? rs.strategy : 'balanced') || 'balanced';
                compoundKey = r.tireCompound || (rs.riderCompounds && rs.riderCompounds[uSlot]) || (uSlot === 0 ? rs.tireCompound : 'medium') || 'medium';
            } else {
                strategy = Math.random() < 0.2 ? 'push' : (Math.random() < 0.15 ? 'conserve' : 'balanced');
            }
            let compoundDef = TIRE_COMPOUNDS[compoundKey] || TIRE_COMPOUNDS.medium;

            if (r.isUser) {
                const uSlot = r.userSlot !== undefined ? r.userSlot : 0;
                const uRiderObj = (state.riders && state.riders[uSlot]) || state.rider;
                let userSkill = uRiderObj.overallSkill || 80;
                if (uRiderObj.injury) {
                    userSkill = Math.max(20, userSkill - uRiderObj.injury.penalty);
                }

                let trackBonus = 0;
                if (gp.favors === 'hp') trackBonus = (bikeStats.hp - 55) * 0.30;
                if (gp.favors === 'aero') trackBonus = (bikeStats.aero - 10) * 0.65;
                if (gp.favors === 'chassis') trackBonus = (bikeStats.chassis - 15) * 0.65;
                if (gp.favors === 'ecu') trackBonus = (bikeStats.ecu - 5) * 0.90;
                if (uRiderObj.favoriteTracks && uRiderObj.favoriteTracks.includes(gp.id)) {
                    trackBonus += 3.5;
                }
                if (rs.weather === 'wet') {
                    trackBonus += ((uRiderObj.wetSkill || 75) - 75) * 0.25;
                }

                const setupBonus = ((rs.setupMatch || 75) - 70) * 0.15;
                riderScore = (bikeStats.overallRating * 0.45) + (userSkill * 0.45) + trackBonus + setupBonus;
                consistency = uRiderObj.consistency || 70;
            }

            const paceOffset = (92 - riderScore) * (baseBenchmarkSec * 0.0016);
            let lapPace = baseBenchmarkSec + paceOffset + trackEvolution + fuelWeightDelta;

            // Lap 1 Standing Start
            if (currentLap === 1) {
                const gridRank = r.gridPosition || 10;
                const uSlot = r.userSlot !== undefined ? r.userSlot : 0;
                const uRiderObj = r.isUser ? ((state.riders && state.riders[uSlot]) || state.rider) : null;
                const launchSkill = r.isUser ? (uRiderObj.braking || 75) : 75;
                const startPenalty = 3.2 + (gridRank * 0.07) - ((launchSkill - 50) * 0.015);
                lapPace += startPenalty;
            }

            // Tire Wear
            let wearMult = 1.0;
            if (strategy === 'push') wearMult = 1.75;
            if (strategy === 'conserve') wearMult = 0.55;

            const lapWear = (compoundDef.wearRate * wearMult) * (12 / totalLaps);
            r.tireCondition = Math.max(0, (r.tireCondition || 100) - lapWear);
            if (r.isUser) {
                const uSlot = r.userSlot !== undefined ? r.userSlot : 0;
                if (!Array.isArray(rs.riderTireConditions) || rs.riderTireConditions.length < 2) {
                    rs.riderTireConditions = [100, 100];
                }
                rs.riderTireConditions[uSlot] = r.tireCondition;
                if (uSlot === 0) rs.tireCondition = r.tireCondition;
            }

            let tirePaceLoss = 0;
            if (r.tireCondition < 75 && r.tireCondition >= 45) {
                tirePaceLoss = ((75 - r.tireCondition) / 30) * 0.35;
            } else if (r.tireCondition < 45 && r.tireCondition >= compoundDef.cliffWear) {
                tirePaceLoss = 0.35 + (((45 - r.tireCondition) / (45 - compoundDef.cliffWear)) * 0.65);
            } else if (r.tireCondition < compoundDef.cliffWear) {
                const cliffDepth = (compoundDef.cliffWear - r.tireCondition) / compoundDef.cliffWear;
                tirePaceLoss = 1.00 + (Math.pow(cliffDepth, 1.8) * 2.2);
            }

            lapPace += (compoundDef.paceDelta + tirePaceLoss);

            // Strategy power delta
            if (strategy === 'push') lapPace -= (rs.sessionType === 'SPRINT' ? 0.58 : 0.52);
            if (strategy === 'conserve') lapPace += 0.44;

            // Yellow flag caution delta in sector
            if (rs.flagState && rs.flagState.status === 'YELLOW') {
                lapPace += 0.50; // Drivers slow down through caution zone
            }

            // Weather & Realistic Tire Pit Adaptation (AI do not blindly all crash on wet track)
            if (rs.weather === 'wet') {
                if (compoundKey !== 'wet') {
                    if (!r.isUser) {
                        // AI executes Flag-to-Flag bike swap on next lap
                        r.tireCompound = 'wet';
                        r.tireCondition = 100;
                        lapPace += 18.5; // Pit transit
                        gameState.addLog(`🛠️ PIT LANE: ${r.name} pitted under Flag-to-Flag rules for wet Michelin tires.`);
                    } else {
                        lapPace += 8.5;
                        // Controlled low crash probability for user staying on slicks
                        if (Math.random() < 0.04 && (rs.totalDnfsInRace || 0) < 3) {
                            r.dnf = true;
                            r.dnfReason = 'Lowside in rain on slick tires';
                            crashesThisLap += 1;
                            rs.totalDnfsInRace = (rs.totalDnfsInRace || 0) + 1;
                            gameState.addLog(`💥 CRASH! ${r.name} slid off into the gravel on slicks in the wet! DNF.`);
                            this.setFlag('YELLOW', 2, 1, `Crash at Turn 6`);
                            return;
                        }
                    }
                }
            } else {
                if (compoundKey === 'wet') {
                    lapPace += 4.5;
                    r.tireCondition = Math.max(0, r.tireCondition - 15);
                }
            }

            // Realistic Individual Crash Probability Check (0.5% per rider per lap dry, max 3 DNFs per race)
            let baseCrashChance = 0.005;
            if (strategy === 'push') baseCrashChance += 0.003;
            if (r.tireCondition < 15) baseCrashChance += 0.015;
            if (rs.weather === 'wet' && compoundKey === 'wet') baseCrashChance += 0.005;

            const totalDnfs = rs.totalDnfsInRace || 0;
            if (totalDnfs < 3 && Math.random() < baseCrashChance) {
                r.dnf = true;
                r.dnfReason = r.tireCondition < 15 ? 'Worn tire rear highside' : (strategy === 'push' ? 'Aggressive trail braking lowside' : 'Lost front end at apex');
                crashesThisLap += 1;
                rs.totalDnfsInRace = totalDnfs + 1;
                const crashSector = Math.floor(Math.random() * 4) + 1;
                this.setFlag('YELLOW', crashSector, 1, `${r.name} crashed in Sector ${crashSector}`);
                gameState.addLog(`💥 CRASH! ${r.name} (${r.team}) suffered a ${r.dnfReason}! DNF on Lap ${currentLap}.`);

                const inj = RiderSystem.processRiderCrash(r.id, r.name, r.isUser, state.tier);
                if (inj) {
                    if (r.isUser) {
                        const uSlot = r.userSlot !== undefined ? r.userSlot : 0;
                        const uRiderObj = (state.riders && state.riders[uSlot]) || state.rider;
                        uRiderObj.injury = inj;
                        if (uSlot === 0) state.rider.injury = inj;
                    }
                    if (inj.severity === 'sidelined') {
                        gameState.addLog(`🏥 MEDICAL ALERT: ${r.name} sustained a ${inj.name} and is SIDELINED for ${inj.racesRemaining} Grand Prix!`);
                    } else {
                        gameState.addLog(`🩺 MEDICAL UPDATE: ${r.name} sustained ${inj.name} (-${inj.penalty}% pace penalty for ${inj.racesRemaining} race).`);
                    }
                }
                return;
            }

            // Consistency Jitter
            const varianceAmp = ((105 - consistency) / 100) * 0.35;
            const lapJitter = (Math.random() - 0.5) * 2 * varianceAmp;
            lapPace += lapJitter;

            // Micro-mistakes
            let eventNote = '';
            const mistakeRoll = Math.random();
            if (strategy === 'push' && mistakeRoll < 0.07) {
                const mistakeLostSec = 0.35 + (Math.random() * 0.40);
                lapPace += mistakeLostSec;
                eventNote = `Wide at Turn 4 (+${mistakeLostSec.toFixed(2)}s)`;
                if (r.isUser) {
                    gameState.addLog(`⚠️ MOMENT! ${r.name} ran wide on Lap ${currentLap} (+${mistakeLostSec.toFixed(2)}s)!`);
                }
            } else if (r.tireCondition < 20 && mistakeRoll < 0.10) {
                const slideLostSec = 0.50 + (Math.random() * 0.50);
                lapPace += slideLostSec;
                eventNote = `Rear slide save (+${slideLostSec.toFixed(2)}s)`;
            }

            // Sectors
            const s1 = (lapPace * gp.sectorRatios[0]) + (Math.random() * 0.08 - 0.04);
            const s2 = (lapPace * gp.sectorRatios[1]) + (Math.random() * 0.08 - 0.04);
            const s3 = (lapPace * gp.sectorRatios[2]) + (Math.random() * 0.08 - 0.04);
            const s4 = lapPace - (s1 + s2 + s3);
            const sectors = [s1, s2, s3, s4];

            const sectorColors = [];
            for (let i = 0; i < 4; i++) {
                if (sectors[i] < (rs.sessionFastestSectors[i] || 999)) {
                    rs.sessionFastestSectors[i] = sectors[i];
                    r.personalBestSectors[i] = sectors[i];
                    sectorColors.push('purple');
                } else if (sectors[i] < (r.personalBestSectors[i] || 999)) {
                    r.personalBestSectors[i] = sectors[i];
                    sectorColors.push('green');
                } else {
                    sectorColors.push('yellow');
                }
            }

            r.lastSectors = sectors;
            r.lastSectorColors = sectorColors;
            r.lastLapSec = lapPace;
            r.lastLapStr = this.formatLapTime(lapPace);

            if (lapPace < r.bestLapSec) {
                r.bestLapSec = lapPace;
                r.bestLapStr = r.lastLapStr;
                if (!eventNote) eventNote = 'Personal Best';
            }

            if (!rs.fastestLap || lapPace < rs.fastestLap.lapTimeSec) {
                rs.fastestLap = {
                    riderName: r.name,
                    team: r.team,
                    lapTimeSec: lapPace,
                    lapTimeStr: r.lastLapStr,
                    lapNum: currentLap
                };
                eventNote = '🟣 FASTEST LAP';
                gameState.addLog(`🟣 FASTEST LAP! ${r.name} clocked ${r.lastLapStr} on Lap ${currentLap}!`);
            }

            r.accumulatedRaceTime += lapPace;

            if (r.isUser) {
                const uSlot = r.userSlot !== undefined ? r.userSlot : 0;
                rs.lapHistory.push({
                    lap: currentLap,
                    riderName: r.name,
                    riderSlot: uSlot,
                    lapTimeStr: r.lastLapStr,
                    lapTimeSec: lapPace,
                    sectors: sectors.map(s => this.formatSectorTime(s)),
                    sectorColors: [...sectorColors],
                    tireCondition: Math.round(r.tireCondition),
                    compound: compoundDef.badge,
                    strategy: strategy.toUpperCase(),
                    eventNote: eventNote
                });
            }
        });

        // Red Flag check (Multi-bike incident)
        if (crashesThisLap >= 2 && !rs.redFlagged) {
            this.handleRedFlagScenario(`Multi-bike incident on Lap ${currentLap}`);
            return;
        }

        rs.leaderboard.sort((a, b) => {
            if (a.dnf && !b.dnf) return 1;
            if (!a.dnf && b.dnf) return -1;
            return a.accumulatedRaceTime - b.accumulatedRaceTime;
        });

        const leaderTime = rs.leaderboard[0].accumulatedRaceTime;
        rs.leaderboard.forEach((r, idx) => {
            if (r.dnf) {
                r.gapSeconds = 999;
                r.intervalSeconds = 999;
                r.lapTimeStr = 'DNF';
            } else {
                r.gapSeconds = idx === 0 ? 0 : r.accumulatedRaceTime - leaderTime;
                const prevRider = idx === 0 ? null : rs.leaderboard[idx - 1];
                r.intervalSeconds = (idx === 0 || !prevRider || prevRider.dnf) ? 0 : Math.max(0.01, r.accumulatedRaceTime - prevRider.accumulatedRaceTime);
            }
        });
    }

    // ==========================================
    // RED FLAG PROCEDURE (Multi-Bike Crash / Stoppage)
    // ==========================================
    static handleRedFlagScenario(reason) {
        const state = gameState.getState();
        const rs = state.raceState;
        rs.redFlagged = true;
        this.setFlag('RED', null, 0, reason);

        const raceDistancePct = rs.currentLap / rs.totalLaps;

        if (raceDistancePct >= 0.75) {
            // Over 75% completed -> Official Finish!
            gameState.addLog(`🚩 RED FLAG (75%+ Completed): Race declared official! Results based on Lap ${rs.currentLap - 1}.`);
            if (rs.sessionType === 'SPRINT') {
                this.finishSprintRace();
            } else {
                this.finishRace();
            }
        } else {
            // Under 75% -> Quick Restart Procedure!
            rs.raceInProgress = false;
            rs.activeIncident = {
                id: 'red_flag_restart',
                title: '🚩 RED FLAG - QUICK RESTART PROCEDURE',
                desc: `Race suspended due to ${reason}. Pit lane open for bike maintenance and tire change. Choose tire compound for the sprint restart (${rs.totalLaps - rs.currentLap} laps remaining):`,
                choices: [
                    { label: '🔴 Restart on SOFT Compound', action: 'restart_soft' },
                    { label: '🟡 Restart on MEDIUM Compound', action: 'restart_med' },
                    { label: '⚪ Restart on HARD Compound', action: 'restart_hard' }
                ]
            };
            gameState.addLog(`🚩 PIT WALL: Red Flag restart procedure active. Select restart tire setup.`);
        }
    }

    static processMidRaceIncidents() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.activeIncident || !rs.raceInProgress) return;

        const rand = Math.random();

        // Sudden Rain Shower (Flag-to-Flag White Flag)
        if (rs.weather === 'dry' && rs.currentLap >= 3 && rs.currentLap <= 6 && rand < 0.12) {
            rs.weather = 'wet';
            this.setFlag('WHITE_CROSS', null, 2, 'Sudden Rain Shower - Flag-to-Flag Bike Swaps Open');
            rs.activeIncident = {
                id: 'weather_rain',
                title: '🌧️ SUDDEN RAIN SHOWER (FLAG-TO-FLAG)!',
                desc: 'Rain is falling over the asphalt! Track is declared WET. Do you want to pit for wet tires?',
                choices: [
                    { label: '🛞 Pit for Wet Michelin Tires (Flag-to-Flag)', action: 'pit_wet' },
                    { label: '⚠️ Stay on Slicks (Gamble on Drying Line)', action: 'stay_slicks' }
                ]
            };
            gameState.addLog(`🌧️ WEATHER ALERT: Rain falling on Lap ${rs.currentLap}! Pit Wall alert active.`);
        }
    }

    /**
     * Calculates sprint race prize money safely with defensive fallbacks.
     * Prevents NaN values across all tiers and handles perks.
     * @param {Object} tierDef - Tier definition object from TIERS
     * @param {number} userPos - Finishing position (1-based index)
     * @param {Array<string>} [heritagePerks=[]] - Active player heritage perks
     * @returns {number} Non-negative integer prize money
     */
    static calculateSprintPrize(tierDef, userPos, heritagePerks = []) {
        if (!tierDef || !Number.isFinite(userPos) || userPos <= 0) return 0;

        const winPrize = Number(tierDef.sprintWinPrize) || 0;
        const podPrize = Number(tierDef.sprintPodiumPrize) || 0;
        const top9Prize = Number(tierDef.sprintTop9Prize) || 0;

        let prizeMoney = userPos === 1 ? winPrize
                       : (userPos <= 3 ? podPrize
                       : (userPos <= 9 ? top9Prize
                       : Math.floor(top9Prize * 0.25)));

        if (!Number.isFinite(prizeMoney) || prizeMoney < 0) {
            prizeMoney = 0;
        }

        if (Array.isArray(heritagePerks) && heritagePerks.includes('heritage_paddock_brand')) {
            prizeMoney *= 2;
        }

        return Math.floor(prizeMoney);
    }

    // ==========================================
    // 7. SPRINT RACE FINISH (Official Sprint Points: 12 down to 1)
    // ==========================================
    static finishSprintRace() {
        const state = gameState.getState();
        const rs = state.raceState;

        rs.raceInProgress = false;
        rs.sprintCompleted = true;
        rs.stage = 'RACE';
        rs.activeIncident = null;
        this.setFlag('GREEN', null, 0, 'Sprint Finished');
        this.syncCalendarActivity('race_sprint');

        this.initChampionshipStandings();

        const sprintPointsTable = [12, 9, 7, 6, 5, 4, 3, 2, 1];

        rs.leaderboard.forEach((r, idx) => {
            if (r.dnf) return;
            const pos = idx + 1;
            const pts = pos <= 9 ? sprintPointsTable[pos - 1] : 0;

            const standingRider = rs.championshipStandings.find(s => s.name === r.name);
            if (standingRider) {
                standingRider.points += pts;
                if (pos === 1) standingRider.sprintWins = (standingRider.sprintWins || 0) + 1;
            }
        });

        rs.championshipStandings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if ((b.wins + (b.sprintWins || 0)) !== (a.wins + (a.sprintWins || 0))) {
                return (b.wins + (b.sprintWins || 0)) - (a.wins + (a.sprintWins || 0));
            }
            return b.podiums - a.podiums;
        });

        const winner = rs.leaderboard[0];
        const userRiders = (state.riders && state.riders.length >= 2) ? state.riders : [state.rider];
        const tierDef = TIERS[state.tier] || TIERS[1];
        let totalSprintPrize = 0;
        let totalSprintHype = 0;

        userRiders.forEach((uRider, uIdx) => {
            const userPos = rs.leaderboard.findIndex(r => r.isUser && (r.userSlot === uIdx || (r.userSlot === undefined && uIdx === 0) || r.name === uRider.name)) + 1;
            const userEntry = userPos > 0 ? rs.leaderboard[userPos - 1] : null;

            if (userEntry && userEntry.dnf) {
                gameState.addLog(`💥 SPRINT RESULT: ${uRider.name} (#${uRider.number || (uIdx + 1)}) suffered a DNF in the Sprint Race.`);
            } else if (userPos > 0) {
                const sprintPts = userPos <= 9 ? sprintPointsTable[userPos - 1] : 0;
                const prizeMoney = this.calculateSprintPrize(tierDef, userPos, state.heritagePerks);
                const hypeEarned = userPos === 1 ? 12 : (userPos <= 3 ? 8 : 4);

                totalSprintPrize += prizeMoney;
                totalSprintHype += hypeEarned;
                rs.seasonPoints += sprintPts;

                gameState.addLog(`⚡ SPRINT FINISH: ${uRider.name} (#${uRider.number || (uIdx + 1)}) crossed the line P${userPos} (+${sprintPts} Sprint PTS, +$${prizeMoney.toLocaleString()}, +${hypeEarned} Hype)!`);
            }
        });

        state.cash = (Number.isFinite(state.cash) ? state.cash : 0) + totalSprintPrize;
        state.hype += totalSprintHype;

        gameState.addLog(`🏁 Saturday Sprint Complete! Winner: ${winner.name}. Team Purse: +$${totalSprintPrize.toLocaleString()}, +${totalSprintHype} Hype. Prepare for Sunday Main Grand Prix.`);
    }

    // ==========================================
    // 8. SUNDAY GRAND PRIX FINISH (Full 25 Points)
    // ==========================================
    static finishRace() {
        const state = gameState.getState();
        const rs = state.raceState;

        rs.raceInProgress = false;
        rs.stage = 'FP1';
        rs.fpCompleted = false;
        rs.practiceCompleted = false;
        rs.q1Completed = false;
        rs.q2Completed = false;
        rs.sprintCompleted = false;
        rs.directQ2 = false;
        rs.activeIncident = null;
        rs.strategy = 'balanced';
        rs.riderStrategies = ['balanced', 'balanced'];
        rs.tireCompound = 'medium';
        rs.riderCompounds = ['medium', 'medium'];
        rs.tireType = 'slicks';
        rs.tireCondition = 100;
        rs.riderTireConditions = [100, 100];
        this.setFlag('GREEN', null, 0, 'Grand Prix Finished');

        this.initChampionshipStandings();

        const pointsTable = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

        rs.leaderboard.forEach((r, idx) => {
            if (r.dnf) return;
            const pos = idx + 1;
            const pts = pos <= 15 ? pointsTable[pos - 1] : 0;

            const standingRider = rs.championshipStandings.find(s => s.name === r.name);
            if (standingRider) {
                standingRider.points += pts;
                if (pos === 1) standingRider.wins += 1;
                if (pos <= 3) standingRider.podiums += 1;
            }
        });

        if (rs.fastestLap) {
            const flRiderPos = rs.leaderboard.findIndex(r => r.name === rs.fastestLap.riderName) + 1;
            if (flRiderPos >= 1 && flRiderPos <= 10) {
                const standingRider = rs.championshipStandings.find(s => s.name === rs.fastestLap.riderName);
                if (standingRider) {
                    standingRider.points += 1;
                    standingRider.fastestLaps = (standingRider.fastestLaps || 0) + 1;
                    gameState.addLog(`🟣 BONUS POINT: ${rs.fastestLap.riderName} awarded +1 Championship Point for Race Fastest Lap (${rs.fastestLap.lapTimeStr})!`);
                }
            }
        }

        rs.championshipStandings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.podiums - a.podiums;
        });

        const userRiders = (state.riders && state.riders.length >= 2) ? state.riders : [state.rider];
        const tierDef = TIERS[state.tier] || TIERS[1];
        let totalGPPrize = 0;
        let totalGPHype = 0;

        userRiders.forEach((uRider, uIdx) => {
            const userPos = rs.leaderboard.findIndex(r => r.isUser && (r.userSlot === uIdx || (r.userSlot === undefined && uIdx === 0) || r.name === uRider.name)) + 1;
            const userEntry = userPos > 0 ? rs.leaderboard[userPos - 1] : null;

            if (userEntry && userEntry.dnf) {
                gameState.addLog(`💥 RACE RESULT: ${uRider.name} (#${uRider.number || (uIdx + 1)}) suffered a DNF crash and scored 0 points.`);
            } else if (userPos > 0) {
                let prizeMoney = Math.floor(tierDef.gpTop10Prize * 0.30);
                let pointsEarned = userPos <= 15 ? pointsTable[userPos - 1] : 0;
                let hypeEarned = 2;

                if (userPos === 1) {
                    prizeMoney = tierDef.gpWinPrize;
                    hypeEarned = 30;
                } else if (userPos <= 3) {
                    prizeMoney = tierDef.gpPodiumPrize;
                    hypeEarned = 18;
                } else if (userPos <= 10) {
                    prizeMoney = tierDef.gpTop10Prize;
                    hypeEarned = 10;
                }

                if (rs.fastestLap && rs.fastestLap.riderName === uRider.name && userPos <= 10) {
                    pointsEarned += 1;
                    prizeMoney += Math.floor(tierDef.gpTop10Prize * 0.50);
                }

                if (state.heritagePerks.includes('heritage_paddock_brand')) {
                    prizeMoney *= 2;
                }

                totalGPPrize += prizeMoney;
                totalGPHype += hypeEarned;
                rs.seasonPoints += pointsEarned;

                gameState.addLog(`🏆 GRAND PRIX RESULT: ${uRider.name} (#${uRider.number || (uIdx + 1)}) finished P${userPos}! Prize: +$${prizeMoney.toLocaleString()}, +${pointsEarned} PTS, +${hypeEarned} Hype.`);

                // Natural injury check / healing for this rider
                if (Math.random() < 0.10) {
                    const injuries = [
                        { name: "Arm Pump Strain", penalty: 8, racesRemaining: 2 },
                        { name: "Shoulder Contusion", penalty: 12, racesRemaining: 2 },
                        { name: "Wrist Sprain", penalty: 10, racesRemaining: 1 }
                    ];
                    const inj = injuries[Math.floor(Math.random() * injuries.length)];
                    uRider.injury = inj;
                    if (uIdx === 0) state.rider.injury = inj;
                    gameState.addLog(`🩺 MEDICAL CENTER: ${uRider.name} sustained ${inj.name} (-${inj.penalty} skill penalty for ${inj.racesRemaining} races)! Hire Physio Trainer to heal.`);
                } else if (uRider.injury) {
                    uRider.injury.racesRemaining -= 1;
                    if (uRider.injury.racesRemaining <= 0) {
                        gameState.addLog(`💪 MEDICAL CLEARANCE: ${uRider.name} has fully recovered from ${uRider.injury.name}!`);
                        uRider.injury = null;
                        if (uIdx === 0) state.rider.injury = null;
                    }
                }
            }
        });

        state.cash = (Number.isFinite(state.cash) ? state.cash : 0) + (Number.isFinite(totalGPPrize) ? totalGPPrize : 0);
        state.hype += totalGPHype;
        this.syncCalendarActivity('race_gp');

        gameState.addLog(`🏁 GRAND PRIX WEEKEND CONCLUDED! Total Team Winnings: +$${totalGPPrize.toLocaleString()}, +${totalGPHype} Hype.`);

        rs.currentGPIndex += 1;
        RiderSystem.advancePaddockAfterRace(state.tier, rs.currentGPIndex);
        if (rs.currentGPIndex % GP_CALENDAR.length === 0) {
            state.season += 1;
            state.seasonsCompleted = (state.seasonsCompleted || 0) + 1;
            state.seasonsInCurrentTier = (state.seasonsInCurrentTier || 0) + 1;

            const champ = rs.championshipStandings[0];
            gameState.addLog(`🏆 WORLD CHAMPIONSHIP FINALE! ${champ.name} (${champ.team}) is crowned Season ${state.season - 1} World Champion with ${champ.points} PTS!`);
            gameState.addLog(`🌟 SEASON EXPERIENCE: You have completed Season ${state.season - 1}! Check the Promotion Hub in your Garage to upgrade your category to Moto2™ or MotoGP™.`);

            rs.championshipStandings.forEach(s => {
                s.points = 0;
                s.wins = 0;
                s.sprintWins = 0;
                s.podiums = 0;
                s.fastestLaps = 0;
            });
        }
    }
}
