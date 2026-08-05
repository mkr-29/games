// RaceSystem.js - Official 2026 Grand Prix Calendar, Moto3/Moto2/MotoGP Grid & Race Engine

import { gameState } from '../engine/GameState.js';
import { BikeSystem } from './BikeSystem.js';

// Official 2026 FIM MotoGP™ World Championship Calendar (21 Rounds)
export const GP_CALENDAR = [
    { id: 'qatar', title: "Qatar Grand Prix (Lusail)", flag: "🇶🇦", lengthKm: 5.380, type: "High Speed & Night Straight", favors: "hp", laps: 12 },
    { id: 'portugal', title: "Portuguese Grand Prix (Portimão)", flag: "🇵🇹", lengthKm: 4.592, type: "Elevation Rollercoaster", favors: "chassis", laps: 12 },
    { id: 'argentina', title: "Argentine Grand Prix (Termas de Río Hondo)", flag: "🇦🇷", lengthKm: 4.806, type: "Fast Flowing Sweepers", favors: "aero", laps: 12 },
    { id: 'americas', title: "Grand Prix of the Americas (COTA Austin)", flag: "🇺🇸", lengthKm: 5.513, type: "Technical & Heavy Bumps", favors: "chassis", laps: 12 },
    { id: 'jerez', title: "Gran Premio de España (Jerez)", flag: "🇪🇸", lengthKm: 4.423, type: "Hard Braking & Trail Entry", favors: "chassis", laps: 12 },
    { id: 'france', title: "French Grand Prix (Le Mans)", flag: "🇫🇷", lengthKm: 4.185, type: "Stop-and-Go & Sudden Rain", favors: "ecu", laps: 12 },
    { id: 'catalunya', title: "Gran Premio de Catalunya (Barcelona)", flag: "🇪🇸", lengthKm: 4.657, type: "High Tire Wear & Drag", favors: "aero", laps: 12 },
    { id: 'mugello', title: "Gran Premio d'Italia (Mugello)", flag: "🇮🇹", lengthKm: 5.245, type: "1.1km Main Straight Speed", favors: "hp", laps: 12 },
    { id: 'assen', title: "TT Assen (Cathedral of Speed)", flag: "🇳🇱", lengthKm: 4.542, type: "Fast Flowing Chicanes", favors: "aero", laps: 12 },
    { id: 'sachsenring', title: "German Grand Prix (Sachsenring)", flag: "🇩🇪", lengthKm: 3.671, type: "Tight Left-Hand Waterfall", favors: "chassis", laps: 12 },
    { id: 'silverstone', title: "British Grand Prix (Silverstone)", flag: "🇬🇧", lengthKm: 5.900, type: "Ultra High-Speed Sweeps", favors: "hp", laps: 12 },
    { id: 'spielberg', title: "Austrian Grand Prix (Red Bull Ring)", flag: "🇦🇹", lengthKm: 4.348, type: "Steep Uphill Acceleration", favors: "hp", laps: 12 },
    { id: 'balaton', title: "Hungarian Grand Prix (Balaton Park)", flag: "🇭🇺", lengthKm: 4.115, type: "Technical Chicane Rhythm", favors: "chassis", laps: 12 },
    { id: 'aragon', title: "Gran Premio de Aragón (MotorLand)", flag: "🇪🇸", lengthKm: 5.077, type: "Carbon Discs Heavy Braking", favors: "hp", laps: 12 },
    { id: 'misano', title: "San Marino Grand Prix (Misano)", flag: "🇮🇹", lengthKm: 4.226, type: "High Lean Cornering Speed", favors: "chassis", laps: 12 },
    { id: 'sokol', title: "Kazakhstan Grand Prix (Sokol Racetrack)", flag: "🇰🇿", lengthKm: 4.495, type: "Technical Rhythm & ECU", favors: "ecu", laps: 12 },
    { id: 'mandalika', title: "Indonesian Grand Prix (Mandalika)", flag: "🇮🇩", lengthKm: 4.313, type: "Fast Coastal Sweeps", favors: "aero", laps: 12 },
    { id: 'motegi', title: "Grand Prix of Japan (Motegi)", flag: "🇯🇵", lengthKm: 4.801, type: "Hard Braking & Acceleration", favors: "ecu", laps: 12 },
    { id: 'phillip_island', title: "Australian Grand Prix (Phillip Island)", flag: "🇦🇺", lengthKm: 4.448, type: "Ocean Sweeps & High Tire Wear", favors: "aero", laps: 12 },
    { id: 'sepang', title: "Malaysian Grand Prix (Sepang)", flag: "🇲🇾", lengthKm: 5.543, type: "High Heat & Sudden Monsoons", favors: "ecu", laps: 12 },
    { id: 'valencia', title: "Gran Premio de Valencia (Finale)", flag: "🇪🇸", lengthKm: 4.005, type: "Tight Stadium Arena Finale", favors: "chassis", laps: 12 }
];

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
        if (tier === 1) return MOTO3_2026_RIDERS;
        if (tier === 2) return MOTO2_2026_RIDERS;
        return MOTOGP_2026_RIDERS;
    }

    static initChampionshipStandings() {
        const state = gameState.getState();
        const rs = state.raceState;
        const tierRiders = this.getTierRiders(state.tier);

        // Check if standings need to be initialized or reset for a new tier
        if (!rs.championshipStandings || rs.championshipStandings.length === 0 || rs.championshipTier !== state.tier) {
            const standings = tierRiders.map(ai => ({
                name: ai.name,
                team: ai.team,
                isUser: false,
                points: 0,
                wins: 0,
                podiums: 0
            }));

            standings.push({
                name: state.rider.name,
                team: "Your Team",
                isUser: true,
                points: 0,
                wins: 0,
                podiums: 0
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

        const setupMatch = Math.min(98, 75 + Math.floor(bikeStats.overallRating * 0.35) + Math.floor(Math.random() * 6));
        rs.setupMatch = setupMatch;

        state.telemetry = Math.min(state.telemetryMax, state.telemetry + 35);
        state.science = Math.min(state.scienceMax, state.science + 10);

        rs.fpCompleted = true;
        rs.stage = 'QP';

        gameState.addLog(`🏁 Free Practice Complete at ${gp.title}! Setup Efficiency: ${setupMatch}%. Telemetry +35, RP +10.`);
        return true;
    }

    static getAISkillRange(tier) {
        if (tier === 1) return { min: 38, max: 54 };
        if (tier === 2) return { min: 55, max: 68 };
        if (tier === 3) return { min: 69, max: 82 };
        return { min: 83, max: 96 };
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

        let trackBonus = 0;
        if (gp.favors === 'hp') trackBonus = (bikeStats.hp - 55) * 0.35;
        if (gp.favors === 'aero') trackBonus = (bikeStats.aero - 10) * 0.7;
        if (gp.favors === 'chassis') trackBonus = (bikeStats.chassis - 15) * 0.7;
        if (gp.favors === 'ecu') trackBonus = (bikeStats.ecu - 5) * 1.0;

        const setupBonus = (rs.setupMatch || 75) * 0.1;

        const userPerformance = (bikeStats.overallRating * 0.5) + (riderSkill * 0.5) + trackBonus + setupBonus + (Math.random() * 3 - 1.5);

        const aiRange = this.getAISkillRange(state.tier);
        const tierRiders = this.getTierRiders(state.tier);

        const grid = tierRiders.map((ai, idx) => {
            const rangeSpan = aiRange.max - aiRange.min;
            const rankRatio = (tierRiders.length - idx) / tierRiders.length;
            const aiScore = aiRange.min + (rankRatio * rangeSpan) + (Math.random() * 4 - 2);
            return {
                name: ai.name,
                team: ai.team,
                isUser: false,
                dnf: false,
                score: aiScore
            };
        });

        grid.push({
            name: state.rider.name,
            team: "Your Team",
            isUser: true,
            dnf: false,
            score: userPerformance
        });

        grid.sort((a, b) => b.score - a.score);

        const topScore = grid[0].score;
        grid.forEach((r) => {
            const gapSec = (topScore - r.score) * 0.08;
            r.gapSeconds = gapSec;
            r.lapTimeStr = this.formatLapTime(gp.lengthKm, r.score);
        });

        const userPos = grid.findIndex(r => r.isUser) + 1;
        rs.qpGridPosition = userPos;
        rs.stage = 'RACE';
        rs.leaderboard = grid;

        gameState.addLog(`⏱️ Qualifying Finished! ${state.rider.name} qualified P${userPos} / ${grid.length}! (Score: ${userPerformance.toFixed(1)})`);
        return true;
    }

    static formatLapTime(trackLengthKm, score) {
        const baseSpeedKmh = 140 + (score * 0.95);
        const lapSec = (trackLengthKm / baseSpeedKmh) * 3600;
        const mins = Math.floor(lapSec / 60);
        const secs = (lapSec % 60).toFixed(3).padStart(6, '0');
        return `${mins}:${secs}`;
    }

    static startGrandPrixRace() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.stage !== 'RACE' || rs.raceInProgress) return false;

        rs.raceInProgress = true;
        rs.currentLap = 1;
        rs.trackProgress = 0;
        rs.weather = (Math.random() < 0.25) ? "wet" : "dry";
        rs.tireType = "slicks";
        rs.tireCondition = 100;
        rs.activeIncident = null;

        const gp = this.getCurrentGP();
        rs.totalLaps = gp.laps;

        if (rs.leaderboard && rs.leaderboard.length > 0) {
            rs.leaderboard.forEach((r, idx) => {
                r.dnf = false;
                const startGap = idx === 0 ? 0 : idx * 0.08;
                r.gapSeconds = startGap;
                r.accumulatedRaceTime = startGap;
            });
        }

        gameState.addLog(`🚀 LIGHTS OUT! Grand Prix Race underway at ${gp.title} (${rs.weather.toUpperCase()} track)!`);
        return true;
    }

    static setStrategy(strategy) {
        const state = gameState.getState();
        state.raceState.strategy = strategy;
        gameState.addLog(`🔧 Engine strategy map switched to: ${strategy.toUpperCase()}`);
    }

    static resolveIncidentChoice(choiceAction) {
        const state = gameState.getState();
        const rs = state.raceState;
        const inc = rs.activeIncident;

        if (!inc) return;

        if (choiceAction === 'pit_wet') {
            rs.tireType = 'wet';
            rs.trackProgress = Math.max(0, rs.trackProgress - 25);
            gameState.addLog(`🛠️ PIT STOP SUCCESS: Switched to WET Michelin tires! Traction restored.`);
        } else if (choiceAction === 'stay_slicks') {
            gameState.addLog(`⚠️ PIT WALL: Staying on slicks in wet conditions! High risk of sliding.`);
        } else if (choiceAction === 'eco_map') {
            rs.strategy = 'conserve';
            gameState.addLog(`🔧 Switched ECU to Eco Conserve map. Engine temperature stabilized.`);
        } else if (choiceAction === 'risk_push') {
            gameState.addLog(`🔥 Keeping Pushing Power Map! Engine temp high.`);
        }

        rs.activeIncident = null;
    }

    static tick(delta) {
        const state = gameState.getState();
        const rs = state.raceState;

        if (!rs.raceInProgress) return;

        let lapSpeed = 16.0;
        if (rs.strategy === 'push') lapSpeed *= 1.15;
        if (rs.strategy === 'conserve') lapSpeed *= 0.88;

        if (rs.weather === 'wet' && rs.tireType === 'slicks') {
            lapSpeed *= 0.6;
        }

        rs.trackProgress += lapSpeed * delta;

        if (rs.trackProgress >= 100) {
            rs.trackProgress = 0;
            rs.currentLap += 1;

            const wearRate = rs.strategy === 'push' ? 7 : (rs.strategy === 'conserve' ? 2 : 4);
            rs.tireCondition = Math.max(0, rs.tireCondition - wearRate);

            if (rs.currentLap > rs.totalLaps) {
                this.finishRace();
            } else {
                this.processMidRaceIncidents();
                this.updateLiveLeaderboard();
            }
        }
    }

    static processMidRaceIncidents() {
        const state = gameState.getState();
        const rs = state.raceState;
        if (rs.activeIncident) return;

        const rand = Math.random();

        if (rs.weather === 'dry' && rs.currentLap >= 4 && rs.currentLap <= 7 && rand < 0.15) {
            rs.weather = 'wet';
            rs.activeIncident = {
                id: 'weather_rain',
                title: '🌧️ SUDDEN RAIN SHOWER!',
                desc: 'Rain is falling over the paddock! Track is wet. Do you want to pit for wet tires?',
                choices: [
                    { label: '🛞 Pit for Wet Tires (Flag-to-Flag)', action: 'pit_wet' },
                    { label: '⚠️ Stay on Slicks (Risk Crashing)', action: 'stay_slicks' }
                ]
            };
            gameState.addLog(`🌧️ WEATHER ALERT: Sudden rain shower on lap ${rs.currentLap}! Pit Wall prompt active.`);
            return;
        }

        if (rand < 0.15) {
            const activeAI = rs.leaderboard.filter(r => !r.isUser && !r.dnf);
            if (activeAI.length > 0) {
                const victim = activeAI[Math.floor(Math.random() * activeAI.length)];
                victim.dnf = true;
                victim.accumulatedRaceTime = 99999;
                gameState.addLog(`💥 CRASH! ${victim.name} (${victim.team}) slid off into the gravel trap! DNF on Lap ${rs.currentLap}.`);
            }
        }

        if (rs.strategy === 'push' && rand > 0.85) {
            rs.activeIncident = {
                id: 'engine_temp',
                title: '⚠️ ENGINE TEMP WARNING!',
                desc: 'Engine coolant temp is spiking in Power 3 Map! Reduce power or risk engine failure?',
                choices: [
                    { label: '🔧 Switch to Eco Map (Save Engine)', action: 'eco_map' },
                    { label: '🔥 Keep Pushing (Risk DNF)', action: 'risk_push' }
                ]
            };
            gameState.addLog(`⚠️ PIT WALL: Engine temp warning on Lap ${rs.currentLap}!`);
            return;
        }

        if (rs.tireCondition < 20 && rand < 0.25) {
            const userRider = rs.leaderboard.find(r => r.isUser);
            if (userRider) {
                userRider.accumulatedRaceTime += 0.8;
                gameState.addLog(`⚠️ NEAR MISS! ${state.rider.name} suffered a massive rear tire slide due to worn rubber (+0.8s time loss)!`);
            }
        }
    }

    static updateLiveLeaderboard() {
        const state = gameState.getState();
        const rs = state.raceState;
        const gp = this.getCurrentGP();

        if (rs.leaderboard && rs.leaderboard.length > 0) {
            rs.leaderboard.forEach(r => {
                if (r.dnf) return;

                let lapPaceDelta = (100 - r.score) * 0.012;

                if (r.isUser) {
                    if (rs.strategy === 'push') lapPaceDelta -= 0.35;
                    if (rs.strategy === 'conserve') lapPaceDelta += 0.20;

                    if (rs.weather === 'wet' && rs.tireType === 'slicks') {
                        lapPaceDelta += 2.2;
                    }
                }

                if (rs.tireCondition < 40) {
                    lapPaceDelta += ((40 - rs.tireCondition) * 0.03);
                }

                lapPaceDelta += (Math.random() * 0.3 - 0.15);
                r.accumulatedRaceTime = (r.accumulatedRaceTime || 0) + lapPaceDelta;
            });

            rs.leaderboard.sort((a, b) => {
                if (a.dnf && !b.dnf) return 1;
                if (!a.dnf && b.dnf) return -1;
                return a.accumulatedRaceTime - b.accumulatedRaceTime;
            });

            const leaderTime = rs.leaderboard[0].accumulatedRaceTime;
            rs.leaderboard.forEach((r, idx) => {
                if (r.dnf) {
                    r.gapSeconds = 999;
                    r.lapTimeStr = 'DNF';
                } else {
                    const gapSec = idx === 0 ? 0 : Math.max(0.05, r.accumulatedRaceTime - leaderTime);
                    r.gapSeconds = gapSec;
                    r.lapTimeStr = this.formatLapTime(gp.lengthKm, r.score);
                }
            });
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

        rs.championshipStandings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.wins - a.wins;
        });

        const userRider = rs.leaderboard.find(r => r.isUser);
        const userPos = rs.leaderboard.findIndex(r => r.isUser) + 1;

        if (userRider && userRider.dnf) {
            gameState.addLog(`💥 DISASTER! ${state.rider.name} suffered a DNF crash and failed to finish.`);
        } else {
            let prizeMoney = 150;
            let pointsEarned = userPos <= 15 ? pointsTable[userPos - 1] : 0;
            let hypeEarned = 2;

            if (userPos === 1) {
                prizeMoney = 1500;
                hypeEarned = 25;
            } else if (userPos <= 3) {
                prizeMoney = 900;
                hypeEarned = 15;
            } else if (userPos <= 10) {
                prizeMoney = 450;
                hypeEarned = 8;
            }

            if (state.heritagePerks.includes('heritage_paddock_brand')) {
                prizeMoney *= 2;
            }

            state.cash += prizeMoney;
            state.hype += hypeEarned;
            rs.seasonPoints += pointsEarned;

            gameState.addLog(`🏆 RACE FINISH! ${state.rider.name} crossed the line P${userPos}! Prize: +$${prizeMoney}, +${pointsEarned} PTS, +${hypeEarned} Hype.`);

            if (Math.random() < 0.12) {
                const injuries = [
                    { name: "Arm Pump Strain", penalty: 8, racesRemaining: 2 },
                    { name: "Shoulder Contusion", penalty: 12, racesRemaining: 2 },
                    { name: "Wrist Sprain", penalty: 10, racesRemaining: 1 }
                ];
                const inj = injuries[Math.floor(Math.random() * injuries.length)];
                state.rider.injury = inj;
                gameState.addLog(`🩺 MEDICAL CENTER ALERT: ${state.rider.name} sustained ${inj.name} (-${inj.penalty} skill penalty for ${inj.racesRemaining} races)! Hire Physio Trainer to heal.`);
            } else if (state.rider.injury) {
                state.rider.injury.racesRemaining -= 1;
                if (state.rider.injury.racesRemaining <= 0) {
                    gameState.addLog(`💪 MEDICAL CLEARANCE: ${state.rider.name} has fully recovered from ${state.rider.injury.name}!`);
                    state.rider.injury = null;
                }
            }
        }

        // Advance Calendar Index across full 21-race season
        rs.currentGPIndex += 1;
        if (rs.currentGPIndex % GP_CALENDAR.length === 0) {
            state.season += 1;
            
            const champ = rs.championshipStandings[0];
            gameState.addLog(`🏆 SEASON COMPLETE! ${champ.name} (${champ.team}) is the Season ${state.season - 1} World Champion with ${champ.points} PTS!`);

            this.checkTierPromotion();

            rs.championshipStandings.forEach(s => {
                s.points = 0;
                s.wins = 0;
                s.podiums = 0;
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
