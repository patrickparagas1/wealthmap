import { FilingStatus } from '../types';

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

interface StateTaxConfig {
  type: 'none' | 'flat' | 'graduated';
  rate?: number;
  brackets?: TaxBracket[];
}

/**
 * Comprehensive state income tax configuration for all 50 states + DC.
 *
 * Sources: State tax authority publications (2024–2025 tax years).
 * Graduated brackets use the "single" filer schedule as defaults.
 * Rates are expressed as decimals (e.g. 0.05 = 5%).
 */
export const STATE_TAX_RATES: Record<string, StateTaxConfig> = {
  // ─── No Income Tax States (9) ────────────────────────────────────────
  AK: { type: 'none' },
  FL: { type: 'none' },
  NH: { type: 'none' },
  NV: { type: 'none' },
  SD: { type: 'none' },
  TN: { type: 'none' },
  TX: { type: 'none' },
  WA: { type: 'none' },
  WY: { type: 'none' },

  // ─── Flat-Rate States ────────────────────────────────────────────────
  CO: { type: 'flat', rate: 0.044 },
  IL: { type: 'flat', rate: 0.0495 },
  IN: { type: 'flat', rate: 0.0305 },
  KY: { type: 'flat', rate: 0.04 },
  MA: { type: 'flat', rate: 0.05 },
  MI: { type: 'flat', rate: 0.0425 },
  NC: { type: 'flat', rate: 0.045 },
  PA: { type: 'flat', rate: 0.0307 },
  UT: { type: 'flat', rate: 0.0465 },

  // ─── Graduated-Rate States ───────────────────────────────────────────

  // Alabama – 3 brackets
  AL: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 500, rate: 0.02 },
      { min: 500, max: 3000, rate: 0.04 },
      { min: 3000, max: Infinity, rate: 0.05 },
    ],
  },

  // Arizona – 2 brackets (post-2023 simplification)
  AZ: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 28653, rate: 0.025 },
      { min: 28653, max: Infinity, rate: 0.025 },
    ],
  },

  // Arkansas – 4 brackets
  AR: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 4300, rate: 0.02 },
      { min: 4300, max: 8500, rate: 0.04 },
      { min: 8500, max: 12900, rate: 0.034 },
      { min: 12900, max: Infinity, rate: 0.044 },
    ],
  },

  // California – 9 brackets
  CA: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 10412, rate: 0.01 },
      { min: 10412, max: 24684, rate: 0.02 },
      { min: 24684, max: 38959, rate: 0.04 },
      { min: 38959, max: 54081, rate: 0.06 },
      { min: 54081, max: 68350, rate: 0.08 },
      { min: 68350, max: 349137, rate: 0.093 },
      { min: 349137, max: 418961, rate: 0.103 },
      { min: 418961, max: 698271, rate: 0.113 },
      { min: 698271, max: Infinity, rate: 0.123 },
    ],
  },

  // Connecticut – 7 brackets
  CT: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 10000, rate: 0.03 },
      { min: 10000, max: 50000, rate: 0.05 },
      { min: 50000, max: 100000, rate: 0.055 },
      { min: 100000, max: 200000, rate: 0.06 },
      { min: 200000, max: 250000, rate: 0.065 },
      { min: 250000, max: 500000, rate: 0.069 },
      { min: 500000, max: Infinity, rate: 0.0699 },
    ],
  },

  // Delaware – 7 brackets
  DE: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 2000, rate: 0.0 },
      { min: 2000, max: 5000, rate: 0.022 },
      { min: 5000, max: 10000, rate: 0.039 },
      { min: 10000, max: 20000, rate: 0.048 },
      { min: 20000, max: 25000, rate: 0.052 },
      { min: 25000, max: 60000, rate: 0.0555 },
      { min: 60000, max: Infinity, rate: 0.066 },
    ],
  },

  // District of Columbia – 6 brackets
  DC: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 10000, rate: 0.04 },
      { min: 10000, max: 40000, rate: 0.06 },
      { min: 40000, max: 60000, rate: 0.065 },
      { min: 60000, max: 250000, rate: 0.085 },
      { min: 250000, max: 500000, rate: 0.0925 },
      { min: 500000, max: 1000000, rate: 0.0975 },
      { min: 1000000, max: Infinity, rate: 0.1075 },
    ],
  },

  // Georgia – 6 brackets
  GA: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 750, rate: 0.01 },
      { min: 750, max: 2250, rate: 0.02 },
      { min: 2250, max: 3750, rate: 0.03 },
      { min: 3750, max: 5250, rate: 0.04 },
      { min: 5250, max: 7000, rate: 0.05 },
      { min: 7000, max: Infinity, rate: 0.055 },
    ],
  },

  // Hawaii – 12 brackets
  HI: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 2400, rate: 0.014 },
      { min: 2400, max: 4800, rate: 0.032 },
      { min: 4800, max: 9600, rate: 0.055 },
      { min: 9600, max: 14400, rate: 0.064 },
      { min: 14400, max: 19200, rate: 0.068 },
      { min: 19200, max: 24000, rate: 0.072 },
      { min: 24000, max: 36000, rate: 0.076 },
      { min: 36000, max: 48000, rate: 0.079 },
      { min: 48000, max: 150000, rate: 0.0825 },
      { min: 150000, max: 175000, rate: 0.09 },
      { min: 175000, max: 200000, rate: 0.10 },
      { min: 200000, max: Infinity, rate: 0.11 },
    ],
  },

  // Idaho – 2 brackets (simplified 2023+)
  ID: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 4489, rate: 0.01 },
      { min: 4489, max: Infinity, rate: 0.058 },
    ],
  },

  // Iowa – 4 brackets (2024+)
  IA: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 6210, rate: 0.044 },
      { min: 6210, max: 31050, rate: 0.0482 },
      { min: 31050, max: 62100, rate: 0.057 },
      { min: 62100, max: Infinity, rate: 0.06 },
    ],
  },

  // Kansas – 3 brackets
  KS: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 15000, rate: 0.031 },
      { min: 15000, max: 30000, rate: 0.0525 },
      { min: 30000, max: Infinity, rate: 0.057 },
    ],
  },

  // Louisiana – 3 brackets
  LA: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 12500, rate: 0.0185 },
      { min: 12500, max: 50000, rate: 0.035 },
      { min: 50000, max: Infinity, rate: 0.0425 },
    ],
  },

  // Maine – 3 brackets
  ME: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 24500, rate: 0.058 },
      { min: 24500, max: 58050, rate: 0.0675 },
      { min: 58050, max: Infinity, rate: 0.0715 },
    ],
  },

  // Maryland – 8 brackets
  MD: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 1000, rate: 0.02 },
      { min: 1000, max: 2000, rate: 0.03 },
      { min: 2000, max: 3000, rate: 0.04 },
      { min: 3000, max: 100000, rate: 0.0475 },
      { min: 100000, max: 125000, rate: 0.05 },
      { min: 125000, max: 150000, rate: 0.0525 },
      { min: 150000, max: 250000, rate: 0.055 },
      { min: 250000, max: Infinity, rate: 0.0575 },
    ],
  },

  // Minnesota – 4 brackets
  MN: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 30070, rate: 0.0535 },
      { min: 30070, max: 98760, rate: 0.068 },
      { min: 98760, max: 183340, rate: 0.0785 },
      { min: 183340, max: Infinity, rate: 0.0985 },
    ],
  },

  // Mississippi – 2 brackets (2024+)
  MS: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 10000, rate: 0.0 },
      { min: 10000, max: Infinity, rate: 0.047 },
    ],
  },

  // Missouri – 6 brackets (simplified)
  MO: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 1207, rate: 0.02 },
      { min: 1207, max: 2414, rate: 0.025 },
      { min: 2414, max: 3621, rate: 0.03 },
      { min: 3621, max: 4828, rate: 0.035 },
      { min: 4828, max: 6035, rate: 0.04 },
      { min: 6035, max: Infinity, rate: 0.048 },
    ],
  },

  // Montana – 2 brackets (2024+)
  MT: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 20500, rate: 0.047 },
      { min: 20500, max: Infinity, rate: 0.059 },
    ],
  },

  // Nebraska – 4 brackets
  NE: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 3700, rate: 0.0246 },
      { min: 3700, max: 22170, rate: 0.0351 },
      { min: 22170, max: 35730, rate: 0.0501 },
      { min: 35730, max: Infinity, rate: 0.0584 },
    ],
  },

  // New Jersey – 7 brackets
  NJ: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 20000, rate: 0.014 },
      { min: 20000, max: 35000, rate: 0.0175 },
      { min: 35000, max: 40000, rate: 0.035 },
      { min: 40000, max: 75000, rate: 0.05525 },
      { min: 75000, max: 500000, rate: 0.0637 },
      { min: 500000, max: 1000000, rate: 0.0897 },
      { min: 1000000, max: Infinity, rate: 0.1075 },
    ],
  },

  // New Mexico – 5 brackets
  NM: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 5500, rate: 0.017 },
      { min: 5500, max: 11000, rate: 0.032 },
      { min: 11000, max: 16000, rate: 0.047 },
      { min: 16000, max: 210000, rate: 0.049 },
      { min: 210000, max: Infinity, rate: 0.059 },
    ],
  },

  // New York – 9 brackets
  NY: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 8500, rate: 0.04 },
      { min: 8500, max: 11700, rate: 0.045 },
      { min: 11700, max: 13900, rate: 0.0525 },
      { min: 13900, max: 80650, rate: 0.055 },
      { min: 80650, max: 215400, rate: 0.06 },
      { min: 215400, max: 1077550, rate: 0.0685 },
      { min: 1077550, max: 5000000, rate: 0.0965 },
      { min: 5000000, max: 25000000, rate: 0.103 },
      { min: 25000000, max: Infinity, rate: 0.109 },
    ],
  },

  // North Dakota – 3 brackets (simplified 2024+)
  ND: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 44725, rate: 0.0 },
      { min: 44725, max: 225975, rate: 0.0195 },
      { min: 225975, max: Infinity, rate: 0.025 },
    ],
  },

  // Ohio – 4 brackets (2024+)
  OH: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 26050, rate: 0.0 },
      { min: 26050, max: 46100, rate: 0.0275 },
      { min: 46100, max: 92150, rate: 0.03 },
      { min: 92150, max: Infinity, rate: 0.035 },
    ],
  },

  // Oklahoma – 6 brackets
  OK: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 1000, rate: 0.0025 },
      { min: 1000, max: 2500, rate: 0.0075 },
      { min: 2500, max: 3750, rate: 0.0175 },
      { min: 3750, max: 4900, rate: 0.0275 },
      { min: 4900, max: 7200, rate: 0.0375 },
      { min: 7200, max: Infinity, rate: 0.0475 },
    ],
  },

  // Oregon – 4 brackets
  OR: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 4050, rate: 0.0475 },
      { min: 4050, max: 10200, rate: 0.0675 },
      { min: 10200, max: 125000, rate: 0.0875 },
      { min: 125000, max: Infinity, rate: 0.099 },
    ],
  },

  // Rhode Island – 3 brackets
  RI: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 73450, rate: 0.0375 },
      { min: 73450, max: 166950, rate: 0.0475 },
      { min: 166950, max: Infinity, rate: 0.0599 },
    ],
  },

  // South Carolina – 7 brackets
  SC: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 3460, rate: 0.0 },
      { min: 3460, max: 6920, rate: 0.03 },
      { min: 6920, max: 10380, rate: 0.04 },
      { min: 10380, max: 13840, rate: 0.05 },
      { min: 13840, max: 17300, rate: 0.06 },
      { min: 17300, max: Infinity, rate: 0.064 },
    ],
  },

  // Vermont – 4 brackets
  VT: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 45400, rate: 0.0335 },
      { min: 45400, max: 110050, rate: 0.066 },
      { min: 110050, max: 229550, rate: 0.076 },
      { min: 229550, max: Infinity, rate: 0.0875 },
    ],
  },

  // Virginia – 4 brackets
  VA: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 3000, rate: 0.02 },
      { min: 3000, max: 5000, rate: 0.03 },
      { min: 5000, max: 17000, rate: 0.05 },
      { min: 17000, max: Infinity, rate: 0.0575 },
    ],
  },

  // West Virginia – 5 brackets
  WV: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 10000, rate: 0.0236 },
      { min: 10000, max: 25000, rate: 0.0315 },
      { min: 25000, max: 40000, rate: 0.0354 },
      { min: 40000, max: 60000, rate: 0.0472 },
      { min: 60000, max: Infinity, rate: 0.0512 },
    ],
  },

  // Wisconsin – 4 brackets
  WI: {
    type: 'graduated',
    brackets: [
      { min: 0, max: 14320, rate: 0.035 },
      { min: 14320, max: 28640, rate: 0.044 },
      { min: 28640, max: 315310, rate: 0.053 },
      { min: 315310, max: Infinity, rate: 0.0765 },
    ],
  },
};

