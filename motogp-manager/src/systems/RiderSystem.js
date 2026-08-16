// RiderSystem.js - Authentic MotoGP Paddock Rider Database, Stats, Favorite Tracks, Form & Injury Engine

export const MOTO3_RIDERS_DB = [
    { id: 'quiles', name: 'M. Quiles', team: 'CFMOTO Aspar Team', speed: 86, racecraft: 84, consistency: 82, wetSkill: 72, tireMgmt: 80, aggression: 78, bikeRating: 88, favoriteTracks: ['jerez', 'catalunya', 'valencia', 'aragon'] },
    { id: 'morelli', name: 'M. Morelli', team: 'CFMOTO Aspar Team', speed: 79, racecraft: 77, consistency: 75, wetSkill: 78, tireMgmt: 74, aggression: 70, bikeRating: 88, favoriteTracks: ['argentina', 'mugello', 'misano'] },
    
    { id: 'cruces', name: 'A. Cruces', team: 'CIP Green Power', speed: 83, racecraft: 85, consistency: 78, wetSkill: 80, tireMgmt: 76, aggression: 82, bikeRating: 84, favoriteTracks: ['portugal', 'spielberg', 'aragon'] },
    { id: 'ogden', name: 'S. Ogden', team: 'CIP Green Power', speed: 76, racecraft: 78, consistency: 84, wetSkill: 88, tireMgmt: 82, aggression: 68, bikeRating: 84, favoriteTracks: ['silverstone', 'assen', 'phillip_island'] },
    
    { id: 'buchanan', name: 'C. Buchanan', team: 'CODE Motorsports', speed: 78, racecraft: 80, consistency: 74, wetSkill: 70, tireMgmt: 72, aggression: 84, bikeRating: 80, favoriteTracks: ['phillip_island', 'americas', 'sepang'] },
    { id: 'moodley', name: 'R. Moodley', team: 'CODE Motorsports', speed: 74, racecraft: 72, consistency: 76, wetSkill: 65, tireMgmt: 70, aggression: 66, bikeRating: 80, favoriteTracks: ['thailand', 'mandalika'] },
    
    { id: 'yamanaka', name: 'R. Yamanaka', team: 'AEON Credit - MT Helmets - MSi', speed: 84, racecraft: 82, consistency: 80, wetSkill: 84, tireMgmt: 83, aggression: 75, bikeRating: 86, favoriteTracks: ['motegi', 'mandalika', 'thailand', 'assen'] },
    { id: 'danish', name: 'H. Danish', team: 'AEON Credit - MT Helmets - MSi', speed: 77, racecraft: 76, consistency: 72, wetSkill: 86, tireMgmt: 75, aggression: 79, bikeRating: 86, favoriteTracks: ['sepang', 'mandalika', 'thailand'] },
    
    { id: 'pratama', name: 'V. Pratama', team: 'Honda Team Asia', speed: 82, racecraft: 83, consistency: 77, wetSkill: 85, tireMgmt: 78, aggression: 86, bikeRating: 81, favoriteTracks: ['thailand', 'mandalika', 'motegi', 'sepang'] },
    { id: 'mitani', name: 'Z. Mitani', team: 'Honda Team Asia', speed: 75, racecraft: 74, consistency: 76, wetSkill: 73, tireMgmt: 74, aggression: 72, bikeRating: 81, favoriteTracks: ['motegi', 'thailand'] },
    
    { id: 'fernandez_a', name: 'A. Fernandez', team: 'Leopard Racing', speed: 85, racecraft: 84, consistency: 80, wetSkill: 74, tireMgmt: 81, aggression: 80, bikeRating: 87, favoriteTracks: ['valencia', 'jerez', 'catalunya', 'portugal'] },
    { id: 'esteban', name: 'J. Esteban', team: 'LEVELUP - MTA', speed: 79, racecraft: 81, consistency: 78, wetSkill: 79, tireMgmt: 75, aggression: 77, bikeRating: 82, favoriteTracks: ['mugello', 'misano', 'spielberg'] },
    { id: 'bertelle', name: 'M. Bertelle', team: 'LEVELUP - MTA', speed: 81, racecraft: 79, consistency: 75, wetSkill: 82, tireMgmt: 76, aggression: 81, bikeRating: 82, favoriteTracks: ['mugello', 'misano', 'brno', 'le mans'] },
    
    { id: 'munoz_d', name: 'D. Muñoz', team: 'LIQUI MOLY Dynavolt Intact GP', speed: 87, racecraft: 88, consistency: 70, wetSkill: 76, tireMgmt: 73, aggression: 92, bikeRating: 85, favoriteTracks: ['jerez', 'sachsenring', 'assen', 'aragon'] },
    { id: 'almansa', name: 'D. Almansa', team: 'LIQUI MOLY Dynavolt Intact GP', speed: 78, racecraft: 76, consistency: 78, wetSkill: 72, tireMgmt: 77, aggression: 74, bikeRating: 85, favoriteTracks: ['aragon', 'catalunya', 'valencia'] },
    
    { id: 'carpe', name: 'A. Carpe', team: 'Red Bull KTM Ajo', speed: 82, racecraft: 80, consistency: 81, wetSkill: 75, tireMgmt: 79, aggression: 78, bikeRating: 89, favoriteTracks: ['jerez', 'spielberg', 'portugal'] },
    { id: 'uriarte', name: 'B. Uriarte', team: 'Red Bull KTM Ajo', speed: 80, racecraft: 78, consistency: 79, wetSkill: 71, tireMgmt: 78, aggression: 75, bikeRating: 89, favoriteTracks: ['spielberg', 'valencia', 'balaton'] },
    
    { id: 'perrone', name: 'V. Perrone', team: 'Red Bull KTM Tech3', speed: 77, racecraft: 75, consistency: 76, wetSkill: 74, tireMgmt: 75, aggression: 76, bikeRating: 83, favoriteTracks: ['argentina', 'le mans', 'misano'] },
    { id: 'salmela', name: 'R. Salmela', team: 'Red Bull KTM Tech3', speed: 79, racecraft: 81, consistency: 73, wetSkill: 86, tireMgmt: 72, aggression: 83, bikeRating: 83, favoriteTracks: ['sachsenring', 'assen', 'silverstone'] },
    
    { id: 'ogorman', name: 'C. O\'Gorman', team: 'SIC58 Squadra Corse', speed: 76, racecraft: 78, consistency: 74, wetSkill: 85, tireMgmt: 73, aggression: 80, bikeRating: 79, favoriteTracks: ['silverstone', 'assen', 'misano'] },
    { id: 'rammerstorfer', name: 'L. Rammerstorfer', team: 'SIC58 Squadra Corse', speed: 73, racecraft: 71, consistency: 77, wetSkill: 70, tireMgmt: 75, aggression: 68, bikeRating: 79, favoriteTracks: ['spielberg', 'sachsenring', 'brno'] },
    
    { id: 'rios', name: 'J. Rios', team: 'Rivacold Snipers Team', speed: 75, racecraft: 74, consistency: 76, wetSkill: 77, tireMgmt: 75, aggression: 72, bikeRating: 78, favoriteTracks: ['misano', 'mugello'] },
    { id: 'carraro', name: 'N. Carraro', team: 'Rivacold Snipers Team', speed: 78, racecraft: 80, consistency: 75, wetSkill: 81, tireMgmt: 74, aggression: 82, bikeRating: 78, favoriteTracks: ['mugello', 'misano', 'jerez'] },
    
    { id: 'kelso', name: 'J. Kelso', team: 'FleetSafe Honda - MLav Racing', speed: 81, racecraft: 83, consistency: 76, wetSkill: 83, tireMgmt: 77, aggression: 85, bikeRating: 77, favoriteTracks: ['phillip_island', 'americas', 'silverstone'] },
    { id: 'oshea', name: 'E. O\'Shea', team: 'FleetSafe Honda - MLav Racing', speed: 74, racecraft: 73, consistency: 75, wetSkill: 79, tireMgmt: 74, aggression: 73, bikeRating: 77, favoriteTracks: ['silverstone', 'portugal'] }
];

