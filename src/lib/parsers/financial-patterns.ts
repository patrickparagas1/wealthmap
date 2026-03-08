// ============================================================================
// Financial Document Pattern Matching
// Extracts structured data from raw text using regex patterns
// ============================================================================

export type DocumentType = 'bank_statement' | 'tax_return' | 'investment' | 'pay_stub' | 'mortgage' | 'unknown';

export interface ExtractedField {
  label: string;
  value: string | number;
  confidence: 'high' | 'medium' | 'low';
  category: 'income' | 'expense' | 'asset' | 'liability' | 'personal' | 'tax';
  rawMatch: string;
}

// --- Dollar amount parsing ---
const DOLLAR_RE = /\$\s?([\d,]+(?:\.\d{2})?)/;
const DOLLAR_GLOBAL = /\$\s?([\d,]+(?:\.\d{2})?)/g;

function parseDollar(s: string): number {
  return parseFloat(s.replace(/,/g, '')) || 0;
}

function extractDollarAfter(text: string, pattern: RegExp): number | null {
  const m = text.match(pattern);
  if (!m) return null;
  const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 40);
  const d = after.match(DOLLAR_RE);
  return d ? parseDollar(d[1]) : null;
}

// --- Document Type Detection ---
export function detectDocumentType(text: string): DocumentType {
  const t = text.toLowerCase();

  // Tax return signals
  if (/(form\s*1040|tax\s*return|adjusted\s*gross\s*income|taxable\s*income|filing\s*status)/i.test(text)) {
    return 'tax_return';
  }

  // Pay stub signals
  if (/(pay\s*stub|pay\s*statement|gross\s*pay|net\s*pay|pay\s*period|earnings\s*statement|ytd\s*earnings)/i.test(text)) {
    return 'pay_stub';
  }

  // Investment statement signals
  if (/(portfolio\s*value|account\s*value|investment\s*summary|holdings|shares|securities|brokerage|dividend|capital\s*gain)/i.test(text)) {
    return 'investment';
  }

  // Mortgage statement signals
  if (/(mortgage\s*statement|principal\s*balance|escrow|loan\s*balance|interest\s*rate.*%|amortization)/i.test(text)) {
    return 'mortgage';
  }

  // Bank statement signals
  if (/(statement\s*period|ending\s*balance|beginning\s*balance|total\s*deposits|total\s*withdrawals|checking|savings\s*account)/i.test(text)) {
    return 'bank_statement';
  }

  return 'unknown';
}

// --- Bank Statement Extraction ---
function extractBankStatement(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const endingBalance = extractDollarAfter(text, /(?:ending|closing|final)\s*balance/i);
  if (endingBalance !== null) {
    fields.push({ label: 'Account Balance', value: endingBalance, confidence: 'high', category: 'asset', rawMatch: `Ending Balance: $${endingBalance}` });
  }

  const beginningBalance = extractDollarAfter(text, /(?:beginning|opening|starting)\s*balance/i);
  if (beginningBalance !== null) {
    fields.push({ label: 'Previous Balance', value: beginningBalance, confidence: 'medium', category: 'asset', rawMatch: `Beginning Balance: $${beginningBalance}` });
  }

  const totalDeposits = extractDollarAfter(text, /total\s*(?:deposits|credits)/i);
  if (totalDeposits !== null) {
    fields.push({ label: 'Monthly Deposits', value: totalDeposits, confidence: 'medium', category: 'income', rawMatch: `Total Deposits: $${totalDeposits}` });
  }

  const totalWithdrawals = extractDollarAfter(text, /total\s*(?:withdrawals|debits|checks)/i);
  if (totalWithdrawals !== null) {
    fields.push({ label: 'Monthly Expenses', value: totalWithdrawals, confidence: 'medium', category: 'expense', rawMatch: `Total Withdrawals: $${totalWithdrawals}` });
  }

  // Try to detect account type
  if (/checking/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'checking', confidence: 'high', category: 'asset', rawMatch: 'Checking Account' });
  } else if (/savings/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'savings', confidence: 'high', category: 'asset', rawMatch: 'Savings Account' });
  }

  return fields;
}

