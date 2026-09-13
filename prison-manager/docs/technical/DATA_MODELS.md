# Data Models

## Overview
This document defines the core data structures and models used in the prison manager game. These models are designed to be serializable for save/load functionality and network transmission if multiplayer is ever added.

## Core Enumerations

### SecurityLevel
```javascript
const SecurityLevel = {
  MINIMUM: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  MAXIMUM: 5,
  SUPERMAX: 6
};
```

### InmateNeed
```javascript
const InmateNeed = {
  HUNGER: "hunger",
  HYGIENE: "hygiene",
  HEALTH: "health",
  COMFORT: "comfort",
  FAMILY: "family",
  RECREATION: "recreation"
};
```

### StaffRole
```javascript
const StaffRole = {
  GUARD: "guard",
  WARDEN: "warden",
  DOCTOR: "doctor",
  COOK: "cook",
  JANITOR: "janitor",
  COUNSELOR: "counselor",
  WORK_SUPERVISOR: "work_supervisor"
};
```

### RoomType
```javascript
const RoomType = {
  CELL: "cell",
  CAFETERIA: "cafeteria",
  YARD: "yard",
  INFIRMARY: "infirmary",
  WORKSHOP: "workshop",
  ADMINISTRATION: "administration",
  GUARD_ROOM: "guard_room",
  VISITATION: "visitation",
  EDUCATION: "education",
  SECURITY_OFFICE: "security_office",
  POWER_ROOM: "power_room",
  WATER_TREATMENT: "water_treatment",
  LAUNDRY: "laundry",
  STORAGE: "storage"
};
```

### IncidentType
```javascript
const IncidentType = {
  FIGHT: "fight",
  RIOT: "riot",
  ESCAPE_ATTEMPT: "escape_attempt",
  ESCAPE: "escape",
  MEDICAL_EMERGENCY: "medical_emergency",
  FIRE: "fire",
  FLOOD: "flood",
  POWER_OUTAGE: "power_outage",
  CONTABAND_FOUND: "contraband_found",
  PROTEST: "protest"
};
```

### WorkProgramType
```javascript
const WorkProgramType = {
  LICENSE_PLATES: "license_plates",
  LAUNDRY: "laundry",
  KITCHEN: "kitchen",
  FARMING: "farming",
  MAINTENANCE: "maintenance",
  TAILORING: "tailoring",
  CARPENTRY: "carpentry",
  METALWORK: "metalwork"
};
```

## Core Data Models

### 1. Coordinates
```javascript
/**
 * Grid-based position in the prison
 */
interface Position {
  x: number;   // Grid X coordinate
  y: number;   // Grid Y coordinate
  z?: number;  // For potential multi-story (optional)
}

/**
 * Bounding box for collision detection
 */
interface Bounds {
  width: number;  // In grid units
  height: number; // In grid units
  offsetX?: number; // Optional offset from position
  offsetY?: number;
}
```

### 2. Entity Base Model
```javascript
/**
 * Base entity model - all entities extend this
 */
interface Entity {
  id: string;           // Unique identifier
  type: string;         // Entity type (inmate, guard, wall, etc.)
  position: Position;   // Current position
  bounds: Bounds;       // Physical dimensions
  createdAt: number;    // Timestamp
  updatedAt: number;    // Last update timestamp
  isActive: boolean;    // Whether entity is currently active
  metadata?: Record<string, any>; // Flexible metadata storage
}
```