export const MOTO2_RIDERS_DB = [
    { id: 'garcia', name: 'S. Garcia', team: 'MT Helmets - MSI Kalex', speed: 89, racecraft: 88, consistency: 86, wetSkill: 82, tireMgmt: 85, aggression: 82, bikeRating: 90, favoriteTracks: ['catalunya', 'jerez', 'le mans', 'americas'] },
    { id: 'ogura_m2', name: 'A. Ogura', team: 'MT Helmets - MSI Boscoscuro', speed: 91, racecraft: 90, consistency: 88, wetSkill: 86, tireMgmt: 89, aggression: 84, bikeRating: 90, favoriteTracks: ['motegi', 'spielberg', 'assen', 'qatar'] },
    
    { id: 'aldeguer_m2', name: 'F. Aldeguer', team: 'Sync SpeedUp Boscoscuro', speed: 92, racecraft: 89, consistency: 82, wetSkill: 84, tireMgmt: 86, aggression: 88, bikeRating: 91, favoriteTracks: ['silverstone', 'phillip_island', 'sepang', 'valencia'] },
    { id: 'lopez_a', name: 'A. Lopez', team: 'Sync SpeedUp Boscoscuro', speed: 87, racecraft: 89, consistency: 78, wetSkill: 80, tireMgmt: 77, aggression: 90, bikeRating: 91, favoriteTracks: ['misano', 'qatar', 'jerez', 'mugello'] },
    
    { id: 'roberts', name: 'J. Roberts', team: 'OnlyFans American Racing', speed: 88, racecraft: 86, consistency: 83, wetSkill: 79, tireMgmt: 82, aggression: 83, bikeRating: 87, favoriteTracks: ['americas', 'mugello', 'brno', 'portugal'] },
    { id: 'ramirez', name: 'M. Ramirez', team: 'OnlyFans American Racing', speed: 82, racecraft: 80, consistency: 82, wetSkill: 75, tireMgmt: 80, aggression: 76, bikeRating: 87, favoriteTracks: ['jerez', 'catalunya', 'sachsenring'] },
    
    { id: 'vietti', name: 'C. Vietti', team: 'Red Bull KTM Ajo', speed: 88, racecraft: 87, consistency: 79, wetSkill: 87, tireMgmt: 81, aggression: 86, bikeRating: 89, favoriteTracks: ['mugello', 'misano', 'spielberg', 'argentina'] },
    { id: 'alonso_d', name: 'D. Alonso', team: 'Red Bull KTM Ajo Moto2', speed: 93, racecraft: 91, consistency: 87, wetSkill: 85, tireMgmt: 88, aggression: 87, bikeRating: 89, favoriteTracks: ['qatar', 'catalunya', 'misano', 'mugello', 'portugal'] },
    
    { id: 'gonzalez_m', name: 'M. Gonzalez', team: 'QJMOTOR Gresini Moto2', speed: 87, racecraft: 86, consistency: 84, wetSkill: 83, tireMgmt: 83, aggression: 81, bikeRating: 86, favoriteTracks: ['motegi', 'mandalika', 'jerez'] },
    { id: 'escrig', name: 'A. Escrig', team: 'KLINT Forward Factory Team', speed: 78, racecraft: 76, consistency: 78, wetSkill: 74, tireMgmt: 76, aggression: 77, bikeRating: 79, favoriteTracks: ['catalunya', 'valencia'] },
    
    { id: 'arbolino', name: 'T. Arbolino', team: 'Elf Marc VDS Racing', speed: 89, racecraft: 90, consistency: 85, wetSkill: 92, tireMgmt: 84, aggression: 86, bikeRating: 88, favoriteTracks: ['le mans', 'sepang', 'silverstone', 'mugello'] },
    { id: 'salac', name: 'F. Salac', team: 'Elf Marc VDS Racing', speed: 81, racecraft: 80, consistency: 80, wetSkill: 84, tireMgmt: 79, aggression: 78, bikeRating: 88, favoriteTracks: ['brno', 'sachsenring', 'le mans'] },
    
    { id: 'canet', name: 'A. Canet', team: 'Fantic Racing Kalex', speed: 91, racecraft: 89, consistency: 81, wetSkill: 86, tireMgmt: 82, aggression: 89, bikeRating: 87, favoriteTracks: ['portugal', 'valencia', 'aragon', 'le mans'] },
    { id: 'cardelus', name: 'X. Cardelus', team: 'Fantic Racing Kalex', speed: 75, racecraft: 74, consistency: 76, wetSkill: 72, tireMgmt: 74, aggression: 70, bikeRating: 87, favoriteTracks: ['catalunya', 'aragon'] },
    
    { id: 'baltus', name: 'B. Baltus', team: 'RW-Idrofoglia Racing', speed: 83, racecraft: 82, consistency: 77, wetSkill: 85, tireMgmt: 78, aggression: 84, bikeRating: 82, favoriteTracks: ['qatar', 'assen', 'silverstone'] },
    { id: 'vd_goorbergh', name: 'Z. van den Goorbergh', team: 'RW-Idrofoglia Racing', speed: 82, racecraft: 80, consistency: 76, wetSkill: 86, tireMgmt: 77, aggression: 82, bikeRating: 82, favoriteTracks: ['assen', 'sachsenring', 'spielberg'] },
    
    { id: 'binder_d', name: 'D. Binder', team: 'Liqui Moly Husqvarna Intact', speed: 84, racecraft: 85, consistency: 78, wetSkill: 83, tireMgmt: 80, aggression: 88, bikeRating: 85, favoriteTracks: ['spielberg', 'phillip_island', 'motegi'] },
    { id: 'agius', name: 'S. Agius', team: 'Liqui Moly Husqvarna Intact', speed: 83, racecraft: 81, consistency: 82, wetSkill: 79, tireMgmt: 81, aggression: 79, bikeRating: 85, favoriteTracks: ['phillip_island', 'catalunya', 'jerez'] },
    
    { id: 'guevara', name: 'I. Guevara', team: 'CFMoto Aspar Team', speed: 86, racecraft: 84, consistency: 81, wetSkill: 80, tireMgmt: 83, aggression: 80, bikeRating: 86, favoriteTracks: ['jerez', 'aragon', 'valencia', 'sachsenring'] },
    { id: 'holgado', name: 'D. Holgado', team: 'CFMoto Aspar Team', speed: 88, racecraft: 87, consistency: 85, wetSkill: 82, tireMgmt: 84, aggression: 83, bikeRating: 86, favoriteTracks: ['portugal', 'le mans', 'mugello', 'qatar'] },
    
    { id: 'masia', name: 'J. Masia', team: 'Preicanos Racing Team', speed: 84, racecraft: 83, consistency: 80, wetSkill: 78, tireMgmt: 79, aggression: 82, bikeRating: 81, favoriteTracks: ['qatar', 'argentina', 'le mans'] },
    { id: 'munoz_m2', name: 'D. Munoz', team: 'Preicanos Racing Team', speed: 80, racecraft: 79, consistency: 78, wetSkill: 75, tireMgmt: 77, aggression: 78, bikeRating: 81, favoriteTracks: ['jerez', 'valencia'] }
];

