/**
 * Domain 03: Inmate Simulation & Agent AI
 * Task 4.2: 15-Need Psychology Engine & Global Danger Bar Calculus
 */

export const SecurityClass = {
  MinimumSecurity: 0,
  MediumSecurity: 1,
  MaximumSecurity: 2,
  SuperMax: 3,
  DeathRow: 4,
  Insane: 5,
} as const;
export type SecurityClass = (typeof SecurityClass)[keyof typeof SecurityClass];

export const BaseDecayRates = {
  FOOD: 8.333, // Starving at 12 hours
  BLADDER: 12.5, // Full at 8 hours
  BOWEL: 6.25, // Full at 16 hours
  SLEEP: 4.167, // Exhausted at 24 hours
  HYGIENE: 5.0, // Needs shower
  EXERCISE: 4.0, // Needs yard/gym
  PRIVACY: 6.0, // Needs single cell
  FREEDOM: 5.0, // Needs free time
  COMFORT: 3.0, // Needs soft bed/chair
  FAMILY: 2.0, // Needs phone/visitation
  RECREATION: 5.0, // Needs TV/radio/pool
  SPIRITUALITY: 2.5, // Needs chapel
  LITERACY: 2.0, // Needs books/library
  WITHDRAWAL: 5.0, // Addiction withdrawal
} as const;

export interface InmateNeedsProfile {
  id: number;
  securityClass: SecurityClass;
  food: number;
  bladder: number;
  bowel: number;
  sleep: number;
  hygiene: number;
  exercise: number;
  safety: number;
  privacy: number;
  freedom: number;
  comfort: number;
  environment: number;
  family: number;
  recreation: number;
  spirituality: number;
  literacy: number;

  hasDrugAddiction: boolean;
  hasAlcoholAddiction: boolean;
  withdrawalLevel: number;
  isSuppressed: boolean;
  suppressionTimer: number;
  angerScore: number;
}

export function createDefaultNeeds(
  id: number,
  securityClass: SecurityClass = SecurityClass.MediumSecurity
): InmateNeedsProfile {
  return {
    id,
    securityClass,
    food: 10.0,
    bladder: 10.0,
    bowel: 10.0,
    sleep: 10.0,
    hygiene: 10.0,
    exercise: 10.0,
    safety: 100.0,
    privacy: 10.0,
    freedom: 10.0,
    comfort: 10.0,
    environment: 10.0,
    family: 10.0,
    recreation: 10.0,
    spirituality: 10.0,
    literacy: 10.0,
    hasDrugAddiction: false,
    hasAlcoholAddiction: false,
    withdrawalLevel: 0.0,
    isSuppressed: false,
    suppressionTimer: 0.0,
    angerScore: 0.0,
  };
}

/**
 * Calculates individual volatility and anger score based on critical unmet needs (>80%)
 */
export function computeIndividualAnger(profile: InmateNeedsProfile): number {
  let score = 0.0;

  if (profile.food > 80.0) score += (profile.food - 80.0) * 1.5;
  if (profile.sleep > 80.0) score += (profile.sleep - 80.0) * 1.2;
  if (profile.bladder > 80.0) score += (profile.bladder - 80.0) * 1.0;
  if (profile.bowel > 80.0) score += (profile.bowel - 80.0) * 1.0;
  if (profile.hygiene > 80.0) score += (profile.hygiene - 80.0) * 0.8;
  if (profile.freedom > 80.0) score += (profile.freedom - 80.0) * 1.0;
  if (profile.privacy > 80.0) score += (profile.privacy - 80.0) * 0.7;
  if (profile.safety < 20.0) score += (20.0 - profile.safety) * 2.0;
  if (profile.withdrawalLevel > 60.0) score += (profile.withdrawalLevel - 60.0) * 1.5;

  if (profile.isSuppressed) {
    score *= 0.25;
  }

  profile.angerScore = Math.min(200.0, Math.max(0.0, score));
  return profile.angerScore;
}

/**
 * Steps the polynomial accelerating need decay for an individual inmate profile
 */