// --- Tax Return Extraction ---
function extractTaxReturn(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const wages = extractDollarAfter(text, /wages,?\s*salaries/i);
  if (wages !== null) {
    fields.push({ label: 'Wages & Salaries', value: wages, confidence: 'high', category: 'income', rawMatch: `Wages: $${wages}` });
  }

  const totalIncome = extractDollarAfter(text, /total\s*income/i);
  if (totalIncome !== null) {
    fields.push({ label: 'Total Income', value: totalIncome, confidence: 'high', category: 'income', rawMatch: `Total Income: $${totalIncome}` });
  }

  const agi = extractDollarAfter(text, /adjusted\s*gross\s*income/i);
  if (agi !== null) {
    fields.push({ label: 'Adjusted Gross Income', value: agi, confidence: 'high', category: 'tax', rawMatch: `AGI: $${agi}` });
  }

  const taxableIncome = extractDollarAfter(text, /taxable\s*income/i);
  if (taxableIncome !== null) {
    fields.push({ label: 'Taxable Income', value: taxableIncome, confidence: 'high', category: 'tax', rawMatch: `Taxable Income: $${taxableIncome}` });
  }

  const totalTax = extractDollarAfter(text, /total\s*tax/i);
  if (totalTax !== null) {
    fields.push({ label: 'Total Tax', value: totalTax, confidence: 'high', category: 'tax', rawMatch: `Total Tax: $${totalTax}` });
  }

  // Filing status
  const filingMatch = text.match(/(Single|Married filing jointly|Married filing separately|Head of household|Qualifying widow)/i);
  if (filingMatch) {
    fields.push({ label: 'Filing Status', value: filingMatch[1], confidence: 'high', category: 'personal', rawMatch: filingMatch[0] });
  }

  // Interest income
  const interest = extractDollarAfter(text, /(?:taxable\s*)?interest/i);
  if (interest !== null && interest > 0 && interest < 1000000) {
    fields.push({ label: 'Interest Income', value: interest, confidence: 'medium', category: 'income', rawMatch: `Interest: $${interest}` });
  }

  // Dividend income
  const dividends = extractDollarAfter(text, /(?:ordinary\s*)?dividends/i);
  if (dividends !== null && dividends > 0 && dividends < 1000000) {
    fields.push({ label: 'Dividend Income', value: dividends, confidence: 'medium', category: 'income', rawMatch: `Dividends: $${dividends}` });
  }

  // Mortgage interest deduction
  const mortgageInterest = extractDollarAfter(text, /mortgage\s*interest/i);
  if (mortgageInterest !== null) {
    fields.push({ label: 'Mortgage Interest Paid', value: mortgageInterest, confidence: 'medium', category: 'expense', rawMatch: `Mortgage Interest: $${mortgageInterest}` });
  }

  // State/local taxes
  const salt = extractDollarAfter(text, /state\s*(?:and\s*)?local\s*(?:income\s*)?tax/i);
  if (salt !== null) {
    fields.push({ label: 'State & Local Taxes', value: salt, confidence: 'medium', category: 'tax', rawMatch: `SALT: $${salt}` });
  }

  return fields;
}

// --- Investment Statement Extraction ---
function extractInvestment(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const accountValue = extractDollarAfter(text, /(?:account|portfolio|total|market)\s*(?:value|balance)/i);
  if (accountValue !== null) {
    fields.push({ label: 'Investment Account Value', value: accountValue, confidence: 'high', category: 'asset', rawMatch: `Account Value: $${accountValue}` });
  }

  // 401k / IRA detection
  if (/401\s*\(?k\)?/i.test(text)) {
    fields.push({ label: 'Account Type', value: '401k', confidence: 'high', category: 'asset', rawMatch: '401(k) Account' });
  } else if (/roth\s*ira/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'roth_ira', confidence: 'high', category: 'asset', rawMatch: 'Roth IRA' });
  } else if (/traditional\s*ira/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'traditional_ira', confidence: 'high', category: 'asset', rawMatch: 'Traditional IRA' });
  } else if (/brokerage/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'brokerage', confidence: 'high', category: 'asset', rawMatch: 'Brokerage Account' });
  }

  // Contributions
  const contributions = extractDollarAfter(text, /(?:total\s*)?contributions/i);
  if (contributions !== null) {
    fields.push({ label: 'Contributions', value: contributions, confidence: 'medium', category: 'income', rawMatch: `Contributions: $${contributions}` });
  }

  // Dividends reinvested
  const divs = extractDollarAfter(text, /dividends?\s*(?:received|earned|reinvested)/i);
  if (divs !== null) {
    fields.push({ label: 'Dividends', value: divs, confidence: 'medium', category: 'income', rawMatch: `Dividends: $${divs}` });
  }

  return fields;
}