export const MOTOGP_RIDERS_DB = [
    { id: 'bagnaia', name: 'F. Bagnaia', team: 'Ducati Lenovo Team', speed: 98, racecraft: 96, consistency: 95, wetSkill: 88, tireMgmt: 96, aggression: 88, bikeRating: 98, favoriteTracks: ['mugello', 'jerez', 'spielberg', 'sepang', 'assen', 'qatar'] },
    { id: 'marquez_m', name: 'M. Marquez', team: 'Ducati Lenovo Team', speed: 99, racecraft: 99, consistency: 88, wetSkill: 97, tireMgmt: 92, aggression: 97, bikeRating: 98, favoriteTracks: ['sachsenring', 'americas', 'aragon', 'phillip_island', 'valencia', 'misano'] },
    
    { id: 'martin_j', name: 'J. Martin', team: 'Aprilia Racing Factory', speed: 98, racecraft: 95, consistency: 92, wetSkill: 89, tireMgmt: 93, aggression: 94, bikeRating: 94, favoriteTracks: ['mandalika', 'phillip_island', 'valencia', 'le mans', 'qatar', 'thailand'] },
    { id: 'bezzecchi', name: 'M. Bezzecchi', team: 'Aprilia Racing Factory', speed: 93, racecraft: 91, consistency: 87, wetSkill: 94, tireMgmt: 88, aggression: 89, bikeRating: 94, favoriteTracks: ['argentina', 'le mans', 'assen', 'brno'] },
    
    { id: 'acosta', name: 'P. Acosta', team: 'Red Bull KTM Factory Racing', speed: 96, racecraft: 95, consistency: 86, wetSkill: 90, tireMgmt: 90, aggression: 95, bikeRating: 93, favoriteTracks: ['portugal', 'jerez', 'americas', 'misano', 'spielberg'] },
    { id: 'binder_b', name: 'B. Binder', team: 'Red Bull KTM Factory Racing', speed: 92, racecraft: 96, consistency: 89, wetSkill: 95, tireMgmt: 91, aggression: 96, bikeRating: 93, favoriteTracks: ['spielberg', 'brno', 'motegi', 'sepang', 'jerez'] },
    
    { id: 'bastianini', name: 'E. Bastianini', team: 'Red Bull KTM Tech3', speed: 95, racecraft: 93, consistency: 89, wetSkill: 86, tireMgmt: 97, aggression: 87, bikeRating: 91, favoriteTracks: ['sepang', 'qatar', 'misano', 'mugello', 'americas', 'silverstone'] },
    { id: 'vinales', name: 'M. Vinales', team: 'Red Bull KTM Tech3', speed: 94, racecraft: 88, consistency: 80, wetSkill: 82, tireMgmt: 87, aggression: 85, bikeRating: 91, favoriteTracks: ['americas', 'portugal', 'assen', 'qatar', 'sepang'] },
    
    { id: 'quartararo', name: 'F. Quartararo', team: 'Monster Energy Yamaha', speed: 95, racecraft: 92, consistency: 93, wetSkill: 81, tireMgmt: 92, aggression: 86, bikeRating: 88, favoriteTracks: ['assen', 'portugal', 'catalunya', 'silverstone', 'sachsenring'] },
    { id: 'rins', name: 'A. Rins', team: 'Monster Energy Yamaha', speed: 89, racecraft: 89, consistency: 81, wetSkill: 87, tireMgmt: 90, aggression: 84, bikeRating: 88, favoriteTracks: ['americas', 'phillip_island', 'silverstone', 'valencia'] },
    
    { id: 'diggia', name: 'F. Di Giannantonio', team: 'Pertamina Enduro VR46', speed: 92, racecraft: 90, consistency: 89, wetSkill: 85, tireMgmt: 91, aggression: 85, bikeRating: 94, favoriteTracks: ['qatar', 'phillip_island', 'mugello', 'misano'] },
    { id: 'morbidelli', name: 'F. Morbidelli', team: 'Pertamina Enduro VR46', speed: 90, racecraft: 88, consistency: 85, wetSkill: 88, tireMgmt: 86, aggression: 86, bikeRating: 94, favoriteTracks: ['misano', 'valencia', 'argentina', 'jerez'] },
    
    { id: 'marquez_a', name: 'A. Marquez', team: 'Gresini Racing MotoGP', speed: 92, racecraft: 90, consistency: 87, wetSkill: 92, tireMgmt: 88, aggression: 89, bikeRating: 93, favoriteTracks: ['silverstone', 'sepang', 'le mans', 'jerez'] },
    { id: 'aldeguer_gp', name: 'F. Aldeguer', team: 'Gresini Racing MotoGP', speed: 91, racecraft: 88, consistency: 80, wetSkill: 83, tireMgmt: 84, aggression: 89, bikeRating: 93, favoriteTracks: ['silverstone', 'phillip_island', 'sepang', 'valencia'] },
    
    { id: 'zarco', name: 'J. Zarco', team: 'CASTROL Honda LCR', speed: 90, racecraft: 92, consistency: 88, wetSkill: 96, tireMgmt: 89, aggression: 86, bikeRating: 84, favoriteTracks: ['phillip_island', 'le mans', 'silverstone', 'brno'] },
    { id: 'chantra', name: 'S. Chantra', team: 'IDEMITSU Honda LCR', speed: 82, racecraft: 81, consistency: 78, wetSkill: 86, tireMgmt: 80, aggression: 84, bikeRating: 84, favoriteTracks: ['thailand', 'mandalika', 'motegi', 'sepang'] },
    
    { id: 'mir', name: 'J. Mir', team: 'Repsol Honda Team', speed: 90, racecraft: 89, consistency: 82, wetSkill: 87, tireMgmt: 88, aggression: 88, bikeRating: 85, favoriteTracks: ['valencia', 'spielberg', 'portugal', 'catalunya'] },
    { id: 'marini', name: 'L. Marini', team: 'Repsol Honda Team', speed: 86, racecraft: 84, consistency: 91, wetSkill: 84, tireMgmt: 87, aggression: 76, bikeRating: 85, favoriteTracks: ['americas', 'qatar', 'mugello', 'misano'] },
    
    { id: 'miller', name: 'J. Miller', team: 'Prima Pramac Yamaha', speed: 91, racecraft: 93, consistency: 79, wetSkill: 98, tireMgmt: 77, aggression: 94, bikeRating: 87, favoriteTracks: ['phillip_island', 'le mans', 'motegi', 'jerez', 'assen'] },
    { id: 'oliveira', name: 'M. Oliveira', team: 'Prima Pramac Yamaha', speed: 89, racecraft: 89, consistency: 83, wetSkill: 96, tireMgmt: 86, aggression: 83, bikeRating: 87, favoriteTracks: ['portugal', 'spielberg', 'mandalika', 'thailand'] },
    
    { id: 'fernandez_r', name: 'R. Fernandez', team: 'Trackhouse Racing Aprilia', speed: 89, racecraft: 86, consistency: 81, wetSkill: 80, tireMgmt: 82, aggression: 85, bikeRating: 89, favoriteTracks: ['catalunya', 'valencia', 'americas', 'sachsenring'] },
    { id: 'ogura_gp', name: 'A. Ogura', team: 'Trackhouse Racing Aprilia', speed: 88, racecraft: 87, consistency: 84, wetSkill: 85, tireMgmt: 85, aggression: 83, bikeRating: 89, favoriteTracks: ['motegi', 'spielberg', 'assen', 'qatar'] }
];