### 3. Inmate Model
```javascript
interface Inmate extends Entity {
  type: "inmate";
  
  // Identification
  name: string;
  inmateNumber: string;
  
  // Classification
  securityLevel: SecurityLevel;
  sentenceLength: number;     // Days remaining
  originalSentence: number;   // Total days sentenced
  crimeType: string;
  
  // Needs (0.0 to 1.0, where 0 = fully satisfied, 1 = critical)
  needs: {
    [InmateNeed.HUNGER]: number;
    [InmateNeed.HYGIENE]: number;
    [InmateNeed.HEALTH]: number;
    [InmateNeed.COMFORT]: number;
    [InmateNeed.FAMILY]: number;
    [InmateNeed.RECREATION]: number;
  };
  
  // Temperament traits (0.0 to 1.0)
  temperament: {
    aggression: number;
    cooperativeness: number;
    intelligence: number;
    impulsivity: number;
    honesty: number;
  };
  
  // Skills (0.0 to 1.0 proficiency)
  skills: {
    [WorkProgramType.LICENSE_PLATES]: number;
    [WorkProgramType.LAUNDRY]: number;
    [WorkProgramType.KITCHEN]: number;
    [WorkProgramType.FARMING]: number;
    [WorkProgramType.MAINTENANCE]: number;
    [WorkProgramType.TAILORING]: number;
    [WorkProgramType.CARPENTRY]: number;
    [WorkProgramType.METALWORK]: number;
  };
  
  // Current status
  status: {
    isIdle: boolean;
    isWorking: boolean;
    isInCell: boolean;
    isInYard: boolean;
    isInInfirmary: boolean;
    contraband: string[];     // Items currently possessed
    gangAffiliation?: string; // If any
    reputation: {
      guards: number;         // -100 to 100
      inmates: number;        // -100 to 100
      warden: number;         // -100 to 100
    };
    health: number;           // 0.0 to 1.0
    energy: number;           // 0.0 to 1.0
    stress: number;           // 0.0 to 1.0
  };
  
  // Schedule
  schedule: {
    currentActivity: string;
    activityStartTime: number; // Timestamp
    activityEndTime: number;   // Timestamp
    nextActivity: string;
  };
  
  // Relationships
  relationships: {
    friends: string[];   // Inmate IDs
    rivals: string[];    // Inmate IDs
    familyContacts: string[]; // Contact information
  };
}
```

### 4. Staff Model
```javascript
interface Staff extends Entity {
  type: "staff";
  
  // Identification
  name: string;
  employeeId: string;
  
  // Role & Qualifications
  role: StaffRole;
  qualifications: string[]; // Certifications, training completed
  experienceLevel: number;  // 0.0 to 1.0
  
  // Attributes (0.0 to 1.0)
  attributes: {
    vigilance: number;
    compassion: number;
    authority: number;
    stamina: number;
    stressResistance: number;
  };
  
  // Status
  status: {
    isOnDuty: boolean;
    currentAssignment: string; // Location or task
    fatigue: number;          // 0.0 to 1.0
    stress: number;           // 0.0 to 1.0
    morale: number;           // 0.0 to 1.0
    health: number;           // 0.0 to 1.0
  };
  
  // Schedule
  schedule: {
    shiftStart: string; // "HH:MM" format
    shiftEnd: string;
    breakTimes: Array<{start: string, end: string}>;
    overtimeHours: number;
  };
  
  // Performance
  performance: {
    effectiveness: number; // 0.0 to 1.0
    reliability: number;   // 0.0 to 1.0
    incidentResponse: number; // 0.0 to 1.0
    inmateRelations: number; // 0.0 to 1.0
  };
  
  // Relationships
  relationships: {
    friends: string[];   // Staff IDs
    preferredPartners: string[]; // For team assignments
  };
}
```

### 5. Structural Entity (Walls, Doors, Furniture)
```javascript
interface StructuralEntity extends Entity {
  type: "wall" | "door" | "window" | "furniture" | "utility";
  
  // Construction properties
  construction: {
    buildCost: number;
    buildTime: number;     // In-game minutes
    maintenanceCost: number; // Per day
    durability: number;    // 0.0 to 1.0
    material: string;      // concrete, steel, wood, etc.
  };
  
  // Functional properties
  functionality: {
    isPassable: boolean;   // Can entities move through?
    blocksVision: boolean; // Does it block line of sight?
    blocksSound: boolean;  // Sound transmission reduction
    powerConduit: boolean; // Can power run through?
    waterConduit: boolean; // Can water run through?
    ventilation: boolean;  // Does it allow air flow?
  };
  
  // Security properties
  security: {
    lockLevel: number;     // 0 (unlocked) to 5 (maximum)
    requiresKeycard: boolean;
    alarmConnected: boolean;
    cameraMonitored: boolean;
    breakInDifficulty: number; // 0.0 to 1.0
  };
  
  // Current state
  state: {
    isDamaged: boolean;
    damageLevel: number;   // 0.0 to 1.0
    isOnFire: boolean;
    isUnderRenovation: boolean;
    lastMaintained: number; // Timestamp
  };
  
  // Connections (for utilities)
  connections: {
    power: string[];   // Connected entity IDs
    water: string[];   // Connected entity IDs
    ventilation: string[]; // Connected entity IDs
  };
}
```