/**
 * Calculate state income tax using the configured brackets or flat rate.
 *
 * For graduated states, tax is computed marginally: each bracket's rate only
 * applies to the portion of income that falls within that bracket's range.
 *
 * @param agi       Adjusted Gross Income (state-level)
 * @param stateCode Two-letter state abbreviation (e.g. "CA", "TX")
 * @param filingStatus  The taxpayer's filing status
 * @returns The calculated state income tax (rounded to 2 decimal places)
 */
export function calculateStateTax(
  agi: number,
  stateCode: string,
  filingStatus: FilingStatus,
): number {
  const config = STATE_TAX_RATES[stateCode.toUpperCase()];

  if (!config) {
    // Unknown state — fall back to 0 rather than throwing
    console.warn(`Unknown state code: "${stateCode}". Returning $0 state tax.`);
    return 0;
  }

  if (agi <= 0) {
    return 0;
  }

  switch (config.type) {
    case 'none':
      return 0;

    case 'flat':
      return Math.round(agi * (config.rate ?? 0) * 100) / 100;

    case 'graduated':
      return calculateGraduatedTax(agi, config.brackets ?? []);

    default:
      return 0;
  }
}

/**
 * Compute marginal/graduated tax across an array of brackets.
 * Each bracket is applied only to the slice of income within [min, max).
 */
function calculateGraduatedTax(agi: number, brackets: TaxBracket[]): number {
  let tax = 0;

  for (const bracket of brackets) {
    if (agi <= bracket.min) {
      break;
    }

    const taxableInBracket = Math.min(agi, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }

  return Math.round(tax * 100) / 100;
}
