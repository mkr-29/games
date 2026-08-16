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
        if (state.unlockedTech.includes(techId)) return false; // Already unlocked

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

    static unlockTech(techId) {
        const state = gameState.getState();
        if (!this.isTechAvailable(techId) || !this.canAfford(techId)) return false;

        const node = TECH_NODES.find(t => t.id === techId);
        if (!node) return false;

        // Deduct cost
        if (node.cost.science) state.science -= node.cost.science;
        if (node.cost.parts) state.parts -= node.cost.parts;
        if (node.cost.cash) state.cash -= node.cost.cash;
        if (node.cost.telemetry) state.telemetry -= node.cost.telemetry;

        state.unlockedTech.push(techId);
        node.effect(state);

        gameState.addLog(`🔬 Unlocked Research: ${node.name}!`);
        return true;
    }
}
