// LongRunSimSystem.js - 20-Lap Race Distance Simulation & Telemetry Engineering Engine

import { gameState } from '../engine/GameState.js';
import { CalendarSystem } from './CalendarSystem.js';
import { RaceSystem, TIRE_COMPOUNDS } from './RaceSystem.js';

export class LongRunSimSystem {
    static simState = {
        active: false,
        totalLaps: 20,
        currentLapIndex: 0,
        selectedCompound: 'medium', // 'soft', 'medium', 'hard'
        selectedMap: 'balanced', // 'push', 'balanced', 'conserve'
        isRunning: false,
        isCompleted: false,
        lapHistory: [],
        radioFeed: [],
        fastestLap: null,
        averageLapSec: 0,
        totalStintTimeSec: 0,
        totalWearPercent: 0,
        consistencyRating: 0,
        engineeringVerdict: null
    };

    static initSimulation() {
        this.simState = {
            active: true,
            totalLaps: 20,
            currentLapIndex: 0,
            selectedCompound: 'medium',
            selectedMap: 'balanced',
            isRunning: false,
            isCompleted: false,
            lapHistory: [],
            radioFeed: [
                { lap: 0, tag: 'RADIO', message: '📡 PIT WALL: Long-run telemetry logging initialized. Select compound and strategy to begin 20-lap stint.' }
            ],
            fastestLap: null,
            averageLapSec: 0,
            totalStintTimeSec: 0,
            totalWearPercent: 0,
            consistencyRating: 0,
            engineeringVerdict: null
        };
        return this.simState;
    }

    /**
     * Executes the 20-lap simulation calculation
     */
    static runFullSimulation(compound = 'medium', map = 'balanced') {
        const state = gameState.getState();
        const tier = state.tier || 1;
        const rider = state.rider;
        const bike = state.bike;

        this.simState.selectedCompound = compound;
        this.simState.selectedMap = map;
        this.simState.isRunning = true;
        this.simState.lapHistory = [];
        this.simState.radioFeed = [];

        // Base Sepang lap time
        const baseSec = 117.7 * RaceSystem.getTierSpeedMultiplier(tier);
        let tireLife = 100;
        let fuelKg = 16.0; // 16kg fuel for 20 laps

        // Wear rate & pace offsets by compound
        let wearRate = 4.2;
        let compPace = 0.0;
        let cliffWear = 22;

        if (compound === 'soft') {
            wearRate = 6.4;
            compPace = -0.55;
            cliffWear = 30;
        } else if (compound === 'hard') {
            wearRate = 2.5;
            compPace = +0.35;
            cliffWear = 16;
        }

        // Map modifier
        let mapPace = 0;
        let mapWearMult = 1.0;
        if (map === 'push') {
            mapPace = -0.30;
            mapWearMult = 1.25;
        } else if (map === 'conserve') {
            mapPace = +0.28;
            mapWearMult = 0.75;
        }

        // Rider & Bike modifier
        const riderSkill = rider.overallSkill || 60;
        const riderPace = (75 - riderSkill) * 0.035;
        const bikeBonus = -(bike.powerHP * 0.008 + bike.chassisGrip * 0.006);

        const history = [];
        let bestLap = null;
        let sumSec = 0;

        this.simState.radioFeed.push({
            lap: 1,
            tag: 'CHIEF MECHANIC',
            message: `🟢 Out of pit lane on ${compound.toUpperCase()} compound (${map.toUpperCase()} MAP). Stint timer started.`
        });

        for (let lap = 1; lap <= 20; lap++) {
            // Fuel effect: losing ~0.75kg per lap, giving -0.065s per lap faster bike
            fuelKg = Math.max(1.0, fuelKg - 0.75);
            const fuelPaceBonus = -((16.0 - fuelKg) * 0.065);

            // Tire wear effect
            tireLife = Math.max(0, tireLife - (wearRate * mapWearMult));
            let tireDropoff = 0;
            if (tireLife < cliffWear) {
                tireDropoff = (cliffWear - tireLife) * 0.085; // Steep cliff penalty
            } else if (tireLife < 60) {
                tireDropoff = (60 - tireLife) * 0.02; // Mild thermal degradation
            }

            // Lap 1 cold tire warm-up penalty
            const warmUpPenalty = lap === 1 ? 1.4 : (lap === 2 ? 0.35 : 0);

            const variance = (Math.random() - 0.5) * 0.28;
            const lapSec = +(baseSec + compPace + mapPace + riderPace + bikeBonus + fuelPaceBonus + tireDropoff + warmUpPenalty + variance).toFixed(3);

            const s1 = +(lapSec * 0.26 + (Math.random() - 0.5) * 0.08).toFixed(3);
            const s2 = +(lapSec * 0.25 + (Math.random() - 0.5) * 0.08).toFixed(3);
            const s3 = +(lapSec * 0.25 + (Math.random() - 0.5) * 0.08).toFixed(3);
            const s4 = +(lapSec - (s1 + s2 + s3)).toFixed(3);

            // Tire temperature simulation
            let tireTempC = Math.round(95 + (lap * 1.8) + (map === 'push' ? 12 : 0) - (tireLife < 30 ? 8 : 0));

            const record = {
                lap,
                lapSec,
                lapStr: RaceSystem.formatLapTime(lapSec),
                s1,
                s2,
                s3,
                s4,
                tireLife: Math.round(tireLife),
                tireTempC,
                fuelKg: +fuelKg.toFixed(1),
                isPersonalBest: false
            };

            if (!bestLap || lapSec < bestLap.lapSec) {
                bestLap = { ...record };
                record.isPersonalBest = true;
            }

            sumSec += lapSec;
            history.push(record);

            // Trigger mid-stint telemetry radio notes
            if (lap === 5) {
                this.simState.radioFeed.push({
                    lap: 5,
                    tag: 'DATA ANALYST',
                    message: `📊 Telemetry stable. Optimal thermal window reached (${tireTempC}°C). S2-S3 delta is +0.05s vs optimal.`
                });
            } else if (lap === 10) {
                this.simState.radioFeed.push({
                    lap: 10,
                    tag: 'RIDER',
                    message: `🎙️ "${rider.name}: Halfway through the run. Fuel burn is noticeable — front end turns in sharper on Turn 14."`
                });
            } else if (lap === 15) {
                if (tireLife < 35) {
                    this.simState.radioFeed.push({
                        lap: 15,
                        tag: 'PIT WALL ALERT',
                        message: `⚠️ HIGH DEGRADATION DETECTED: ${compound.toUpperCase()} tire life down to ${Math.round(tireLife)}%. Drop-off is +${tireDropoff.toFixed(2)}s/lap.`
                    });
                } else {
                    this.simState.radioFeed.push({
                        lap: 15,
                        tag: 'CHIEF ENGINEER',
                        message: `👍 Tire wear under control (${Math.round(tireLife)}% remaining). Consistency is strong.`
                    });
                }
            } else if (lap === 20) {
                this.simState.radioFeed.push({
                    lap: 20,
                    tag: 'RADIO',
                    message: `🏁 CHEQUERED FLAG! 20 Laps simulation complete. Telemetry download ready for race engineering review.`
                });
            }
        }

        const avgSec = +(sumSec / 20).toFixed(3);
        const totalWear = Math.round(100 - tireLife);

        // Compute consistency rating (std dev based)
        let varianceSum = 0;
        history.forEach(h => {
            varianceSum += Math.pow(h.lapSec - avgSec, 2);
        });
        const stdDev = Math.sqrt(varianceSum / 20);
        const consistencyScore = Math.max(70, Math.min(99, Math.round(100 - (stdDev * 12))));

        // Generate comprehensive engineering verdict
        const verdict = this.buildEngineeringVerdict(compound, map, avgSec, bestLap, totalWear, consistencyScore);

        this.simState.lapHistory = history;
        this.simState.fastestLap = bestLap;
        this.simState.averageLapSec = avgSec;
        this.simState.totalStintTimeSec = sumSec;
        this.simState.totalWearPercent = totalWear;
        this.simState.consistencyRating = consistencyScore;
        this.simState.engineeringVerdict = verdict;
        this.simState.isCompleted = true;
        this.simState.isRunning = false;

        return this.simState;
    }