### 6. Room Model
```javascript
interface Room extends Entity {
  type: "room";
  
  // Definition
  roomType: RoomType;
  name: string;          // Custom name or auto-generated
  description?: string;
  
  // Spatial
  bounds: Bounds;        // Overall room bounds
  tilePositions: Position[]; // All grid tiles occupied
  
  // Capacity & Usage
  capacity: {
    maxOccupants: number;
    currentOccupants: number;
    idealOccupancy: number; // For comfort calculations
  };
  
  // Functionality
  functionality: {
    isActive: boolean;
    efficiency: number;   // 0.0 to 1.0 (affects service quality)
    requiresStaff: boolean;
    staffRequirements: {
      [StaffRole.GUARD]: number;
      [StaffRole.DOCTOR]: number;
      [StaffRole.COOK]: number;
      // etc.
    };
    utilities: {
      powerConsumption: number; // Watts
      waterUsage: number;       // Liters/hour
      ventilationNeeded: boolean;
    };
  };
  
  // Environmental
  environment: {
    temperature: number;   // Celsius
    humidity: number;      // Percentage
    cleanliness: number;   // 0.0 to 1.0
    noiseLevel: number;    // 0.0 to 1.0
    lightLevel: number;    // 0.0 to 1.0
    airQuality: number;    // 0.0 to 1.0
  };
  
  // Security
  security: {
    isLocked: boolean;
    lockdownStatus: string; // "normal", "alert", "lockdown"
    cameraCoverage: number; // 0.0 to 1.0
    guardVisibility: number; // 0.0 to 1.0
    contrabandRisk: number; // 0.0 to 1.0
  };
  
  // Contents (furniture, equipment)
  contents: {
    furniture: string[];   // Entity IDs
    equipment: string[];   // Entity IDs
    supplies: {
      [item: string]: number; // Item name -> quantity
    };
  };
  
  // Financial
  financial: {
    dailyOperatingCost: number;
    revenueGenerated: number; // For workshops, etc.
    maintenanceCost: number;
  };
}
```

### 7. Utility System Model
```javascript
interface UtilityNetwork extends Entity {
  type: "utility_network";
  
  utilityType: "power" | "water" | "ventilation";
  
  // Generation/Sources
  sources: {
    entityId: string;      // Power plant, water treatment, etc.
    capacity: number;      // Maximum output
    currentOutput: number; // Current production
    efficiency: number;    // 0.0 to 1.0
    fuelLevel?: number;    // For generators
  }[];
  
  // Distribution
  network: {
    pipes: string[];       // Conduit entity IDs
    junctions: string[];   // Junction/splitter entity IDs
    storage: string[];     // Batteries, water tanks, etc.
  };
  
  // Consumption
  consumers: {
    entityId: string;
    currentDraw: number;   // Current usage
    ratedDraw: number;     // Normal usage
    priority: number;      // 1 (essential) to 5 (luxury)
  }[];
  
  // Status
  status: {
    totalCapacity: number;
    totalConsumption: number;
    efficiency: number;    // 0.0 to 1.0
    isStable: boolean;
    fluctuations: number;  // Variance in supply/demand
    lastMaintained: number; // Timestamp
  };
  
  // Financial
  financial: {
    dailyOperatingCost: number;
    maintenanceCost: number;
    upgradeCost: number;
  };
}
```

