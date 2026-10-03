/**
 * Domain 03: Inmate Simulation & Agent AI
 * Task 4.3: Utility AI Behavior Scoring & Action State Machine (HFSM)
 */

import type { InmateNeedsProfile } from './InmateNeedsManager.ts';

export const InmateAction = {
  Eat: 0,
  Sleep: 1,
  UseToilet: 2,
  Shower: 3,
  Exercise: 4,
  WanderFreeTime: 5,
  Work: 6,
  LockupInCell: 7,
} as const;
export type InmateAction = (typeof InmateAction)[keyof typeof InmateAction];

export const RegimeActivity = {
  Lockdown: 0,
  Sleep: 1,
  Eat: 2,
  Yard: 3,
  Shower: 4,
  WorkLockup: 5,
  WorkFreeTime: 6,
  FreeTime: 7,
} as const;
export type RegimeActivity = (typeof RegimeActivity)[keyof typeof RegimeActivity];

export interface ActionFacilityDistances {
  distCanteen: number;
  distBed: number;
  distToilet: number;
  distShower: number;
  distYard: number;
  distWorkplace: number;
  distCell: number;
}

export function createDefaultDistances(): ActionFacilityDistances {
  return {
    distCanteen: 10.0,
    distBed: 5.0,
    distToilet: 2.0,
    distShower: 8.0,
    distYard: 15.0,
    distWorkplace: 20.0,
    distCell: 5.0,
  };
}

/**
 * Evaluates the utility score for an action given needs, distances, and regime mandate.
 */
export function scoreAction(
  action: InmateAction,
  needs: InmateNeedsProfile,
  distances: ActionFacilityDistances,
  regime: RegimeActivity
): number {
  let score = 0.0;

  switch (action) {
    case InmateAction.Eat: {
      const intensity = Math.pow(needs.food / 100.0, 2) * 100.0;
      score += intensity * 1.5;
      if (needs.food > 80.0) {
        score += (needs.food - 80.0) * 3.0; // Urgent hunger spike
      }
      score -= distances.distCanteen * 0.3;
      if (regime === RegimeActivity.Eat) {
        score += 150.0; // Regime mandate bonus
      }
      break;
    }
    case InmateAction.Sleep: {
      const intensity = Math.pow(needs.sleep / 100.0, 2) * 100.0;
      score += intensity * 1.2;
      if (needs.sleep > 80.0) {
        score += (needs.sleep - 80.0) * 2.5;
      }
      score -= distances.distBed * 0.2;
      if (regime === RegimeActivity.Sleep) {
        score += 200.0;
      }
      break;
    }
    case InmateAction.UseToilet: {
      const maxNeed = Math.max(needs.bladder, needs.bowel);
      const intensity = Math.pow(maxNeed / 100.0, 2) * 100.0;
      score += intensity * 1.8;
      if (maxNeed > 80.0) {
        // Emergency relief takes precedence over almost anything
        score += (maxNeed - 80.0) * 5.0 + 50.0;
      }
      score -= distances.distToilet * 0.1;
      break;
    }
    case InmateAction.Shower: {
      const intensity = Math.pow(needs.hygiene / 100.0, 2) * 100.0;
      score += intensity * 1.0;
      if (needs.hygiene > 80.0) {
        score += (needs.hygiene - 80.0) * 2.0;
      }
      score -= distances.distShower * 0.3;
      if (regime === RegimeActivity.Shower) {
        score += 120.0;
      }
      break;
    }
    case InmateAction.Exercise: {
      const intensity = Math.pow(needs.exercise / 100.0, 2) * 100.0;
      score += intensity * 0.9;
      score -= distances.distYard * 0.2;
      if (regime === RegimeActivity.Yard) {
        score += 110.0;
      }
      break;
    }
    case InmateAction.WanderFreeTime: {
      const freedomInt = Math.pow(needs.freedom / 100.0, 2) * 50.0;
      const recInt = Math.pow(needs.recreation / 100.0, 2) * 50.0;
      score += freedomInt + recInt + 10.0;
      if (regime === RegimeActivity.FreeTime || regime === RegimeActivity.WorkFreeTime) {
        score += 60.0;
      }
      break;
    }
    case InmateAction.Work: {
      if (regime === RegimeActivity.WorkLockup || regime === RegimeActivity.WorkFreeTime) {
        score += 100.0;
      }
      score -= distances.distWorkplace * 0.2;
      break;
    }
    case InmateAction.LockupInCell: {
      if (regime === RegimeActivity.Lockdown) {
        score += 250.0;
      } else if (regime === RegimeActivity.WorkLockup) {
        score += 80.0;
      }
      score -= distances.distCell * 0.1;
      break;
    }
  }

  return Math.max(0.0, score);
}

export function selectBestAction(
  needs: InmateNeedsProfile,
  distances: ActionFacilityDistances,
  regime: RegimeActivity
): { action: InmateAction; score: number } {
  const actions: InmateAction[] = [
    InmateAction.UseToilet,
    InmateAction.Eat,
    InmateAction.Sleep,
    InmateAction.Shower,
    InmateAction.Exercise,
    InmateAction.WanderFreeTime,
    InmateAction.Work,
    InmateAction.LockupInCell,
  ];

  let bestAction: InmateAction = InmateAction.WanderFreeTime;
  let bestScore = -1.0;

  for (const act of actions) {
    const s = scoreAction(act, needs, distances, regime);
    if (s > bestScore) {
      bestScore = s;
      bestAction = act;
    }
  }

  return { action: bestAction, score: bestScore };
}