// Official Replacement / Reserve / Wildcard Riders
export const RESERVE_RIDERS = {
    1: [ // Moto3 Reserves
        { name: "C. Lunetta", team: "SIC58 / Wildcard", speed: 76, racecraft: 75, consistency: 74, wetSkill: 78, tireMgmt: 73, aggression: 78, bikeRating: 80 },
        { name: "T. Suzuki", team: "Snipers / Reserve", speed: 77, racecraft: 76, consistency: 75, wetSkill: 79, tireMgmt: 75, aggression: 76, bikeRating: 80 },
        { name: "M. Piqueras", team: "Leopard / Test", speed: 79, racecraft: 78, consistency: 76, wetSkill: 75, tireMgmt: 77, aggression: 80, bikeRating: 83 }
    ],
    2: [ // Moto2 Reserves
        { name: "M. Pasini", team: "SpeedUp / Wildcard", speed: 85, racecraft: 88, consistency: 80, wetSkill: 86, tireMgmt: 80, aggression: 88, bikeRating: 86 },
        { name: "L. Dalla Porta", team: "Forward / Reserve", speed: 81, racecraft: 80, consistency: 81, wetSkill: 79, tireMgmt: 80, aggression: 78, bikeRating: 82 },
        { name: "S. Corsi", team: "Fantic / Reserve", speed: 82, racecraft: 83, consistency: 84, wetSkill: 83, tireMgmt: 82, aggression: 79, bikeRating: 84 }
    ],
    3: [ // MotoGP Reserves / Test Legends
        { name: "D. Pedrosa", team: "Red Bull KTM Test", speed: 94, racecraft: 95, consistency: 93, wetSkill: 89, tireMgmt: 94, aggression: 86, bikeRating: 93 },
        { name: "P. Espargaro", team: "Red Bull KTM Test", speed: 90, racecraft: 91, consistency: 84, wetSkill: 88, tireMgmt: 86, aggression: 92, bikeRating: 92 },
        { name: "M. Pirro", team: "Ducati Test Team", speed: 89, racecraft: 88, consistency: 90, wetSkill: 86, tireMgmt: 89, aggression: 80, bikeRating: 96 },
        { name: "L. Savadori", team: "Aprilia Test Team", speed: 87, racecraft: 86, consistency: 85, wetSkill: 87, tireMgmt: 85, aggression: 82, bikeRating: 92 },
        { name: "S. Bradl", team: "HRC Test Team", speed: 86, racecraft: 85, consistency: 88, wetSkill: 85, tireMgmt: 87, aggression: 79, bikeRating: 85 },
        { name: "C. Crutchlow", team: "Yamaha Factory Test", speed: 89, racecraft: 90, consistency: 82, wetSkill: 92, tireMgmt: 84, aggression: 90, bikeRating: 88 }
    ]
};

