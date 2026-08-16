// PreSeasonTestSystem.js - Official Sepang Pre-Season Test & Prototype Development Engine

import { gameState } from '../engine/GameState.js';
import { CalendarSystem } from './CalendarSystem.js';
import { RiderSystem } from './RiderSystem.js';
import { RaceSystem } from './RaceSystem.js';

export class PreSeasonTestSystem {
    static sessionState = {
        active: false,
        circuitId: 'sepang',
        circuitTitle: 'Sepang International Circuit',
        circuitLengthKm: 5.543,
        sessionTotalSeconds: 3600, // 60:00 minutes
        sessionTimeRemaining: 3600,
        selectedPrototypeId: 'spec_a', // 'spec_a' or 'spec_b'
        selectedCompound: 'medium', // 'soft', 'medium', 'hard'
        isStintRunning: false,
        stintLapsCompleted: 0,
        prototypes: {},
        testTelemetry: {
            spec_a: { laps: [], bestLap: null, bestSectors: [null, null, null, null], topSpeedKmh: 0, totalLaps: 0, riderNotes: [] },
            spec_b: { laps: [], bestLap: null, bestSectors: [null, null, null, null], topSpeedKmh: 0, totalLaps: 0, riderNotes: [] }
        },
        aiLeaderboard: [],
        sessionFastestLap: null,
        sessionFastestSectors: [null, null, null, null],
        confirmedSeasonSpec: null
    };

    /**
     * Initializes a fresh pre-season test session
     */
    static initSession() {
        const state = gameState.getState();
        const tier = state.tier || 1;
        const currentBike = state.bike;

        // Generate Prototype A & Prototype B based on current tier
        const prototypes = this.generatePrototypes(tier, currentBike);

        this.sessionState = {
            active: true,
            circuitId: 'sepang',
            circuitTitle: 'Sepang International Circuit (Malaysia)',
            circuitLengthKm: 5.543,
            sessionTotalSeconds: 3600,
            sessionTimeRemaining: 3600,
            selectedPrototypeId: 'spec_a',
            selectedCompound: 'medium',
            isStintRunning: false,
            stintLapsCompleted: 0,
            prototypes,
            testTelemetry: {
                spec_a: { laps: [], bestLap: null, bestSectors: [null, null, null, null], topSpeedKmh: 0, totalLaps: 0, riderNotes: [] },
                spec_b: { laps: [], bestLap: null, bestSectors: [null, null, null, null], topSpeedKmh: 0, totalLaps: 0, riderNotes: [] }
            },
            aiLeaderboard: this.initAICompetitors(tier),
            sessionFastestLap: null,
            sessionFastestSectors: [null, null, null, null],
            confirmedSeasonSpec: null
        };

        // Populate initial baseline AI test lap times so the timing tower looks alive right away
        this.simulateInitialAILaps();
        return this.sessionState;
    }

