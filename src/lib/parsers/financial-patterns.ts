// ============================================================================
// Financial Document Pattern Matching
// Extracts structured data from raw text using regex patterns
// Broadened patterns to handle real-world document variations
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
const DOLLAR_RE = /\$\s?([\d,]+(?:\.\d{1,2})?)/;
const NUMBER_AFTER_RE = /(?:\$\s?|USD\s?|us\$\s?)([\d,]+(?:\.\d{1,2})?)|(?:^|\s)([\d,]{2,}(?:\.\d{2}))\s*$/m;

function parseDollar(s: string): number {
  return parseFloat(s.replace(/,/g, '')) || 0;
}

/**
 * Look for a dollar amount within 200 chars after a label match.
 * Handles multi-line documents, extra spacing, and various dollar formats.
 */
function extractDollarAfter(text: string, pattern: RegExp): number | null {
  const m = text.match(pattern);
  if (!m) return null;
  // Look up to 200 characters ahead (handles line breaks, extra spaces)
  const start = (m.index ?? 0) + m[0].length;
  const after = text.slice(start, start + 200);

  // Try $ format first
  const d = after.match(DOLLAR_RE);
  if (d) return parseDollar(d[1]);

  // Try bare number format (e.g., "Balance: 12,345.67")
  const bare = after.match(/(?:[:=]\s*|^\s*)([\d,]+\.\d{2})\b/);
  if (bare) return parseDollar(bare[1]);

  // Try number with possible negative
  const neg = after.match(/-?\s?\$?\s?([\d,]+\.\d{2})/);
  if (neg) return parseDollar(neg[1]);

  return null;
}

/**
 * Scan entire text for a labeled dollar amount pattern.
 * More aggressive — finds "Label ... $Amount" anywhere in the text.
 */
function extractLabeledAmount(text: string, labelPattern: RegExp): number | null {
  const lines = text.split(/\n/);
  for (const line of lines) {
    if (labelPattern.test(line)) {
      const dollarMatch = line.match(/\$\s?([\d,]+(?:\.\d{1,2})?)/);
      if (dollarMatch) return parseDollar(dollarMatch[1]);
      // Try bare number at end of line
      const bareMatch = line.match(/([\d,]+\.\d{2})\s*$/);
      if (bareMatch) return parseDollar(bareMatch[1]);
    }
  }
  return null;
}

// --- Document Type Detection (Broadened) ---
export function detectDocumentType(text: string): DocumentType {
  const t = text.toLowerCase();

  // Tax return signals (expanded)
  if (/(form\s*1040|1040-?[a-z]{0,3}|tax\s*return|adjusted\s*gross\s*income|taxable\s*income|filing\s*status|w-?2\s|form\s*w-?2|1099-?[a-z]*|schedule\s*[a-e]|tax\s*year|refund\s*amount|federal\s*tax|irs|internal\s*revenue)/i.test(text)) {
    return 'tax_return';
  }

  // Pay stub signals (expanded)
  if (/(pay\s*stub|pay\s*statement|gross\s*pay|net\s*pay|pay\s*period|earnings\s*statement|ytd\s*(?:gross|earnings|total|net)|gross\s*(?:wages|compensation|earnings)|take[- ]?home\s*pay|pay\s*date|pay\s*rate|hourly\s*rate|hours\s*worked|employer\s*name|employee\s*(?:name|id)|federal\s*withholding|fica|social\s*security\s*tax|medicare\s*tax)/i.test(text)) {
    return 'pay_stub';
  }

  // Bank statement signals (check BEFORE investment to avoid false positives)
  if (/(statement\s*(?:period|date|summary)|(?:ending|closing|final|opening|beginning|starting)\s*balance|total\s*(?:deposits?|credits?|withdrawals?|debits?|checks?)|(?:checking|savings?|money\s*market)\s*(?:account|summary)|account\s*(?:summary|statement|activity)|transaction\s*(?:history|summary|detail)|(?:direct\s*)?deposit|atm\s*withdrawal|debit\s*card)/i.test(text)) {
    return 'bank_statement';
  }

  // Investment statement signals (expanded — require investment-specific terms)
  if (/(portfolio\s*(?:value|summary|balance)|investment\s*(?:summary|statement|account|value)|(?:total\s*)?market\s*value|(?:stock|bond|fund)\s*holdings|shares\s*(?:owned|held)|securities|brokerage\s*(?:account|statement)|(?:total\s*)?capital\s*gains?|(?:unrealized|realized)\s*(?:gain|loss)|net\s*asset\s*value|401\s*\(?k\)?\s*(?:statement|summary|balance|account)|(?:traditional|roth)\s*ira\s*(?:statement|summary|balance|account)|(?:mutual|index)\s*fund|stock\s*(?:symbol|ticker)|etf\s*(?:holding|value)|bond\s*(?:fund|portfolio)|asset\s*allocation|dividend\s*(?:reinvest|summary|statement))/i.test(text)) {
    return 'investment';
  }

  // Mortgage statement signals (expanded)
  if (/(mortgage\s*(?:statement|payment|account)|principal\s*(?:balance|amount|remaining)|escrow\s*(?:balance|payment|account)|loan\s*(?:balance|amount|statement|number)|(?:interest|annual|fixed|variable)\s*rate\s*[:.]?\s*\d|amortization|(?:monthly|regular|minimum)\s*(?:mortgage\s*)?payment|remaining\s*(?:balance|term)|maturity\s*date|lien|deed\s*of\s*trust)/i.test(text)) {
    return 'mortgage';
  }

  return 'unknown';
}

