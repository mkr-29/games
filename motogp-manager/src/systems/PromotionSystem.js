// PromotionSystem.js - Official Grand Prix Category Promotion Ladder (Moto3 -> Moto2 -> MotoGP)

import { gameState } from '../engine/GameState.js';
import { RaceSystem } from './RaceSystem.js';

export const TIERS = {
    1: {
        id: 1,
        name: "Tier 1: Moto3™ World Championship",
        shortName: "Moto3™",
        category: "moto3",
        hasSprint: false,
        bikeModel: "KTM RC250GP / Honda NSF250RW Factory Spec",
        engineSpec: "250cc 4-Stroke Single-Cylinder (DOHC 4V, 81mm Max Bore)",
        revLimit: "13,500 RPM (Spec Dell'Orto Unified ECU)",
        powerOutput: "60–65 HP @ 13,000 RPM",
        topSpeedKmh: "245–250 km/h (Mugello Record: 248.8 km/h)",
        minWeightKg: "152 kg (Combined Bike + Rider minimum)",
        brakes: "Dual Steel Floating Discs (Carbon Brakes Strictly Banned)",
        aeroRules: "Regulated Fairing (Ground-effect aero diffusers & wings prohibited)",
        tires: "Pirelli Diablo Superbike Slick Spec",
        baseHP: 60,
        promotionCost: 0,
        requiredSeason: 1,
        requiredHype: 0,
        requiredHP: 0,
        gpWinPrize: 1800,
        gpPodiumPrize: 1000,
        gpTop10Prize: 500,
        sprintWinPrize: 800,
        sprintPodiumPrize: 400,
        sprintTop9Prize: 200,
        sponsorMulti: 1.0,
        description: "Official FIM lightweight entry class: 250cc single-cylinder 4-stroke prototypes, 13,500 RPM rev limit, steel brakes, and extreme slipstream racing (No Sprints)."
    },
    2: {
        id: 2,
        name: "Tier 2: Moto2™ World Championship",
        shortName: "Moto2™",
        category: "moto2",
        hasSprint: false,
        bikeModel: "Kalex / Boscoscuro Triumph 765cc Triple Prototype",
        engineSpec: "Spec Triumph 765cc Inline 3-Cylinder (DOHC 12V, ExternPro Sealed)",
        revLimit: "14,000 RPM (Spec Magneti Marelli ECU)",
        powerOutput: "140–145 HP @ 13,500 RPM",
        topSpeedKmh: "295–301 km/h (Mugello Record: 301.8 km/h)",
        minWeightKg: "217 kg (Combined Bike + Rider minimum)",
        brakes: "Dual Steel Floating Discs (Carbon Brakes Strictly Banned)",
        aeroRules: "Regulated Prototype Fairing (Wings & ground effect banned)",
        tires: "Pirelli Diablo Superbike Slick Spec",
        baseHP: 140,
        promotionCost: 25000, // $25,000 Capital required
        requiredSeason: 2,    // Available only after Season 1 is completed
        requiredHype: 40,
        requiredHP: 70,
        gpWinPrize: 6500,
        gpPodiumPrize: 3800,
        gpTop10Prize: 1800,
        sprintWinPrize: 2500,
        sprintPodiumPrize: 1500,
        sprintTop9Prize: 700,
        sponsorMulti: 3.5,
        description: "Official intermediate category: Sealed Triumph 765cc 3-cylinder race engines producing 140+ HP, prototype chassis, steel brakes, and rider-controlled dynamics (No Sprints)."
    },
    3: {
        id: 3,
        name: "Tier 3: Premier Class MotoGP™",
        shortName: "MotoGP™",
        category: "motogp",
        hasSprint: true,
        bikeModel: "1000cc Factory Prototype (Ducati Desmosedici / KTM RC16 / Aprilia RS-GP / Yamaha YZR-M1 / Honda RC213V)",
        engineSpec: "1,000cc 4-Cylinder (V4 / Inline-4, 81mm Max Bore, Pneumatic Valves)",
        revLimit: "18,500+ RPM (Magneti Marelli Unified Hardware & Software)",
        powerOutput: "290–305+ HP @ 18,000 RPM",
        topSpeedKmh: "360–366+ km/h (Official All-Time Record: 366.1 km/h)",
        minWeightKg: "157 kg (Dry bike minimum)",
        brakes: "Brembo 340mm/355mm Ventilated Carbon-Carbon Discs & Calipers",
        aeroRules: "Aerodynamic Downforce Wings, Ground-Effect Side Fairings, Front & Rear Ride-Height / Holeshot Devices",
        tires: "Michelin Power Slick Spec",
        baseHP: 290,
        promotionCost: 100000, // $100,000 Capital required
        requiredSeason: 3,     // Available only after at least 1 Season in Moto2
        requiredHype: 120,
        requiredHP: 140,
        gpWinPrize: 25000,
        gpPodiumPrize: 15000,
        gpTop10Prize: 8000,
        sprintWinPrize: 10000,
        sprintPodiumPrize: 6000,
        sprintTop9Prize: 3000,
        sponsorMulti: 10.0,
        description: "The pinnacle of world motorcycle racing. Bespoke 1,000cc 4-cylinder prototypes exceeding 300 HP, pneumatic valves, carbon disc brakes, active ride-height shapers, downforce winglets, and Saturday Sprints."
    }
};