    /**
     * Generates Prototype A and Prototype B specs tailored to the current tier
     */
    static generatePrototypes(tier, currentBike) {
        if (tier === 1 || tier === 2) {
            // Moto3
            return {
                spec_a: {
                    id: 'spec_a',
                    name: '2026 Spec-A (Velocity & Aero Wing Evo)',
                    badge: 'AERO / SPEED',
                    tagColor: 'var(--accent-cyan)',
                    description: 'Engineered for straight-line velocity with high-lift aerodynamic winglets. Exceptional top speed down Sepang twin 900m straights, with slightly stiffer turn-in.',
                    powerHP: currentBike.powerHP + 6,
                    aeroDownforce: currentBike.aeroDownforce + 12,
                    chassisGrip: currentBike.chassisGrip + 2,
                    ecuIntelligence: currentBike.ecuIntelligence + 2,
                    reliability: 93,
                    handlingRating: 78,
                    accelRating: 88,
                    topSpeedKmh: Math.round(228 + (tier * 4)),
                    tyreWearIndex: 'Medium-High (1.15x)',
                    focusSector: 'Sector 1 & Sector 4 (Straights & High Speed)',
                    bonusesDesc: '+6 HP Engine Output • +12 Aero Downforce • +8 km/h Top Speed'
                },
                spec_b: {
                    id: 'spec_b',
                    name: '2026 Spec-B (Agile Mechanical Grip Chassis)',
                    badge: 'CHASSIS / GRIP',
                    tagColor: 'var(--accent-gold)',
                    description: 'Features a flexible composite swingarm and optimized weight distribution. Maximizes mid-corner lean angle and gentle tire wear in tropical heat.',
                    powerHP: currentBike.powerHP + 2,
                    aeroDownforce: currentBike.aeroDownforce + 4,
                    chassisGrip: currentBike.chassisGrip + 14,
                    ecuIntelligence: currentBike.ecuIntelligence + 6,
                    reliability: 98,
                    handlingRating: 92,
                    accelRating: 80,
                    topSpeedKmh: Math.round(221 + (tier * 4)),
                    tyreWearIndex: 'Low (0.85x)',
                    focusSector: 'Sector 2 & Sector 3 (Technical Sweepers & Hairpins)',
                    bonusesDesc: '+14 Chassis Grip • +6 ECU Intelligence • +5% Reliability • Low Tyre Degradation'
                }
            };
        } else if (tier === 3) {
            // Moto2
            return {
                spec_a: {
                    id: 'spec_a',
                    name: 'Triumph 765 EVO (Ram-Air Aero Spec)',
                    badge: 'AERO / SPEED',
                    tagColor: 'var(--accent-cyan)',
                    description: 'Focuses on maximum top speed and slipstream efficiency with aggressive fairing diffusers.',
                    powerHP: currentBike.powerHP + 12,
                    aeroDownforce: currentBike.aeroDownforce + 18,
                    chassisGrip: currentBike.chassisGrip + 6,
                    ecuIntelligence: currentBike.ecuIntelligence + 6,
                    reliability: 92,
                    handlingRating: 80,
                    accelRating: 90,
                    topSpeedKmh: 298,
                    tyreWearIndex: 'Medium-High (1.15x)',
                    focusSector: 'Sector 1 & Sector 4 (High Speed)',
                    bonusesDesc: '+12 HP • +18 Aero Downforce • +10 km/h Top Speed'
                },
                spec_b: {
                    id: 'spec_b',
                    name: 'Boscoscuro Precision Flex Chassis Spec',
                    badge: 'CHASSIS / GRIP',
                    tagColor: 'var(--accent-gold)',
                    description: 'Provides sublime front-end feedback and smooth tire preservation over race distance.',
                    powerHP: currentBike.powerHP + 5,
                    aeroDownforce: currentBike.aeroDownforce + 8,
                    chassisGrip: currentBike.chassisGrip + 22,
                    ecuIntelligence: currentBike.ecuIntelligence + 10,
                    reliability: 98,
                    handlingRating: 95,
                    accelRating: 82,
                    topSpeedKmh: 290,
                    tyreWearIndex: 'Low (0.85x)',
                    focusSector: 'Sector 2 & Sector 3 (Corner Speed)',
                    bonusesDesc: '+22 Chassis Grip • +10 ECU Intelligence • Superior Tire Life'
                }
            };
        } else {
            // MotoGP (Tier 4 & 5)
            return {
                spec_a: {
                    id: 'spec_a',
                    name: 'Desmo Ground-Effect Aero & Ride-Height Spec',
                    badge: 'AERO / SPEED',
                    tagColor: 'var(--accent-cyan)',
                    description: 'Maximum aerodynamic downforce with active ride-height launch devices and sheer 300+ HP acceleration.',
                    powerHP: currentBike.powerHP + 20,
                    aeroDownforce: currentBike.aeroDownforce + 25,
                    chassisGrip: currentBike.chassisGrip + 10,
                    ecuIntelligence: currentBike.ecuIntelligence + 10,
                    reliability: 91,
                    handlingRating: 84,
                    accelRating: 96,
                    topSpeedKmh: 352,
                    tyreWearIndex: 'High (1.20x)',
                    focusSector: 'Sector 1 & Sector 4',
                    bonusesDesc: '+20 HP • +25 Aero Downforce • +350 km/h Top Speed'
                },
                spec_b: {
                    id: 'spec_b',
                    name: 'Seamless Cornering Stability & Adaptive ECU Spec',
                    badge: 'CHASSIS / GRIP',
                    tagColor: 'var(--accent-gold)',
                    description: 'Incredible mechanical grip, refined electronic anti-wheelie/traction control, and gentle tire consumption.',
                    powerHP: currentBike.powerHP + 10,
                    aeroDownforce: currentBike.aeroDownforce + 12,
                    chassisGrip: currentBike.chassisGrip + 28,
                    ecuIntelligence: currentBike.ecuIntelligence + 20,
                    reliability: 97,
                    handlingRating: 96,
                    accelRating: 88,
                    topSpeedKmh: 342,
                    tyreWearIndex: 'Low (0.80x)',
                    focusSector: 'Sector 2 & Sector 3',
                    bonusesDesc: '+28 Chassis Grip • +20 ECU Intelligence • Low Tire Wear'
                }
            };
        }
    }

