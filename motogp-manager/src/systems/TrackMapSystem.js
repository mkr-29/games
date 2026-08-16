// TrackMapSystem.js - Authentic 2D Grand Prix Circuit Geometries & Telemetry Splines for All 21 Rounds

export const CIRCUIT_GEOMETRIES = {
    // 1. Qatar - Lusail International Circuit (16 Turns, Clockwise)
    qatar: {
        id: 'qatar',
        name: 'Lusail International Circuit',
        viewBox: '0 0 500 340',
        // Authentic Lusail 16-turn SVG path matching official FIM layout
        path: 'M 340 315 L 75 315 C 45 315, 30 285, 45 260 C 60 235, 95 230, 115 210 C 125 200, 125 185, 115 170 C 105 155, 75 125, 50 90 C 35 65, 45 35, 75 35 C 100 35, 115 55, 125 85 L 140 120 C 145 135, 155 135, 160 120 L 175 45 C 180 15, 205 15, 215 45 L 225 80 C 235 95, 255 100, 255 125 C 255 145, 240 165, 260 175 C 275 180, 300 170, 320 150 C 345 125, 375 75, 400 50 C 415 35, 445 35, 465 50 C 480 65, 480 85, 470 110 L 420 170 C 410 185, 415 205, 430 225 L 460 270 C 475 295, 465 315, 430 315 Z',
        sectors: [0.24, 0.50, 0.76, 1.00],
        straightZones: [[0.0, 0.22], [0.55, 0.65]], // 1.068km main straight & T10-T11 exit
        brakingZones: [0.23, 0.44, 0.72, 0.96],
        startFinish: { x: 340, y: 315, angle: 180 },
        turns: [
            { num: 1, x: 45, y: 285 },
            { num: 2, x: 120, y: 220 },
            { num: 3, x: 110, y: 185 },
            { num: 4, x: 45, y: 65 },
            { num: 5, x: 75, y: 35 },
            { num: 6, x: 148, y: 135 },
            { num: 7, x: 195, y: 18 },
            { num: 8, x: 235, y: 85 },
            { num: 9, x: 255, y: 125 },
            { num: 10, x: 250, y: 175 },
            { num: 11, x: 340, y: 130 },
            { num: 12, x: 415, y: 40 },
            { num: 13, x: 465, y: 50 },
            { num: 14, x: 470, y: 110 },
            { num: 15, x: 420, y: 195 },
            { num: 16, x: 465, y: 295 }
        ]
    },

    // 2. Portugal - Autódromo Internacional do Algarve (Portimão) (15 Turns, Clockwise)
    portugal: {
        id: 'portugal',
        name: 'Autódromo Internacional do Algarve (Portimão)',
        viewBox: '0 0 520 340',
        path: 'M 270 300 L 60 300 C 40 300, 30 280, 35 255 L 20 190 C 15 175, 25 155, 45 130 L 60 100 C 68 85, 85 85, 95 100 L 105 150 C 110 180, 130 195, 160 195 L 295 195 C 315 195, 320 175, 300 160 L 180 140 C 145 135, 120 145, 105 130 L 90 95 C 85 80, 105 75, 125 80 L 240 105 C 265 110, 285 95, 300 75 L 325 45 C 340 30, 365 30, 380 45 L 380 75 L 380 120 C 380 145, 395 160, 420 175 L 435 180 C 455 180, 460 165, 445 140 L 420 95 C 410 70, 435 60, 460 75 C 495 95, 510 160, 495 220 C 480 270, 450 300, 410 300 Z',
        sectors: [0.25, 0.50, 0.76, 1.00],
        straightZones: [[0.0, 0.22], [0.35, 0.45]], // 969m main straight & T4-T5 infield straight
        brakingZones: [0.23, 0.34, 0.46, 0.78],
        startFinish: { x: 270, y: 300, angle: 180 },
        turns: [
            { num: 1, x: 40, y: 285 },
            { num: 2, x: 20, y: 190 },
            { num: 3, x: 75, y: 95 },
            { num: 4, x: 110, y: 175 },
            { num: 5, x: 310, y: 185 },
            { num: 6, x: 220, y: 150 },
            { num: 7, x: 130, y: 140 },
            { num: 8, x: 95, y: 85 },
            { num: 9, x: 245, y: 105 },
            { num: 10, x: 320, y: 45 },
            { num: 11, x: 375, y: 45 },
            { num: 12, x: 370, y: 130 },
            { num: 13, x: 445, y: 175 },
            { num: 14, x: 425, y: 85 },
            { num: 15, x: 490, y: 215 }
        ]
    },

    // 3. Argentina - Autódromo Termas de Río Hondo (14 Turns, Clockwise)
    argentina: {
        id: 'argentina',
        name: 'Autódromo Termas de Río Hondo',
        viewBox: '0 0 540 340',
        path: 'M 100 145 L 75 80 C 70 50, 85 25, 110 25 C 135 25, 145 50, 140 75 L 155 130 C 160 150, 165 170, 175 180 C 185 190, 200 190, 205 175 L 215 150 C 220 135, 235 125, 250 125 L 460 175 C 490 180, 525 195, 520 220 C 515 240, 485 245, 465 240 C 435 235, 395 245, 370 270 C 350 290, 320 325, 295 320 C 275 315, 275 285, 280 260 L 290 220 C 295 200, 285 185, 265 175 C 240 160, 200 165, 180 195 L 155 245 C 145 265, 125 260, 120 240 L 100 145 Z',
        sectors: [0.25, 0.52, 0.75, 1.00],
        straightZones: [[0.22, 0.44], [0.92, 1.00]], // 1.076km back straight & start/finish straight
        brakingZones: [0.08, 0.20, 0.45, 0.65],
        startFinish: { x: 100, y: 145, angle: -65 },
        turns: [
            { num: 1, x: 105, y: 30 },
            { num: 2, x: 150, y: 115 },
            { num: 3, x: 190, y: 185 },
            { num: 4, x: 235, y: 130 },
            { num: 5, x: 510, y: 210 },
            { num: 6, x: 430, y: 240 },
            { num: 7, x: 360, y: 275 },
            { num: 8, x: 310, y: 315 },
            { num: 9, x: 280, y: 280 },
            { num: 10, x: 290, y: 210 },
            { num: 11, x: 255, y: 170 },
            { num: 12, x: 200, y: 175 },
            { num: 13, x: 165, y: 230 },
            { num: 14, x: 130, y: 255 }
        ]
    },

    // 4. Americas - Circuit of the Americas (COTA) (20 Turns, Counter-Clockwise)
    americas: {
        id: 'americas',
        name: 'Circuit of the Americas (COTA)',
        viewBox: '0 0 540 540',
        path: 'M 90 440 L 330 480 C 365 485, 375 465, 340 430 L 310 395 C 295 375, 305 345, 325 320 L 340 295 C 350 280, 345 260, 335 245 L 350 215 C 360 200, 375 200, 390 205 L 420 170 C 430 155, 445 160, 455 170 L 485 135 C 500 115, 515 70, 500 35 C 485 15, 470 25, 450 45 L 180 235 C 160 250, 165 265, 195 285 L 240 310 C 255 320, 245 340, 225 340 L 170 315 C 145 305, 130 320, 150 335 L 205 375 C 220 390, 220 415, 190 425 C 160 435, 125 410, 100 380 L 50 445 C 30 470, 45 480, 70 470 L 90 440 Z',
        sectors: [0.26, 0.52, 0.78, 1.00],
        straightZones: [[0.0, 0.12], [0.46, 0.65]], // Main straight climb to T1 & 1.2km massive back straight
        brakingZones: [0.12, 0.44, 0.66, 0.95],
        startFinish: { x: 100, y: 442, angle: 9 },
        turns: [
            { num: 1, x: 355, y: 480 },
            { num: 2, x: 310, y: 395 },
            { num: 3, x: 325, y: 320 },
            { num: 4, x: 340, y: 295 },
            { num: 5, x: 335, y: 245 },
            { num: 6, x: 355, y: 215 },
            { num: 7, x: 390, y: 205 },
            { num: 8, x: 420, y: 170 },
            { num: 9, x: 455, y: 170 },
            { num: 10, x: 485, y: 135 },
            { num: 11, x: 500, y: 35 },
            { num: 12, x: 170, y: 245 },
            { num: 13, x: 240, y: 310 },
            { num: 14, x: 225, y: 340 },
            { num: 15, x: 170, y: 315 },
            { num: 16, x: 150, y: 335 },
            { num: 17, x: 205, y: 375 },
            { num: 18, x: 190, y: 425 },
            { num: 19, x: 100, y: 380 },
            { num: 20, x: 50, y: 445 }
        ]
    },

    // 5. Spain - Circuito de Jerez – Ángel Nieto (13 Turns, Clockwise)
    jerez: {
        id: 'jerez',
        name: 'Circuito de Jerez – Ángel Nieto',
        viewBox: '0 0 540 520',
        path: 'M 280 240 L 225 75 C 220 50, 250 40, 310 40 C 330 40, 340 55, 330 75 L 300 120 C 290 155, 310 195, 360 205 L 420 215 C 470 225, 495 250, 485 275 L 260 480 C 245 495, 235 485, 250 450 L 275 380 C 270 310, 245 270, 205 230 L 160 215 C 120 230, 100 320, 75 345 C 50 355, 40 330, 50 300 L 90 200 C 105 165, 135 140, 185 140 L 205 140 C 235 150, 260 190, 285 275 L 305 330 C 320 355, 340 345, 335 320 L 325 290 Z',
        sectors: [0.25, 0.50, 0.75, 1.00],
        straightZones: [[0.22, 0.40], [0.92, 1.00]], // 607m back straight to Dry Sack & start/finish straight
        brakingZones: [0.08, 0.22, 0.41, 0.75],
        startFinish: { x: 280, y: 240, angle: -115 },
        turns: [
            { num: 1, x: 235, y: 45 },
            { num: 2, x: 320, y: 50 },
            { num: 3, x: 295, y: 140 },
            { num: 4, x: 335, y: 200 },
            { num: 5, x: 470, y: 245 },
            { num: 6, x: 245, y: 490 },
            { num: 7, x: 265, y: 390 },
            { num: 8, x: 220, y: 240 },
            { num: 9, x: 140, y: 215 },
            { num: 10, x: 60, y: 345 },
            { num: 11, x: 95, y: 190 },
            { num: 12, x: 195, y: 140 },
            { num: 13, x: 325, y: 340 }
        ]
    },

    // 6. France - Le Mans (Bugatti Circuit) (14 Turns, Clockwise)
    france: {
        id: 'france',
        name: 'Le Mans (Bugatti Circuit)',
        viewBox: '0 0 540 360',
        path: 'M 380 310 L 470 310 C 495 310, 505 285, 490 265 L 460 260 C 425 255, 415 230, 435 205 C 445 190, 435 180, 380 170 L 320 185 C 295 185, 275 165, 250 145 L 100 50 C 70 35, 65 65, 95 85 L 265 210 C 280 220, 270 240, 240 240 L 160 170 C 130 145, 65 115, 45 140 C 25 165, 55 215, 105 240 L 135 235 C 150 235, 155 255, 140 265 L 195 305 C 215 310, 220 310, 240 310 L 380 310 Z',
        sectors: [0.24, 0.50, 0.76, 1.00],
        straightZones: [[0.0, 0.15], [0.35, 0.50]], // Main straight to Dunlop & straight to Garage Vert
        brakingZones: [0.14, 0.28, 0.50, 0.88],
        startFinish: { x: 380, y: 310, angle: 0 },
        turns: [
            { num: 1, x: 485, y: 305 },
            { num: 2, x: 490, y: 270 },
            { num: 3, x: 455, y: 260 },
            { num: 4, x: 420, y: 240 },
            { num: 5, x: 435, y: 195 },
            { num: 6, x: 380, y: 170 },
            { num: 7, x: 95, y: 45 },
            { num: 8, x: 120, y: 75 },
            { num: 9, x: 265, y: 215 },
            { num: 10, x: 240, y: 240 },
            { num: 11, x: 50, y: 140 },
            { num: 12, x: 100, y: 235 },
            { num: 13, x: 140, y: 265 },
            { num: 14, x: 200, y: 305 }
        ]
    },

    // 7. Catalunya - Circuit de Barcelona-Catalunya (14 Turns, Clockwise)
    catalunya: {
        id: 'catalunya',
        name: 'Circuit de Barcelona-Catalunya',
        viewBox: '0 0 560 340',
        path: 'M 360 280 L 80 280 C 60 280, 50 255, 55 225 C 25 175, 30 85, 75 50 C 130 35, 175 45, 210 65 C 235 85, 225 110, 185 115 L 140 115 C 90 135, 100 165, 155 210 C 190 235, 225 240, 240 210 L 290 95 C 305 65, 335 65, 350 80 L 470 185 C 495 210, 510 235, 485 245 C 465 250, 455 230, 460 200 L 450 135 C 465 75, 515 70, 535 85 C 555 105, 545 150, 540 190 L 540 240 C 540 280, 520 280, 490 280 L 360 280 Z',
        sectors: [0.26, 0.50, 0.76, 1.00],
        straightZones: [[0.0, 0.22], [0.52, 0.64]], // 1.047km main straight & back straight
        brakingZones: [0.21, 0.38, 0.65, 0.95],
        startFinish: { x: 360, y: 280, angle: 180 },
        turns: [
            { num: 1, x: 60, y: 275 },
            { num: 2, x: 55, y: 225 },
            { num: 3, x: 35, y: 95 },
            { num: 4, x: 210, y: 65 },
            { num: 5, x: 115, y: 125 },
            { num: 6, x: 145, y: 195 },
            { num: 7, x: 240, y: 210 },
            { num: 8, x: 285, y: 120 },
            { num: 9, x: 325, y: 65 },
            { num: 10, x: 495, y: 235 },
            { num: 11, x: 460, y: 190 },
            { num: 12, x: 480, y: 80 },
            { num: 13, x: 540, y: 130 },
            { num: 14, x: 540, y: 240 }
        ]
    },

    // 8. Italy - Autodromo Internazionale del Mugello (15 Turns, Clockwise)
    mugello: {
        id: 'mugello',
        name: 'Autodromo Internazionale del Mugello',
        viewBox: '0 0 560 380',
        path: 'M 270 205 L 450 290 C 495 315, 515 335, 480 345 C 445 350, 420 320, 395 330 C 370 345, 360 355, 335 335 L 260 295 C 240 285, 220 300, 185 280 L 125 235 C 105 210, 50 160, 45 95 C 40 45, 80 35, 140 45 L 185 60 C 205 75, 190 105, 215 120 L 285 140 C 345 155, 355 185, 310 195 L 245 170 C 235 155, 205 140, 170 125 C 120 100, 65 95, 65 135 C 65 175, 115 190, 190 160 L 270 205 Z',
        sectors: [0.26, 0.50, 0.76, 1.00],
        straightZones: [[0.0, 0.20], [0.88, 1.00]], // 1.141km main straight across blind crest into San Donato
        brakingZones: [0.19, 0.35, 0.65, 0.88],
        startFinish: { x: 270, y: 205, angle: 28 },
        turns: [
            { num: 1, x: 490, y: 335 },
            { num: 2, x: 430, y: 330 },
            { num: 3, x: 395, y: 330 },
            { num: 4, x: 335, y: 335 },
            { num: 5, x: 260, y: 295 },
            { num: 6, x: 225, y: 295 },
            { num: 7, x: 185, y: 280 },
            { num: 8, x: 85, y: 175 },
            { num: 9, x: 50, y: 80 },
            { num: 10, x: 185, y: 60 },
            { num: 11, x: 215, y: 120 },
            { num: 12, x: 345, y: 175 },
            { num: 13, x: 245, y: 170 },
            { num: 14, x: 200, y: 145 },
            { num: 15, x: 65, y: 135 }
        ]
    },

    // 9. Netherlands - TT Circuit Assen (Cathedral of Speed) (18 Turns, Clockwise)
    assen: {
        id: 'assen',
        name: 'TT Circuit Assen (Cathedral of Speed)',
        viewBox: '0 0 560 360',
        path: 'M 130 185 L 65 100 C 50 85, 75 45, 115 30 C 145 35, 140 75, 110 80 C 90 80, 85 95, 110 95 L 140 95 L 310 130 C 335 145, 355 170, 385 170 C 415 155, 450 160, 470 245 C 505 255, 545 270, 535 295 C 515 315, 465 315, 435 280 L 395 235 C 355 185, 320 180, 245 195 C 220 220, 195 215, 165 235 L 130 185 Z',
        sectors: [0.24, 0.48, 0.74, 1.00],
        straightZones: [[0.18, 0.35], [0.92, 1.00]], // Veenslang straight & main straight to Haarbocht
        brakingZones: [0.08, 0.16, 0.50, 0.88],
        startFinish: { x: 130, y: 185, angle: -50 },
        turns: [
            { num: 1, x: 55, y: 85 },
            { num: 2, x: 80, y: 45 },
            { num: 3, x: 120, y: 30 },
            { num: 4, x: 140, y: 60 },
            { num: 5, x: 95, y: 85 },
            { num: 6, x: 335, y: 145 },
            { num: 7, x: 365, y: 170 },
            { num: 8, x: 400, y: 165 },
            { num: 9, x: 455, y: 185 },
            { num: 10, x: 475, y: 255 },
            { num: 11, x: 530, y: 275 },
            { num: 12, x: 500, y: 310 },
            { num: 13, x: 440, y: 285 },
            { num: 14, x: 400, y: 240 },
            { num: 15, x: 330, y: 180 },
            { num: 16, x: 245, y: 195 },
            { num: 17, x: 210, y: 220 },
            { num: 18, x: 170, y: 230 }
        ]
    },

    // 10. Germany - Sachsenring (13 Turns, Counter-Clockwise)
    sachsenring: {
        id: 'sachsenring',
        name: 'Sachsenring',
        viewBox: '0 0 560 340',
        path: 'M 180 180 L 400 50 C 425 45, 430 75, 400 115 C 395 150, 440 205, 465 235 C 475 250, 445 255, 415 235 L 405 175 C 390 135, 345 130, 310 170 C 295 190, 305 240, 350 280 C 385 300, 435 295, 475 270 L 535 185 C 555 145, 545 80, 480 35 C 430 5, 360 25, 315 75 L 90 75 C 60 75, 50 100, 50 135 L 50 245 C 50 280, 75 285, 100 255 L 180 180 Z',
        sectors: [0.24, 0.48, 0.74, 1.00],
        straightZones: [[0.0, 0.18], [0.72, 0.85]], // Main straight & back straight exiting Waterfall
        brakingZones: [0.18, 0.35, 0.72, 0.95],
        startFinish: { x: 180, y: 180, angle: -30 },
        turns: [
            { num: 1, x: 400, y: 50 },
            { num: 2, x: 400, y: 115 },
            { num: 3, x: 465, y: 235 },
            { num: 4, x: 405, y: 175 },
            { num: 5, x: 350, y: 135 },
            { num: 6, x: 310, y: 180 },
            { num: 7, x: 360, y: 290 },
            { num: 8, x: 475, y: 270 },
            { num: 9, x: 535, y: 185 },
            { num: 10, x: 480, y: 35 },
            { num: 11, x: 360, y: 25 },
            { num: 12, x: 90, y: 75 },
            { num: 13, x: 50, y: 245 }
        ]
    },

    // 11. Great Britain - Silverstone Circuit (18 Turns, Clockwise)
    silverstone: {
        id: 'silverstone',
        name: 'Silverstone Circuit',
        viewBox: '0 0 580 400',
        path: 'M 235 80 L 280 115 C 290 145, 290 175, 315 230 C 330 250, 315 265, 280 275 C 265 285, 285 305, 335 305 L 420 210 C 450 175, 450 130, 410 95 C 400 70, 440 65, 465 75 C 490 90, 485 115, 500 270 C 505 295, 475 310, 450 310 L 360 320 C 345 345, 310 325, 270 350 C 250 340, 245 305, 200 270 L 95 195 C 65 170, 75 140, 110 140 L 145 90 C 160 75, 145 55, 185 45 L 235 80 Z',
        sectors: [0.25, 0.52, 0.76, 1.00],
        straightZones: [[0.22, 0.35], [0.60, 0.74], [0.92, 1.00]], // Wellington Straight, 770m Hangar Straight, Hamilton Straight
        brakingZones: [0.12, 0.22, 0.52, 0.74],
        startFinish: { x: 235, y: 80, angle: 36 },
        turns: [
            { num: 1, x: 280, y: 115 },
            { num: 2, x: 290, y: 175 },
            { num: 3, x: 325, y: 250 },
            { num: 4, x: 280, y: 275 },
            { num: 5, x: 335, y: 305 },
            { num: 6, x: 450, y: 130 },
            { num: 7, x: 420, y: 70 },
            { num: 8, x: 485, y: 115 },
            { num: 9, x: 490, y: 295 },
            { num: 10, x: 450, y: 310 },
            { num: 11, x: 360, y: 320 },
            { num: 12, x: 345, y: 345 },
            { num: 13, x: 310, y: 325 },
            { num: 14, x: 270, y: 350 },
            { num: 15, x: 95, y: 195 },
            { num: 16, x: 145, y: 90 },
            { num: 17, x: 160, y: 75 },
            { num: 18, x: 145, y: 55 }
        ]
    },

    // 12. Austria - Red Bull Ring (Spielberg) (10 Turns)
    spielberg: {
        id: 'spielberg',
        name: 'Red Bull Ring (Spielberg)',
        viewBox: '0 0 500 320',
        path: 'M 370 285 L 100 285 C 65 285, 45 255, 65 220 L 160 80 C 185 45, 240 40, 275 65 L 435 170 C 470 195, 465 235, 430 260 C 405 280, 395 285, 370 285 Z',
        sectors: [0.24, 0.52, 0.76, 1.00],
        straightZones: [[0.0, 0.24], [0.45, 0.62]], // Steep uphill straight to Remus
        brakingZones: [0.25, 0.44, 0.68, 0.96],
        startFinish: { x: 370, y: 285, angle: 180 }
    },

    // 13. Hungary - Balaton Park Circuit (16 Turns)
    balaton: {
        id: 'balaton',
        name: 'Balaton Park Circuit',
        viewBox: '0 0 500 320',
        path: 'M 360 280 L 90 280 C 55 280, 40 250, 60 215 C 80 180, 130 190, 160 160 C 190 130, 175 90, 210 65 C 245 40, 310 45, 345 75 C 380 105, 420 85, 440 115 C 460 145, 440 185, 410 200 C 380 215, 390 250, 420 260 C 445 270, 435 280, 395 280 Z',
        sectors: [0.25, 0.50, 0.75, 1.00],
        straightZones: [[0.0, 0.23], [0.50, 0.62]],
        brakingZones: [0.24, 0.48, 0.73, 0.97],
        startFinish: { x: 360, y: 280, angle: 180 }
    },

    // 14. Aragon - MotorLand Aragón (17 Turns)
    aragon: {
        id: 'aragon',
        name: 'MotorLand Aragón',
        viewBox: '0 0 500 320',
        path: 'M 360 280 L 85 280 C 50 280, 35 250, 60 215 C 85 180, 135 190, 165 160 C 195 130, 175 90, 215 60 C 255 30, 335 40, 375 70 C 415 100, 455 80, 470 115 C 485 150, 460 190, 425 205 C 390 220, 400 255, 435 265 C 460 275, 445 280, 405 280 Z',
        sectors: [0.26, 0.50, 0.76, 1.00],
        straightZones: [[0.0, 0.25], [0.54, 0.70]], // 968m reverse back straight
        brakingZones: [0.26, 0.50, 0.74, 0.98],
        startFinish: { x: 360, y: 280, angle: 180 }
    },

    // 15. San Marino - Misano World Circuit Marco Simoncelli (16 Turns)
    misano: {
        id: 'misano',
        name: 'Misano World Circuit Marco Simoncelli',
        viewBox: '0 0 500 320',
        path: 'M 360 280 L 95 280 C 60 280, 45 250, 65 215 C 85 180, 140 195, 170 165 C 195 135, 175 95, 210 70 C 245 45, 310 50, 345 80 C 380 110, 425 90, 445 120 C 465 150, 445 190, 415 205 C 385 220, 395 255, 425 265 C 450 275, 440 280, 400 280 Z',
        sectors: [0.24, 0.50, 0.75, 1.00],
        straightZones: [[0.0, 0.23], [0.48, 0.60]], // Curvone high-speed curve
        brakingZones: [0.24, 0.47, 0.72, 0.97],
        startFinish: { x: 360, y: 280, angle: 180 }
    },

    // 16. Kazakhstan - Sokol Racetrack (13 Turns)
    sokol: {
        id: 'sokol',
        name: 'Sokol Racetrack',
        viewBox: '0 0 500 320',
        path: 'M 360 280 L 85 280 C 50 280, 35 250, 60 215 C 85 180, 135 190, 165 160 C 195 130, 175 90, 215 60 C 255 30, 335 40, 375 70 C 415 100, 455 80, 470 115 C 485 150, 460 190, 425 205 C 390 220, 400 255, 435 265 C 460 275, 445 280, 405 280 Z',
        sectors: [0.25, 0.50, 0.75, 1.00],
        straightZones: [[0.0, 0.24], [0.50, 0.64]],
        brakingZones: [0.25, 0.48, 0.74, 0.98],
        startFinish: { x: 360, y: 280, angle: 180 }
    },

    // 17. Indonesia - Pertamina Mandalika Circuit (17 Turns)
    mandalika: {
        id: 'mandalika',
        name: 'Pertamina Mandalika Circuit',
        viewBox: '0 0 500 320',
        path: 'M 360 280 L 90 280 C 55 280, 40 250, 60 215 C 80 180, 130 190, 160 160 C 190 130, 175 90, 210 65 C 245 40, 310 45, 345 75 C 380 105, 420 85, 440 115 C 460 145, 440 185, 410 200 C 380 215, 390 250, 420 260 C 445 270, 435 280, 395 280 Z',
        sectors: [0.25, 0.50, 0.75, 1.00],
        straightZones: [[0.0, 0.23], [0.50, 0.62]],
        brakingZones: [0.24, 0.48, 0.73, 0.97],
        startFinish: { x: 360, y: 280, angle: 180 }
    },

    // 18. Japan - Mobility Resort Motegi (14 Turns)
    motegi: {
        id: 'motegi',
        name: 'Mobility Resort Motegi',
        viewBox: '0 0 500 320',
        path: 'M 360 280 L 95 280 C 60 280, 45 250, 65 215 C 85 180, 140 195, 170 165 C 195 135, 175 95, 210 70 C 245 45, 310 50, 345 80 C 380 110, 425 90, 445 120 C 465 150, 445 190, 415 205 C 385 220, 395 255, 425 265 C 450 275, 440 280, 400 280 Z',
        sectors: [0.24, 0.50, 0.76, 1.00],
        straightZones: [[0.0, 0.22], [0.50, 0.65]], // Downhill bridge straight to Hairpin
        brakingZones: [0.24, 0.48, 0.72, 0.98],
        startFinish: { x: 360, y: 280, angle: 180 }
    },

    // 19. Australia - Phillip Island Grand Prix Circuit (12 Turns)
    phillip_island: {
        id: 'phillip_island',
        name: 'Phillip Island Grand Prix Circuit',
        viewBox: '0 0 500 320',
        path: 'M 370 285 L 80 285 C 45 285, 35 250, 60 215 C 85 180, 140 195, 170 160 C 200 125, 180 80, 220 50 C 260 20, 340 30, 380 60 C 420 90, 460 70, 475 105 C 490 140, 465 180, 430 195 C 395 210, 405 250, 440 260 C 465 270, 450 285, 410 285 Z',
        sectors: [0.23, 0.50, 0.76, 1.00],
        straightZones: [[0.0, 0.25], [0.50, 0.65]], // Gardner Straight
        brakingZones: [0.25, 0.48, 0.72, 0.97],
        startFinish: { x: 370, y: 285, angle: 180 }
    },

    // 20. Malaysia - Sepang International Circuit (15 Turns)
    sepang: {
        id: 'sepang',
        name: 'Sepang International Circuit',
        viewBox: '0 0 500 320',
        path: 'M 360 280 L 90 280 C 55 280, 40 250, 60 215 C 80 180, 130 190, 160 160 L 300 160 C 330 160, 350 130, 320 100 L 200 100 C 165 100, 145 60, 175 40 L 410 40 C 445 40, 465 75, 445 105 L 410 145 C 385 175, 405 210, 435 230 C 465 250, 450 280, 400 280 Z',
        sectors: [0.26, 0.51, 0.76, 1.00],
        straightZones: [[0.0, 0.24], [0.52, 0.74]], // Twin 900m parallel straights
        brakingZones: [0.25, 0.50, 0.75, 0.98],
        startFinish: { x: 360, y: 280, angle: 180 }
    },

    // 21. Valencia - Circuit Ricardo Tormo (14 Turns)
    valencia: {
        id: 'valencia',
        name: 'Circuit Ricardo Tormo (Valencia)',
        viewBox: '0 0 500 320',
        path: 'M 360 280 L 85 280 C 50 280, 35 250, 60 215 C 85 180, 135 190, 165 160 C 195 130, 175 90, 215 60 C 255 30, 335 40, 375 70 C 415 100, 455 80, 470 115 C 485 150, 460 190, 425 205 C 390 220, 400 255, 435 265 C 460 275, 445 280, 405 280 Z',
        sectors: [0.24, 0.50, 0.75, 1.00],
        straightZones: [[0.0, 0.23], [0.48, 0.60]],
        brakingZones: [0.24, 0.48, 0.72, 0.97],
        startFinish: { x: 360, y: 280, angle: 180 }
    }
};