### 8. Incident Model
```javascript
interface Incident extends Entity {
  type: "incident";
  
  // Basic info
  incidentType: IncidentType;
  severity: number;      // 0.0 to 1.0
  title: string;
  description: string;
  
  // Location & Timing
  position: Position;
  areaAffected: Bounds;  // Area where incident is occurring/spreading
  startTime: number;     // Timestamp
  estimatedEndTime?: number; // Timestamp
  actualEndTime?: number;  // Timestamp (when resolved)
  
  // Participants
  participants: {
    inmates: string[];   // Inmate IDs involved
    staff: string[];     // Staff IDs involved
    witnesses: string[]; // Entity IDs that observed
  };
  
  // Causes & Contributing Factors
  causes: {
    primary: string;     // Main cause
    contributing: string[]; // Secondary factors
    triggerEvent?: string; // Specific event that started it
  };
  
  // Progression
  progression: {
    currentStage: string; // e.g., "brewing", "active", "containing", "resolved"
    intensity: number;    // 0.0 to 1.0
    spreadRate: number;   // How fast it's spreading (0.0 to 1.0)
    containment: number;  // 0.0 to 1.0 (how well contained)
  };
  
  // Response
  response: {
    unitsDeployed: {
      guards: number;
      medical: number;
      fire: number;
    };
    tacticsUsed: string[]; // e.g., "negotiation", "tear_gas", "isolation"
    resourcesUsed: {
      // Resources consumed during response
    };
    effectiveness: number; // 0.0 to 1.0
  };
  
  // Outcomes & Consequences
  outcomes: {
    injuries: number;    // Number of people injured
    fatalities: number;  // Number of deaths
    escapes: number;     // Number of successful escapes
    contrabandSeized: string[]; // Items confiscated
    propertyDamage: number; // Estimated repair cost
    moraleImpact: {
      inmates: number;   // -1.0 to 1.0
      staff: number;     // -1.0 to 1.0
    };
    financialImpact: number; // Cost of incident + response
    policyChanges: string[]; // New policies implemented
  };
  
  // Metadata
  metadata: {
    reportedBy: string;   // Who reported it
    witnessedBy: string[]; // Who saw it
    evidence: string[];   // Evidence collected
  };
}
```

### 9. Financial Model
```javascript
interface FinancialSystem extends Entity {
  type: "financial_system";
  
  // Budget
  budget: {
    dailyAllocation: number; // Government funding per day
    currentBalance: number;
    dailyIncome: number;
    dailyExpenses: number;
    projectedBalance: number; // 30-day forecast
  };
  
  // Income Sources
  incomeSources: {
    governmentStipend: number;     // Per inmate per day
    workProgramRevenue: number;    // From license plates, etc.
    commissaryProfit: number;      // From inmate purchases
    phoneRevenue: number;          // From inmate calls
    grants: number;                // Performance-based
    finesCollected: number;        // From contraband, violations
    other: number;                 // Miscellaneous
  };
  
  // Expense Categories
  expenseCategories: {
    staffSalaries: number;
    utilities: number;
    food: number;
    medical: number;
    clothing: number;
    maintenance: number;
    securityEquipment: number;
    transportation: number;
    administrative: number;
    other: number;
  };
  
  // Cash Flow
  cashFlow: {
    dailyNet: number;           // Income - expenses
    weeklyNet: number;
    monthlyNet: number;
    runningAverage: number;     // 7-day average
    trend: "improving" | "stable" | "declining";
  };
  
  // Assets & Liabilities
  assets: {
    facilityValue: number;      // Estimated resale value
    equipmentValue: number;
    cashReserves: number;
    investments: number;
  };
  
  liabilities: {
    outstandingLoans: number;
    unpaidBills: number;
    legalReserves: number;      // For lawsuits
  };
  
  // Performance Metrics
  metrics: {
    costPerInmate: number;      // Daily cost per inmate
    revenuePerInmate: number;   // Daily revenue per inmate
    roi: number;                // Return on investment
    efficiencyScore: number;    // 0.0 to 1.0
    sustainability: number;     // Months of operation at current burn rate
  };
  
  // Alerts & Thresholds
  alerts: {
    lowFunds: boolean;          // Balance below threshold
    overspending: boolean;      // Expenses > income for 7+ days
    budgetOverrun: boolean;     // Projected to exceed allocation
    emergencyFunds: boolean;    // Using emergency reserves
  };
}
```