    /**
     * Initializes AI competitor roster for the test session
     */
    static initAICompetitors(tier) {
        const roster = RiderSystem.getActiveGridRoster(tier);
        return roster.map(r => ({
            id: r.id,
            name: r.name,
            team: r.team,
            speed: r.speed,
            racecraft: r.racecraft,
            consistency: r.consistency,
            bikeRating: r.bikeRating || 85,
            bestLapSec: null,
            bestLapStr: '--:--.---',
            sectors: [null, null, null, null],
            lapsCompleted: 0,
            topSpeedKmh: 0,
            gapSec: 0,
            isUser: false
        }));
    }

    /**
     * Generates initial baseline laps for AI competitors
     */
    static simulateInitialAILaps() {
        const state = gameState.getState();
        const baseSec = 117.7; // Sepang Base Lap Time (~1:57.700)
        const tierMultiplier = RaceSystem.getTierSpeedMultiplier(state.tier);
        const targetBase = baseSec * tierMultiplier;

        this.sessionState.aiLeaderboard.forEach(ai => {
            const lapsToRun = Math.floor(Math.random() * 4) + 3; // 3-6 laps
            let bestLap = 999;
            let bestSectors = [999, 999, 999, 999];

            const skillFactor = (ai.speed * 0.5 + ai.bikeRating * 0.5);
            const paceDelta = (85 - skillFactor) * 0.055;

            for (let i = 0; i < lapsToRun; i++) {
                const variance = (Math.random() - 0.5) * 0.8;
                const lap = targetBase + paceDelta + variance;
                if (lap < bestLap) {
                    bestLap = lap;
                    bestSectors = [
                        +(lap * 0.26 + (Math.random() - 0.5) * 0.2).toFixed(3),
                        +(lap * 0.25 + (Math.random() - 0.5) * 0.2).toFixed(3),
                        +(lap * 0.25 + (Math.random() - 0.5) * 0.2).toFixed(3),
                        +(lap * 0.24 + (Math.random() - 0.5) * 0.2).toFixed(3)
                    ];
                }
            }

            ai.bestLapSec = bestLap;
            ai.bestLapStr = RaceSystem.formatLapTime(bestLap);
            ai.sectors = bestSectors;
            ai.lapsCompleted = lapsToRun;
            ai.topSpeedKmh = Math.round(218 + (ai.speed * 0.12) + (Math.random() * 4));
        });

        this.recalculateLeaderboard();
    }

