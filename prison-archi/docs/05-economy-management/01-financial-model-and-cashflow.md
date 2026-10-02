# Domain 05: Economy, Management & Governance
## Feature Specification 01: Financial Engine, Cashflow Dynamics & Corporate Taxation

---

## 1. System Overview & The Dual Economic Model

The financial simulation in *Prison Architect Web* is structured around two distinct accounting metrics:
1. **Bank Balance (Liquid Capital):** Total cash reserves available immediately for purchasing construction materials, hiring personnel, or paying fines.
2. **Daily Cashflow ($\Delta\$ / \text{day}$):** The continuous net rate of profit or loss, calculated every in-game midnight ($00:00$).

Operating at a negative cashflow gradually depletes the bank balance; if the bank balance falls below $-\$10,000$ and remains negative for 48 hours, the prison is declared bankrupt, triggering a **Chapter 11 Bankruptcy Dismissal (Game Over)**.

```
┌────────────────────────────────────────────────────────┐
│ DAILY REVENUES (+)                                     │
│  - Prisoner Intake Subsidies (by Security Class)       │
│  - Early Parole Subsidies ($3,000 per reformed inmate) │
│  - Industrial Workshop Exports (Plates & Furniture)    │
│  - Forestry Wood Milling Sales                         │
├────────────────────────────────────────────────────────┤
│ DAILY EXPENDITURES (-)                                 │
│  - Staff Payroll Wages (Guards, Cooks, Doctors, Admin) │
│  - Food Ingredient Contracts (Meal Quality & Variety)  │
│  - Municipal Electricity & Water Base Utility Rates    │
│  - Legal Fines (Escapes: -$10,000, Deaths: -$50,000)   │
│  - Corporate Income Tax (Base rate: 30%)               │
└────────────────────────────────────────────────────────┘
```

---

## 2. Revenue Breakdown & Prisoner Intake Stipends

The Department of Corrections pays a daily per-inmate housing subsidy:

| Security Classification | Daily Subsidy (per inmate) | Influx Initial Bounty | Risk / Volatility Profile |
| :--- | :--- | :--- | :--- |
| **Minimum Security** | $\$100 / \text{day}$ | $\$1,000$ | Low escape risk, high work productivity |
| **Medium Security** | $\$150 / \text{day}$ | $\$1,500$ | Balanced general population |
| **Maximum Security** | $\$200 / \text{day}$ | $\$2,500$ | High violence; requires heavy guard presence |
| **SuperMax** | $\$500 / \text{day}$ | $\$5,000$ | Extreme danger; requires individual cells |
| **Death Row** | $\$1,000 / \text{day}$ | $\$10,000$ | Capital offenders awaiting appeals |
| **Criminally Insane** | $\$400 / \text{day}$ | $\$3,500$ | Requires Orderlies & Psychiatric therapy |

$$\text{Revenue}_{\text{intake}} = \sum_{c \in \text{Classes}} N_c \times \text{Subsidy}(c)$$

---

## 3. Staff Wages & Payroll Table

Staff salaries are deducted automatically on an hourly basis:

```rust
pub struct StaffPayroll {
    pub guard_wage_daily: u32,       // $100
    pub armed_guard_wage_daily: u32, // $150
    pub dog_handler_wage_daily: u32, // $150
    pub sniper_wage_daily: u32,      // $175
    pub cook_wage_daily: u32,        // $80
    pub doctor_wage_daily: u32,      // $100
    pub workman_wage_daily: u32,     // $100
    pub janitor_wage_daily: u32,     // $50
    pub warden_wage_daily: u32,      // $200
    pub accountant_wage_daily: u32,  // $200
}
```

---

## 4. Corporate Taxation & Legal Loopholes

By default, the state levies a **$30\%$ Corporate Income Tax** on daily operating profit. 

Through the **Bureaucracy Research Tree**, the Warden can hire an **Accountant** and a **Corporate Lawyer** to unlock financial exemptions:

```
[ Base Tax Rate: 30% ]
           │
           ▼ Research: "Tax Relief" (Accountant)
[ Reduced Tax Rate: 15% ]
           │
           ▼ Research: "Offshore Tax Loophole" (Corporate Lawyer)
[ Minimum Tax Rate: 1% ]
  All profit redirected to shell corporations in the Cayman Islands!
```

---

## 5. Bank Loans & Credit Rating Calculus

When cash reserves are exhausted, the player can take out commercial bank loans:

$$\text{Max Borrowing Limit} = \$25,000 + (\text{Prison Net Worth} \times 0.25)$$

* **Interest Rate:** Scales with prison safety metrics ($5\%$ base interest; increases to $18\%$ if multiple escapes or murders occurred recently).
* **Credit Rating:** Graded from `AAA` (low interest, $500k ceiling) down to `D` (predatory subprime loans with daily loan shark penalties).

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Wrongful Death Lawsuit** | Guard beats an unarmed, surrendered inmate to death in solitary. | Legal Settlement Fee: Deducts an immediate $\$50,000$ legal settlement. If the Corporate Lawyer has researched `Legal Defense`, the fee is reduced to $\$10,000$. |
| **Instant Negative Cashflow Bankruptcy** | Player hires 100 armed guards on day 1 with 10 prisoners. | Bankruptcy Warning Timer: The game provides a 48-hour grace period with an emergency option to sell off shares in the prison to venture capitalists. |
| **Valuation Exploitation via Tree Farming** | Player covers the entire map in trees to artificially inflate prison net worth before taking out maximum loans. | Soil Depletion: Continuous tree farming depletes soil nutrients; re-planting on un-rotated soil reduces tree growth speed by $50\%$ per generation. |