### 10. Policies & Regulations Model
```javascript
interface PolicySystem extends Entity {
  type: "policy_system";
  
  // Active Policies
  policies: {
    // Security Policies
    lockdownProcedures: {
      triggerLevel: string;    // What triggers lockdown
      duration: number;        // Minimum lockdown duration
      escalation: string[];    // Steps if situation worsens
    };
    
    contrabandPolicy: {
      searchFrequency: number; // Searches per day per inmate
      punishmentSeverity: number; // 0.0 to 1.0
      confiscation: boolean;   // Whether items are destroyed or stored
    };
    
    useOfForcePolicy: {
      escalationLevels: string[]; // Verbal -> restraint -> chemicals -> firearms
      approvalRequired: boolean;  // Whether supervisor approval needed
      reportingRequired: boolean; // Whether incidents must be documented
    };
    
    // Rehabilitation Policies
    educationPrograms: {
      availability: number;    // 0.0 to 1.0 (percentage of inmates eligible)
      quality: number;         // 0.0 to 1.0
      mandatory: boolean;      // Whether participation is required
    };
    
    workPrograms: {
      availability: number;    // Percentage of population that can work
      safetyStandards: number; // 0.0 to 1.0
      inmatePay: number;       // Percentage of market wage paid to inmates
    };
    
    visitationPolicy: {
      frequency: number;       // Visits per month allowed
      duration: number;        // Minutes per visit
      contactType: string;     // "contact", "non-contact", "video"
      backgroundCheckRequired: boolean;
    };
    
    // Administrative Policies
    staffingPolicy: {
      guardToInmateRatio: number; // Target ratio
      overtimeLimits: number;   // Maximum hours per week
      trainingRequirements: number; // Hours per month required
    };
    
    grievanceProcedure: {
      availability: boolean;   // Whether inmates can file grievances
      responseTime: number;    // Hours to respond
      escalationPath: string[]; // Steps if not resolved
    };
  };
  
  // Compliance Tracking
  compliance: {
    internalAudits: {
      lastAudit: number;       // Timestamp
      score: number;           // 0.0 to 1.0
      findings: string[];      // Issues found
    };
    
    externalInspections: {
      lastInspection: number;  // Timestamp
      rating: string;          // "excellent", "good", "fair", "poor", "critical"
      violations: number;      // Number of violations found
      fines: number;           // Financial penalties
    };
    
    incidentReports: {
      filingTimeliness: number; // Percentage filed on time
      accuracy: number;        // 0.0 to 1.0 (estimated accuracy)
      followUpCompletion: number; // Percentage with completed follow-up
    };
  };
  
  // Enforcement
  enforcement: {
    violationsToday: number;   // Number of policy violations today
    disciplinaryActions: {
      warnings: number;
      suspensions: number;
      terminations: number;
      inmatePunishments: number;
    };
    trainingCompleted: {
      staff: number;           // Staff who completed required training
      inmates: number;         // Inmates who completed programs
    };
  };
  
  // Financial Impact
  financialImpact: {
    complianceCost: number;    // Cost to maintain compliance
    violationFines: number;    // Fines paid for violations
    litigationCosts: number;   // Legal fees and settlements
    insurancePremiums: number; // Cost of liability insurance
  };
  
  // Public Perception
  publicPerception: {
    mediaCoverage: string;     // "positive", "neutral", "negative"
    communityRelations: number; // 0.0 to 1.0
    advocacyGroupRating: number; // 0.0 to 1.0
    politicalPressure: number;  // 0.0 to 1.0
  };
}
```