// --- Bank Statement Extraction (Expanded) ---
function extractBankStatement(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const endingBalance = extractDollarAfter(text, /(?:ending|closing|final|current|available)\s*balance/i)
    ?? extractLabeledAmount(text, /(?:ending|closing|final|current|available)\s*balance/i);
  if (endingBalance !== null) {
    fields.push({ label: 'Account Balance', value: endingBalance, confidence: 'high', category: 'asset', rawMatch: `Ending Balance: $${endingBalance}` });
  }

  const beginningBalance = extractDollarAfter(text, /(?:beginning|opening|starting|previous)\s*balance/i)
    ?? extractLabeledAmount(text, /(?:beginning|opening|starting|previous)\s*balance/i);
  if (beginningBalance !== null) {
    fields.push({ label: 'Previous Balance', value: beginningBalance, confidence: 'medium', category: 'asset', rawMatch: `Beginning Balance: $${beginningBalance}` });
  }

  const totalDeposits = extractDollarAfter(text, /total\s*(?:deposits?|credits?|additions?|money\s*in)/i)
    ?? extractLabeledAmount(text, /total\s*(?:deposits?|credits?|additions?|money\s*in)/i);
  if (totalDeposits !== null) {
    fields.push({ label: 'Monthly Deposits', value: totalDeposits, confidence: 'medium', category: 'income', rawMatch: `Total Deposits: $${totalDeposits}` });
  }

  const totalWithdrawals = extractDollarAfter(text, /total\s*(?:withdrawals?|debits?|subtractions?|checks?|money\s*out)/i)
    ?? extractLabeledAmount(text, /total\s*(?:withdrawals?|debits?|subtractions?|checks?|money\s*out)/i);
  if (totalWithdrawals !== null) {
    fields.push({ label: 'Monthly Expenses', value: totalWithdrawals, confidence: 'medium', category: 'expense', rawMatch: `Total Withdrawals: $${totalWithdrawals}` });
  }

  // Account type detection
  if (/checking/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'checking', confidence: 'high', category: 'asset', rawMatch: 'Checking Account' });
  } else if (/savings?/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'savings', confidence: 'high', category: 'asset', rawMatch: 'Savings Account' });
  } else if (/money\s*market/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'savings', confidence: 'medium', category: 'asset', rawMatch: 'Money Market Account' });
  }

  return fields;
}