// --- Pay Stub Extraction ---
function extractPayStub(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const grossPay = extractDollarAfter(text, /gross\s*pay/i);
  if (grossPay !== null) {
    fields.push({ label: 'Gross Pay (Period)', value: grossPay, confidence: 'high', category: 'income', rawMatch: `Gross Pay: $${grossPay}` });
  }

  const netPay = extractDollarAfter(text, /net\s*pay/i);
  if (netPay !== null) {
    fields.push({ label: 'Net Pay (Period)', value: netPay, confidence: 'high', category: 'income', rawMatch: `Net Pay: $${netPay}` });
  }

  const ytdGross = extractDollarAfter(text, /ytd\s*(?:gross|earnings|total)/i);
  if (ytdGross !== null) {
    fields.push({ label: 'YTD Gross Earnings', value: ytdGross, confidence: 'high', category: 'income', rawMatch: `YTD Gross: $${ytdGross}` });
  }

  const fedTax = extractDollarAfter(text, /federal\s*(?:income\s*)?tax/i);
  if (fedTax !== null) {
    fields.push({ label: 'Federal Tax Withheld', value: fedTax, confidence: 'medium', category: 'tax', rawMatch: `Federal Tax: $${fedTax}` });
  }

  const retirement401k = extractDollarAfter(text, /401\s*\(?k\)?/i);
  if (retirement401k !== null) {
    fields.push({ label: '401(k) Contribution', value: retirement401k, confidence: 'medium', category: 'asset', rawMatch: `401(k): $${retirement401k}` });
  }

  // Try to detect pay frequency for annualization
  if (/bi-?weekly|every\s*two\s*weeks/i.test(text)) {
    fields.push({ label: 'Pay Frequency', value: 'biweekly', confidence: 'medium', category: 'personal', rawMatch: 'Bi-weekly pay' });
  } else if (/semi-?monthly|twice\s*(?:a|per)\s*month/i.test(text)) {
    fields.push({ label: 'Pay Frequency', value: 'semimonthly', confidence: 'medium', category: 'personal', rawMatch: 'Semi-monthly pay' });
  } else if (/monthly/i.test(text)) {
    fields.push({ label: 'Pay Frequency', value: 'monthly', confidence: 'medium', category: 'personal', rawMatch: 'Monthly pay' });
  } else if (/weekly/i.test(text)) {
    fields.push({ label: 'Pay Frequency', value: 'weekly', confidence: 'medium', category: 'personal', rawMatch: 'Weekly pay' });
  }

  return fields;
}

