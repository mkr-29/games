// RaceSystem.js - Official 2026 Grand Prix Weekend Format with FIM Flags & Realistic Crash Engine

import { gameState } from '../engine/GameState.js';
import { BikeSystem } from './BikeSystem.js';

// Official 2026 FIM MotoGP™ World Championship Calendar (21 Rounds)
export const GP_CALENDAR = [
    { id: 'qatar', title: "Qatar Grand Prix (Lusail)", flag: "🇶🇦", lengthKm: 5.380, type: "High Speed & Night Straight", favors: "hp", laps: 12, baseSec: 108.2, sectorRatios: [0.24, 0.26, 0.26, 0.24] },
    { id: 'portugal', title: "Portuguese Grand Prix (Portimão)", flag: "🇵🇹", lengthKm: 4.592, type: "Elevation Rollercoaster", favors: "chassis", laps: 12, baseSec: 98.4, sectorRatios: [0.25, 0.25, 0.26, 0.24] },
    { id: 'argentina', title: "Argentine Grand Prix (Termas de Río Hondo)", flag: "🇦🇷", lengthKm: 4.806, type: "Fast Flowing Sweepers", favors: "aero", laps: 12, baseSec: 98.1, sectorRatios: [0.25, 0.27, 0.23, 0.25] },
    { id: 'americas', title: "Grand Prix of the Americas (COTA Austin)", flag: "🇺🇸", lengthKm: 5.513, type: "Technical & Heavy Bumps", favors: "chassis", laps: 12, baseSec: 122.3, sectorRatios: [0.27, 0.25, 0.26, 0.22] },
    { id: 'jerez', title: "Gran Premio de España (Jerez)", flag: "🇪🇸", lengthKm: 4.423, type: "Hard Braking & Trail Entry", favors: "chassis", laps: 12, baseSec: 96.6, sectorRatios: [0.25, 0.25, 0.25, 0.25] },
    { id: 'france', title: "French Grand Prix (Le Mans)", flag: "🇫🇷", lengthKm: 4.185, type: "Stop-and-Go & Sudden Rain", favors: "ecu", laps: 12, baseSec: 90.6, sectorRatios: [0.23, 0.27, 0.25, 0.25] },
    { id: 'catalunya', title: "Gran Premio de Catalunya (Barcelona)", flag: "🇪🇸", lengthKm: 4.657, type: "High Tire Wear & Drag", favors: "aero", laps: 12, baseSec: 98.6, sectorRatios: [0.26, 0.24, 0.25, 0.25] },
    { id: 'mugello', title: "Gran Premio d'Italia (Mugello)", flag: "🇮🇹", lengthKm: 5.245, type: "1.1km Main Straight Speed", favors: "hp", laps: 12, baseSec: 105.1, sectorRatios: [0.27, 0.23, 0.26, 0.24] },
    { id: 'assen', title: "TT Assen (Cathedral of Speed)", flag: "🇳🇱", lengthKm: 4.542, type: "Fast Flowing Chicanes", favors: "aero", laps: 12, baseSec: 91.6, sectorRatios: [0.24, 0.26, 0.25, 0.25] },
    { id: 'sachsenring', title: "German Grand Prix (Sachsenring)", flag: "🇩🇪", lengthKm: 3.671, type: "Tight Left-Hand Waterfall", favors: "chassis", laps: 12, baseSec: 80.3, sectorRatios: [0.25, 0.25, 0.25, 0.25] },
    { id: 'silverstone', title: "British Grand Prix (Silverstone)", flag: "🇬🇧", lengthKm: 5.900, type: "Ultra High-Speed Sweeps", favors: "hp", laps: 12, baseSec: 118.2, sectorRatios: [0.25, 0.26, 0.24, 0.25] },
    { id: 'spielberg', title: "Austrian Grand Prix (Red Bull Ring)", flag: "🇦🇹", lengthKm: 4.348, type: "Steep Uphill Acceleration", favors: "hp", laps: 12, baseSec: 88.6, sectorRatios: [0.24, 0.28, 0.24, 0.24] },
    { id: 'balaton', title: "Hungarian Grand Prix (Balaton Park)", flag: "🇭🇺", lengthKm: 4.115, type: "Technical Chicane Rhythm", favors: "chassis", laps: 12, baseSec: 92.1, sectorRatios: [0.25, 0.25, 0.25, 0.25] },
    { id: 'aragon', title: "Gran Premio de Aragón (MotorLand)", flag: "🇪🇸", lengthKm: 5.077, type: "Carbon Discs Heavy Braking", favors: "hp", laps: 12, baseSec: 106.2, sectorRatios: [0.26, 0.24, 0.26, 0.24] },
    { id: 'misano', title: "San Marino Grand Prix (Misano)", flag: "🇮🇹", lengthKm: 4.226, type: "High Lean Cornering Speed", favors: "chassis", laps: 12, baseSec: 91.1, sectorRatios: [0.24, 0.26, 0.25, 0.25] },
    { id: 'sokol', title: "Kazakhstan Grand Prix (Sokol Racetrack)", flag: "🇰🇿", lengthKm: 4.495, type: "Technical Rhythm & ECU", favors: "ecu", laps: 12, baseSec: 96.2, sectorRatios: [0.25, 0.25, 0.25, 0.25] },
    { id: 'mandalika', title: "Indonesian Grand Prix (Mandalika)", flag: "🇮🇩", lengthKm: 4.313, type: "Fast Coastal Sweeps", favors: "aero", laps: 12, baseSec: 90.1, sectorRatios: [0.25, 0.25, 0.25, 0.25] },
    { id: 'motegi', title: "Grand Prix of Japan (Motegi)", flag: "🇯🇵", lengthKm: 4.801, type: "Hard Braking & Acceleration", favors: "ecu", laps: 12, baseSec: 104.2, sectorRatios: [0.24, 0.26, 0.26, 0.24] },
    { id: 'phillip_island', title: "Australian Grand Prix (Phillip Island)", flag: "🇦🇺", lengthKm: 4.448, type: "Ocean Sweeps & High Tire Wear", favors: "aero", laps: 12, baseSec: 87.6, sectorRatios: [0.23, 0.27, 0.26, 0.24] },
    { id: 'sepang', title: "Malaysian Grand Prix (Sepang)", flag: "🇲🇾", lengthKm: 5.543, type: "High Heat & Sudden Monsoons", favors: "ecu", laps: 12, baseSec: 117.7, sectorRatios: [0.26, 0.25, 0.25, 0.24] },
    { id: 'valencia', title: "Gran Premio de Valencia (Finale)", flag: "🇪🇸", lengthKm: 4.005, type: "Tight Stadium Arena Finale", favors: "chassis", laps: 12, baseSec: 89.9, sectorRatios: [0.24, 0.26, 0.25, 0.25] }
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

// Official 2026 Moto3™ Championship Rider Grid
const MOTO3_2026_RIDERS = [
    { name: "D. Alonso", team: "CFMoto Gaviota Aspar" },
    { name: "I. Ortola", team: "MT Helmets - MSI" },
    { name: "C. Veijer", team: "Liqui Moly Husqvarna Intact" },
    { name: "D. Holgado", team: "Red Bull GASGAS Tech3" },
    { name: "A. Piqueras", team: "Leopard Racing Honda" },
    { name: "J. Rueda", team: "Red Bull KTM Ajo" },
    { name: "T. Suzuki", team: "Liqui Moly Husqvarna Intact" },
    { name: "S. Nepa", team: "LEVELUP - MTA" },
    { name: "A. Fernandez", team: "Leopard Racing Honda" },
    { name: "R. Rossi", team: "CIP Green Power" },
    { name: "M. Yamanaka", team: "MT Helmets - MSI" },
    { name: "S. Ogden", team: "MLav Racing Honda" },
    { name: "J. Esteban", team: "CFMoto Gaviota Aspar" },
    { name: "N. Carraro", team: "LEVELUP - MTA" },
    { name: "T. Furusato", team: "Honda Team Asia" }
];

// Official 2026 Moto2™ Championship Rider Grid
const MOTO2_2026_RIDERS = [
    { name: "S. Garcia", team: "MT Helmets - MSI Kalex" },
    { name: "A. Ogura", team: "MT Helmets - MSI Boscoscuro" },
    { name: "F. Aldeguer", team: "Sync SpeedUp Boscoscuro" },
    { name: "J. Roberts", team: "OnlyFans American Racing" },
    { name: "C. Vietti", team: "Red Bull KTM Ajo" },
    { name: "A. Lopez", team: "Sync SpeedUp Boscoscuro" },
    { name: "M. Gonzalez", team: "QJMOTOR Gresini Moto2" },
    { name: "T. Arbolino", team: "Elf Marc VDS Racing" },
    { name: "B. Baltus", team: "RW-Idrofoglia Racing" },
    { name: "Z. van den Goorbergh", team: "RW-Idrofoglia Racing" },
    { name: "A. Canet", team: "Fantic Racing Kalex" },
    { name: "D. Binder", team: "Liqui Moly Husqvarna Intact" },
    { name: "I. Guevara", team: "CFMoto Aspar Team" },
    { name: "D. Alonso", team: "Red Bull KTM Ajo Moto2" },
    { name: "M. Ramirez", team: "OnlyFans American Racing" }
];

// Official 2026 Premier Class MotoGP™ Championship Rider Grid
const MOTOGP_2026_RIDERS = [
    { name: "F. Bagnaia", team: "Ducati Lenovo Team" },
    { name: "M. Marquez", team: "Ducati Lenovo Team" },
    { name: "J. Martin", team: "Aprilia Racing Factory" },
    { name: "P. Acosta", team: "Red Bull KTM Factory Racing" },
    { name: "E. Bastianini", team: "Red Bull KTM Tech3" },
    { name: "M. Vinales", team: "Red Bull KTM Tech3" },
    { name: "F. Quartararo", team: "Monster Energy Yamaha" },
    { name: "A. Espargaro", team: "Aprilia Racing Factory" },
    { name: "B. Binder", team: "Red Bull KTM Factory Racing" },
    { name: "M. Bezzecchi", team: "Aprilia Racing Factory" },
    { name: "F. Di Giannantonio", team: "Pertamina Enduro VR46" },
    { name: "A. Marquez", team: "Gresini Racing MotoGP" },
    { name: "J. Zarco", team: "CASTROL Honda LCR" },
    { name: "J. Mir", team: "Repsol Honda Team" },
    { name: "L. Marini", team: "Repsol Honda Team" }
];

export class RaceSystem {
    static getCurrentGP() {
        const state = gameState.getState();
        const idx = state.raceState.currentGPIndex % GP_CALENDAR.length;
        return GP_CALENDAR[idx];
    }

    static getTierRiders(tier) {
        if (tier === 1 || tier === 2) return MOTO3_2026_RIDERS;
        if (tier === 3) return MOTO2_2026_RIDERS;
        return MOTOGP_2026_RIDERS;
    }

    static getTierSpeedMultiplier(tier) {
        if (tier === 1 || tier === 2) return 1.080;
        if (tier === 3) return 1.035;
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

    static initChampionshipStandings() {
        const state = gameState.getState();
        const rs = state.raceState;
        const tierRiders = this.getTierRiders(state.tier);

        if (!rs.championshipStandings || rs.championshipStandings.length === 0 || rs.championshipTier !== state.tier) {
            const standings = tierRiders.map(ai => ({
                name: ai.name,
                team: ai.team,
                isUser: false,
                points: 0,
                wins: 0,
                sprintWins: 0,
                podiums: 0,
                fastestLaps: 0
            }));

            standings.push({
                name: state.rider.name,
                team: "Your Team",
                isUser: true,
                points: 0,
                wins: 0,
                sprintWins: 0,
                podiums: 0,
                fastestLaps: 0
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

        const setupMatch = Math.min(99, 72 + Math.floor(bikeStats.overallRating * 0.35) + Math.floor(Math.random() * 8));
        rs.setupMatch = setupMatch;

        state.telemetry = Math.min(state.telemetryMax, state.telemetry + 35);
        state.science = Math.min(state.scienceMax, state.science + 12);

        rs.fpCompleted = true;
        rs.stage = 'PR';
        this.setFlag('GREEN', null, 0, 'Track clear');

        gameState.addLog(`🏁 Free Practice 1 Complete at ${gp.title}! Setup Dialed In: ${setupMatch}%. Telemetry +35, RP +12.`);
        return true;
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
        let riderSkill = state.rider.overallSkill;
        if (state.rider.injury) riderSkill = Math.max(20, riderSkill - state.rider.injury.penalty);

        const gp = this.getCurrentGP();
        const tierMult = this.getTierSpeedMultiplier(state.tier);
        const baseTrackSec = gp.baseSec * tierMult;

        let trackBonus = 0;
        if (gp.favors === 'hp') trackBonus = (bikeStats.hp - 55) * 0.30;
        if (gp.favors === 'aero') trackBonus = (bikeStats.aero - 10) * 0.65;
        if (gp.favors === 'chassis') trackBonus = (bikeStats.chassis - 15) * 0.65;
        if (gp.favors === 'ecu') trackBonus = (bikeStats.ecu - 5) * 0.90;

        const setupBonus = ((rs.setupMatch || 75) - 70) * 0.15;
        const userScore = (bikeStats.overallRating * 0.45) + (riderSkill * 0.45) + trackBonus + setupBonus;

        const aiRange = this.getAISkillRange(state.tier);
        const tierRiders = this.getTierRiders(state.tier);

        const practiceList = tierRiders.map((ai, idx) => {
            const rangeSpan = aiRange.max - aiRange.min;
            const rankRatio = (tierRiders.length - idx) / tierRiders.length;
            const aiScore = aiRange.min + (rankRatio * rangeSpan) + (Math.random() * 3 - 1.5);
            const aiConsistency = 70 + Math.floor(rankRatio * 20);
            const { bestLap, bestSectors } = this.simulateHotLap(aiScore, aiConsistency, baseTrackSec, gp.sectorRatios);

            return {
                name: ai.name,
                team: ai.team,
                isUser: false,
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

        const userConsistency = state.rider.consistency || 65;
        const { bestLap: userBestLap, bestSectors: userBestSectors } = this.simulateHotLap(userScore, userConsistency, baseTrackSec, gp.sectorRatios);

        practiceList.push({
            name: state.rider.name,
            team: "Your Team",
            isUser: true,
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

        practiceList.sort((a, b) => a.bestLapSec - b.bestLapSec);

        const practiceLeader = practiceList[0].bestLapSec;
        practiceList.forEach((r, idx) => {
            r.gapSeconds = idx === 0 ? 0 : r.bestLapSec - practiceLeader;
            r.intervalSeconds = idx === 0 ? 0 : r.bestLapSec - practiceList[idx - 1].bestLapSec;
        });

        rs.leaderboard = practiceList;

        const top10 = practiceList.slice(0, 10);
        const bottom6 = practiceList.slice(10);

        rs.q2DirectRiders = top10;
        rs.q1Riders = bottom6;

        const userPos = practiceList.findIndex(r => r.isUser) + 1;
        rs.directQ2 = userPos <= 10;
        rs.practiceCompleted = true;
        rs.stage = 'Q1';

        if (rs.directQ2) {
            gameState.addLog(`🌟 TIMED PRACTICE SUCCESS: ${state.rider.name} finished P${userPos} and qualified DIRECTLY into Q2! (Time: ${this.formatLapTime(userBestLap)})`);
        } else {
            gameState.addLog(`⚠️ TIMED PRACTICE: ${state.rider.name} finished P${userPos}. Must fight in Q1 Shootout for top 2 spots into Q2!`);
        }

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

        const q1Grid = rs.q1Riders || rs.leaderboard.slice(10);

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

        const q1Graduates = q1Grid.slice(0, 2);
        const q1Eliminated = q1Grid.slice(2);

        rs.q1Graduates = q1Graduates;
        rs.q1Eliminated = q1Eliminated;
        rs.q1Completed = true;
        rs.stage = 'Q2';
        rs.leaderboard = q1Grid;

        const userInQ1 = q1Grid.find(r => r.isUser);
        if (userInQ1) {
            const q1Pos = q1Grid.indexOf(userInQ1) + 1;
            if (q1Pos <= 2) {
                gameState.addLog(`🔥 Q1 GRADUATION! ${state.rider.name} finished P${q1Pos} in Q1 and advanced to Q2! (Time: ${this.formatLapTime(userInQ1.q1LapSec)})`);
            } else {
                const finalGridPos = 12 + q1Pos;
                gameState.addLog(`⏱️ Q1 COMPLETE: ${state.rider.name} knocked out in Q1 (P${q1Pos}). Starting grid locked at P${finalGridPos}.`);
            }
        } else {
            gameState.addLog(`⏱️ Q1 Shootout finished! ${q1Graduates[0].name} (${q1Graduates[0].lapTimeStr}) and ${q1Graduates[1].name} (${q1Graduates[1].lapTimeStr}) graduated to Q2.`);
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

        const direct10 = rs.q2DirectRiders || rs.leaderboard.slice(0, 10);
        const grad2 = rs.q1Graduates || [];
        const q2List = [...direct10, ...grad2];

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

        const lockedBottom4 = rs.q1Eliminated || [];
        const finalGrid = [...q2List, ...lockedBottom4];

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
        const userPos = finalGrid.findIndex(r => r.isUser) + 1;
        rs.qpGridPosition = userPos;
        rs.q2Completed = true;
        rs.stage = 'SPRINT';

        const poleRider = finalGrid[0];
        gameState.addLog(`👑 POLE POSITION! ${poleRider.name} takes POLE with ${this.formatLapTime(poleTime)}! ${state.rider.name} starts P${userPos} for both Sprint & Grand Prix!`);
        return true;
    }

    static setTireCompound(compoundId) {
        const state = gameState.getState();
        if (!TIRE_COMPOUNDS[compoundId]) return;
        state.raceState.tireCompound = compoundId;
        state.raceState.tireType = compoundId === 'wet' ? 'wet' : 'slicks';
        gameState.addLog(`🛞 Tire compound selected: ${TIRE_COMPOUNDS[compoundId].name} (${TIRE_COMPOUNDS[compoundId].badge})`);
    }

    // ==========================================
    // 5. SATURDAY SPRINT RACE (50% Distance & Points)
    // ==========================================
    static startSprintRace() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.stage !== 'SPRINT' || rs.raceInProgress) return false;

        rs.sessionType = 'SPRINT';
        rs.raceInProgress = true;
        rs.currentLap = 1;
        rs.trackProgress = 0;
        rs.weather = (Math.random() < 0.20) ? "wet" : "dry";
        rs.trackTempC = rs.weather === 'wet' ? 20 : Math.floor(27 + Math.random() * 10);
        rs.tireCondition = 100;
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
        if (rs.weather === 'wet' && rs.tireCompound !== 'wet') {
            rs.tireCompound = 'wet';
            rs.tireType = 'wet';
        } else if (rs.weather === 'dry' && rs.tireCompound === 'wet') {
            rs.tireCompound = 'medium';
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
                riderCopy.tireCompound = rs.tireCompound;
            }

            riderCopy.gapSeconds = idx === 0 ? 0 : idx * 0.05;
            return riderCopy;
        });
    }

    static setStrategy(strategy) {
        const state = gameState.getState();
        state.raceState.strategy = strategy;
        const labels = { push: "PUSH HARD (PWR 1)", balanced: "BALANCED (PWR 2)", conserve: "TIRE SAVER (PWR 3)" };
        gameState.addLog(`🔧 Engine mapping changed to: ${labels[strategy] || strategy.toUpperCase()}`);
    }

    static resolveIncidentChoice(choiceAction) {
        const state = gameState.getState();
        const rs = state.raceState;
        const inc = rs.activeIncident;

        if (!inc) return;

        if (choiceAction === 'pit_wet') {
            rs.tireCompound = 'wet';
            rs.tireType = 'wet';
            rs.tireCondition = 100;
            const userRider = rs.leaderboard.find(r => r.isUser);
            if (userRider) {
                userRider.tireCompound = 'wet';
                userRider.tireCondition = 100;
                userRider.accumulatedRaceTime += 18.5;
            }
            gameState.addLog(`🛠️ BOX BOX! Switched to WET Michelin tires (+18.5s pit lane transit). Full rain grip restored!`);
        } else if (choiceAction === 'stay_slicks') {
            gameState.addLog(`⚠️ PIT WALL: Staying on slick tires on a wet track! Extreme slide and crash risk!`);
        } else if (choiceAction === 'eco_map') {
            rs.strategy = 'conserve';
            gameState.addLog(`🔧 Switched ECU to Eco Map (PWR 3). Engine coolant temperature stabilized.`);
        } else if (choiceAction === 'risk_push') {
            gameState.addLog(`🔥 PUSHING POWER MAP: Maintaining full power. High risk of engine failure!`);
        } else if (choiceAction === 'restart_soft' || choiceAction === 'restart_med' || choiceAction === 'restart_hard') {
            const comp = choiceAction.replace('restart_', '');
            rs.tireCompound = comp;
            rs.tireCondition = 100;
            rs.raceInProgress = true;
            this.setFlag('GREEN', null, 0, 'Quick Restart underway');
            gameState.addLog(`🚀 QUICK RESTART! Race resumed from the grid with fresh ${comp.toUpperCase()} tires!`);
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
        let userSkill = state.rider.overallSkill;
        if (state.rider.injury) {
            userSkill = Math.max(20, userSkill - state.rider.injury.penalty);
        }

        const trackEvolution = -Math.min(0.25, (currentLap / totalLaps) * 0.25);
        const fuelWeightDelta = ((totalLaps - currentLap + 1) / totalLaps) * (rs.sessionType === 'SPRINT' ? 0.40 : 0.75);

        let crashesThisLap = 0;

        rs.leaderboard.forEach(r => {
            if (r.dnf) return;

            let riderScore = r.score;
            let consistency = r.consistency || 70;
            let strategy = r.isUser ? rs.strategy : (Math.random() < 0.2 ? 'push' : (Math.random() < 0.15 ? 'conserve' : 'balanced'));
            let compoundKey = r.tireCompound || 'medium';
            let compoundDef = TIRE_COMPOUNDS[compoundKey] || TIRE_COMPOUNDS.medium;

            if (r.isUser) {
                let trackBonus = 0;
                if (gp.favors === 'hp') trackBonus = (bikeStats.hp - 55) * 0.30;
                if (gp.favors === 'aero') trackBonus = (bikeStats.aero - 10) * 0.65;
                if (gp.favors === 'chassis') trackBonus = (bikeStats.chassis - 15) * 0.65;
                if (gp.favors === 'ecu') trackBonus = (bikeStats.ecu - 5) * 0.90;
                const setupBonus = ((rs.setupMatch || 75) - 70) * 0.15;
                riderScore = (bikeStats.overallRating * 0.45) + (userSkill * 0.45) + trackBonus + setupBonus;
                consistency = state.rider.consistency || 65;
            }

            const paceOffset = (92 - riderScore) * (baseBenchmarkSec * 0.0016);
            let lapPace = baseBenchmarkSec + paceOffset + trackEvolution + fuelWeightDelta;

            // Lap 1 Standing Start
            if (currentLap === 1) {
                const gridRank = r.gridPosition || 10;
                const launchSkill = r.isUser ? (state.rider.braking || 60) : 75;
                const startPenalty = 3.2 + (gridRank * 0.07) - ((launchSkill - 50) * 0.015);
                lapPace += startPenalty;
            }

            // Tire Wear
            let wearMult = 1.0;
            if (strategy === 'push') wearMult = 1.75;
            if (strategy === 'conserve') wearMult = 0.55;

            const lapWear = (compoundDef.wearRate * wearMult) * (12 / totalLaps);
            r.tireCondition = Math.max(0, (r.tireCondition || 100) - lapWear);
            if (r.isUser) rs.tireCondition = r.tireCondition;

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
                rs.lapHistory.push({
                    lap: currentLap,
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

        const userRider = rs.leaderboard.find(r => r.isUser);
        const userPos = rs.leaderboard.findIndex(r => r.isUser) + 1;
        const winner = rs.leaderboard[0];

        if (userRider && userRider.dnf) {
            gameState.addLog(`💥 SPRINT RESULT: ${state.rider.name} suffered a DNF in the Sprint Race.`);
        } else {
            const sprintPts = userPos <= 9 ? sprintPointsTable[userPos - 1] : 0;
            const prizeMoney = userPos === 1 ? 800 : (userPos <= 3 ? 450 : (userPos <= 9 ? 200 : 50));
            const hypeEarned = userPos === 1 ? 12 : (userPos <= 3 ? 8 : 4);

            state.cash += prizeMoney;
            state.hype += hypeEarned;
            rs.seasonPoints += sprintPts;

            gameState.addLog(`⚡ SPRINT FINISH: ${winner.name} wins the Saturday Sprint! ${state.rider.name} crossed the line P${userPos} (+${sprintPts} Sprint PTS, +$${prizeMoney}, +${hypeEarned} Hype)!`);
        }

        gameState.addLog(`🏁 Saturday Sprint Complete! Prepare your machine for the Sunday Main Grand Prix.`);
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

        const userRider = rs.leaderboard.find(r => r.isUser);
        const userPos = rs.leaderboard.findIndex(r => r.isUser) + 1;

        if (userRider && userRider.dnf) {
            gameState.addLog(`💥 RACE RESULT: ${state.rider.name} suffered a DNF crash and scored 0 points.`);
        } else {
            let prizeMoney = 150;
            let pointsEarned = userPos <= 15 ? pointsTable[userPos - 1] : 0;
            let hypeEarned = 2;

            if (userPos === 1) {
                prizeMoney = 1800;
                hypeEarned = 30;
            } else if (userPos <= 3) {
                prizeMoney = 1000;
                hypeEarned = 18;
            } else if (userPos <= 10) {
                prizeMoney = 500;
                hypeEarned = 10;
            }

            if (rs.fastestLap && rs.fastestLap.riderName === state.rider.name && userPos <= 10) {
                pointsEarned += 1;
                prizeMoney += 250;
            }

            if (state.heritagePerks.includes('heritage_paddock_brand')) {
                prizeMoney *= 2;
            }

            state.cash += prizeMoney;
            state.hype += hypeEarned;
            rs.seasonPoints += pointsEarned;

            gameState.addLog(`🏆 GRAND PRIX COMPLETE! ${state.rider.name} finished P${userPos}! Prize: +$${prizeMoney}, +${pointsEarned} PTS, +${hypeEarned} Hype.`);

            if (Math.random() < 0.10) {
                const injuries = [
                    { name: "Arm Pump Strain", penalty: 8, racesRemaining: 2 },
                    { name: "Shoulder Contusion", penalty: 12, racesRemaining: 2 },
                    { name: "Wrist Sprain", penalty: 10, racesRemaining: 1 }
                ];
                const inj = injuries[Math.floor(Math.random() * injuries.length)];
                state.rider.injury = inj;
                gameState.addLog(`🩺 MEDICAL CENTER: ${state.rider.name} sustained ${inj.name} (-${inj.penalty} skill penalty for ${inj.racesRemaining} races)! Hire Physio Trainer to heal.`);
            } else if (state.rider.injury) {
                state.rider.injury.racesRemaining -= 1;
                if (state.rider.injury.racesRemaining <= 0) {
                    gameState.addLog(`💪 MEDICAL CLEARANCE: ${state.rider.name} has fully recovered from ${state.rider.injury.name}!`);
                    state.rider.injury = null;
                }
            }
        }

        rs.currentGPIndex += 1;
        if (rs.currentGPIndex % GP_CALENDAR.length === 0) {
            state.season += 1;
            const champ = rs.championshipStandings[0];
            gameState.addLog(`🏆 WORLD CHAMPIONSHIP FINALE! ${champ.name} (${champ.team}) is crowned Season ${state.season - 1} World Champion with ${champ.points} PTS!`);

            this.checkTierPromotion();

            rs.championshipStandings.forEach(s => {
                s.points = 0;
                s.wins = 0;
                s.sprintWins = 0;
                s.podiums = 0;
                s.fastestLaps = 0;
            });
        }
    }

    static checkTierPromotion() {
        const state = gameState.getState();
        if (state.tier === 1 && state.bike.powerHP >= 70 && state.hype >= 25) {
            state.tier = 2;
            state.tierName = "Tier 2: Moto3 World Championship";
            state.bike.modelName = "KTM / Honda Moto3 Factory Spec";
            gameState.addLog(`🌟 PROMOTED TO TIER 2: Moto3 World Championship! Unlocked Wind Tunnels & CNC Machining!`);
        } else if (state.tier === 2 && state.bike.powerHP >= 95 && state.hype >= 65) {
            state.tier = 3;
            state.tierName = "Tier 3: Moto2 World Championship";
            state.bike.modelName = "Kalex Triumph 765cc Prototype";
            gameState.addLog(`🌟 PROMOTED TO TIER 3: Moto2 World Championship! Unlocked VIP Hospitality & Cloud Telemetry!`);
        } else if (state.tier === 3 && state.bike.powerHP >= 150 && state.hype >= 150) {
            state.tier = 4;
            state.tierName = "Tier 4: Premier Class MotoGP™ World Championship";
            state.bike.modelName = "1000cc V4 Factory Prototype";
            gameState.addLog(`👑 PROMOTED TO TIER 4: Premier Class MotoGP™! You are competing at the pinnacle of motorcycle racing!`);
        }
    }
}