// --- Tax Return Extraction (Expanded) ---
function extractTaxReturn(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const wages = extractDollarAfter(text, /(?:wages|salaries|compensation|w-?2\s*(?:income|wages))/i)
    ?? extractLabeledAmount(text, /(?:wages|salaries|compensation)/i);
  if (wages !== null) {
    fields.push({ label: 'Wages & Salaries', value: wages, confidence: 'high', category: 'income', rawMatch: `Wages: $${wages}` });
  }

  const totalIncome = extractDollarAfter(text, /(?:total|gross|combined)\s*income/i)
    ?? extractLabeledAmount(text, /(?:total|gross|combined)\s*income/i);
  if (totalIncome !== null) {
    fields.push({ label: 'Total Income', value: totalIncome, confidence: 'high', category: 'income', rawMatch: `Total Income: $${totalIncome}` });
  }

  const agi = extractDollarAfter(text, /adjusted\s*gross\s*income|agi/i)
    ?? extractLabeledAmount(text, /adjusted\s*gross\s*income|agi/i);
  if (agi !== null) {
    fields.push({ label: 'Adjusted Gross Income', value: agi, confidence: 'high', category: 'tax', rawMatch: `AGI: $${agi}` });
  }

  const taxableIncome = extractDollarAfter(text, /taxable\s*income/i)
    ?? extractLabeledAmount(text, /taxable\s*income/i);
  if (taxableIncome !== null) {
    fields.push({ label: 'Taxable Income', value: taxableIncome, confidence: 'high', category: 'tax', rawMatch: `Taxable Income: $${taxableIncome}` });
  }

  const totalTax = extractDollarAfter(text, /(?:total|federal)\s*(?:income\s*)?tax(?:\s*(?:due|owed|liability))?/i)
    ?? extractLabeledAmount(text, /(?:total|federal)\s*(?:income\s*)?tax/i);
  if (totalTax !== null) {
    fields.push({ label: 'Total Tax', value: totalTax, confidence: 'high', category: 'tax', rawMatch: `Total Tax: $${totalTax}` });
  }

  // Filing status
  const filingMatch = text.match(/(Single|Married\s*filing\s*jointly|Married\s*filing\s*separately|Head\s*of\s*household|Qualifying\s*(?:widow|surviving\s*spouse))/i);
  if (filingMatch) {
    fields.push({ label: 'Filing Status', value: filingMatch[1], confidence: 'high', category: 'personal', rawMatch: filingMatch[0] });
  }

  // Interest income
  const interest = extractDollarAfter(text, /(?:taxable\s*)?interest\s*(?:income|earned|received)/i)
    ?? extractLabeledAmount(text, /(?:taxable\s*)?interest\s*(?:income|earned)/i);
  if (interest !== null && interest > 0 && interest < 10000000) {
    fields.push({ label: 'Interest Income', value: interest, confidence: 'medium', category: 'income', rawMatch: `Interest: $${interest}` });
  }

  // Dividend income
  const dividends = extractDollarAfter(text, /(?:ordinary\s*|qualified\s*)?dividends?\s*(?:income|earned|received)?/i)
    ?? extractLabeledAmount(text, /(?:ordinary\s*|qualified\s*)?dividends/i);
  if (dividends !== null && dividends > 0 && dividends < 10000000) {
    fields.push({ label: 'Dividend Income', value: dividends, confidence: 'medium', category: 'income', rawMatch: `Dividends: $${dividends}` });
  }

  // Self-employment income
  const selfEmployment = extractDollarAfter(text, /(?:self[- ]?employment|schedule\s*c|business)\s*(?:income|profit|net)/i);
  if (selfEmployment !== null) {
    fields.push({ label: 'Self-Employment Income', value: selfEmployment, confidence: 'medium', category: 'income', rawMatch: `Self-Employment: $${selfEmployment}` });
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

  // Refund
  const refund = extractDollarAfter(text, /(?:refund|amount\s*(?:refunded|overpaid))/i);
  if (refund !== null) {
    fields.push({ label: 'Tax Refund', value: refund, confidence: 'medium', category: 'income', rawMatch: `Refund: $${refund}` });
  }

  return fields;
}

// --- Investment Statement Extraction (Expanded) ---
function extractInvestment(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const accountValue = extractDollarAfter(text, /(?:account|portfolio|total|market|net\s*asset|net\s*account|current)\s*(?:value|balance|worth)/i)
    ?? extractLabeledAmount(text, /(?:account|portfolio|total|market|net)\s*(?:value|balance)/i);
  if (accountValue !== null) {
    fields.push({ label: 'Investment Account Value', value: accountValue, confidence: 'high', category: 'asset', rawMatch: `Account Value: $${accountValue}` });
  }

  // 401k / IRA / account type detection
  if (/401\s*\(?k\)?/i.test(text)) {
    fields.push({ label: 'Account Type', value: '401k', confidence: 'high', category: 'asset', rawMatch: '401(k) Account' });
  } else if (/roth\s*ira/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'roth_ira', confidence: 'high', category: 'asset', rawMatch: 'Roth IRA' });
  } else if (/traditional\s*ira/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'traditional_ira', confidence: 'high', category: 'asset', rawMatch: 'Traditional IRA' });
  } else if (/403\s*\(?b\)?/i.test(text)) {
    fields.push({ label: 'Account Type', value: '401k', confidence: 'high', category: 'asset', rawMatch: '403(b) Account' });
  } else if (/457\s*\(?b?\)?/i.test(text)) {
    fields.push({ label: 'Account Type', value: '401k', confidence: 'high', category: 'asset', rawMatch: '457 Plan' });
  } else if (/tsp|thrift\s*savings/i.test(text)) {
    fields.push({ label: 'Account Type', value: '401k', confidence: 'high', category: 'asset', rawMatch: 'Thrift Savings Plan' });
  } else if (/brokerage/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'brokerage', confidence: 'high', category: 'asset', rawMatch: 'Brokerage Account' });
  } else if (/529|education\s*(?:savings|plan)/i.test(text)) {
    fields.push({ label: 'Account Type', value: 'brokerage', confidence: 'medium', category: 'asset', rawMatch: '529 Education Plan' });
  }

  // Contributions
  const contributions = extractDollarAfter(text, /(?:total\s*|employee\s*|employer\s*)?contributions?/i);
  if (contributions !== null) {
    fields.push({ label: 'Contributions', value: contributions, confidence: 'medium', category: 'income', rawMatch: `Contributions: $${contributions}` });
  }

  // Dividends
  const divs = extractDollarAfter(text, /(?:total\s*)?dividends?\s*(?:received|earned|reinvested|paid|income)?/i);
  if (divs !== null && divs > 0) {
    fields.push({ label: 'Dividends', value: divs, confidence: 'medium', category: 'income', rawMatch: `Dividends: $${divs}` });
  }

  // Gain/Loss
  const gains = extractDollarAfter(text, /(?:total\s*|net\s*|unrealized\s*|realized\s*)?(?:gain|loss|return)/i);
  if (gains !== null) {
    fields.push({ label: 'Investment Gain/Loss', value: gains, confidence: 'low', category: 'income', rawMatch: `Gain/Loss: $${gains}` });
  }

  return fields;
}