export const INJURY_TYPES = [
    { type: 'arm_pump', name: 'Arm Pump Strain', severity: 'minor', penalty: 8, racesOut: 0, racesRemaining: 2, desc: 'Forearm muscular compartment syndrome. -8% pace for 2 races.' },
    { type: 'wrist_sprain', name: 'Sprained Throttle Wrist', severity: 'minor', penalty: 12, racesOut: 0, racesRemaining: 1, desc: 'Hyperextension from gravel trap. -12% pace for 1 race.' },
    { type: 'bruised_ribs', name: 'Bruised Ribs', severity: 'minor', penalty: 6, racesOut: 0, racesRemaining: 1, desc: 'High-G landing impact. -6% pace for 1 race.' },
    { type: 'concussion', name: 'Concussion Protocol', severity: 'sidelined', penalty: 100, racesOut: 1, racesRemaining: 1, desc: 'Mandatory FIM neurological stand-down for 1 Grand Prix.' },
    { type: 'collarbone', name: 'Fractured Collarbone', severity: 'sidelined', penalty: 100, racesOut: 2, racesRemaining: 2, desc: 'Plate fixation surgery required. Sidelined for 2 Grands Prix.' },
    { type: 'scaphoid', name: 'Fractured Scaphoid', severity: 'sidelined', penalty: 100, racesOut: 2, racesRemaining: 2, desc: 'Wrist fracture from high-side. Sidelined for 2 Grands Prix.' }
];