    /**
     * Executes a time-based testing stint on track for the active prototype
     * @param {number} durationMinutes - e.g. 5, 10, 15, or custom minutes
     */
    static runStint(durationMinutes = 10) {
        if (!this.sessionState.active) {
            this.initSession();
        }

        const stintDurationSec = Math.min(this.sessionState.sessionTimeRemaining, durationMinutes * 60);
        if (stintDurationSec <= 0) {
            gameState.addLog(`⏱️ Sepang Test Session Chequered Flag! Session time expired.`);
            return { success: false, reason: 'time_expired' };
        }

        const state = gameState.getState();
        const tier = state.tier || 1;
        const rider = state.rider;
        const proto = this.sessionState.prototypes[this.sessionState.selectedPrototypeId];
        const compound = this.sessionState.selectedCompound;

        // Base Sepang lap time ~117.7 seconds
        const baseSec = 117.7;
        const tierMultiplier = RaceSystem.getTierSpeedMultiplier(tier);
        const targetBase = baseSec * tierMultiplier;

        // Number of laps that fit in this stint duration
        const estimatedLapTime = targetBase;
        const totalLapsInStint = Math.max(1, Math.floor(stintDurationSec / estimatedLapTime));

        const stintLaps = [];
        const telem = this.sessionState.testTelemetry[this.sessionState.selectedPrototypeId];

        // Calculate performance offsets for prototype
        let specPaceOffset = 0;
        let s14Offset = 0; // Straight sectors
        let s23Offset = 0; // Corner sectors

        if (proto.id === 'spec_a') {
            specPaceOffset = -0.35 - (proto.powerHP * 0.015);
            s14Offset = -0.28; // Faster in straights
            s23Offset = +0.10; // Slightly more hesitant in tight turns
        } else {
            specPaceOffset = -0.25 - (proto.chassisGrip * 0.012);
            s14Offset = +0.12; // Slower in straights
            s23Offset = -0.32; // Significantly faster in technical sectors 2 & 3
        }

        // Tire compound pace & degradation offset
        let compoundPace = 0;
        let compoundWearPerLap = 4.5;
        if (compound === 'soft') {
            compoundPace = -0.45;
            compoundWearPerLap = 7.5;
        } else if (compound === 'hard') {
            compoundPace = +0.30;
            compoundWearPerLap = 2.8;
        }

        if (proto.id === 'spec_b') {
            compoundWearPerLap *= 0.85; // Low wear trait
        } else {
            compoundWearPerLap *= 1.15; // Higher wear trait
        }

        // Rider skill factor
        const riderSkillFactor = (rider.overallSkill || 60);
        const riderPace = (75 - riderSkillFactor) * 0.04;

        let currentTireLife = 100;

        for (let l = 1; l <= totalLapsInStint; l++) {
            currentTireLife = Math.max(0, currentTireLife - compoundWearPerLap);
            const tireDegradationPenalty = currentTireLife < 40 ? ((40 - currentTireLife) * 0.04) : 0;
            const variance = (Math.random() - 0.5) * 0.35;

            const lapTime = targetBase + specPaceOffset + compoundPace + riderPace + tireDegradationPenalty + variance;

            const s1 = +(lapTime * 0.26 + s14Offset + (Math.random() - 0.5) * 0.1).toFixed(3);
            const s2 = +(lapTime * 0.25 + s23Offset + (Math.random() - 0.5) * 0.1).toFixed(3);
            const s3 = +(lapTime * 0.25 + s23Offset + (Math.random() - 0.5) * 0.1).toFixed(3);
            const s4 = +(lapTime * 0.24 + s14Offset + (Math.random() - 0.5) * 0.1).toFixed(3);
            const actualLap = +(s1 + s2 + s3 + s4).toFixed(3);

            const lapRecord = {
                lapNumber: telem.totalLaps + l,
                specId: proto.id,
                compound,
                lapSec: actualLap,
                lapStr: RaceSystem.formatLapTime(actualLap),
                s1,
                s2,
                s3,
                s4,
                tireHealth: Math.round(currentTireLife),
                topSpeedKmh: proto.topSpeedKmh + Math.round((Math.random() - 0.5) * 3)
            };

            stintLaps.push(lapRecord);
            telem.laps.push(lapRecord);

            // Update best lap for this prototype
            if (!telem.bestLap || actualLap < telem.bestLap.lapSec) {
                telem.bestLap = lapRecord;
            }

            // Update best sectors for this prototype
            if (!telem.bestSectors[0] || s1 < telem.bestSectors[0]) telem.bestSectors[0] = s1;
            if (!telem.bestSectors[1] || s2 < telem.bestSectors[1]) telem.bestSectors[1] = s2;
            if (!telem.bestSectors[2] || s3 < telem.bestSectors[2]) telem.bestSectors[2] = s3;
            if (!telem.bestSectors[3] || s4 < telem.bestSectors[3]) telem.bestSectors[3] = s4;

            if (lapRecord.topSpeedKmh > telem.topSpeedKmh) {
                telem.topSpeedKmh = lapRecord.topSpeedKmh;
            }
        }

        telem.totalLaps += totalLapsInStint;
        this.sessionState.sessionTimeRemaining = Math.max(0, this.sessionState.sessionTimeRemaining - stintDurationSec);

        // Generate realistic rider feedback quote based on spec
        const feedbackQuote = this.generateRiderFeedback(proto.id, telem.bestLap, compound);
        telem.riderNotes.unshift({
            timestamp: this.formatSessionClock(this.sessionState.sessionTimeRemaining),
            stintDuration: `${durationMinutes} mins (${totalLapsInStint} laps)`,
            compound: compound.toUpperCase(),
            bestTime: telem.bestLap ? telem.bestLap.lapStr : '--',
            quote: feedbackQuote
        });

        // Also simulate simultaneous AI progression during this time window
        this.simulateAIProgression(totalLapsInStint);

        // Update overall Leaderboard
        this.recalculateLeaderboard();

        // Award instant telemetry data for running track laps
        const telemetryEarned = Math.round(totalLapsInStint * 6);
        const rpEarned = Math.round(totalLapsInStint * 2.5);
        state.telemetry = Math.min(state.telemetryMax, state.telemetry + telemetryEarned);
        state.science = Math.min(state.scienceMax, state.science + rpEarned);

        gameState.addLog(`⏱️ Sepang Test Stint (${durationMinutes}m): ${rider.name} ran ${totalLapsInStint} laps on ${proto.name}. Best Lap: ${telem.bestLap?.lapStr || '--'}. (+${telemetryEarned} Tel, +${rpEarned} RP)`);

        return {
            success: true,
            stintLaps,
            bestLap: telem.bestLap,
            timeRemaining: this.sessionState.sessionTimeRemaining
        };
    }

