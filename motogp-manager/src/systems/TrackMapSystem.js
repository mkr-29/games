// TrackMapSystem.js - Authentic 2D Grand Prix Circuit Geometries & Telemetry Splines for All 22 Rounds

export const CIRCUIT_GEOMETRIES = {
    // 1. Thailand - Chang International Circuit (Buriram) (12 Turns, Clockwise)
    thailand: {
        id: 'thailand',
        name: 'Chang International Circuit (Buriram)',
        viewBox: '0 0 1020 520',
        path: 'M 25 470 L 210 80 C 220 60, 245 65, 275 75 L 660 140 C 720 150, 850 170, 950 190 C 985 200, 995 240, 965 260 L 350 170 C 310 170, 280 200, 260 230 L 170 340 C 140 380, 155 425, 205 425 C 245 425, 270 410, 290 375 L 360 270 C 380 260, 420 260, 470 265 L 590 285 C 620 290, 630 310, 630 340 L 640 430 C 640 465, 620 485, 580 485 C 520 450, 450 420, 380 470 L 60 485 C 30 485, 15 485, 25 470 Z',
        sectors: [0.24, 0.50, 0.75, 1.00],
        straightZones: [[0.0, 0.08], [0.10, 0.32], [0.85, 0.98]], // Main straight, 1.000km Back Straight (T1-T3), and bottom straight (T11-T12)
        brakingZones: [0.08, 0.32, 0.48, 0.70, 0.98], // T1, T3 (heaviest), T5, T8, T12 (final hairpin)
        startFinish: { x: 55, y: 380, angle: -65 },
        turns: [
            { num: 1, x: 220, y: 75 },
            { num: 2, x: 660, y: 140 },
            { num: 3, x: 975, y: 230 },
            { num: 4, x: 310, y: 175 },
            { num: 5, x: 150, y: 390 },
            { num: 6, x: 255, y: 410 },
            { num: 7, x: 360, y: 265 },
            { num: 8, x: 615, y: 305 },
            { num: 9, x: 625, y: 475 },
            { num: 10, x: 480, y: 430 },
            { num: 11, x: 370, y: 475 },
            { num: 12, x: 30, y: 480 }
        ]
    },

    // 2. Qatar - Lusail International Circuit (16 Turns, Clockwise)
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
        viewBox: '0 0 580 340',
        path: 'M 380 290 L 80 290 C 55 290, 40 265, 45 235 C 15 185, 20 85, 75 45 C 130 30, 185 40, 220 65 C 245 85, 235 110, 195 120 L 145 120 C 95 135, 105 170, 155 210 C 190 235, 230 240, 245 205 L 300 95 C 315 65, 345 65, 360 80 L 480 185 C 505 210, 520 235, 495 245 C 475 250, 465 230, 470 200 L 460 135 C 475 75, 525 70, 545 85 C 565 105, 555 150, 550 190 L 550 240 C 550 290, 525 290, 490 290 L 380 290 Z',
        sectors: [0.26, 0.50, 0.76, 1.00],
        straightZones: [[0.0, 0.22], [0.52, 0.64]], // 1.047km main straight & back straight
        brakingZones: [0.21, 0.38, 0.65, 0.95],
        startFinish: { x: 380, y: 290, angle: 180 },
        turns: [
            { num: 1, x: 60, y: 285 },
            { num: 2, x: 45, y: 235 },
            { num: 3, x: 30, y: 95 },
            { num: 4, x: 220, y: 65 },
            { num: 5, x: 120, y: 130 },
            { num: 6, x: 150, y: 205 },
            { num: 7, x: 245, y: 205 },
            { num: 8, x: 295, y: 120 },
            { num: 9, x: 335, y: 65 },
            { num: 10, x: 505, y: 235 },
            { num: 11, x: 470, y: 190 },
            { num: 12, x: 490, y: 80 },
            { num: 13, x: 550, y: 130 },
            { num: 14, x: 550, y: 240 }
        ]
    },

    // 8. Italy - Autodromo Internazionale del Mugello (15 Turns, Clockwise)
    mugello: {
        id: 'mugello',
        name: 'Autodromo Internazionale del Mugello',
        viewBox: '0 0 700 400',
        path: 'M 350 210 L 90 205 C 50 200, 50 155, 90 150 L 140 140 C 170 125, 175 90, 200 75 C 215 65, 235 75, 250 80 L 330 95 C 345 105, 365 95, 385 75 C 400 65, 430 75, 450 85 L 495 105 C 515 125, 525 175, 545 195 L 600 195 C 655 200, 665 255, 645 285 L 580 305 L 515 325 C 490 310, 485 280, 465 270 L 350 280 C 300 285, 280 260, 305 235 C 325 220, 360 235, 380 245 C 400 255, 440 240, 470 245 L 590 270 C 630 270, 640 240, 620 215 L 480 210 L 350 210 Z',
        sectors: [0.26, 0.50, 0.76, 1.00],
        straightZones: [[0.0, 0.20], [0.88, 1.00]], // 1.141km main straight across blind crest into San Donato
        brakingZones: [0.18, 0.35, 0.65, 0.88],
        startFinish: { x: 350, y: 210, angle: 180 },
        turns: [
            { num: 1, x: 60, y: 175 },
            { num: 2, x: 155, y: 130 },
            { num: 3, x: 200, y: 75 },
            { num: 4, x: 345, y: 95 },
            { num: 5, x: 390, y: 75 },
            { num: 6, x: 515, y: 125 },
            { num: 7, x: 550, y: 195 },
            { num: 8, x: 635, y: 205 },
            { num: 9, x: 655, y: 275 },
            { num: 10, x: 515, y: 325 },
            { num: 11, x: 475, y: 275 },
            { num: 12, x: 290, y: 260 },
            { num: 13, x: 380, y: 245 },
            { num: 14, x: 450, y: 245 },
            { num: 15, x: 625, y: 245 }
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

    // 12. Czech Republic - Automotodrom Brno (14 Turns, Clockwise)
    brno: {
        id: 'brno',
        name: 'Automotodrom Brno',
        viewBox: '0 0 560 360',
        path: 'M 180 290 L 420 290 C 455 290, 480 265, 465 235 L 430 180 C 415 155, 430 130, 460 115 L 500 95 C 530 80, 530 45, 495 35 L 390 35 C 355 35, 335 60, 310 85 L 260 135 C 235 160, 205 160, 180 135 L 140 95 C 115 70, 80 80, 70 115 L 60 180 C 50 220, 80 255, 120 265 L 180 290 Z',
        sectors: [0.25, 0.50, 0.75, 1.00],
        straightZones: [[0.0, 0.22], [0.45, 0.60]], // Main straight & hillside back straight
        brakingZones: [0.22, 0.44, 0.70, 0.94],
        startFinish: { x: 180, y: 290, angle: 0 },
        turns: [
            { num: 1, x: 455, y: 285 },
            { num: 2, x: 465, y: 235 },
            { num: 3, x: 430, y: 180 },
            { num: 4, x: 460, y: 115 },
            { num: 5, x: 515, y: 80 },
            { num: 6, x: 495, y: 35 },
            { num: 7, x: 390, y: 35 },
            { num: 8, x: 310, y: 85 },
            { num: 9, x: 260, y: 135 },
            { num: 10, x: 180, y: 135 },
            { num: 11, x: 140, y: 95 },
            { num: 12, x: 70, y: 115 },
            { num: 13, x: 60, y: 180 },
            { num: 14, x: 120, y: 265 }
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

    // 12. Austria - Red Bull Ring (Spielberg) (10 Turns, Clockwise)
    spielberg: {
        id: 'spielberg',
        name: 'Red Bull Ring (Spielberg)',
        viewBox: '0 0 600 380',
        path: 'M 420 240 L 320 315 C 305 330, 285 315, 270 290 L 170 205 C 130 170, 95 140, 75 120 C 60 100, 75 85, 105 75 L 290 45 C 325 45, 335 65, 315 100 L 280 125 C 225 155, 205 185, 225 230 C 240 250, 270 255, 290 230 C 305 205, 310 175, 345 150 L 450 90 C 475 80, 490 95, 490 115 L 525 145 C 535 160, 520 175, 495 195 L 420 240 Z',
        sectors: [0.25, 0.52, 0.76, 1.00],
        straightZones: [[0.0, 0.12], [0.15, 0.32], [0.36, 0.48], [0.85, 1.00]], // Main straight, uphill Schönberg straight, downhill run to T4
        brakingZones: [0.12, 0.32, 0.48, 0.82],
        startFinish: { x: 420, y: 240, angle: 137 },
        turns: [
            { num: 1, x: 295, y: 320 },
            { num: 2, x: 170, y: 205 },
            { num: 3, x: 75, y: 110 },
            { num: 4, x: 325, y: 55 },
            { num: 5, x: 305, y: 105 },
            { num: 6, x: 215, y: 175 },
            { num: 7, x: 245, y: 240 },
            { num: 8, x: 305, y: 185 },
            { num: 9, x: 475, y: 90 },
            { num: 10, x: 515, y: 150 }
        ]
    },

    // 13. Hungary - Balaton Park Circuit (16 Turns, Counter-Clockwise)
    balaton: {
        id: 'balaton',
        name: 'Balaton Park Circuit',
        viewBox: '0 0 540 600',
        path: 'M 370 80 L 90 80 C 70 75, 85 55, 135 25 C 130 15, 90 10, 45 20 C 25 35, 20 65, 25 105 C 25 125, 45 125, 90 125 L 380 125 C 395 130, 385 160, 375 180 C 425 240, 425 280, 375 360 L 290 445 C 250 485, 240 500, 255 510 C 265 520, 245 530, 235 540 L 195 575 C 180 590, 210 595, 230 575 L 340 470 C 410 390, 450 270, 455 170 L 455 160 C 455 155, 485 160, 495 155 L 505 110 C 510 85, 480 55, 460 55 C 445 55, 430 70, 415 80 L 370 80 Z',
        sectors: [0.24, 0.48, 0.74, 1.00],
        straightZones: [[0.0, 0.12], [0.20, 0.32], [0.65, 0.85]], // Main straight, back straight (T4-T5), and long uphill straight (T10-T12)
        brakingZones: [0.12, 0.33, 0.58, 0.88],
        startFinish: { x: 370, y: 80, angle: 180 },
        turns: [
            { num: 1, x: 75, y: 70 },
            { num: 2, x: 130, y: 20 },
            { num: 3, x: 35, y: 30 },
            { num: 4, x: 30, y: 115 },
            { num: 5, x: 390, y: 130 },
            { num: 6, x: 375, y: 175 },
            { num: 7, x: 425, y: 260 },
            { num: 8, x: 245, y: 495 },
            { num: 9, x: 260, y: 515 },
            { num: 10, x: 190, y: 580 },
            { num: 11, x: 410, y: 390 },
            { num: 12, x: 455, y: 160 },
            { num: 13, x: 495, y: 155 },
            { num: 14, x: 505, y: 110 },
            { num: 15, x: 465, y: 55 },
            { num: 16, x: 425, y: 75 }
        ]
    },

    // 14. Aragon - MotorLand Aragón (17 Turns, Counter-Clockwise)
    aragon: {
        id: 'aragon',
        name: 'MotorLand Aragón',
        viewBox: '0 0 640 400',
        path: 'M 450 205 L 380 150 C 360 140, 380 175, 340 200 C 290 215, 265 140, 210 70 C 185 70, 175 130, 125 155 C 100 135, 110 50, 85 25 C 45 15, 25 55, 35 105 C 55 170, 100 205, 135 185 C 170 170, 210 220, 205 250 L 205 275 L 260 290 L 510 340 C 560 345, 575 305, 530 270 L 450 205 Z',
        sectors: [0.24, 0.48, 0.74, 1.00],
        straightZones: [[0.0, 0.12], [0.60, 0.85]], // Start/Finish straight & 968m Back Straight
        brakingZones: [0.12, 0.35, 0.58, 0.86],
        startFinish: { x: 450, y: 205, angle: -38 },
        turns: [
            { num: 1, x: 375, y: 145 },
            { num: 2, x: 365, y: 175 },
            { num: 3, x: 330, y: 200 },
            { num: 4, x: 280, y: 200 },
            { num: 5, x: 245, y: 120 },
            { num: 6, x: 200, y: 70 },
            { num: 7, x: 175, y: 125 },
            { num: 8, x: 120, y: 155 },
            { num: 9, x: 85, y: 35 },
            { num: 10, x: 35, y: 60 },
            { num: 11, x: 45, y: 150 },
            { num: 12, x: 105, y: 200 },
            { num: 13, x: 165, y: 175 },
            { num: 14, x: 205, y: 250 },
            { num: 15, x: 205, y: 275 },
            { num: 16, x: 545, y: 340 },
            { num: 17, x: 550, y: 285 }
        ]
    },

    // 15. San Marino - Misano World Circuit Marco Simoncelli (16 Turns, Clockwise)
    misano: {
        id: 'misano',
        name: 'Misano World Circuit Marco Simoncelli',
        viewBox: '0 0 650 500',
        path: 'M 360 220 L 290 360 C 280 390, 250 390, 215 420 C 205 450, 205 480, 170 485 L 50 485 C 30 480, 25 450, 60 430 L 110 460 C 120 460, 130 440, 150 420 L 335 175 C 360 140, 340 105, 290 125 L 180 195 C 130 215, 90 195, 100 160 C 110 140, 150 130, 200 115 L 390 35 C 420 20, 460 30, 560 55 C 610 70, 645 105, 640 145 L 610 225 C 600 240, 585 220, 580 155 C 575 110, 530 75, 450 65 C 420 65, 405 95, 385 140 L 360 220 Z',
        sectors: [0.25, 0.50, 0.75, 1.00],
        straightZones: [[0.0, 0.12], [0.22, 0.35], [0.55, 0.70]], // Main straight, back straight to Quercia, and Curvone straight
        brakingZones: [0.12, 0.22, 0.36, 0.52, 0.72, 0.90],
        startFinish: { x: 360, y: 220, angle: 115 },
        turns: [
            { num: 1, x: 280, y: 380 },
            { num: 2, x: 235, y: 400 },
            { num: 3, x: 205, y: 475 },
            { num: 4, x: 35, y: 465 },
            { num: 5, x: 60, y: 430 },
            { num: 6, x: 110, y: 460 },
            { num: 7, x: 250, y: 290 },
            { num: 8, x: 345, y: 125 },
            { num: 9, x: 145, y: 205 },
            { num: 10, x: 95, y: 175 },
            { num: 11, x: 420, y: 25 },
            { num: 12, x: 575, y: 60 },
            { num: 13, x: 635, y: 125 },
            { num: 14, x: 605, y: 235 },
            { num: 15, x: 565, y: 105 },
            { num: 16, x: 425, y: 75 }
        ]
    },

    // 18. Indonesia - Pertamina Mandalika Circuit (17 Turns, Clockwise)
    mandalika: {
        id: 'mandalika',
        name: 'Pertamina Mandalika Circuit',
        viewBox: '0 0 760 980',
        path: 'M 300 135 L 640 55 C 665 50, 680 65, 680 90 L 680 235 C 680 255, 665 265, 640 265 L 610 265 C 590 265, 580 280, 580 300 C 580 320, 595 335, 620 350 L 690 410 C 710 425, 715 445, 715 470 L 715 565 C 715 585, 705 605, 685 630 L 615 705 C 595 720, 575 725, 555 725 C 525 725, 505 740, 485 760 L 415 820 L 195 940 C 165 955, 150 940, 150 905 L 150 745 C 150 725, 165 710, 195 700 L 285 660 C 305 650, 315 630, 315 600 L 315 435 C 315 405, 300 385, 275 375 L 190 355 C 160 350, 140 330, 115 295 L 60 180 C 45 155, 45 125, 55 95 L 75 45 C 85 20, 115 20, 125 45 L 125 140 C 125 165, 135 170, 160 165 L 300 135 Z',
        sectors: [0.25, 0.50, 0.75, 1.00],
        straightZones: [[0.0, 0.15], [0.55, 0.70]], // 507m Start/Finish Straight & T9-T10 full throttle run
        brakingZones: [0.15, 0.28, 0.42, 0.68, 0.90, 0.98],
        startFinish: { x: 300, y: 135, angle: 12 },
        turns: [
            { num: 1, x: 670, y: 65 },
            { num: 2, x: 670, y: 255 },
            { num: 3, x: 600, y: 265 },
            { num: 4, x: 580, y: 310 },
            { num: 5, x: 710, y: 430 },
            { num: 6, x: 715, y: 575 },
            { num: 7, x: 605, y: 715 },
            { num: 8, x: 505, y: 740 },
            { num: 9, x: 415, y: 820 },
            { num: 10, x: 165, y: 940 },
            { num: 11, x: 160, y: 725 },
            { num: 12, x: 305, y: 650 },
            { num: 13, x: 305, y: 400 },
            { num: 14, x: 175, y: 355 },
            { num: 15, x: 45, y: 165 },
            { num: 16, x: 100, y: 20 },
            { num: 17, x: 135, y: 170 }
        ]
    },

    // 17. Japan - Mobility Resort Motegi (14 Turns, Clockwise)
    motegi: {
        id: 'motegi',
        name: 'Mobility Resort Motegi',
        viewBox: '0 0 700 440',
        path: 'M 400 380 L 160 380 C 135 380, 125 365, 125 345 C 125 325, 135 310, 160 310 L 400 285 C 425 285, 440 270, 440 250 C 440 230, 425 215, 395 215 L 155 260 C 125 265, 115 245, 130 220 L 165 170 C 180 150, 210 145, 255 145 L 340 145 C 360 145, 375 130, 375 110 C 375 80, 400 70, 430 75 L 500 110 C 525 125, 545 120, 540 90 L 515 25 C 510 5, 535 5, 540 25 L 625 315 C 630 335, 615 345, 590 345 L 500 345 C 475 345, 455 360, 450 380 Z',
        sectors: [0.24, 0.49, 0.74, 1.00],
        straightZones: [[0.0, 0.18], [0.52, 0.74]], // Main straight & 762m downhill back straight to Turn 11
        brakingZones: [0.18, 0.32, 0.50, 0.74, 0.94], // T1, T3, T5, T11 (heaviest braking zone), T12
        startFinish: { x: 300, y: 380, angle: 180 },
        turns: [
            { num: 1, x: 135, y: 375 },
            { num: 2, x: 135, y: 320 },
            { num: 3, x: 425, y: 285 },
            { num: 4, x: 420, y: 220 },
            { num: 5, x: 120, y: 250 },
            { num: 6, x: 175, y: 155 },
            { num: 7, x: 355, y: 145 },
            { num: 8, x: 400, y: 75 },
            { num: 9, x: 535, y: 115 },
            { num: 10, x: 525, y: 12 },
            { num: 11, x: 620, y: 335 },
            { num: 12, x: 505, y: 345 },
            { num: 13, x: 455, y: 375 }
        ]
    },

    // 19. Australia - Phillip Island Grand Prix Circuit (12 Turns, Counter-Clockwise)
    phillip_island: {
        id: 'phillip_island',
        name: 'Phillip Island Grand Prix Circuit',
        viewBox: '0 0 760 500',
        path: 'M 100 310 L 520 310 C 570 310, 610 330, 630 380 L 655 440 C 675 490, 740 490, 740 430 L 640 260 C 615 240, 540 220, 480 210 L 460 205 C 435 200, 435 180, 460 175 L 570 170 C 600 170, 600 120, 560 110 L 480 90 C 420 95, 360 85, 310 40 C 270 5, 210 20, 160 80 L 150 135 C 145 150, 155 155, 170 145 C 140 100, 70 100, 35 140 L 15 220 C 5 270, 30 310, 100 310 Z',
        sectors: [0.23, 0.48, 0.74, 1.00],
        straightZones: [[0.85, 0.12], [0.30, 0.40]], // 900m Gardner Straight & T2-T3 Stoner Sweeper run
        brakingZones: [0.12, 0.28, 0.46, 0.72], // T1 (Doohan), T4 (Miller Corner), T6 (Siberia), T10 (MG corner)
        startFinish: { x: 310, y: 310, angle: 0 },
        turns: [
            { num: 1, x: 575, y: 335 },
            { num: 2, x: 710, y: 470 },
            { num: 3, x: 610, y: 240 },
            { num: 4, x: 445, y: 190 },
            { num: 5, x: 520, y: 170 },
            { num: 6, x: 595, y: 140 },
            { num: 7, x: 480, y: 90 },
            { num: 8, x: 380, y: 95 },
            { num: 9, x: 230, y: 20 },
            { num: 10, x: 150, y: 150 },
            { num: 11, x: 75, y: 110 },
            { num: 12, x: 25, y: 290 }
        ]
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
