// ResearchSystem.js - Tech Tree Upgrades & Research Logic

import { gameState } from '../engine/GameState.js';

export const TECH_NODES = [
    // ==========================================
    // 1. ENGINE & POWERTRAIN (TREE) ⚙️
    // ==========================================
    // --- Branch A: Cylinder Head & Valvetrain ---
    {
        id: 'pneumatic_valves',
        name: 'Pneumatic Valve Return System',
        category: 'engine',
        branch: 'Valvetrain & Combustion',
        tierLevel: 1,
        icon: '⚙️',
        desc: 'Pressurized air spring valvetrain eliminating mechanical valve float at 18,500+ RPM.',
        statBonus: '+10 HP Power',
        cost: { science: 25, parts: 20 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.powerHP += 10; }
    },
    {
        id: 'dlc_camshafts',
        name: 'DLC-Coated High-Lift Camshafts',
        category: 'engine',
        branch: 'Valvetrain & Combustion',
        tierLevel: 2,
        icon: '🔩',
        desc: 'Diamond-Like Carbon profile reducing friction by 40% with aggressive duration for top-end power.',
        statBonus: '+16 HP Power',
        cost: { science: 65, parts: 45 },
        prereq: ['pneumatic_valves'],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.powerHP += 16; }
    },
    {
        id: 'pankl_forged_pistons',
        name: 'Pankl Racing Billet Slipper Pistons',
        category: 'engine',
        branch: 'Valvetrain & Combustion',
        tierLevel: 3,
        icon: '🔥',
        desc: 'Ultra-lightweight forged alloy pistons & titanium connecting rods for maximum combustion pressure.',
        statBonus: '+24 HP Power',
        cost: { science: 140, parts: 90, cash: 2000 },
        prereq: ['dlc_camshafts'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.powerHP += 24; }
    },

    // --- Branch B: Air Intake & Fuel Delivery ---
    {
        id: 'variable_intake_trumpets',
        name: 'Variable-Length Intake Velocity Stacks',
        category: 'engine',
        branch: 'Intake & Fuel Delivery',
        tierLevel: 1,
        icon: '🌪️',
        desc: 'Motorized telescopic trumpets optimizing acoustic pressure waves for mid-range torque.',
        statBonus: '+8 HP Power',
        cost: { science: 20, parts: 15 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.powerHP += 8; }
    },
    {
        id: 'high_pressure_injectors',
        name: 'Twin-Spray 12-Hole Fuel Injectors',
        category: 'engine',
        branch: 'Intake & Fuel Delivery',
        tierLevel: 2,
        icon: '⛽',
        desc: 'Dual injector rail operating at 5.5 bar pressure with micro-droplet atomization for efficient burn.',
        statBonus: '+14 HP Power',
        cost: { science: 55, parts: 40 },
        prereq: ['variable_intake_trumpets'],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.powerHP += 14; }
    },
    {
        id: 'carbon_ram_airbox',
        name: 'High-Pressure Carbon Fiber Ram-Air Duct',
        category: 'engine',
        branch: 'Intake & Fuel Delivery',
        tierLevel: 3,
        icon: '💨',
        desc: 'Pressurizes the intake plenum at 350+ km/h straightaway speed, delivering supercharging effect.',
        statBonus: '+22 HP Power',
        cost: { science: 120, parts: 80, telemetry: 100 },
        prereq: ['high_pressure_injectors'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.powerHP += 22; }
    },

    // --- Branch C: Exhaust & Drivetrain ---
    {
        id: 'akrapovic_titanium_exhaust',
        name: 'Akrapovič Hydroformed Titanium Exhaust',
        category: 'engine',
        branch: 'Exhaust & Drivetrain',
        tierLevel: 1,
        icon: '🎺',
        desc: '4-into-2 bespoke titanium headers engineered for acoustic exhaust gas scavenging.',
        statBonus: '+12 HP Power',
        cost: { science: 30, parts: 25 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.powerHP += 12; }
    },
    {
        id: 'seamless_shift_gearbox',
        name: 'Zero-Torque Cut Seamless Transmission',
        category: 'engine',
        branch: 'Exhaust & Drivetrain',
        tierLevel: 2,
        icon: '🔄',
        desc: 'Instantaneous dog-ring cassette engagement preventing chassis pitch and wheelies during upshifts.',
        statBonus: '+18 HP & +5 km/h Top Speed',
        cost: { science: 85, parts: 60 },
        prereq: ['akrapovic_titanium_exhaust'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.powerHP += 18; }
    },
    {
        id: 'stm_slipper_clutch',
        name: 'STM Billet Dry Slipper Clutch Assembly',
        category: 'engine',
        branch: 'Exhaust & Drivetrain',
        tierLevel: 3,
        icon: '🛡️',
        desc: 'Multi-ball ramp back-torque limiter eliminating rear-wheel hop under aggressive trail braking.',
        statBonus: '+15 HP & +10 Grip',
        cost: { science: 130, parts: 85 },
        prereq: ['seamless_shift_gearbox'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.powerHP += 15; s.bike.chassisGrip += 10; }
    },

    // ==========================================
    // 2. AERODYNAMICS (TREE) 🦅
    // ==========================================
    // --- Branch A: Front Aero & Downforce ---
    {
        id: 'biplane_front_winglets',
        name: 'Carbon Fiber Biplane Front Winglets',
        category: 'aero',
        branch: 'Front Downforce & Fairing',
        tierLevel: 1,
        icon: '🦅',
        desc: 'Dual-tier front aerofoils generating 40kg of downforce at 300 km/h to keep front tire planted.',
        statBonus: '+12 Aero Downforce',
        cost: { science: 25, parts: 20 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.aeroDownforce += 12; }
    },
    {
        id: 'diffuser_nose_cone',
        name: 'Front Aero Diffuser & Fork Leg Shrouds',
        category: 'aero',
        branch: 'Front Downforce & Fairing',
        tierLevel: 2,
        icon: '🛩️',
        desc: 'Channels turbulent air around front forks directly into radiators and oil coolers.',
        statBonus: '+18 Aero Downforce',
        cost: { science: 65, parts: 45 },
        prereq: ['biplane_front_winglets'],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.aeroDownforce += 18; }
    },
    {
        id: 'ground_effect_side_ducts',
        name: 'Ground-Effect Step-Down Downforce Ducts',
        category: 'aero',
        branch: 'Front Downforce & Fairing',
        tierLevel: 3,
        icon: '🌪️',
        desc: 'Creates a venturi suction effect between the lower fairing and asphalt at maximum 65° lean angles.',
        statBonus: '+28 Aero Downforce',
        cost: { science: 140, parts: 90, cash: 2200 },
        prereq: ['diffuser_nose_cone'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.aeroDownforce += 28; }
    },

    // --- Branch B: Rear Aero & Slipstream ---
    {
        id: 'rear_stegosaurus_wings',
        name: 'Stegosaurus Rear Tail Fin Spoilers',
        category: 'aero',
        branch: 'Rear Wake & Ground Effect',
        tierLevel: 1,
        icon: '🦖',
        desc: 'Vertical tail fin vortex generators that stabilize the chassis during heavy straightaway braking.',
        statBonus: '+10 Aero Downforce',
        cost: { science: 20, parts: 15 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.aeroDownforce += 10; }
    },
    {
        id: 'swingarm_downforce_spoon',
        name: 'Under-Swingarm Rear Downforce Spoon',
        category: 'aero',
        branch: 'Rear Wake & Ground Effect',
        tierLevel: 2,
        icon: '🥄',
        desc: 'Under-belly scoop channeling clean air onto the rear tire for cooling while generating rear load.',
        statBonus: '+16 Aero Downforce',
        cost: { science: 60, parts: 40 },
        prereq: ['rear_stegosaurus_wings'],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.aeroDownforce += 16; }
    },
    {
        id: 'drag_reduction_bellypan',
        name: 'Low-Drag Laminar Slipstream Bellypan',
        category: 'aero',
        branch: 'Rear Wake & Ground Effect',
        tierLevel: 3,
        icon: '🚀',
        desc: 'Wind-tunnel developed aerodynamically sealed undertray minimizing trailing wake turbulence.',
        statBonus: '+22 Aero & +6 km/h Top Speed',
        cost: { science: 125, parts: 80 },
        prereq: ['swingarm_downforce_spoon'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.aeroDownforce += 22; }
    },

    // ==========================================
    // 3. ELECTRONICS & ECU (TREE) ⚡
    // ==========================================
    // --- Branch A: Unified ECU & Traction ---
    {
        id: 'six_axis_imu_sensor',
        name: 'Magneti Marelli 6-Axis Inertial Measurement Unit',
        category: 'electronics',
        branch: 'ECU & Traction Algorithm',
        tierLevel: 1,
        icon: '🧭',
        desc: 'Gyroscopic accelerometer measuring roll, pitch, and yaw rates at 1,000 Hz.',
        statBonus: '+10 ECU Intelligence',
        cost: { science: 25, telemetry: 30 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.ecuIntelligence += 10; }
    },
    {
        id: 'lean_angle_traction_control',
        name: 'Predictive Lean-Angle Traction Control',
        category: 'electronics',
        branch: 'ECU & Traction Algorithm',
        tierLevel: 2,
        icon: '🎛️',
        desc: 'Software algorithm trimming torque based on bank angle, tire carcass slip, and grip coefficient.',
        statBonus: '+16 ECU Intelligence',
        cost: { science: 70, telemetry: 75 },
        prereq: ['six_axis_imu_sensor'],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.ecuIntelligence += 16; }
    },
    {
        id: 'predictive_slide_control',
        name: 'Predictive Side-Slip & Slide Control Engine',
        category: 'electronics',
        branch: 'ECU & Traction Algorithm',
        tierLevel: 3,
        icon: '⚡',
        desc: 'Allows rider to back the bike into corners and powerslide safely without risking a highside.',
        statBonus: '+26 ECU Intelligence',
        cost: { science: 145, telemetry: 140, cash: 2000 },
        prereq: ['lean_angle_traction_control'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.ecuIntelligence += 26; }
    },

    // --- Branch B: Ride-Height & Launch Management ---
    {
        id: 'holeshot_launch_control',
        name: 'Front & Rear Mechanical Holeshot Device',
        category: 'electronics',
        branch: 'Launch & Ride-Height Devices',
        tierLevel: 1,
        icon: '🚥',
        desc: 'Pre-compresses suspension at grid start to lower center of gravity for maximum start acceleration.',
        statBonus: '+10 ECU & +15% Launch Boost',
        cost: { science: 30, parts: 20 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.ecuIntelligence += 10; }
    },
    {
        id: 'dynamic_ride_height_device',
        name: 'Dynamic Hydraulic Ride-Height Drop Device',
        category: 'electronics',
        branch: 'Launch & Ride-Height Devices',
        tierLevel: 2,
        icon: '📉',
        desc: 'Drops the rear suspension on corner exit, eliminating wheelies and maximizing drive off turns.',
        statBonus: '+18 ECU Intelligence',
        cost: { science: 75, telemetry: 80 },
        prereq: ['holeshot_launch_control'],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.ecuIntelligence += 18; }
    },
    {
        id: 'gps_sector_mapping',
        name: 'GPS-Guided Corner-by-Corner Engine Mapping',
        category: 'electronics',
        branch: 'Launch & Ride-Height Devices',
        tierLevel: 3,
        icon: '🛰️',
        desc: 'Automates power delivery, engine brake (EBC), and fuel trimming specifically per corner apex.',
        statBonus: '+25 ECU Intelligence',
        cost: { science: 150, telemetry: 150 },
        prereq: ['dynamic_ride_height_device'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.ecuIntelligence += 25; }
    },

    // ==========================================
    // 4. STORAGE & FACTORY CAPACITY 🏭
    // ==========================================
    {
        id: 'science_storage_1',
        name: 'R&D Data Server Vault',
        category: 'storage',
        branch: 'Factory Infrastructure',
        tierLevel: 1,
        icon: '🗄️',
        desc: 'Expands maximum Research Points (RP) storage capacity by +50 (Capacity: 100 RP).',
        statBonus: '+50 Max RP Storage',
        cost: { science: 15, cash: 120 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.scienceMax += 50; }
    },
    {
        id: 'science_storage_2',
        name: 'High-Performance Compute Cluster',
        category: 'storage',
        branch: 'Factory Infrastructure',
        tierLevel: 2,
        icon: '🖥️',
        desc: 'Expands maximum Research Points (RP) storage capacity by +100 (Capacity: 200 RP).',
        statBonus: '+100 Max RP Storage',
        cost: { science: 40, cash: 450 },
        prereq: ['science_storage_1'],
        unlockedAtTier: 1,
        effect: (s) => { s.scienceMax += 100; }
    },
    {
        id: 'science_storage_3',
        name: 'Quantum Simulation Server',
        category: 'storage',
        branch: 'Factory Infrastructure',
        tierLevel: 3,
        icon: '⚛️',
        desc: 'Expands maximum Research Points (RP) storage capacity by +250 (Capacity: 450 RP).',
        statBonus: '+250 Max RP Storage',
        cost: { science: 120, cash: 2500 },
        prereq: ['science_storage_2'],
        unlockedAtTier: 2,
        effect: (s) => { s.scienceMax += 250; }
    },
    {
        id: 'telemetry_storage_1',
        name: 'High-Density Telemetry Server Racks',
        category: 'storage',
        branch: 'Factory Infrastructure',
        tierLevel: 1,
        icon: '💾',
        desc: 'Increases max Telemetry storage by +100.',
        statBonus: '+100 Max Telemetry Storage',
        cost: { science: 10, cash: 100 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.telemetryMax += 100; }
    },
    {
        id: 'parts_bin_1',
        name: 'Modular Part Shelving & Autoclave',
        category: 'storage',
        branch: 'Factory Infrastructure',
        tierLevel: 1,
        icon: '📦',
        desc: 'Increases max Spare Parts storage by +50.',
        statBonus: '+50 Max Parts Storage',
        cost: { science: 15, cash: 150 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.partsMax += 50; }
    },
    {
        id: 'adv_dyno',
        name: 'Automated Dyno Engine Test Bench',
        category: 'storage',
        branch: 'Factory Infrastructure',
        tierLevel: 2,
        icon: '📈',
        desc: '+50% Telemetry generation rate from test laps.',
        statBonus: '+50% Telemetry Rate',
        cost: { science: 45, cash: 400 },
        prereq: [],
        unlockedAtTier: 1,
        effect: () => {}
    },
    {
        id: 'carbon_autoclave',
        name: 'High-Pressure Carbon Autoclave Oven',
        category: 'storage',
        branch: 'Factory Infrastructure',
        tierLevel: 2,
        icon: '🔥',
        desc: '+50% Spare Parts manufacturing output.',
        statBonus: '+50% Parts Output',
        cost: { science: 50, parts: 30 },
        prereq: [],
        unlockedAtTier: 1,
        effect: () => {}
    },
    {
        id: 'sponsor_manager',
        name: 'Professional Paddock PR & Hospitality Manager',
        category: 'storage',
        branch: 'Factory Infrastructure',
        tierLevel: 2,
        icon: '💼',
        desc: '+50% Commercial Cash revenue generation.',
        statBonus: '+50% Cash Generation',
        cost: { science: 60, cash: 800 },
        prereq: [],
        unlockedAtTier: 1,
        effect: () => {}
    },
    {
        id: 'telemetry_cloud',
        name: 'Cloud Telemetry Analytics Server',
        category: 'storage',
        branch: 'Factory Infrastructure',
        tierLevel: 3,
        icon: '☁️',
        desc: '+50% Research Points (RP) computation rate.',
        statBonus: '+50% RP Generation',
        cost: { science: 90, cash: 1500, telemetry: 80 },
        prereq: ['adv_dyno'],
        unlockedAtTier: 2,
        effect: () => {}
    }
];