### 11. Reports & Analytics Model
```javascript
interface ReportingSystem extends Entity {
  type: "reporting_system";
  
  // Key Performance Indicators
  kpis: {
    // Safety Metrics
    violenceRate: number;      // Incidents per 1000 inmate-days
    escapeRate: number;        // Escape attempts per 1000 inmate-days
    contrabandRate: number;    // Items found per 100 inmate-days
    injuryRate: number;        // Injuries per 1000 inmate-days
    fatalityRate: number;      // Deaths per 10000 inmate-days
    
    // Operational Metrics
    staffOvertime: number;     // Average overtime hours per staff
    staffTurnover: number;     // Percentage leaving per month
    inmateGrievances: number;  // Formal complaints per 100 inmates
    medicalVisits: number;     // Clinic visits per 100 inmate-days
    
    // Financial Metrics
    costPerInmateDay: number;  // Total daily cost / inmate count
    revenuePerInmateDay: number; // Total daily revenue / inmate count
    operatingMargin: number;   // (Revenue - Expenses) / Revenue
    budgetVariance: number;    // Actual vs budgeted expenses
    
    // Rehabilitation Metrics
    programParticipation: number; // Percentage in programs
    recidivismPrediction: number; // Estimated likelihood to reoffend
    educationCompletion: number;  // Percentage completing edu programs
    vocationalCertifications: number; // Job certifications earned
    
    // Quality of Life
    inmateSatisfaction: number; // Survey-based 0.0 to 1.0
    staffSatisfaction: number;  // Survey-based 0.0 to 1.0
    nutritionQuality: number;   // Meal quality score
    recreationAccess: number;   // Hours available per week
    medicalAccess: number;      // Wait time for non-emergency care
  };
  
  // Trends & Analytics
  trends: {
    // Time series data (last 30 days)
    dailyPopulations: number[];     // Inmate count each day
    dailyIncidents: number[];       // Incident count each day
    dailyCosts: number[];           // Expenses each day
    dailyRevenue: number[];         // Income each day
    
    // Moving averages
    weeklyAvgIncidents: number[];
    weeklyAvgCosts: number[];
    weeklyAvgRevenue: number[];
    
    // Predictions
    forecastedPopulation: number[]; // Next 30 days
    forecastedCosts: number[];      // Next 30 days
    forecastedRevenue: number[];    // Next 30 days
  };
  
  // Reports
  reports: {
    generatedReports: {
      id: string;
      type: string; // "daily", "weekly", "monthly", "incident", "audit"
      generatedAt: number; // Timestamp
      generatedBy: string; // Entity ID (staff or system)
      recipients: string[]; // Entity IDs who should receive
      status: "draft" | "pending" | "completed" | "archived";
    }[];
    
    scheduledReports: {
      frequency: string; // "daily", "weekly", "monthly"
      time: string;      // "HH:MM"
      recipients: string[];
      template: string;  // Report template ID
      active: boolean;
    }[];
  };
  
  // Data Export
  export: {
    formats: string[]; // ["csv", "json", "xml", "pdf"]
    lastExport: number;  // Timestamp
    exportSettings: {
      includeSensitive: boolean;
      aggregateLevel: string; // "individual", "summary", "aggregated"
      dateRange: string;      // "last_7_days", "last_30_days", "custom"
    };
  };
}
```

## Data Relationships