    /**
     * Synthesizes Chief Race Engineer debrief and strategic recommendations
     */
    static buildEngineeringVerdict(compound, map, avgSec, bestLap, totalWear, consistency) {
        let recommendation = "";
        let analysis = "";

        if (compound === 'soft') {
            analysis = `The Soft compound offered exceptional outright pace in the opening 7 laps (Fastest Lap: ${bestLap.lapStr}), but suffered from extreme thermal degradation in the Malaysian heat, degrading by ${totalWear}% overall. Significant time loss (+1.5s/lap) was observed from Lap 13 onwards.`;
            recommendation = `Optimal for 10-12 Lap Saturday Sprint Races or Qualifying, but too fragile for a full 20-Lap Grand Prix feature distance without extreme tire management.`;
        } else if (compound === 'hard') {
            analysis = `The Hard compound took 2 laps to reach optimal working temperature, but demonstrated linear and ultra-durable wear (${totalWear}% total wear, ${100 - totalWear}% remaining life). Lap times remained remarkably stable with a consistency score of ${consistency}%.`;
            recommendation = `Highly recommended for hot track conditions (32°C+) where rear stability on exit is crucial. Allows full engine map (PWR 1 / Push) throughout the second half of the race.`;
        } else {
            analysis = `The Medium compound provided the most harmonious compromise between initial grip and race distance endurance. Average pace was ${RaceSystem.formatLapTime(avgSec)} with ${totalWear}% wear over 20 laps and strong mid-race stability.`;
            recommendation = `The benchmark race compound. Recommended baseline for the Sepang Grand Prix with a Balanced engine map.`;
        }

        return {
            compoundTested: compound.toUpperCase(),
            mapTested: map.toUpperCase(),
            bestLapTime: bestLap.lapStr,
            averagePace: RaceSystem.formatLapTime(avgSec),
            totalTireDegradation: `${totalWear}% (${100 - totalWear}% Life Remaining)`,
            consistencyIndex: `${consistency}% (Excellent)`,
            technicalAnalysis: analysis,
            raceStrategyRecommendation: recommendation
        };
    }

    /**
     * Applies simulation completion rewards and marks activity complete
     */
    static acceptEngineeringReport() {
        const state = gameState.getState();
        const cal = CalendarSystem.getCalendarState();

        cal.completedActivities['w1_long_run'] = 'completed';

        // Award rewards (+80 Telemetry, +40 RP, +15 Hype)
        state.telemetry = Math.min(state.telemetryMax, state.telemetry + 80);
        state.science = Math.min(state.scienceMax, state.science + 40);
        state.hype += 15;

        gameState.addLog(`📊 20-LAP RACE SIMULATION COMPLETED: Engineering telemetry debrief accepted. (+80 Telemetry, +40 RP, +15 Hype)`);
        return true;
    }
}