// --- Pay Stub Extraction (Expanded) ---
function extractPayStub(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const grossPay = extractDollarAfter(text, /gross\s*(?:pay|wages?|compensation|earnings)/i)
    ?? extractLabeledAmount(text, /gross\s*(?:pay|wages?|compensation|earnings)/i);
  if (grossPay !== null) {
    fields.push({ label: 'Gross Pay (Period)', value: grossPay, confidence: 'high', category: 'income', rawMatch: `Gross Pay: $${grossPay}` });
  }

  const netPay = extractDollarAfter(text, /(?:net\s*pay|take[- ]?home\s*pay|net\s*(?:wages|amount|earnings))/i)
    ?? extractLabeledAmount(text, /(?:net\s*pay|take[- ]?home)/i);
  if (netPay !== null) {
    fields.push({ label: 'Net Pay (Period)', value: netPay, confidence: 'high', category: 'income', rawMatch: `Net Pay: $${netPay}` });
  }

  const ytdGross = extractDollarAfter(text, /ytd\s*(?:gross|earnings|total|wages|compensation)/i)
    ?? extractLabeledAmount(text, /ytd\s*(?:gross|earnings|total)/i);
  if (ytdGross !== null) {
    fields.push({ label: 'YTD Gross Earnings', value: ytdGross, confidence: 'high', category: 'income', rawMatch: `YTD Gross: $${ytdGross}` });
  }

  const fedTax = extractDollarAfter(text, /federal\s*(?:income\s*)?(?:tax|withholding)|fed\s*(?:tax|w\/h)/i);
  if (fedTax !== null) {
    fields.push({ label: 'Federal Tax Withheld', value: fedTax, confidence: 'medium', category: 'tax', rawMatch: `Federal Tax: $${fedTax}` });
  }

  const stateTax = extractDollarAfter(text, /state\s*(?:income\s*)?(?:tax|withholding)/i);
  if (stateTax !== null) {
    fields.push({ label: 'State Tax Withheld', value: stateTax, confidence: 'medium', category: 'tax', rawMatch: `State Tax: $${stateTax}` });
  }

  const retirement401k = extractDollarAfter(text, /401\s*\(?k\)?|retirement\s*(?:contribution|deduction)/i);
  if (retirement401k !== null) {
    fields.push({ label: '401(k) Contribution', value: retirement401k, confidence: 'medium', category: 'asset', rawMatch: `401(k): $${retirement401k}` });
  }

  const healthIns = extractDollarAfter(text, /(?:health|medical|dental|vision)\s*(?:insurance|premium|deduction)/i);
  if (healthIns !== null) {
    fields.push({ label: 'Health Insurance Premium', value: healthIns, confidence: 'medium', category: 'expense', rawMatch: `Health Insurance: $${healthIns}` });
  }

  // Pay frequency detection
  if (/bi-?weekly|every\s*(?:two|2)\s*weeks|26\s*pay\s*periods/i.test(text)) {
    fields.push({ label: 'Pay Frequency', value: 'biweekly', confidence: 'medium', category: 'personal', rawMatch: 'Bi-weekly pay' });
  } else if (/semi-?monthly|twice\s*(?:a|per)\s*month|24\s*pay\s*periods/i.test(text)) {
    fields.push({ label: 'Pay Frequency', value: 'semimonthly', confidence: 'medium', category: 'personal', rawMatch: 'Semi-monthly pay' });
  } else if (/monthly|12\s*pay\s*periods/i.test(text)) {
    fields.push({ label: 'Pay Frequency', value: 'monthly', confidence: 'medium', category: 'personal', rawMatch: 'Monthly pay' });
  } else if (/weekly|52\s*pay\s*periods/i.test(text)) {
    fields.push({ label: 'Pay Frequency', value: 'weekly', confidence: 'medium', category: 'personal', rawMatch: 'Weekly pay' });
  }

  return fields;
}