// --- Mortgage Statement Extraction ---
function extractMortgage(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const principal = extractDollarAfter(text, /(?:principal|outstanding|unpaid|current)\s*balance/i);
  if (principal !== null) {
    fields.push({ label: 'Mortgage Balance', value: principal, confidence: 'high', category: 'liability', rawMatch: `Balance: $${principal}` });
  }

  const monthlyPayment = extractDollarAfter(text, /(?:monthly|regular)\s*payment/i);
  if (monthlyPayment !== null) {
    fields.push({ label: 'Monthly Payment', value: monthlyPayment, confidence: 'high', category: 'expense', rawMatch: `Payment: $${monthlyPayment}` });
  }

  const rateMatch = text.match(/(?:interest|annual)\s*rate\s*[:.]?\s*([\d.]+)\s*%/i);
  if (rateMatch) {
    fields.push({ label: 'Interest Rate', value: parseFloat(rateMatch[1]), confidence: 'high', category: 'liability', rawMatch: `Rate: ${rateMatch[1]}%` });
  }

  const escrow = extractDollarAfter(text, /escrow/i);
  if (escrow !== null) {
    fields.push({ label: 'Escrow Payment', value: escrow, confidence: 'medium', category: 'expense', rawMatch: `Escrow: $${escrow}` });
  }

  const originalBalance = extractDollarAfter(text, /original\s*(?:loan|balance|amount)/i);
  if (originalBalance !== null) {
    fields.push({ label: 'Original Loan Amount', value: originalBalance, confidence: 'medium', category: 'liability', rawMatch: `Original: $${originalBalance}` });
  }

  return fields;
}

// --- Main extraction function ---
export function extractFromText(text: string): { type: DocumentType; fields: ExtractedField[] } {
  const type = detectDocumentType(text);

  let fields: ExtractedField[];
  switch (type) {
    case 'bank_statement': fields = extractBankStatement(text); break;
    case 'tax_return': fields = extractTaxReturn(text); break;
    case 'investment': fields = extractInvestment(text); break;
    case 'pay_stub': fields = extractPayStub(text); break;
    case 'mortgage': fields = extractMortgage(text); break;
    default: fields = []; break;
  }

  // If unknown, try all extractors and merge results
  if (type === 'unknown' && fields.length === 0) {
    fields = [
      ...extractBankStatement(text),
      ...extractTaxReturn(text),
      ...extractInvestment(text),
      ...extractPayStub(text),
      ...extractMortgage(text),
    ];
    // Lower confidence for all since we couldn't identify the document
    fields = fields.map(f => ({ ...f, confidence: 'low' as const }));
  }

  return { type, fields };
}

// --- CSV Transaction Categorization ---
export function categorizeTransaction(description: string, amount: number): { category: string; isIncome: boolean } {
  const d = description.toLowerCase();

  // Income patterns
  if (/payroll|direct\s*dep|salary|wage|ach\s*credit|employer/i.test(d)) {
    return { category: 'salary', isIncome: true };
  }
  if (/dividend|interest\s*(?:paid|earned|credit)/i.test(d)) {
    return { category: 'investment_income', isIncome: true };
  }
  if (/refund|tax\s*refund|irs/i.test(d)) {
    return { category: 'other_income', isIncome: true };
  }

  // Expense categories
  if (/rent|mortgage|hoa|property/i.test(d)) return { category: 'housing', isIncome: false };
  if (/electric|gas|water|utility|internet|cable|phone|verizon|att|comcast|pg&e/i.test(d)) return { category: 'utilities', isIncome: false };
  if (/grocery|safeway|trader|whole\s*foods|kroger|costco|walmart|target/i.test(d)) return { category: 'food', isIncome: false };
  if (/restaurant|doordash|grubhub|uber\s*eats|starbucks|mcdonald/i.test(d)) return { category: 'dining', isIncome: false };
  if (/gas\s*station|shell|chevron|exxon|bp\s/i.test(d)) return { category: 'transportation', isIncome: false };
  if (/insurance|geico|allstate|state\s*farm|progressive|aetna|cigna|blue\s*cross/i.test(d)) return { category: 'insurance', isIncome: false };
  if (/medical|doctor|hospital|pharmacy|cvs|walgreens|dental/i.test(d)) return { category: 'healthcare', isIncome: false };
  if (/netflix|spotify|hulu|disney|amazon\s*prime|subscription/i.test(d)) return { category: 'entertainment', isIncome: false };
  if (/loan|student|auto\s*pay|car\s*payment/i.test(d)) return { category: 'debt_payment', isIncome: false };
  if (/transfer|zelle|venmo|paypal/i.test(d)) return { category: 'transfer', isIncome: false };

  // Default: positive amounts are likely income, negative are expenses
  if (amount > 0) return { category: 'other_income', isIncome: true };
  return { category: 'other', isIncome: false };
}