export class ResearchSystem {
    static isTechAvailable(techId) {
        const state = gameState.getState();
        if (state.unlockedTech.includes(techId)) return false; // Already fully unlocked
        if (state.activeUpgrades && state.activeUpgrades[techId]) return false; // In development/testing pipeline

        const node = TECH_NODES.find(t => t.id === techId);
        if (!node) return false;

        if (state.tier < node.unlockedAtTier) return false;

        // Check prerequisites
        for (const prereqId of node.prereq) {
            if (!state.unlockedTech.includes(prereqId)) return false;
        }

        return true;
    }

    static canAfford(techId) {
        const state = gameState.getState();
        const node = TECH_NODES.find(t => t.id === techId);
        if (!node) return false;

        if (node.cost.science && state.science < node.cost.science) return false;
        if (node.cost.parts && state.parts < node.cost.parts) return false;
        if (node.cost.cash && state.cash < node.cost.cash) return false;
        if (node.cost.telemetry && state.telemetry < node.cost.telemetry) return false;

        return true;
    }

    static getTechDuration(techId) {
        const state = gameState.getState();
        const node = TECH_NODES.find(t => t.id === techId);
        if (!node) return 15;

        const tierLvl = node.tierLevel || 1;
        let baseSec = tierLvl === 1 ? 14 : (tierLvl === 2 ? 26 : 42);

        // Faster development with Chief Pit Mechanic & Data Engineers
        const chiefLvl = state.crew?.chief_mechanic || 0;
        const dataLvl = state.crew?.data_engineer || 0;
        const speedBonus = 1 + (chiefLvl * 0.12) + (dataLvl * 0.08);

        return Math.max(5, Math.round(baseSec / speedBonus));
    }

