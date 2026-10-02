# Domain 05: Economy, Management & Governance
## Feature Specification 05: Rehabilitation Programs, Recidivism Calculus & Parole

---

## 1. System Overview & The Justice Spectrum

*Prison Architect Web* measures the moral and institutional success of your facility through the **Recidivism Rate (%)**—the percentage of released prisoners who commit new crimes and return to prison within two years.

A purely punitive, brutal prison (punctuated by solitary confinement, starvation, and armed suppression) drives recidivism up to **$80–90\%$**. Conversely, an investment in education, addiction therapy, and vocational training drives recidivism down below **$10\%$**, unlocking state subsidies, early release grants, and corporate prestige awards.

```
                    [ INMATE ADMISSION ]
               Initial Recidivism: ~70-85%
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
 [ PUNITIVE PATHWAY ]                    [ REFORM PATHWAY ]
  - 23hr Cell Lockdown                    - Foundation Education (Classroom)
  - Cold Showers                          - Alcoholics Anonymous (Infirmary)
  - Constant Armed Suppression            - Behavioral Therapy (Psychologist)
  - Zero Work Skills                      - Carpentry & Kitchen Certification
        │                                       │
        ▼                                       ▼
 Recidivism Climbs: 95%                  Recidivism Drops: 8%
 (Re-arrested within 3 months)           (Earns Early Parole Grant: +$3,000)
```

---

## 2. Reform Program Registry

Programs require specific rooms, certified instructors, equipment, and scheduled regime blocks:

| Program Name | Room Required | Instructor | Duration | Primary Benefit |
| :--- | :--- | :--- | :--- | :--- |
| **Foundation Education** | Classroom | Outside Teacher | 20 Sessions | Literacy, unlocks Library & General Ed |
| **General Education** | Classroom | Outside Teacher | 30 Sessions | Advanced Diploma, cuts recidivism by $25\%$ |
| **Alcoholics Anonymous** | Common Room | Psychologist | 10 Sessions | Cures Alcohol Addiction trait |
| **Pharmacological Therapy**| Infirmary | Doctor | 10 Sessions | Cures Drug Addiction trait |
| **Behavioral Therapy** | Psychologist Office | Psychologist | 10 Sessions | Removes Volatile trait outbursts |
| **Kitchen Safety** | Kitchen | Head Cook | 5 Sessions | Unlocks inmate kitchen labor |
| **Spiritual Guidance** | Chapel | Priest / Imam / Rabbi | Ongoing | Boosts Spirituality need; calms unrest |

---

## 3. Recidivism Score Mathematical Formula

When an inmate is released (via sentence completion or early parole), the engine calculates their final **Re-Offending Probability ($R_{\text{final}}$)**:

$$R_{\text{final}} = R_{\text{base}} - \Delta R_{\text{punishment}} - \Delta R_{\text{reform}} - \Delta R_{\text{security}} + \Delta R_{\text{trauma}}$$

Where:
* $R_{\text{base}} = 0.80$ ($80\%$ base criminal re-offending rate).
* $\Delta R_{\text{punishment}} = \min(0.15, \text{DaysInSolitary} \times 0.01)$ (Deterrence effect).
* $\Delta R_{\text{reform}} = \sum (\text{PassedPrograms} \times \text{Weight})$ (Up to $-0.50$).
* $\Delta R_{\text{security}} = \text{EmploymentDays} \times 0.005$ (Job experience, up to $-0.15$).
* $\Delta R_{\text{trauma}} = \text{BeatingsSuffered} \times 0.05 + \text{ProlongedSuppression} \times 0.10$ (Institutional trauma).

```rust
pub fn calculate_inmate_recidivism(profile: &PrisonerProfile) -> f32 {
    let mut score = 0.80f32;

    // Deduct passed education & therapy
    for prog in &profile.passed_programs {
        score -= match prog.tier {
            ProgramTier::FoundationEducation => 0.12,
            ProgramTier::GeneralEducation => 0.20,
            ProgramTier::BehavioralTherapy => 0.15,
            ProgramTier::AddictionRecovery => 0.18,
            ProgramTier::VocationalCraft => 0.10,
        };
    }

    // Add trauma penalties
    score += (profile.times_beaten_by_guards as f32) * 0.04;
    score += (profile.hours_suppressed as f32) * 0.001;

    score.clamp(0.02, 0.98) // Clamped between 2% and 98%
}
```

---

## 4. The Parole Hearing System

Inmates who complete **$50\%$ and $75\%$** of their total sentence become eligible for an **Early Parole Hearing**:

```
[ Parole Hearing Room ]
  ├── 1 Inmate
  ├── 1 Inmate Lawyer
  └── 2 Outside Parole Board Magistrates
```

1. The Parole Board reviews the inmate's current Recidivism Score.
2. The player sets the **Institutional Parole Re-offending Threshold** (e.g. $15\%$).
3. **Outcome A (Parole Granted):** Inmate released immediately; state awards the prison an instant **$\$3,000$ Early Release Subsidy**.
4. **The Parole Penalty:** If the released parolee re-offends and is arrested within 2 years, the prison is slapped with a **$-\$10,000$ State Liability Fine**.

---

## 5. Program Attendance & Concentration Mechanics

Inmates will skip scheduled reform classes if:
* Their `Suppression` meter is $> 20\%$ (too intimidated by armed guards to learn).
* Their critical physical needs (`Food`, `Sleep`, `Bladder`) are $> 70\%$ (unable to concentrate due to discomfort).
* Rival gang members occupy the classroom without guard presence.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Outside Teacher Assaulted** | Violent inmate in classroom attacks civilian teacher; teachers refuse to return. | Guard Escort Protocol: A guard must be stationed inside any classroom where Medium or Max-Sec inmates attend educational programs. |
| **Parole Board Stabbing** | Inmate denied parole attacks magistrates with a smuggled shiv. | Secure Partition Tables: Install bulletproof glass barriers in the Parole Room for Maximum Security inmates. |
| **Recidivism Exploitation via Instant Release** | Player grants parole to violent offenders at 90% recidivism to clear cell space. | Government Sanctions: If 3 consecutive parolees re-offend, the Governor revokes parole privileges for 30 days and cuts daily subsidies by $50\%$. |
