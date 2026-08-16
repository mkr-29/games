// RaceSystem.js - Official 2026 Grand Prix Calendar, Moto3/Moto2/MotoGP Grid & Dynamic Physics Engine

import { gameState } from '../engine/GameState.js';
import { BikeSystem } from './BikeSystem.js';

// Official 2026 FIM MotoGP™ World Championship Calendar (21 Rounds)
// baseSec is benchmark MotoGP dry flying lap time in seconds
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

// Tire Compound Specs & Characteristics
export const TIRE_COMPOUNDS = {
    soft: {
        id: 'soft',
        name: 'Soft Compound',
        shortName: 'SOFT',
        badge: 'S',
        color: '#ff334b',
        paceDelta: -0.35, // 0.35s faster initially
        wearRate: 7.5,
        cliffWear: 28
    },
    medium: {
        id: 'medium',
        name: 'Medium Compound',
        shortName: 'MED',
        badge: 'M',
        color: '#ffb700',
        paceDelta: 0.00, // baseline
        wearRate: 4.5,
        cliffWear: 22
    },
    hard: {
        id: 'hard',
        name: 'Hard Compound',
        shortName: 'HARD',
        badge: 'H',
        color: '#e0e0e0',
        paceDelta: 0.28, // 0.28s slower initially, but resilient
        wearRate: 2.6,
        cliffWear: 18
    },
    wet: {
        id: 'wet',
        name: 'Michelin Wet Rain',
        shortName: 'WET',
        badge: 'W',
        color: '#00d2ff',
        paceDelta: 4.20, // Rain baseline pace
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
        if (tier === 1 || tier === 2) return 1.080; // Moto3 ~7-8s slower than MotoGP
        if (tier === 3) return 1.035; // Moto2 ~3-4s slower than MotoGP
        return 1.000; // MotoGP Premier Class
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
                podiums: 0,
                fastestLaps: 0
            }));

            standings.push({
                name: state.rider.name,
                team: "Your Team",
                isUser: true,
                points: 0,
                wins: 0,
                podiums: 0,
                fastestLaps: 0
            });

            rs.championshipStandings = standings;
            rs.championshipTier = state.tier;
        }
    }

    static runFreePractice() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.stage !== 'FP') return false;

        this.initChampionshipStandings();

        const bikeStats = BikeSystem.getBikeStats();
        const gp = this.getCurrentGP();

        const setupMatch = Math.min(99, 72 + Math.floor(bikeStats.overallRating * 0.35) + Math.floor(Math.random() * 8));
        rs.setupMatch = setupMatch;

        state.telemetry = Math.min(state.telemetryMax, state.telemetry + 35);
        state.science = Math.min(state.scienceMax, state.science + 12);

        rs.fpCompleted = true;
        rs.stage = 'QP';

        gameState.addLog(`🏁 Free Practice 1 Complete at ${gp.title}! Setup Dialed In: ${setupMatch}%. Telemetry +35, RP +12.`);
        return true;
    }

    static getAISkillRange(tier) {
        if (tier === 1) return { min: 42, max: 62 };
        if (tier === 2) return { min: 58, max: 74 };
        if (tier === 3) return { min: 72, max: 86 };
        return { min: 86, max: 98 };
    }

    static runQualifying() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.stage !== 'QP') return false;

        this.initChampionshipStandings();

        const bikeStats = BikeSystem.getBikeStats();
        let riderSkill = state.rider.overallSkill;

        if (state.rider.injury) {
            riderSkill = Math.max(20, riderSkill - state.rider.injury.penalty);
        }

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

        // Simulate 3 hot laps for each rider to find their optimal pole lap
        const calculateHotLap = (score, consistency = 75) => {
            const paceOffset = (92 - score) * (baseTrackSec * 0.0018);
            let bestLap = 999;
            let bestSectors = [];

            for (let lap = 1; lap <= 3; lap++) {
                const variance = ((Math.random() - 0.5) * 2) * ((105 - consistency) * 0.006);
                const lapSec = baseTrackSec + paceOffset + variance;
                if (lapSec < bestLap) {
                    bestLap = lapSec;
                    // Sector splits
                    const s1 = bestLap * gp.sectorRatios[0] + (Math.random() * 0.1 - 0.05);
                    const s2 = bestLap * gp.sectorRatios[1] + (Math.random() * 0.1 - 0.05);
                    const s3 = bestLap * gp.sectorRatios[2] + (Math.random() * 0.1 - 0.05);
                    const s4 = bestLap - (s1 + s2 + s3);
                    bestSectors = [s1, s2, s3, s4];
                }
            }
            return { bestLap, bestSectors };
        };

        const grid = tierRiders.map((ai, idx) => {
            const rangeSpan = aiRange.max - aiRange.min;
            const rankRatio = (tierRiders.length - idx) / tierRiders.length;
            const aiScore = aiRange.min + (rankRatio * rangeSpan) + (Math.random() * 3 - 1.5);
            const aiConsistency = 70 + Math.floor(rankRatio * 20);
            const { bestLap, bestSectors } = calculateHotLap(aiScore, aiConsistency);

            return {
                name: ai.name,
                team: ai.team,
                isUser: false,
                score: aiScore,
                consistency: aiConsistency,
                qualifyingLapSec: bestLap,
                qualifyingSectors: bestSectors,
                dnf: false
            };
        });

        const userConsistency = state.rider.consistency || 65;
        const { bestLap: userBestLap, bestSectors: userBestSectors } = calculateHotLap(userScore, userConsistency);

        grid.push({
            name: state.rider.name,
            team: "Your Team",
            isUser: true,
            score: userScore,
            consistency: userConsistency,
            qualifyingLapSec: userBestLap,
            qualifyingSectors: userBestSectors,
            dnf: false
        });

        // Sort grid by fastest qualifying lap time
        grid.sort((a, b) => a.qualifyingLapSec - b.qualifyingLapSec);

        const poleTime = grid[0].qualifyingLapSec;
        grid.forEach((r, idx) => {
            r.gridPosition = idx + 1;
            r.gapSeconds = idx === 0 ? 0 : r.qualifyingLapSec - poleTime;
            r.lapTimeStr = this.formatLapTime(r.qualifyingLapSec);
            r.bestLapSec = r.qualifyingLapSec;
            r.bestLapStr = r.lapTimeStr;
            r.lastLapSec = r.qualifyingLapSec;
            r.lastLapStr = r.lapTimeStr;
            r.lastSectors = r.qualifyingSectors;
            r.lastSectorColors = ['yellow', 'yellow', 'yellow', 'yellow'];
            r.personalBestSectors = [...r.qualifyingSectors];
            r.accumulatedRaceTime = 0;
            r.tireCondition = 100;
        });

        const userPos = grid.findIndex(r => r.isUser) + 1;
        rs.qpGridPosition = userPos;
        rs.stage = 'RACE';
        rs.leaderboard = grid;

        gameState.addLog(`⏱️ Qualifying Shootout complete! ${state.rider.name} locked in P${userPos} on the grid! (Pole time: ${this.formatLapTime(poleTime)}, Gap: +${(userBestLap - poleTime).toFixed(3)}s)`);
        return true;
    }

    static setTireCompound(compoundId) {
        const state = gameState.getState();
        if (!TIRE_COMPOUNDS[compoundId]) return;
        state.raceState.tireCompound = compoundId;
        state.raceState.tireType = compoundId === 'wet' ? 'wet' : 'slicks';
        gameState.addLog(`🛞 Tire compound selected: ${TIRE_COMPOUNDS[compoundId].name} (${TIRE_COMPOUNDS[compoundId].badge})`);
    }

    static startGrandPrixRace() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.stage !== 'RACE' || rs.raceInProgress) return false;

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

        // Ensure proper tire choice for weather
        if (rs.weather === 'wet' && rs.tireCompound !== 'wet') {
            rs.tireCompound = 'wet';
            rs.tireType = 'wet';
        } else if (rs.weather === 'dry' && rs.tireCompound === 'wet') {
            rs.tireCompound = 'medium';
            rs.tireType = 'slicks';
        }

        const gp = this.getCurrentGP();
        rs.totalLaps = gp.laps;

        if (rs.leaderboard && rs.leaderboard.length > 0) {
            const dryCompounds = ['medium', 'medium', 'soft', 'hard'];
            rs.leaderboard.forEach((r, idx) => {
                r.dnf = false;
                r.accumulatedRaceTime = 0;
                r.lastLapSec = 0;
                r.lastLapStr = '--:--.---';
                r.bestLapSec = 999;
                r.bestLapStr = '--:--.---';
                r.lastSectors = [0, 0, 0, 0];
                r.lastSectorColors = ['yellow', 'yellow', 'yellow', 'yellow'];
                r.personalBestSectors = [999, 999, 999, 999];
                r.tireCondition = 100;

                // AI Compound selection
                if (!r.isUser) {
                    if (rs.weather === 'wet') {
                        r.tireCompound = 'wet';
                    } else {
                        r.tireCompound = dryCompounds[Math.floor(Math.random() * dryCompounds.length)];
                    }
                } else {
                    r.tireCompound = rs.tireCompound;
                }

                // Grid start gap staggered
                r.gapSeconds = idx === 0 ? 0 : idx * 0.05;
            });
        }

        gameState.addLog(`🚀 LIGHTS OUT AND AWAY WE GO! Grand Prix Race underway at ${gp.title} (${rs.weather.toUpperCase()} track, ${rs.trackTempC}°C)!`);
        return true;
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
                userRider.accumulatedRaceTime += 18.5; // Pit lane transit time
            }
            gameState.addLog(`🛠️ BOX BOX! Switched to WET Michelin tires (+18.5s pit lane transit). Full rain grip restored!`);
        } else if (choiceAction === 'stay_slicks') {
            gameState.addLog(`⚠️ PIT WALL: Staying on slick tires on a wet track! Extreme slide and crash risk!`);
        } else if (choiceAction === 'eco_map') {
            rs.strategy = 'conserve';
            gameState.addLog(`🔧 Switched ECU to Eco Map (PWR 3). Engine coolant temperature stabilized.`);
        } else if (choiceAction === 'risk_push') {
            gameState.addLog(`🔥 PUSHING POWER MAP: Maintaining full power. High risk of engine failure!`);
        }

        rs.activeIncident = null;
    }

    static tick(delta) {
        const state = gameState.getState();
        const rs = state.raceState;

        if (!rs.raceInProgress) return;

        // Base visual progress speed across the lap bar
        let lapProgressRate = 18.0; // ~5.5s per simulated lap
        if (rs.strategy === 'push') lapProgressRate *= 1.12;
        if (rs.strategy === 'conserve') lapProgressRate *= 0.90;

        if (rs.weather === 'wet' && rs.tireType === 'slicks') {
            lapProgressRate *= 0.65;
        }

        const prevProgress = rs.trackProgress;
        rs.trackProgress += lapProgressRate * delta;

        // Check if full lap completed
        if (rs.trackProgress >= 100) {
            rs.trackProgress = 0;
            this.simulateCompletedLap();

            rs.currentLap += 1;
            if (rs.currentLap > rs.totalLaps) {
                this.finishRace();
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

        const bikeStats = BikeSystem.getBikeStats();
        let userSkill = state.rider.overallSkill;
        if (state.rider.injury) {
            userSkill = Math.max(20, userSkill - state.rider.injury.penalty);
        }

        // Track evolution: rubber builds up (-0.15s to -0.30s by mid-race)
        const trackEvolution = -Math.min(0.25, (currentLap / totalLaps) * 0.25);

        // Fuel burn: starts at +0.75s heavy, sheds ~0.06s per lap
        const fuelWeightDelta = ((totalLaps - currentLap + 1) / totalLaps) * 0.75;

        // Lap-by-lap simulation for each active rider
        rs.leaderboard.forEach(r => {
            if (r.dnf) return;

            // 1. Performance Base
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

            // 2. Base Pace from performance score
            const paceOffset = (92 - riderScore) * (baseBenchmarkSec * 0.0016);
            let lapPace = baseBenchmarkSec + paceOffset + trackEvolution + fuelWeightDelta;

            // 3. Lap 1 Standing Start & T1 Congestion
            if (currentLap === 1) {
                const gridRank = r.gridPosition || 10;
                const launchSkill = r.isUser ? (state.rider.braking || 60) : 75;
                const startPenalty = 3.2 + (gridRank * 0.07) - ((launchSkill - 50) * 0.015);
                lapPace += startPenalty;
            }

            // 4. Tire Degradation Curve
            let wearMult = 1.0;
            if (strategy === 'push') wearMult = 1.75;
            if (strategy === 'conserve') wearMult = 0.55;

            // Decrement tire condition
            const lapWear = (compoundDef.wearRate * wearMult) * (12 / totalLaps);
            r.tireCondition = Math.max(0, (r.tireCondition || 100) - lapWear);
            if (r.isUser) rs.tireCondition = r.tireCondition;

            // Tire wear pace penalty (non-linear drop)
            let tirePaceLoss = 0;
            if (r.tireCondition < 75 && r.tireCondition >= 45) {
                tirePaceLoss = ((75 - r.tireCondition) / 30) * 0.35;
            } else if (r.tireCondition < 45 && r.tireCondition >= compoundDef.cliffWear) {
                tirePaceLoss = 0.35 + (((45 - r.tireCondition) / (45 - compoundDef.cliffWear)) * 0.65);
            } else if (r.tireCondition < compoundDef.cliffWear) {
                // The cliff: severe degradation
                const cliffDepth = (compoundDef.cliffWear - r.tireCondition) / compoundDef.cliffWear;
                tirePaceLoss = 1.00 + (Math.pow(cliffDepth, 1.8) * 2.2);
            }

            lapPace += (compoundDef.paceDelta + tirePaceLoss);

            // 5. Engine Map / Push Strategy
            if (strategy === 'push') lapPace -= 0.52;
            if (strategy === 'conserve') lapPace += 0.44;

            // 6. Weather Penalty
            if (rs.weather === 'wet') {
                if (compoundKey !== 'wet') {
                    // Slicks on wet track: disastrous loss
                    lapPace += 8.5 + (Math.random() * 4.0);
                    if (Math.random() < 0.25) {
                        r.dnf = true;
                        r.dnfReason = 'Lowside crash in wet on slick tires';
                        gameState.addLog(`💥 CRASH! ${r.name} (${r.team}) suffered a violent highside in the rain on slick tires! DNF on Lap ${currentLap}.`);
                        return;
                    }
                }
            } else {
                if (compoundKey === 'wet') {
                    // Wet tires on dry track: severe overheating
                    lapPace += 4.5;
                    r.tireCondition = Math.max(0, r.tireCondition - 15);
                }
            }

            // 7. Rider Consistency & Gaussian Lap Variance
            const varianceAmp = ((105 - consistency) / 100) * 0.35;
            const lapJitter = (Math.random() - 0.5) * 2 * varianceAmp;
            lapPace += lapJitter;

            // 8. Micro-mistakes & Near-Misses
            let eventNote = '';
            const mistakeRoll = Math.random();
            if (strategy === 'push' && mistakeRoll < 0.08) {
                const mistakeLostSec = 0.35 + (Math.random() * 0.45);
                lapPace += mistakeLostSec;
                eventNote = `Wide at Turn 4 (+${mistakeLostSec.toFixed(2)}s)`;
                if (r.isUser) {
                    gameState.addLog(`⚠️ MOMENT! ${r.name} missed the apex and ran wide on Lap ${currentLap} (+${mistakeLostSec.toFixed(2)}s)!`);
                }
            } else if (r.tireCondition < 20 && mistakeRoll < 0.12) {
                const slideLostSec = 0.60 + (Math.random() * 0.60);
                lapPace += slideLostSec;
                eventNote = `Massive rear slide (+${slideLostSec.toFixed(2)}s)`;
                if (r.isUser) {
                    gameState.addLog(`⚠️ TIRE WARNING! ${r.name} had a rear tire blowout slide (+${slideLostSec.toFixed(2)}s loss)!`);
                }
            }

            // 9. Calculate Sector Splits
            const s1 = (lapPace * gp.sectorRatios[0]) + (Math.random() * 0.08 - 0.04);
            const s2 = (lapPace * gp.sectorRatios[1]) + (Math.random() * 0.08 - 0.04);
            const s3 = (lapPace * gp.sectorRatios[2]) + (Math.random() * 0.08 - 0.04);
            const s4 = lapPace - (s1 + s2 + s3);
            const sectors = [s1, s2, s3, s4];

            // 10. Sector Colors (Purple = Session Fastest, Green = Personal Best, Yellow = Standard)
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

            // 11. Check Personal Best & Race Fastest Lap
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
                gameState.addLog(`🟣 NEW FASTEST LAP! ${r.name} clocked a blistering ${r.lastLapStr} on Lap ${currentLap}!`);
            }

            // 12. Accumulate Race Time
            r.accumulatedRaceTime += lapPace;

            // 13. Record Telemetry History for User
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

        // Sort Leaderboard by Accumulated Race Time
        rs.leaderboard.sort((a, b) => {
            if (a.dnf && !b.dnf) return 1;
            if (!a.dnf && b.dnf) return -1;
            return a.accumulatedRaceTime - b.accumulatedRaceTime;
        });

        // Compute Gaps & Intervals
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

    static processMidRaceIncidents() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.activeIncident) return;

        const rand = Math.random();

        // Sudden Rain Incident (Flag-to-Flag Decision)
        if (rs.weather === 'dry' && rs.currentLap >= 4 && rs.currentLap <= 7 && rand < 0.15) {
            rs.weather = 'wet';
            rs.activeIncident = {
                id: 'weather_rain',
                title: '🌧️ SUDDEN RAIN SHOWER!',
                desc: 'Rain is pouring over the asphalt! Track is wet. Do you want to pit for wet tires or gamble on slicks?',
                choices: [
                    { label: '🛞 Pit for Wet Michelin Tires (Flag-to-Flag)', action: 'pit_wet' },
                    { label: '⚠️ Stay on Slicks (Gamble in the Wet)', action: 'stay_slicks' }
                ]
            };
            gameState.addLog(`🌧️ WEATHER ALERT: Sudden rain shower on Lap ${rs.currentLap}! Pit Wall prompt active.`);
            return;
        }

        // Random AI crash
        if (rand < 0.12) {
            const activeAI = rs.leaderboard.filter(r => !r.isUser && !r.dnf);
            if (activeAI.length > 0) {
                const victim = activeAI[Math.floor(Math.random() * activeAI.length)];
                victim.dnf = true;
                victim.dnfReason = 'Gravel trap lowside';
                victim.accumulatedRaceTime = 99999;
                gameState.addLog(`💥 CRASH! ${victim.name} (${victim.team}) lost the front into the gravel! DNF on Lap ${rs.currentLap}.`);
            }
        }

        // Engine Temp Spikes in Push Mode
        if (rs.strategy === 'push' && rand > 0.85) {
            rs.activeIncident = {
                id: 'engine_temp',
                title: '⚠️ HIGH ENGINE COOLANT TEMP!',
                desc: 'Engine coolant temp is spiking in Power 1 Map! Switch to Tire Saver/Eco to save the engine?',
                choices: [
                    { label: '🔧 Switch to Eco Map (Save Engine)', action: 'eco_map' },
                    { label: '🔥 Keep Pushing (Risk Engine Blowout)', action: 'risk_push' }
                ]
            };
            gameState.addLog(`⚠️ PIT WALL WARNING: Engine temp alarm on Lap ${rs.currentLap}!`);
        }
    }

    static finishRace() {
        const state = gameState.getState();
        const rs = state.raceState;

        rs.raceInProgress = false;
        rs.stage = 'FP';
        rs.fpCompleted = false;
        rs.activeIncident = null;

        this.initChampionshipStandings();

        const pointsTable = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

        // Award standard points
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

        // Award +1 point for Fastest Lap if finished in top 10
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

        // Sort Championship Standings
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

            // Fastest Lap bonus for user
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

            // Injury Check
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

        // Advance GP Calendar Index
        rs.currentGPIndex += 1;
        if (rs.currentGPIndex % GP_CALENDAR.length === 0) {
            state.season += 1;
            const champ = rs.championshipStandings[0];
            gameState.addLog(`🏆 WORLD CHAMPIONSHIP FINALE! ${champ.name} (${champ.team}) is crowned Season ${state.season - 1} World Champion with ${champ.points} PTS!`);

            this.checkTierPromotion();

            rs.championshipStandings.forEach(s => {
                s.points = 0;
                s.wins = 0;
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