    static getTestDuration(techId) {
        const state = gameState.getState();
        const node = TECH_NODES.find(t => t.id === techId);
        const tierLvl = node?.tierLevel || 1;
        let baseSec = tierLvl === 1 ? 8 : (tierLvl === 2 ? 14 : 20);

        // Wind tunnel and dyno bench speed up testing
        const dynoCount = state.producers?.dyno_bench || 0;
        const windCount = state.producers?.wind_tunnel_slot || 0;
        const testSpeedBonus = 1 + (dynoCount * 0.08) + (windCount * 0.12);

        return Math.max(3, Math.round(baseSec / testSpeedBonus));
    }

    static startDevelopment(techId) {
        const state = gameState.getState();
        if (!this.isTechAvailable(techId) || !this.canAfford(techId)) return false;

        const node = TECH_NODES.find(t => t.id === techId);
        if (!node) return false;

        // Deduct cost
        if (node.cost.science) state.science -= node.cost.science;
        if (node.cost.parts) state.parts -= node.cost.parts;
        if (node.cost.cash) state.cash -= node.cost.cash;
        if (node.cost.telemetry) state.telemetry -= node.cost.telemetry;

        if (!state.activeUpgrades) state.activeUpgrades = {};

        const duration = this.getTechDuration(techId);
        const testDuration = this.getTestDuration(techId);

        state.activeUpgrades[techId] = {
            techId,
            name: node.name,
            icon: node.icon,
            category: node.category,
            stage: 'DEVELOPING', // 'DEVELOPING' -> 'TESTING' -> 'REFINING'
            progress: 0,
            duration: duration,
            testProgress: 0,
            testDuration: testDuration,
            isTestingActive: false,
            testTelemetryLog: null
        };

        gameState.addLog(`🔨 R&D STARTED: ${node.name} CAD engineering & manufacturing commenced (${duration}s estimated).`);
        return true;
    }