export class RiderSystem {
    static getTierDatabase(tier) {
        if (tier === 1) return MOTO3_RIDERS_DB;
        if (tier === 2) return MOTO2_RIDERS_DB;
        return MOTOGP_RIDERS_DB;
    }

    /**
     * Initializes or updates persistent paddock state (injuries, form, replacement riders)
     */
    static getPaddockState() {
        const root = typeof window !== 'undefined' ? window : globalThis;
        if (!root._motogpPaddockState) {
            root._motogpPaddockState = {
                riders: {},
                lastRoundIndex: -1
            };
        }
        return root._motogpPaddockState;
    }

    /**
     * Calculates realistic dynamic performance score for a rider at a specific circuit
     */
    static calculateRiderPerformanceScore(rider, circuitId, weather, currentTier) {
        // Base team machine power (40%) + Rider core speed (45%)
        const bikeRating = rider.bikeRating || 85;
        const speedRating = rider.speed || 80;
        const racecraftRating = rider.racecraft || 80;
        const consistencyRating = rider.consistency || 80;

        let score = (bikeRating * 0.40) + (speedRating * 0.45) + (racecraftRating * 0.10) + (consistencyRating * 0.05);

        // Favorite / Home Track Specialist Bonus (+3.0 to +5.5 points, approx 0.3s - 0.6s per lap!)
        if (rider.favoriteTracks && rider.favoriteTracks.includes(circuitId)) {
            score += 4.2;
        }

        // Wet Weather Mastery Bonus
        if (weather === 'wet') {
            const wetSkill = rider.wetSkill || 75;
            const wetDelta = (wetSkill - 75) * 0.25;
            score += wetDelta;
        }

        // Dynamic Form / Confidence Variance (+/- 2.5 points)
        const paddock = this.getPaddockState();
        const riderPaddock = paddock.riders[rider.id] || { form: 1.0, injury: null };
        const formMultiplier = riderPaddock.form || 1.0;
        score = score * (0.95 + (formMultiplier * 0.05));

        // Injury Penalty
        if (riderPaddock.injury && riderPaddock.injury.severity === 'minor') {
            score -= riderPaddock.injury.penalty;
        }

        // Session natural variance
        const sessionVariance = (Math.random() * 2.8) - 1.4;
        score += sessionVariance;

        return Math.max(50, Math.min(99.8, score));
    }