    /**
     * Generates immersive rider telemetry impressions
     */
    static generateRiderFeedback(specId, bestLap, compound) {
        const timeStr = bestLap ? bestLap.lapStr : '1:58.200';
        if (specId === 'spec_a') {
            const quotes = [
                `"The acceleration out of Turn 15 onto the main straight is unbelievable — we are gaining 2 tenths in top speed! But the bike feels a bit heavy changing direction through Turns 5-6."`,
                `"Top speed is definitely there (${bestLap?.topSpeedKmh || 228} km/h trap speed). In Sector 1 we are flying, but we need to watch rear tire spin on corner exit with the ${compound} tire."`,
                `"Aero stability at 200+ km/h is solid. Front downforce keeps the front wheel planted, but heavy trail braking into Turn 1 requires high rider effort."`
            ];
            return quotes[Math.floor(Math.random() * quotes.length)];
        } else {
            const quotes = [
                `"The front-end feel in Sector 2 and Sector 3 is incredible! I can carry so much lean angle through Turn 7-8 and the tire is barely degrading."`,
                `"Very forgiving chassis. Bike turns effortlessly into the Turn 9 hairpin. We give up 3-4 km/h on the back straight, but consistency is rock solid (${timeStr})."`,
                `"Tire temperature stayed perfectly stable across the entire run. If track temps hit 35°C in the afternoon, this chassis will be a huge advantage."`
            ];
            return quotes[Math.floor(Math.random() * quotes.length)];
        }
    }

    /**
     * Simulates AI competitors turning laps during the test session
     */
    static simulateAIProgression(lapsToAdd) {
        const state = gameState.getState();
        const baseSec = 117.7 * RaceSystem.getTierSpeedMultiplier(state.tier);

        this.sessionState.aiLeaderboard.forEach(ai => {
            const newLaps = Math.max(1, Math.floor(lapsToAdd * (0.8 + Math.random() * 0.4)));
            ai.lapsCompleted += newLaps;

            // Small chance for AI to improve their best lap
            const skillFactor = (ai.speed * 0.5 + ai.bikeRating * 0.5);
            const paceDelta = (85 - skillFactor) * 0.055;

            for (let i = 0; i < newLaps; i++) {
                if (Math.random() < 0.35) {
                    const variance = (Math.random() - 0.55) * 0.9;
                    const testLap = baseSec + paceDelta + variance;
                    if (!ai.bestLapSec || testLap < ai.bestLapSec) {
                        ai.bestLapSec = testLap;
                        ai.bestLapStr = RaceSystem.formatLapTime(testLap);
                        ai.sectors = [
                            +(testLap * 0.26 + (Math.random() - 0.5) * 0.15).toFixed(3),
                            +(testLap * 0.25 + (Math.random() - 0.5) * 0.15).toFixed(3),
                            +(testLap * 0.25 + (Math.random() - 0.5) * 0.15).toFixed(3),
                            +(testLap * 0.24 + (Math.random() - 0.5) * 0.15).toFixed(3)
                        ];
                    }
                }
            }
        });
    }