### 1. Entity Relationships
```
Inmate 1---* Room (assigned cell, current location)
Inmate 1---* WorkProgram (assigned program)
Inmate 1---* Incident (as participant/victim/perpetrator)
Inmate 1---* Report (as subject of disciplinary/medical reports)
Inmate *---* Inmate (friends, rivals, gang affiliations)

Staff 1---* Room (assigned patrol station, break room)
Staff 1---* Incident (as responder/witness/involved party)
Staff 1---* Report (as author/subject)
Staff *---* Staff (friends, partners, supervisors/subordinates)

Room 1---* StructuralEntity (walls, doors, furniture)
Room 1---* UtilityNetwork (power, water, vents connections)
Room 1---* Incident (location of incident)
Room *---* Room (adjacent rooms, connected via doors)

UtilityNetwork 1---* StructuralEntity (conduits, junction boxes)
UtilityNetwork 1---* Room (serves rooms)
UtilityNetwork *---* UtilityNetwork (interconnections: power-water venting)

Incident 1---* Response (guards/medical/fire deployed)
Incident 1---* Report (incident report, investigation)
Incident *---* Inmate/Staff (participants, witnesses)

FinancialSystem 1---* Report (budget, expense, income reports)
FinancialSystem *---* Room (operating costs per room)
FinancialSystem *---* Staff (salary expenses)
FinancialSystem *---* Inmate (stipend allocation, revenue generation)

PolicySystem 1---* Report (compliance, audit reports)
PolicySystem *---* Room (standards per room type)
PolicySystem *---* Staff (training requirements per role)
PolicySystem *---* Inmate (rights, privileges, restrictions)

ReportingSystem 1---* Report (all generated reports)
ReportingSystem *---* Inmate/Staff/Room (metrics sourced from entities)
ReportingSystem *---* FinancialSystem (cost/revenue data)
ReportingSystem *---* PolicySystem (compliance metrics)
ReportingSystem *---* IncidentSystem (incident data)
```

### 2. Data Flow Patterns
```
Game Entity Updates → Needs/State Changes → Incident Detection → 
Response Coordination → Resolution → Reporting → 
Policy Review → Financial Adjustment → 
Entity State Updates (next frame)
```

```
Player Action (Build/Hire/Fire/Policy Change) → 
Immediate Entity Updates → 
Cascading Effects (Needs, Security, Finances) → 
Potential Incident Trigger → 
System Response → 
Updated Reporting → 
UI Feedback → 
Next Player Decision
```

### 3. Save/Load Structure
```
SaveGame {
  version: string;
  timestamp: number;
  gameSettings: {
    difficulty: string;
    speed: number;
    ruleset: string;
  };
  entities: {
    inmates: Inmate[];
    staff: Staff[];
    structural: StructuralEntity[];
    rooms: Room[];
    utilities: UtilityNetwork[];
    incidents: Incident[]; // Active incidents only
    financial: FinancialSystem;
    policies: PolicySystem;
    reporting: ReportingSystem;
  };
  worldState: {
    timeOfDay: number;     // Minutes since midnight
    dayCount: number;      // Days since start
    weather: {
      temperature: number;
      precipitation: number;
      wind: number;
    };
    globalEvents: string[]; // Active global events (holidays, etc.)
  };
  metadata: {
    playTime: number;      // Total playtime in seconds
    saveCount: number;     // Number of times saved
    achievements: string[]; // Unlocked achievements
  };
}
```

## Implementation Guidelines

### 1. Data Validation
- All numeric values should be clamped to valid ranges on assignment
- String lengths should be limited for network efficiency
- Reference integrity: when an entity is deleted, all references should be cleared or marked invalid
- Default values should be sensible for new entities

### 2. Serialization
- Use JSON for save/load with revision handling
- Consider binary serialization for network transmission if multiplayer added
- Implement versioning system for save file compatibility
- Exclude transient/runtime-only data from serialization

### 3. Performance Considerations
- Frequently accessed components (Position, Needs) should be cache-friendly
- Use object pooling for entities that are frequently created/destroyed
- Implement dirty flags to minimize unnecessary updates
- Spatial queries should use grid-based lookup for O(1) access

### 4. Extensibility
- New component types should be registered with the ECS system
- New entity types should follow existing patterns
- Enumerations should be designed to be extensible (allow custom values)
- Event system should allow custom event types

### 5. Security & Privacy
- Inmate personal information should be treated as sensitive
- Staff personal information should be protected
- Financial data should be encrypted at rest if required
- Audit trails should be maintained for policy changes and financial transactions