    /**
     * Evaluates crash outcome and potential injury for an AI or player rider
     */
    static processRiderCrash(riderId, riderName, isPlayer = false, tier = 1) {
        // 35% chance of suffering an injury upon crash
        if (Math.random() > 0.35) return null;

        const injTemplate = INJURY_TYPES[Math.floor(Math.random() * INJURY_TYPES.length)];
        const injury = { ...injTemplate };

        if (!isPlayer) {
            const paddock = this.getPaddockState();
            if (!paddock.riders[riderId]) paddock.riders[riderId] = { form: 1.0, injury: null };
            paddock.riders[riderId].injury = injury;
            paddock.riders[riderId].form = Math.max(0.85, (paddock.riders[riderId].form || 1.0) - 0.08);
        }

        return injury;
    }

    /**
     * Advances paddock injury recovery & form after each completed Grand Prix weekend
     */
    static advancePaddockAfterRace(tier, completedGPIndex) {
        const paddock = this.getPaddockState();
        const tierRiders = this.getTierDatabase(tier);

        tierRiders.forEach(r => {
            if (!paddock.riders[r.id]) {
                paddock.riders[r.id] = { form: 1.0 + (Math.random() * 0.08 - 0.04), injury: null };
            }

            const pRider = paddock.riders[r.id];

            // Heal injuries
            if (pRider.injury) {
                pRider.injury.racesRemaining -= 1;
                if (pRider.injury.racesRemaining <= 0) {
                    pRider.injury = null;
                    pRider.form = Math.min(1.10, pRider.form + 0.05);
                }
            } else {
                // Natural form oscillation towards mean (1.0)
                pRider.form = (pRider.form * 0.70) + (1.0 * 0.30) + (Math.random() * 0.04 - 0.02);
            }
        });

        paddock.lastRoundIndex = completedGPIndex;
    }