export class PromotionSystem {
    static getPromotionStatus(state) {
        const currentTier = TIERS[state.tier] || TIERS[1];
        const nextTier = TIERS[state.tier + 1] || null;

        if (!nextTier) {
            return {
                currentTier,
                nextTier: null,
                isMaxTier: true,
                canPromote: false,
                requirements: null
            };
        }

        const seasonMet = (state.season >= nextTier.requiredSeason);
        const cashMet = (state.cash >= nextTier.promotionCost);
        const hypeMet = (state.hype >= nextTier.requiredHype);
        const hpMet = (state.bike.powerHP >= nextTier.requiredHP);

        const canPromote = seasonMet && cashMet && hypeMet && hpMet;

        return {
            currentTier,
            nextTier,
            isMaxTier: false,
            canPromote,
            requirements: {
                seasonMet,
                currentSeason: state.season,
                requiredSeason: nextTier.requiredSeason,
                cashMet,
                currentCash: state.cash,
                requiredCash: nextTier.promotionCost,
                hypeMet,
                currentHype: state.hype,
                requiredHype: nextTier.requiredHype,
                hpMet,
                currentHP: state.bike.powerHP,
                requiredHP: nextTier.requiredHP
            }
        };
    }

    static promoteTeam() {
        const state = gameState.getState();
        const status = this.getPromotionStatus(state);

        if (!status.canPromote || !status.nextTier) {
            gameState.addLog("⚠️ PROMOTION FAILED: Requirements not met yet. Check Season experience and Capital balance.");
            return false;
        }

        const next = status.nextTier;

        // Deduct capital
        state.cash -= next.promotionCost;
        state.tier = next.id;
        state.tierName = next.name;
        state.bike.modelName = next.bikeModel;
        state.bike.powerHP = Math.max(state.bike.powerHP, next.baseHP);

        // Re-initialize championship for the new tier
        RaceSystem.initChampionshipStandings(true);
        state.raceState.currentGPIndex = 0;
        state.raceState.stage = 'FP1';
        state.raceState.fpCompleted = false;
        state.raceState.practiceCompleted = false;
        state.raceState.q1Completed = false;
        state.raceState.q2Completed = false;
        state.raceState.sprintCompleted = false;

        gameState.addLog(`🎉 CATEGORY PROMOTION! Your team has officially stepped up to the ${next.name}! Capital invested: -$${next.promotionCost.toLocaleString()}. Fresh championship season begins!`);
        return true;
    }
}
