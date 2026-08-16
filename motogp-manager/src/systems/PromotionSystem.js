// PromotionSystem.js - Official Grand Prix Category Promotion Ladder (Moto3 -> Moto2 -> MotoGP)

import { gameState } from '../engine/GameState.js';
import { RaceSystem } from './RaceSystem.js';

export const TIERS = {
    1: {
        id: 1,
        name: "Tier 1: Moto3™ World Championship",
        shortName: "Moto3™",
        category: "moto3",
        bikeModel: "KTM / Honda 250cc Factory Spec",
        baseHP: 60,
        promotionCost: 0,
        requiredSeason: 1,
        requiredHype: 0,
        requiredHP: 0,
        gpWinPrize: 1800,
        gpPodiumPrize: 1000,
        gpTop10Prize: 500,
        sprintWinPrize: 800,
        sprintPodiumPrize: 450,
        sprintTop9Prize: 200,
        sponsorMulti: 1.0,
        description: "Entry class of Grand Prix racing with lightweight 250cc 4-stroke single cylinder prototypes."
    },
    2: {
        id: 2,
        name: "Tier 2: Moto2™ World Championship",
        shortName: "Moto2™",
        category: "moto2",
        bikeModel: "Kalex Triumph 765cc Triple Prototype",
        baseHP: 140,
        promotionCost: 25000, // $25,000 Capital required
        requiredSeason: 2,    // Available only after Season 1 is completed
        requiredHype: 40,
        requiredHP: 70,
        gpWinPrize: 6500,
        gpPodiumPrize: 3800,
        gpTop10Prize: 1800,
        sprintWinPrize: 2800,
        sprintPodiumPrize: 1500,
        sprintTop9Prize: 750,
        sponsorMulti: 3.5,
        description: "Intermediate class powered by official Triumph 765cc engines and pure prototype chassis (Kalex & Boscoscuro)."
    },
    3: {
        id: 3,
        name: "Tier 3: Premier Class MotoGP™",
        shortName: "MotoGP™",
        category: "motogp",
        bikeModel: "1000cc V4 Factory Prototype (280+ HP)",
        baseHP: 280,
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
        description: "The pinnacle of motorcycle racing. 1000cc V4 engines producing over 280 HP, carbon disc brakes, ride-height devices, and ground-effect aero winglets."
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