    /**
     * Gets the active grid roster for the current Grand Prix, replacing sidelined injured riders with reserve riders
     */
    static getActiveGridRoster(tier) {
        const tierRiders = this.getTierDatabase(tier);
        const paddock = this.getPaddockState();
        const reserves = RESERVE_RIDERS[tier] || RESERVE_RIDERS[1];
        let reserveIdx = 0;

        return tierRiders.map((r, idx) => {
            const pRider = paddock.riders[r.id];
            const isSidelined = pRider && pRider.injury && pRider.injury.severity === 'sidelined' && pRider.injury.racesRemaining > 0;

            if (isSidelined) {
                const sub = reserves[reserveIdx % reserves.length];
                reserveIdx++;
                return {
                    id: `sub_${sub.name}`,
                    name: `${sub.name} (Sub)`,
                    originalRiderName: r.name,
                    team: r.team,
                    speed: sub.speed,
                    racecraft: sub.racecraft,
                    consistency: sub.consistency,
                    wetSkill: sub.wetSkill,
                    tireMgmt: sub.tireMgmt,
                    aggression: sub.aggression,
                    bikeRating: r.bikeRating,
                    favoriteTracks: [],
                    isReplacement: true,
                    sidelinedRider: r,
                    injuryDesc: pRider.injury.name
                };
            }

            return {
                ...r,
                isReplacement: false,
                injury: pRider ? pRider.injury : null
            };
        });
    }
}