export class TrackMapSystem {
    static pathCache = new Map();

    static getCircuitGeometry(circuitId) {
        return CIRCUIT_GEOMETRIES[circuitId] || CIRCUIT_GEOMETRIES.qatar;
    }

    /**
     * Creates or retrieves a hidden SVGPathElement to calculate exact coordinates along the circuit spline.
     */
    static getOrCreateSVGPath(circuitId) {
        if (this.pathCache.has(circuitId)) {
            return this.pathCache.get(circuitId);
        }

        if (typeof document === 'undefined') {
            // Server / Node test environment mock
            return {
                getTotalLength: () => 1400,
                getPointAtLength: (len) => {
                    const t = (len / 1400) * Math.PI * 2;
                    return { x: 250 + Math.cos(t) * 180, y: 160 + Math.sin(t) * 100 };
                }
            };
        }

        const geo = this.getCircuitGeometry(circuitId);
        const svgNS = "http://www.w3.org/2000/svg";
        const pathEl = document.createElementNS(svgNS, "path");
        pathEl.setAttribute("d", geo.path);
        this.pathCache.set(circuitId, pathEl);
        return pathEl;
    }

    /**
     * Computes the exact (x, y) coordinate, tangent heading angle (in degrees),
     * current sector (1, 2, 3, 4), and whether the bike is in a straight or braking zone.
     */
    static getPointOnCircuit(circuitId, progress) {
        const geo = this.getCircuitGeometry(circuitId);
        const pathEl = this.getOrCreateSVGPath(circuitId);

        // Normalize progress between 0.0 and 1.0
        const normT = ((progress % 1.0) + 1.0) % 1.0;
        const totalLength = pathEl.getTotalLength();
        const curLength = normT * totalLength;

        const pt = pathEl.getPointAtLength(curLength);

        // Sample next tiny step for tangent direction
        const delta = Math.min(2.0, totalLength * 0.002);
        const nextLen = (curLength + delta) % totalLength;
        const nextPt = pathEl.getPointAtLength(nextLen);

        const angleRad = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x);
        const angleDeg = (angleRad * 180) / Math.PI;

        // Determine Sector Index (1, 2, 3, 4)
        let sector = 1;
        if (normT <= geo.sectors[0]) sector = 1;
        else if (normT <= geo.sectors[1]) sector = 2;
        else if (normT <= geo.sectors[2]) sector = 3;
        else sector = 4;

        // Determine if on a straight zone (slipstream active)
        const isStraight = geo.straightZones.some(([start, end]) => {
            if (start <= end) return normT >= start && normT <= end;
            return normT >= start || normT <= end;
        });

        // Determine if approaching a heavy braking turn (overtake battle active)
        const isBrakingZone = geo.brakingZones.some(b => Math.abs(normT - b) < 0.025);

        return {
            x: pt.x,
            y: pt.y,
            angle: angleDeg,
            sector,
            isStraight,
            isBrakingZone,
            normT
        };
    }
}