// --- Mortgage Statement Extraction (Expanded) ---
function extractMortgage(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const principal = extractDollarAfter(text, /(?:principal|outstanding|unpaid|current|remaining|loan)\s*balance/i)
    ?? extractLabeledAmount(text, /(?:principal|outstanding|unpaid|current|remaining|loan)\s*balance/i);
  if (principal !== null) {
    fields.push({ label: 'Mortgage Balance', value: principal, confidence: 'high', category: 'liability', rawMatch: `Balance: $${principal}` });
  }

  const monthlyPayment = extractDollarAfter(text, /(?:monthly|regular|minimum|total)\s*(?:mortgage\s*)?payment/i)
    ?? extractLabeledAmount(text, /(?:monthly|regular)\s*payment/i);
  if (monthlyPayment !== null) {
    fields.push({ label: 'Monthly Payment', value: monthlyPayment, confidence: 'high', category: 'expense', rawMatch: `Payment: $${monthlyPayment}` });
  }

  const rateMatch = text.match(/(?:interest|annual|fixed|variable|current)\s*rate\s*[:.]?\s*([\d.]+)\s*%/i);
  if (rateMatch) {
    fields.push({ label: 'Interest Rate', value: parseFloat(rateMatch[1]), confidence: 'high', category: 'liability', rawMatch: `Rate: ${rateMatch[1]}%` });
  }

  const escrow = extractDollarAfter(text, /escrow\s*(?:balance|payment|amount)?/i);
  if (escrow !== null) {
    fields.push({ label: 'Escrow Payment', value: escrow, confidence: 'medium', category: 'expense', rawMatch: `Escrow: $${escrow}` });
  }

  const originalBalance = extractDollarAfter(text, /original\s*(?:loan|balance|amount|principal)/i);
  if (originalBalance !== null) {
    fields.push({ label: 'Original Loan Amount', value: originalBalance, confidence: 'medium', category: 'liability', rawMatch: `Original: $${originalBalance}` });
  }

  return fields;
}