    static startTesting(techId) {
        const state = gameState.getState();
        const upgrade = state.activeUpgrades ? state.activeUpgrades[techId] : null;
        if (!upgrade || upgrade.stage !== 'TESTING') return false;

        upgrade.isTestingActive = true;
        const node = TECH_NODES.find(t => t.id === techId);
        const nodeName = node ? node.name : techId;

        gameState.addLog(`🔬 BENCH & TRACK TEST: ${nodeName} prototype loaded onto Dyno & Wind Tunnel for telemetry acquisition...`);
        return true;
    }

    static getRefinementsForTech(techId) {
        const node = TECH_NODES.find(t => t.id === techId);
        const cat = node ? node.category : 'engine';
        const nodeName = node ? node.name : 'Component';

        if (cat === 'aero') {
            return [
                {
                    id: 'high_downforce',
                    name: 'High-Downforce Apex Grip Spec',
                    badge: '🏁 High Downforce',
                    desc: 'Aggressive flap angle of attack maximizing corner entry stability and front-tire loading.',
                    bonusText: '+6 Aero Downforce, +4 Braking Stability, -1 km/h Straightaway Drag',
                    applyBonus: (s) => {
                        s.bike.aeroDownforce = (s.bike.aeroDownforce || 10) + 6;
                        s.bike.chassisGrip = (s.bike.chassisGrip || 15) + 3;
                    }
                },
                {
                    id: 'low_drag',
                    name: 'Low-Drag Slipstream Velocity Spec',
                    badge: '⚡ Low Drag Velocity',
                    desc: 'Slimline aerodynamic profile tailored for lightning top speed on high-speed straights.',
                    bonusText: '+3 Aero Downforce, +6 km/h Straightaway Top Speed',
                    applyBonus: (s) => {
                        s.bike.aeroDownforce = (s.bike.aeroDownforce || 10) + 3;
                        s.bike.powerHP = (s.bike.powerHP || 55) + 3;
                    }
                },
                {
                    id: 'ground_effect_efficiency',
                    name: 'Ground-Effect Stepped Airflow Spec',
                    badge: '🌿 Ground-Effect Flow',
                    desc: 'Bespoke diffuser venturi channels stabilizing tire temperatures and high-speed lean.',
                    bonusText: '+4 Aero Downforce, +5% Reliability, -8% Tire Degradation',
                    applyBonus: (s) => {
                        s.bike.aeroDownforce = (s.bike.aeroDownforce || 10) + 4;
                        s.bike.reliability = Math.min(100, (s.bike.reliability || 95) + 3);
                    }
                }
            ];
        } else if (cat === 'chassis') {
            return [
                {
                    id: 'rigid_apex_carver',
                    name: 'Rigid Apex Attack Tuning',
                    badge: '🎯 Rigid Apex Spec',
                    desc: 'High torsional stiffness frame profile providing razor-sharp direction changes.',
                    bonusText: '+8 Chassis Grip, +2% Apex Turn-in Pace',
                    applyBonus: (s) => {
                        s.bike.chassisGrip = (s.bike.chassisGrip || 15) + 8;
                    }
                },
                {
                    id: 'supple_tire_saver',
                    name: 'Supple Flex Tire-Preservation Setup',
                    badge: '🛞 Tire Preservation Spec',
                    desc: 'Engineered lateral flex geometry absorbing kerb impacts and extending tire life.',
                    bonusText: '+4 Chassis Grip, -12% Tire Degradation, +4% Wet Track Mastery',
                    applyBonus: (s) => {
                        s.bike.chassisGrip = (s.bike.chassisGrip || 15) + 4;
                        s.bike.reliability = Math.min(100, (s.bike.reliability || 95) + 2);
                    }
                },
                {
                    id: 'heavy_braking_support',
                    name: 'Anti-Dive Trail Braking Setup',
                    badge: '🛑 Trail-Braking Support',
                    desc: 'Reinforced steering headstock and swingarm pivot eliminating fork bottoming.',
                    bonusText: '+6 Chassis Grip, +6 Trail Braking Stability',
                    applyBonus: (s) => {
                        s.bike.chassisGrip = (s.bike.chassisGrip || 15) + 6;
                    }
                }
            ];
        } else if (cat === 'electronics') {
            return [
                {
                    id: 'adaptive_tc',
                    name: 'AI Dynamic Lean-Angle Traction Control',
                    badge: '🧠 Adaptive Lean TC',
                    desc: 'Sub-millisecond ignition cut mapping delivering maximum drive out of slow hairpins.',
                    bonusText: '+8 ECU Intelligence, +5% Wet Weather Grip',
                    applyBonus: (s) => {
                        s.bike.ecuIntelligence = (s.bike.ecuIntelligence || 5) + 8;
                    }
                },
                {
                    id: 'launch_hole_shot',
                    name: 'Zero-Wheelie Hole-Shot Launch Control',
                    badge: '🚀 Hole-Shot Master',
                    desc: 'Optimized starting RPM torque curve and front ride-height actuation algorithm.',
                    bonusText: '+5 ECU Intelligence, +0.35s Grid Launch Advantage',
                    applyBonus: (s) => {
                        s.bike.ecuIntelligence = (s.bike.ecuIntelligence || 5) + 5;
                        s.bike.powerHP = (s.bike.powerHP || 55) + 2;
                    }
                },
                {
                    id: 'smooth_engine_brake',
                    name: 'Progressive Deceleration Engine Braking',
                    badge: '⚙️ Smooth Engine Brake',
                    desc: 'Cylinder-by-cylinder fuel cutoff preventing rear-wheel lockups into chicanes.',
                    bonusText: '+6 ECU Intelligence, -10% Rear Tire Wear, +3% Reliability',
                    applyBonus: (s) => {
                        s.bike.ecuIntelligence = (s.bike.ecuIntelligence || 5) + 6;
                        s.bike.reliability = Math.min(100, (s.bike.reliability || 95) + 2);
                    }
                }
            ];
        } else {
            // Default Engine / Powertrain
            return [
                {
                    id: 'peak_rpm_power',
                    name: 'High-Rev Top Speed Power Map',
                    badge: '🔥 High-RPM Firepower',
                    desc: 'Aggressive ignition timing and combustion chamber pressure maximizing peak horsepower.',
                    bonusText: '+7 Power (HP), +5 km/h Top Speed',
                    applyBonus: (s) => {
                        s.bike.powerHP = (s.bike.powerHP || 55) + 7;
                    }
                },
                {
                    id: 'torque_corner_exit',
                    name: 'Low-End Corner Exit Punch Map',
                    badge: '⚡ Low-End Torque Punch',
                    desc: 'Fat mid-range torque curve optimized for explosive acceleration out of 2nd-gear corners.',
                    bonusText: '+4 Power (HP), +5 Chassis Acceleration Grip',
                    applyBonus: (s) => {
                        s.bike.powerHP = (s.bike.powerHP || 55) + 4;
                        s.bike.chassisGrip = (s.bike.chassisGrip || 15) + 3;
                    }
                },
                {
                    id: 'endurance_efficiency',
                    name: 'Endurance Thermal Efficiency Map',
                    badge: '🛡️ Thermal Efficiency & Reliability',
                    desc: 'Cooler combustion temperature profile preventing engine degradation across full race distance.',
                    bonusText: '+3 Power (HP), +5% Engine Reliability, -6% Fuel Burn',
                    applyBonus: (s) => {
                        s.bike.powerHP = (s.bike.powerHP || 55) + 3;
                        s.bike.reliability = Math.min(100, (s.bike.reliability || 95) + 4);
                    }
                }
            ];
        }
    }

