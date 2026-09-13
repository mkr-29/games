# Prison Manager - 2D Prison Management Game

## Overview
A 2D top-down prison management simulation where players act as prison governor, responsible for designing, building, managing, and maintaining a correctional facility while balancing security, rehabilitation, budget, and inmate welfare.

## Core Gameplay Loop
1. **Plan & Build** - Design prison layout, construct facilities
2. **Manage Resources** - Balance budget, staff, supplies
3. **Supervise Inmates** - Monitor needs, behavior, programs
4. **Respond to Events** - Handle riots, escapes, emergencies
5. **Evaluate & Adapt** - Review reports, adjust strategies

## Core Systems

### Facility Management
- **Construction System**: Grid-based building of walls, doors, rooms
- **Room Types**: Cells, cafeterias, workshops, yards, infirmaries, visitation, administration
- **Utilities**: Power, water, heating, ventilation systems
- **Security**: Cameras, alarms, armed guards, lockdown protocols

### Inmate Management
- **Classification System**: Security levels (minimum/medium/maximum), sentence lengths, crime types
- **Needs System**: Hunger, hygiene, health, comfort, family contact, recreation
- **Behavior System**: Gang affiliation, temperament, rehabilitation progress, contraband tendency
- **Schedule System**: Work, meals, recreation, lockdown, sleep times

### Staff Management
- **Roles**: Guards, wardens, doctors, cooks, janitors, counselors, work supervisors
- **Training System**: Skill development, certifications
- **Morale System**: Stress, fatigue, satisfaction affecting performance
- **Assignment System**: Patrol routes, station duties, shift rotations

### Economy & Resources
- **Budget System**: Operating costs, revenue from government/fines/work programs
- **Supply Chain**: Food, medicine, clothing, equipment procurement
- **Work Programs**: License plate making, laundry, kitchen work, farming (income generation)
- **Grants & Funding**: Performance-based subsidies for low recidivism

### Security & Operations
- **Contraband System**: Detection, searches, inmate ingenuity
- **Incident Response**: Riots, fights, escapes, medical emergencies
- **Intelligence Gathering**: Informants, surveillance, shakedowns
- **Lockdown Procedures**: Progressive security levels

## End-to-End Game Flow

### 1. Initial Setup (First 15 minutes)
- Choose difficulty/starting conditions (empty lot, pre-built facility, crisis scenario)
- Set prison name and basic parameters (capacity, security focus)
- Tutorial guides first cell block construction and basic staff hiring
- Initial intake of low-risk inmates to establish baseline

### 2. Facility Development (Ongoing)
- **Assessment Phase**: Review inmate needs, security reports, financial status
- **Planning Phase**: Design new facilities based on gaps (more yards if recreation low, infirmary if illness spreading)
- **Construction Phase**: Build facilities, connect utilities, staff appropriately
- **Activation Phase**: Open new areas, transfer inmates, monitor adjustment period

### 3. Daily Operations Cycle
- **Morning Shift** (6:00-12:00):
  - Cell searches and contraband sweeps
  - Breakfast service and morning yard time
  - Work program assignments begin
  - Medical sick call and medication distribution
  
- **Afternoon Shift** (12:00-18:00):
  - Lunch service and visitation hours
  - Continued work programs and education classes
  - Recreation time in yards/gyms
  - Staff rotations and break coverage
  
- **Evening Shift** (18:00-24:00):
  - Dinner service and evening yard/rec time
  - Family phone calls and personal time
  - Cell lockdown procedures begin
  - Night shift guard assignments

- **Night Shift** (00:00-6:00):
  - Reduced staff levels, increased patrol frequency
  - Lights out and sleep monitoring
  - Contraband moving hours (higher risk)
  - Emergency response readiness

### 4. Progression & Challenges
- **Inmate Population Growth**: Gradual increase requiring facility expansion
- **Sentence Completion**: Inmates release, affecting reputation and funding
- **New Inmate Types**: Higher security prisoners with special needs
- **Events System**: 
  - Routine: Inspections, holidays, gang tensions
  - Crisis: Riots, escapes, fires, medical outbreaks
  - Opportunities: Grants, celebrity visits, positive press

### 5. Victory & Failure Conditions
- **Success Metrics** (player-defined goals):
  - Low recidivism rates (<20%)
  - High inmate satisfaction (>70%)
  - Financial self-sufficiency
  - Zero major incidents for 30 days
  
- **Failure Conditions**:
  - Budget bankruptcy (negative funds for 7+ days)
  - Mass escape (>5 inmates simultaneously)
  - Three major riots in 30 days
  - Government takeover due to violations

## 2D-Specific Implementation Considerations

### Visual Design
- **Top-down Perspective**: Clear visibility of facility layout and inmate movement
- **Sprite-Based Graphics**: Distinct visuals for different inmate types, staff roles, objects
- **Color Coding**: Security levels (green/yellow/red), needs status, room functions
- **Overlay Systems**: Heatmaps for crime density, need satisfaction, staff coverage

### User Interface
- **Build Menu**: Tab-based categorization (Security, Utilities, Living, Work, Medical)
- **Information Panels**: Real-time graphs for budget, population, incident rates
- **Contextual Actions**: Click on rooms/staff/inmates for detailed management options
- **Alert System**: Priority notifications requiring immediate attention

### Technical Architecture
- **Grid-Based World**: Tile-based construction with snap-to-grid placement
- **Time System**: Adjustable speed (pause, 1x, 2x, 5x, 10x) with real-time scheduling
- **AI Systems**: 
  - Inmate AI: Needs-driven behavior with personality traits
  - Staff AI: Task-oriented with fatigue and morale factors
  - Emergency AI: Dynamic response based on incident type and location
- **Data Systems**: 
  - Save/load with JSON serialization
  - Statistics tracking for progression and achievements
  - Mod support for custom content

## Recommended Technology Stack
- **Engine**: Phaser 3 or Godot (both excellent for 2D tile-based games)
- **Language**: TypeScript/JavaScript (for web deployment) or GDScript (Godot)
- **Architecture**: Entity-Component-System for flexible AI and object behavior
- **Storage**: LocalStorage or IndexedDB for save games
- **Deployment**: Web browser primary target, with optional desktop exports

## Scope for MVP (Minimum Viable Product)
- **Core Systems**: Construction, basic needs (hunger, sleep), guard staff
- **Facility Types**: Cells, cafeteria, yard, infirmary, guard room
- **Inmate Types**: Low/medium security with basic behavior
- **Events**: Fights, medical emergencies, contraband finds
- **UI**: Basic build menu, information panels, time controls
- **Progression**: 30-minute play session with clear feedback loops

This design provides a solid foundation for an engaging 2D prison management game that captures the depth of titles like Prison Architect while being accessible for 2D implementation.