    /**
     * Recalculates and sorts the overall FIM timing tower
     */
    static recalculateLeaderboard() {
        const state = gameState.getState();
        const rider = state.rider;

        // Build entries list
        const entries = [...this.sessionState.aiLeaderboard];

        // Add Spec A user entry if it has laps
        const telemA = this.sessionState.testTelemetry.spec_a;
        if (telemA.bestLap) {
            entries.push({
                id: 'user_spec_a',
                name: `${rider.name} (Spec A)`,
                team: 'Your Team Machine',
                specId: 'spec_a',
                bestLapSec: telemA.bestLap.lapSec,
                bestLapStr: telemA.bestLap.lapStr,
                sectors: telemA.bestSectors,
                lapsCompleted: telemA.totalLaps,
                topSpeedKmh: telemA.topSpeedKmh,
                isUser: true,
                isSpecA: true
            });
        }

        // Add Spec B user entry if it has laps
        const telemB = this.sessionState.testTelemetry.spec_b;
        if (telemB.bestLap) {
            entries.push({
                id: 'user_spec_b',
                name: `${rider.name} (Spec B)`,
                team: 'Your Team Machine',
                specId: 'spec_b',
                bestLapSec: telemB.bestLap.lapSec,
                bestLapStr: telemB.bestLap.lapStr,
                sectors: telemB.bestSectors,
                lapsCompleted: telemB.totalLaps,
                topSpeedKmh: telemB.topSpeedKmh,
                isUser: true,
                isSpecB: true
            });
        }

        // Sort by best lap time ascending
        entries.sort((a, b) => {
            if (!a.bestLapSec) return 1;
            if (!b.bestLapSec) return -1;
            return a.bestLapSec - b.bestLapSec;
        });

        // Compute gaps & fastest sectors
        const p1Time = entries[0]?.bestLapSec || null;
        let s1Best = 999, s2Best = 999, s3Best = 999, s4Best = 999;

        entries.forEach((e, idx) => {
            e.position = idx + 1;
            if (p1Time && e.bestLapSec) {
                e.gapSec = +(e.bestLapSec - p1Time).toFixed(3);
                e.gapStr = idx === 0 ? 'LEADER' : `+${e.gapSec.toFixed(3)}s`;
            } else {
                e.gapStr = '--';
            }

            if (e.sectors[0] && e.sectors[0] < s1Best) s1Best = e.sectors[0];
            if (e.sectors[1] && e.sectors[1] < s2Best) s2Best = e.sectors[1];
            if (e.sectors[2] && e.sectors[2] < s3Best) s3Best = e.sectors[2];
            if (e.sectors[3] && e.sectors[3] < s4Best) s4Best = e.sectors[3];
        });

        this.sessionState.sessionFastestLap = entries[0] || null;
        this.sessionState.sessionFastestSectors = [s1Best < 900 ? s1Best : null, s2Best < 900 ? s2Best : null, s3Best < 900 ? s3Best : null, s4Best < 900 ? s4Best : null];
        this.sessionState.combinedLeaderboard = entries;
    }

    /**
     * Confirms the official season prototype selection and applies bonuses
     * @param {string} specId - 'spec_a' or 'spec_b'
     */
    static confirmSeasonPrototype(specId) {
        if (!this.sessionState.prototypes[specId]) return false;

        const chosenProto = this.sessionState.prototypes[specId];
        const state = gameState.getState();

        // Apply chosen prototype specs to main bike
        state.bike.modelName = chosenProto.name;
        state.bike.powerHP = chosenProto.powerHP;
        state.bike.aeroDownforce = chosenProto.aeroDownforce;
        state.bike.chassisGrip = chosenProto.chassisGrip;
        state.bike.ecuIntelligence = chosenProto.ecuIntelligence;
        state.bike.reliability = chosenProto.reliability;
        state.bike.seasonSpecChosen = specId;

        this.sessionState.confirmedSeasonSpec = specId;

        // Mark Sepang mandatory test activity completed
        const cal = CalendarSystem.getCalendarState();
        cal.completedActivities['w1_test_main'] = 'completed';

        // Award mandatory activity rewards (+120 Telemetry, +60 RP, +Season readiness)
        state.telemetry = Math.min(state.telemetryMax, state.telemetry + 120);
        state.science = Math.min(state.scienceMax, state.science + 60);
        state.hype += 20;

        gameState.addLog(`🏆 SEASON PROTOTYPE CONFIRMED: Selected "${chosenProto.name}"! Factory specification locked for the 2026 World Championship.`);
        return true;
    }

    static formatSessionClock(totalSeconds) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = Math.floor(totalSeconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
}