export type AgentStateKind =
  | 'SelectNextAction'
  | 'NavigatingToTarget'
  | 'InteractingWithObject'
  | 'NeedSatisfied'
  | 'Interrupted';

export interface AgentBehaviorState {
  kind: AgentStateKind;
  action: InmateAction | null;
  targetX: number;
  targetY: number;
  progress: number;
  totalDuration: number;
}

export class InmateHFSM {
  public state: AgentBehaviorState;
  public x: number;
  public y: number;
  public speed: number = 3.5;
  public isCompliant: boolean = true;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.state = {
      kind: 'SelectNextAction',
      action: null,
      targetX: x,
      targetY: y,
      progress: 0.0,
      totalDuration: 0.0,
    };
  }

  public getTargetForAction(action: InmateAction): { x: number; y: number } {
    switch (action) {
      case InmateAction.UseToilet:
        return { x: 246.0, y: 246.0 };
      case InmateAction.Eat:
        return { x: 256.0, y: 245.0 };
      case InmateAction.Sleep:
        return { x: 245.0, y: 246.0 };
      case InmateAction.Shower:
        return { x: 244.0, y: 247.0 };
      case InmateAction.Exercise:
        return { x: 246.0, y: 265.0 };
      case InmateAction.WanderFreeTime:
        return { x: this.x + (Math.random() - 0.5) * 4, y: this.y + (Math.random() - 0.5) * 4 };
      case InmateAction.Work:
        return { x: 270.0, y: 250.0 };
      case InmateAction.LockupInCell:
        return { x: 245.0, y: 245.0 };
    }
  }

  public getInteractionDuration(action: InmateAction): number {
    switch (action) {
      case InmateAction.UseToilet:
        return 3.0;
      case InmateAction.Eat:
        return 10.0;
      case InmateAction.Sleep:
        return 20.0;
      case InmateAction.Shower:
        return 6.0;
      case InmateAction.Exercise:
        return 8.0;
      case InmateAction.WanderFreeTime:
        return 5.0;
      case InmateAction.Work:
        return 15.0;
      case InmateAction.LockupInCell:
        return 12.0;
    }
  }

  public step(
    dt: number,
    needs: InmateNeedsProfile,
    distances: ActionFacilityDistances,
    regime: RegimeActivity
  ): void {
    switch (this.state.kind) {
      case 'SelectNextAction': {
        const { action } = selectBestAction(needs, distances, regime);
        const target = this.getTargetForAction(action);
        this.state = {
          kind: 'NavigatingToTarget',
          action,
          targetX: target.x,
          targetY: target.y,
          progress: 0.0,
          totalDuration: this.getInteractionDuration(action),
        };
        break;
      }

      case 'NavigatingToTarget': {
        const dx = this.state.targetX - this.x;
        const dy = this.state.targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.6) {
          this.state = {
            kind: 'InteractingWithObject',
            action: this.state.action,
            targetX: this.state.targetX,
            targetY: this.state.targetY,
            progress: 0.0,
            totalDuration: this.state.totalDuration,
          };
        } else {
          const stepDist = this.speed * dt;
          if (stepDist >= dist) {
            this.x = this.state.targetX;
            this.y = this.state.targetY;
          } else {
            this.x += (dx / dist) * stepDist;
            this.y += (dy / dist) * stepDist;
          }
        }
        break;
      }

      case 'InteractingWithObject': {
        this.state.progress += dt;
        if (this.state.progress >= this.state.totalDuration) {
          const act = this.state.action;
          if (act !== null) {
            switch (act) {
              case InmateAction.UseToilet:
                needs.bladder = 0.0;
                needs.bowel = 0.0;
                break;
              case InmateAction.Eat:
                needs.food = Math.max(0.0, needs.food - 80.0);
                break;
              case InmateAction.Sleep:
                needs.sleep = Math.max(0.0, needs.sleep - 70.0);
                needs.comfort = Math.max(0.0, needs.comfort - 50.0);
                break;
              case InmateAction.Shower:
                needs.hygiene = Math.max(0.0, needs.hygiene - 85.0);
                break;
              case InmateAction.Exercise:
                needs.exercise = Math.max(0.0, needs.exercise - 75.0);
                needs.recreation = Math.max(0.0, needs.recreation - 40.0);
                break;
              case InmateAction.WanderFreeTime:
                needs.freedom = Math.max(0.0, needs.freedom - 30.0);
                needs.recreation = Math.max(0.0, needs.recreation - 30.0);
                break;
              case InmateAction.Work:
                needs.literacy = Math.max(0.0, needs.literacy - 20.0);
                break;
              case InmateAction.LockupInCell:
                needs.privacy = Math.max(0.0, needs.privacy - 40.0);
                break;
            }
          }

          this.state = {
            kind: 'NeedSatisfied',
            action: act,
            targetX: this.x,
            targetY: this.y,
            progress: 0.0,
            totalDuration: 0.0,
          };
        }
        break;
      }

      case 'NeedSatisfied':
      case 'Interrupted': {
        this.state = {
          kind: 'SelectNextAction',
          action: null,
          targetX: this.x,
          targetY: this.y,
          progress: 0.0,
          totalDuration: 0.0,
        };
        break;
      }
    }
  }
}
