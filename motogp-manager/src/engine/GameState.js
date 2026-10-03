// GameState.js - Centralized Game State Store

export const INITIAL_STATE = {
    // Versioning
    version: "1.1.0",
    lastSaved: Date.now(),

    // Tier Progression
    tier: 1, // 1: Moto3 Garage, 2: Moto3 World Champ, 3: Moto2, 4: MotoGP, 5: Factory Empire
    tierName: "Tier 1: Moto3 Local Garage",
    season: 1,

    // Resources
    cash: 500,
    telemetry: 0,
    telemetryMax: 100,
    science: 0,
    scienceMax: 50,
    parts: 0,
    partsMax: 50,
    hype: 10,
    heritageTokens: 0,

    // Manual Action Amounts
    clickTelemetryAmount: 1,
    clickPartsAmount: 1,
    clickSponsorAmount: 10,

    // Producers Owned { id: count }
    producers: {
        dyno_bench: 0,      // +0.5 Telemetry/s
        manual_lathe: 0,    // +0.2 Parts/s
        data_analyst: 0,    // +0.2 RP/s (consumes Telemetry)
        local_fan_club: 0,  // +$2.5/s
        wind_tunnel_slot: 0,// +1.0 Telemetry/s, +0.5 RP/s
        cnc_milling_vMC: 0, // +1.0 Parts/s
        telemetry_rig: 0,   // +3.0 Telemetry/s
        ai_telemetry_hub: 0,// +2.5 RP/s
        hospitality_suite: 0// +$25.0/s
    },

    // Unlocked R&D Tech Node IDs
    unlockedTech: [],

    // Bike Performance Base & Modifiers
    bike: {
        modelName: "Moto3 Entry Prototype",
        powerHP: 55,
        aeroDownforce: 10,
        chassisGrip: 15,
        ecuIntelligence: 5,
        reliability: 95 // % Machine reliability
    },

    // Flag indicating whether user completed initial racer selection
    selectedRacersChosen: false,

    // Team Racers (2 Official Racers per team)
    riders: [
        {
            id: "quiles",
            name: "Máximo Quiles",
            shortName: "M. Quiles",
            number: 28,
            team: "Your Factory Team",
            country: "🇪🇸 Spain",
            countryCode: "ESP",
            category: "Moto3",
            tier: 1,
            overallSkill: 83,
            speed: 86,
            racecraft: 84,
            cornering: 84,
            braking: 85,
            consistency: 82,
            wetSkill: 72,
            tireMgmt: 80,
            aggression: 78,
            bikeRating: 88,
            corneringLvl: 1,
            brakingLvl: 1,
            consistencyLvl: 1,
            wetLvl: 1,
            injury: null,
            form: 1.0,
            favoriteTracks: ["jerez", "catalunya", "valencia", "aragon"],
            ridingStyle: "High Braking Force & Red Bull Rookies Ace",
            avatar: "🇪🇸 #28",
            slot: 0,
            isUser: true
        },
        {
            id: "munoz_d",
            name: "David Muñoz",
            shortName: "D. Muñoz",
            number: 64,
            team: "Your Factory Team",
            country: "🇪🇸 Spain",
            countryCode: "ESP",
            category: "Moto3",
            tier: 1,
            overallSkill: 83,
            speed: 87,
            racecraft: 88,
            cornering: 86,
            braking: 88,
            consistency: 70,
            wetSkill: 76,
            tireMgmt: 73,
            aggression: 92,
            bikeRating: 85,
            corneringLvl: 1,
            brakingLvl: 1,
            consistencyLvl: 1,
            wetLvl: 1,
            injury: null,
            form: 1.0,
            favoriteTracks: ["jerez", "sachsenring", "assen", "aragon"],
            ridingStyle: "Fierce Inside Dive-Bomber & Fearless Combatant",
            avatar: "🇪🇸 #64",
            slot: 1,
            isUser: true
        }
    ],

    // Lead Rider (Synced with riders[0] for backward compatibility)
    rider: {
        id: "quiles",
        name: "Máximo Quiles",
        shortName: "M. Quiles",
        overallSkill: 83,
        cornering: 84,
        braking: 85,
        consistency: 82,
        wetSkill: 72,
        corneringLvl: 1,
        brakingLvl: 1,
        consistencyLvl: 1,
        wetLvl: 1,
        injury: null
    },

    // Crew & Engineers
    crew: {
        chief_mechanic: 0,  // +10% Parts output
        data_engineer: 0,   // +10% RP generation
        aerodynamicist: 0,  // +5 Aero Downforce per lvl
        telemetry_chief: 0, // +20% Telemetry storage & gen
        physio_trainer: 0   // Heals rider injuries & boosts stamina
    },

    // Race Calendar & Interactive State
    raceState: {
        currentGPIndex: 0, // Index in GP calendar
        stage: "FP1", // "FP1", "PR", "Q1", "Q2", "SPRINT", "RACE"
        sessionType: "RACE", // "SPRINT" or "RACE"
        strategy: "balanced", // "balanced", "push", "conserve"
        fpCompleted: false,
        practiceCompleted: false,
        directQ2: false, // Top 10 in Practice get direct Q2 entry
        q1Completed: false,
        q2Completed: false,
        sprintCompleted: false,
        qpGridPosition: 12,
        grid: [], // Final starting grid for Sprint & Main GP
        raceInProgress: false,
        currentLap: 0,
        totalLaps: 12,
        trackProgress: 0, // 0 to 100%
        lapTimes: [],
        leaderboard: [],
        lapHistory: [], // Full telemetry per completed lap
        fastestLap: null, // { riderName, lapTimeSec, lapTimeStr, lapNum }
        sessionFastestSectors: [null, null, null, null], // [s1, s2, s3, s4] overall bests
        raceLogs: [],
        seasonPoints: 0,
        weather: "dry", // "dry" or "wet"
        trackTempC: 28, // Track temperature in Celsius
        tireCompound: "medium", // "soft", "medium", "hard", "wet"
        tireType: "slicks", // "slicks" or "wet"
        tireCondition: 100, // 100% down to 0%
        flagState: {
            status: "GREEN", // "GREEN", "YELLOW", "RED", "WHITE_CROSS"
            sector: null, // 1, 2, 3, 4 or null
            lapsRemaining: 0,
            reason: "Track clear"
        },
        redFlagged: false,
        totalDnfsInRace: 0,
        activeIncident: null // Prompt object for mid-race choices
    },

    // Heritage / Prestige Perks Owned
    heritagePerks: [],
    totalPrestigeResets: 0,

    // Activity Log
    logs: [
        "Paddock Garage initialized. Start testing bike telemetry and tuning stock parts!"
    ]
};

class GameStateStore {
    constructor() {
        this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
        this.syncRiders();
        this.listeners = [];
    }

    syncRiders() {
        if (!this.state.riders || !Array.isArray(this.state.riders) || this.state.riders.length === 0) {
            this.state.riders = JSON.parse(JSON.stringify(INITIAL_STATE.riders));
        }
        if (this.state.riders.length === 1) {
            this.state.riders.push(JSON.parse(JSON.stringify(INITIAL_STATE.riders[1])));
        }
        this.state.rider = this.state.riders[0];
    }

    getState() {
        this.syncRiders();
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.syncRiders();
        this.notify();
    }

    update(updaterFn) {
        updaterFn(this.state);
        this.syncRiders();
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    addLog(msg, type = "system") {
        this.state.logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
        if (this.state.logs.length > 50) this.state.logs.pop();
        this.notify();
    }

    resetState() {
        this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
        this.syncRiders();
        this.notify();
    }
}

export const gameState = new GameStateStore();