export function stepInmateDecay(profile: InmateNeedsProfile, dtHours: number): void {
  const accelerate = (current: number, baseRate: number): number => {
    const factor = 1.0 + Math.pow(current / 100.0, 2);
    return Math.min(100.0, Math.max(0.0, current + baseRate * factor * dtHours));
  };

  profile.food = accelerate(profile.food, BaseDecayRates.FOOD);
  profile.bladder = accelerate(profile.bladder, BaseDecayRates.BLADDER);
  profile.bowel = accelerate(profile.bowel, BaseDecayRates.BOWEL);
  profile.sleep = accelerate(profile.sleep, BaseDecayRates.SLEEP);
  profile.hygiene = accelerate(profile.hygiene, BaseDecayRates.HYGIENE);
  profile.exercise = accelerate(profile.exercise, BaseDecayRates.EXERCISE);
  profile.privacy = accelerate(profile.privacy, BaseDecayRates.PRIVACY);
  profile.freedom = accelerate(profile.freedom, BaseDecayRates.FREEDOM);
  profile.comfort = accelerate(profile.comfort, BaseDecayRates.COMFORT);
  profile.family = accelerate(profile.family, BaseDecayRates.FAMILY);
  profile.recreation = accelerate(profile.recreation, BaseDecayRates.RECREATION);
  profile.spirituality = accelerate(profile.spirituality, BaseDecayRates.SPIRITUALITY);
  profile.literacy = accelerate(profile.literacy, BaseDecayRates.LITERACY);

  if (!profile.isSuppressed) {
    profile.safety = Math.min(100.0, Math.max(0.0, profile.safety + 2.0 * dtHours));
  }

  if (profile.hasDrugAddiction || profile.hasAlcoholAddiction) {
    profile.withdrawalLevel = Math.min(
      100.0,
      Math.max(0.0, profile.withdrawalLevel + BaseDecayRates.WITHDRAWAL * dtHours)
    );
  }

  if (profile.suppressionTimer > 0.0) {
    profile.suppressionTimer = Math.max(0.0, profile.suppressionTimer - dtHours);
    profile.isSuppressed = profile.suppressionTimer > 0.0;
  }

  computeIndividualAnger(profile);
}

/**
 * Global Prison Danger Level Calculus across all inmates
 */
export function calculatePrisonDanger(
  inmates: InmateNeedsProfile[],
  unrestPoints: number = 0.0,
  armedGuardsCount: number = 0
): number {
  if (inmates.length === 0) return 0.0;

  let totalFrustration = 0.0;

  for (let i = 0; i < inmates.length; i++) {
    const p = inmates[i];
    let individualScore = 0.0;

    if (p.food > 80.0) individualScore += (p.food - 80.0) * 1.5;
    if (p.sleep > 80.0) individualScore += (p.sleep - 80.0) * 1.2;
    if (p.freedom > 80.0) individualScore += (p.freedom - 80.0) * 1.0;
    if (p.bladder > 80.0) individualScore += (p.bladder - 80.0) * 0.8;
    if (p.safety < 20.0) individualScore += (20.0 - p.safety) * 2.0;
    if (p.withdrawalLevel > 60.0) individualScore += (p.withdrawalLevel - 60.0) * 1.2;

    let multiplier = 1.0;
    if (p.securityClass === SecurityClass.MinimumSecurity) multiplier = 0.5;
    else if (p.securityClass === SecurityClass.MediumSecurity) multiplier = 1.0;
    else if (p.securityClass === SecurityClass.MaximumSecurity) multiplier = 2.0;
    else if (p.securityClass === SecurityClass.SuperMax) multiplier = 3.5;
    else if (p.securityClass === SecurityClass.DeathRow) multiplier = 1.5;
    else if (p.securityClass === SecurityClass.Insane) multiplier = 2.5;

    totalFrustration += individualScore * multiplier;
  }

  const avgFrustration = totalFrustration / inmates.length;
  const rawDanger = avgFrustration * 2.5 + unrestPoints;
  const suppressionDiscount = armedGuardsCount * 5.0;

  return Math.min(100.0, Math.max(0.0, rawDanger - suppressionDiscount));
}

/**
 * Inmate Needs Manager handling bulk psychology updates and global telemetry
 */
export class InmateNeedsManager {
  public inmates: Map<number, InmateNeedsProfile> = new Map();
  public unrestPoints: number = 0.0;
  public armedGuardsCount: number = 0;

  public registerInmate(
    id: number,
    securityClass: SecurityClass = SecurityClass.MediumSecurity
  ): InmateNeedsProfile {
    const profile = createDefaultNeeds(id, securityClass);
    this.inmates.set(id, profile);
    return profile;
  }

  public stepAll(dtHours: number): void {
    for (const profile of this.inmates.values()) {
      stepInmateDecay(profile, dtHours);
    }
  }

  public getGlobalDanger(): number {
    const list = Array.from(this.inmates.values());
    return calculatePrisonDanger(list, this.unrestPoints, this.armedGuardsCount);
  }

  public satisfyNeed(id: number, need: keyof InmateNeedsProfile, amount: number): void {
    const profile = this.inmates.get(id);
    if (profile && typeof profile[need] === 'number') {
      (profile[need] as number) = Math.max(0.0, (profile[need] as number) - amount);
      computeIndividualAnger(profile);
    }
  }
}