    static applyRefinement(techId, refinementId) {
        const state = gameState.getState();
        const upgrade = state.activeUpgrades ? state.activeUpgrades[techId] : null;
        if (!upgrade || upgrade.stage !== 'REFINING') return false;

        const node = TECH_NODES.find(t => t.id === techId);
        if (!node) return false;

        const refinements = this.getRefinementsForTech(techId);
        const choice = refinements.find(r => r.id === refinementId) || refinements[0];

        // Apply base node effect
        node.effect(state);

        // Apply chosen refinement bonuses
        choice.applyBonus(state);

        if (!state.unlockedTech.includes(techId)) {
            state.unlockedTech.push(techId);
        }

        if (!state.refinedTechs) state.refinedTechs = {};
        state.refinedTechs[techId] = {
            id: choice.id,
            name: choice.name,
            badge: choice.badge,
            bonusText: choice.bonusText
        };

        // Remove from active pipeline
        delete state.activeUpgrades[techId];

        gameState.addLog(`✅ REFINEMENT APPLIED: ${node.name} successfully fitted to Factory Bike with [${choice.name}]!`);
        return true;
    }

    static unlockTech(techId) {
        // Direct method starts the development workflow
        return this.startDevelopment(techId);
    }

    static tick(delta) {
        const state = gameState.getState();
        if (!state.activeUpgrades) return;

        let stateChanged = false;

        Object.values(state.activeUpgrades).forEach(upgrade => {
            const node = TECH_NODES.find(t => t.id === upgrade.techId);
            const nodeName = node ? node.name : upgrade.techId;

            if (upgrade.stage === 'DEVELOPING') {
                upgrade.progress += delta;
                if (upgrade.progress >= upgrade.duration) {
                    upgrade.progress = upgrade.duration;
                    upgrade.stage = 'TESTING';
                    upgrade.isTestingActive = false;
                    stateChanged = true;
                    gameState.addLog(`⚙️ MANUFACTURING COMPLETE: ${nodeName} prototype fabricated! Ready for Dyno & Track Testing.`);
                }
            } else if (upgrade.stage === 'TESTING' && upgrade.isTestingActive) {
                upgrade.testProgress += delta;
                if (upgrade.testProgress >= upgrade.testDuration) {
                    upgrade.testProgress = upgrade.testDuration;
                    upgrade.stage = 'REFINING';
                    upgrade.isTestingActive = false;

                    // Generate rich telemetry telemetry findings
                    const telemetrySnapshots = [
                        `Aero Downforce: +14.8 kgf @ 290 km/h | Flow Separation: Minimal | Center of Pressure: Forward 2.2%`,
                        `Dyno Output: +16.2 HP @ 17,900 RPM | Thermal Gradient: -4.1°C | Lambda Ratio: 0.88`,
                        `Chassis Lateral G: 1.82G Max Lean | High-Speed Wobble Dampened | Rear Flex: Optimal`,
                        `Telemetry Sampling: 500Hz | Slip Control Reaction: 8ms | Tire Surface Temp: 92°C Nominal`
                    ];
                    upgrade.testTelemetryLog = telemetrySnapshots[Math.floor(Math.random() * telemetrySnapshots.length)];

                    stateChanged = true;
                    gameState.addLog(`🔬 TRACK TESTING COMPLETED: ${nodeName} telemetry captured! Engineering refinement options are now available.`);
                }
            }
        });

        return stateChanged;
    }

    static fastForward(seconds) {
        if (!seconds || seconds <= 0) return;
        const state = gameState.getState();
        if (!state.activeUpgrades) return;

        Object.values(state.activeUpgrades).forEach(upgrade => {
            if (upgrade.stage === 'DEVELOPING') {
                upgrade.progress = Math.min(upgrade.duration, upgrade.progress + seconds);
                if (upgrade.progress >= upgrade.duration) {
                    upgrade.stage = 'TESTING';
                    upgrade.isTestingActive = false;
                }
            } else if (upgrade.stage === 'TESTING' && upgrade.isTestingActive) {
                upgrade.testProgress = Math.min(upgrade.testDuration, upgrade.testProgress + seconds);
                if (upgrade.testProgress >= upgrade.testDuration) {
                    upgrade.stage = 'REFINING';
                    upgrade.isTestingActive = false;
                }
            }
        });
    }
}