// ============================================================================
// GENERIC FINANCIAL DATA EXTRACTION
// This is the key fallback — scans for ANY financial terms and dollar amounts
// even when the document type can't be identified.
// ============================================================================

function extractGenericFinancialData(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const seen = new Set<string>(); // prevent duplicates

  // Generic patterns: "Label $Amount" or "Label: $Amount" or "Label ... $Amount"
  const genericPatterns: { pattern: RegExp; label: string; category: ExtractedField['category'] }[] = [
    // Income
    { pattern: /(?:annual|yearly|total)\s*(?:salary|income|compensation|earnings)/i, label: 'Annual Income', category: 'income' },
    { pattern: /(?:monthly|bi-?weekly|weekly)\s*(?:salary|income|pay|wage)/i, label: 'Periodic Income', category: 'income' },
    { pattern: /salary/i, label: 'Salary', category: 'income' },
    { pattern: /(?:annual|base)\s*(?:pay|compensation)/i, label: 'Base Compensation', category: 'income' },
    { pattern: /rental\s*income/i, label: 'Rental Income', category: 'income' },
    { pattern: /(?:social\s*security|ssa|ss)\s*(?:income|benefit|payment)/i, label: 'Social Security', category: 'income' },
    { pattern: /pension\s*(?:income|benefit|payment)/i, label: 'Pension', category: 'income' },
    { pattern: /alimony|child\s*support/i, label: 'Support Payments', category: 'income' },

    // Assets
    { pattern: /(?:total\s*)?(?:net\s*)?worth/i, label: 'Net Worth', category: 'asset' },
    { pattern: /(?:checking|savings?|bank)\s*(?:account|balance)/i, label: 'Bank Account', category: 'asset' },
    { pattern: /(?:emergency|rainy\s*day)\s*fund/i, label: 'Emergency Fund', category: 'asset' },
    { pattern: /(?:home|property|house|real\s*estate)\s*(?:value|worth|equity)/i, label: 'Home Value', category: 'asset' },
    { pattern: /(?:car|vehicle|auto(?:mobile)?)\s*(?:value|worth)/i, label: 'Vehicle Value', category: 'asset' },
    { pattern: /(?:retirement|401k?|ira|403b?|457|tsp)\s*(?:balance|value|savings?|account)?/i, label: 'Retirement Account', category: 'asset' },
    { pattern: /(?:investment|brokerage|stock|bond|mutual\s*fund|etf)\s*(?:balance|value|account|portfolio)?/i, label: 'Investment Account', category: 'asset' },
    { pattern: /(?:529|education|college)\s*(?:savings?|fund|plan|account)/i, label: 'Education Savings', category: 'asset' },
    { pattern: /(?:hsa|health\s*savings)\s*(?:balance|account)?/i, label: 'HSA Balance', category: 'asset' },
    { pattern: /(?:crypto|bitcoin|ethereum|digital\s*asset)/i, label: 'Cryptocurrency', category: 'asset' },
    { pattern: /cash\s*(?:on\s*hand|value|balance|available)/i, label: 'Cash', category: 'asset' },

    // Liabilities
    { pattern: /(?:mortgage|home\s*loan)\s*(?:balance|owed|remaining|amount|debt)?/i, label: 'Mortgage Balance', category: 'liability' },
    { pattern: /(?:student|education)\s*loan/i, label: 'Student Loan', category: 'liability' },
    { pattern: /(?:car|auto|vehicle)\s*loan/i, label: 'Auto Loan', category: 'liability' },
    { pattern: /(?:credit\s*card|revolving)\s*(?:balance|debt|owed)?/i, label: 'Credit Card Debt', category: 'liability' },
    { pattern: /(?:personal|unsecured)\s*loan/i, label: 'Personal Loan', category: 'liability' },
    { pattern: /(?:medical|healthcare)\s*(?:debt|bill|balance)/i, label: 'Medical Debt', category: 'liability' },
    { pattern: /(?:total\s*)?(?:debt|liabilities|amount\s*owed)/i, label: 'Total Debt', category: 'liability' },
    { pattern: /heloc|home\s*equity\s*(?:line|loan)/i, label: 'HELOC', category: 'liability' },

    // Expenses
    { pattern: /(?:monthly\s*)?(?:rent|lease)\s*(?:payment|amount|expense)?/i, label: 'Rent/Lease', category: 'expense' },
    { pattern: /(?:monthly\s*)?(?:mortgage\s*)?payment/i, label: 'Monthly Payment', category: 'expense' },
    { pattern: /(?:health|medical|dental|vision)\s*(?:insurance|premium)/i, label: 'Health Insurance', category: 'expense' },
    { pattern: /(?:life|term|whole)\s*insurance\s*(?:premium)?/i, label: 'Life Insurance', category: 'expense' },
    { pattern: /(?:car|auto|vehicle)\s*(?:insurance|payment)/i, label: 'Auto Insurance/Payment', category: 'expense' },
    { pattern: /(?:home(?:owners?)?|renters?|property)\s*insurance/i, label: 'Home Insurance', category: 'expense' },
    { pattern: /(?:child\s*care|daycare|nanny|babysit)/i, label: 'Childcare', category: 'expense' },
    { pattern: /(?:tuition|school\s*fee|education\s*(?:cost|expense))/i, label: 'Education', category: 'expense' },
    { pattern: /(?:monthly\s*)?(?:utility|utilities|electric|gas\s*bill|water\s*bill)/i, label: 'Utilities', category: 'expense' },
    { pattern: /(?:total\s*monthly\s*)?expenses?/i, label: 'Total Expenses', category: 'expense' },

    // Tax
    { pattern: /(?:property|real\s*estate)\s*tax/i, label: 'Property Tax', category: 'tax' },
    { pattern: /(?:estimated|quarterly)\s*tax/i, label: 'Estimated Tax', category: 'tax' },
  ];

  for (const { pattern, label, category } of genericPatterns) {
    if (seen.has(label)) continue;
    const value = extractDollarAfter(text, pattern) ?? extractLabeledAmount(text, pattern);
    if (value !== null && value > 0) {
      seen.add(label);
      fields.push({
        label,
        value,
        confidence: 'medium',
        category,
        rawMatch: `${label}: $${value.toLocaleString()}`,
      });
    }
  }

  // Also scan for any standalone labeled dollar amounts we might have missed
  // Pattern: "Some Label: $12,345" or "Some Label $12,345.67"
  const labeledDollarRe = /^[\s]*([A-Z][A-Za-z\s&/()]{3,40})[:.\s]+\$\s?([\d,]+(?:\.\d{2})?)/gm;
  let match;
  while ((match = labeledDollarRe.exec(text)) !== null) {
    const rawLabel = match[1].trim();
    const amount = parseDollar(match[2]);
    if (amount <= 0 || amount > 100000000) continue;
    if (seen.has(rawLabel)) continue;
    seen.add(rawLabel);

    // Infer category from label
    const lbl = rawLabel.toLowerCase();
    let category: ExtractedField['category'] = 'asset';
    if (/income|salary|wage|pay|earning|dividend|interest|rent(?:al)?/i.test(lbl)) category = 'income';
    else if (/expense|payment|bill|premium|cost|fee|rent$/i.test(lbl)) category = 'expense';
    else if (/debt|loan|owe|balance.*owe|credit\s*card|mortgage/i.test(lbl)) category = 'liability';
    else if (/tax/i.test(lbl)) category = 'tax';
    else if (/balance|value|worth|saving|account|fund|invest/i.test(lbl)) category = 'asset';

    fields.push({
      label: rawLabel,
      value: amount,
      confidence: 'low',
      category,
      rawMatch: `${rawLabel}: $${amount.toLocaleString()}`,
    });
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

  // If we identified a type but got few results, also try generic extraction
  if (fields.length < 3) {
    const genericFields = extractGenericFinancialData(text);
    // Only add generic fields that don't duplicate existing labels
    const existingLabels = new Set(fields.map(f => f.label.toLowerCase()));
    for (const gf of genericFields) {
      if (!existingLabels.has(gf.label.toLowerCase())) {
        fields.push(gf);
      }
    }
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

  // If STILL empty, try the generic extractor as last resort
  if (fields.length === 0) {
    fields = extractGenericFinancialData(text);
  }

  return { type, fields };
}

// --- CSV Transaction Categorization ---
export function categorizeTransaction(description: string, amount: number): { category: string; isIncome: boolean } {
  const d = description.toLowerCase();

  // Income patterns
  if (/payroll|direct\s*dep|salary|wage|ach\s*credit|employer|income|compensation/i.test(d)) {
    return { category: 'salary', isIncome: true };
  }
  if (/dividend|interest\s*(?:paid|earned|credit)|investment\s*income/i.test(d)) {
    return { category: 'investment_income', isIncome: true };
  }
  if (/refund|tax\s*refund|irs|tax\s*return/i.test(d)) {
    return { category: 'other_income', isIncome: true };
  }
  if (/rental|rent\s*(?:income|received|payment\s*from)/i.test(d)) {
    return { category: 'rental', isIncome: true };
  }
  if (/social\s*security|ssa|pension|retirement\s*(?:income|benefit)/i.test(d)) {
    return { category: 'other_income', isIncome: true };
  }

  // Expense categories
  if (/rent|mortgage|hoa|property\s*(?:tax|mgmt)|lease\s*payment/i.test(d)) return { category: 'housing', isIncome: false };
  if (/electric|gas\s*(?:bill|company)|water|utility|internet|cable|phone|verizon|at&?t|comcast|pg&e|spectrum|xfinity/i.test(d)) return { category: 'utilities', isIncome: false };
  if (/grocery|safeway|trader|whole\s*foods|kroger|costco|walmart|target|publix|aldi|wegmans|sprouts|h-?e-?b/i.test(d)) return { category: 'food', isIncome: false };
  if (/restaurant|doordash|grubhub|uber\s*eats|starbucks|mcdonald|chipotle|chick-?fil-?a|panera|dominos/i.test(d)) return { category: 'dining', isIncome: false };
  if (/gas\s*station|shell|chevron|exxon|bp\s|texaco|marathon|76|arco|sunoco|speedway/i.test(d)) return { category: 'transportation', isIncome: false };
  if (/insurance|geico|allstate|state\s*farm|progressive|aetna|cigna|blue\s*cross|united\s*health|humana|kaiser/i.test(d)) return { category: 'insurance', isIncome: false };
  if (/medical|doctor|hospital|pharmacy|cvs|walgreens|dental|optom|lab\s*corp|quest\s*diag/i.test(d)) return { category: 'healthcare', isIncome: false };
  if (/netflix|spotify|hulu|disney|amazon\s*prime|subscription|apple\s*(?:tv|music)|youtube|hbo|paramount/i.test(d)) return { category: 'entertainment', isIncome: false };
  if (/loan\s*(?:payment|pmt)|student\s*loan|auto\s*(?:pay|loan)|car\s*payment|navient|nelnet|sofi|earnest/i.test(d)) return { category: 'debt_payment', isIncome: false };
  if (/transfer|zelle|venmo|paypal|cash\s*app|wire/i.test(d)) return { category: 'transfer', isIncome: false };
  if (/amazon(?!\s*prime)|ebay|etsy|online\s*(?:purchase|order)|shop/i.test(d)) return { category: 'other', isIncome: false };

  // Default: positive amounts are likely income, negative are expenses
  if (amount > 0) return { category: 'other_income', isIncome: true };
  return { category: 'other', isIncome: false };
}
