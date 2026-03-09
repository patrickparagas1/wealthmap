// ============================================================================
// Financial Document Pattern Matching
// Extracts structured data from raw text using regex patterns
// Broadened patterns to handle real-world document variations
// ============================================================================

export type DocumentType = 'bank_statement' | 'tax_return' | 'investment' | 'pay_stub' | 'mortgage' | 'budget' | 'unknown';

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

// --- Document Type Detection ---
// IMPORTANT: Order matters! Pay stub first (very distinctive signals that won't
// appear in investment docs), then investment (contains "federal"/"balance" boilerplate
// that matches bank/tax), then tax/bank/budget/mortgage.
export function detectDocumentType(text: string): DocumentType {
  // 1. PAY STUB — check FIRST because pay stubs mention "retirement plan",
  //    "employee contributions", etc. that would falsely match investment.
  //    Require at least 2 signals to avoid false positives.
  const payStubSignals = [
    /pay\s*(?:stub|advice|statement|check)/i,
    /gross\s*(?:pay|wages?|compensation|earnings)/i,
    /net\s*pay/i,
    /hours\s*and\s*earnings/i,
    /ytd\s*(?:gross|earnings|total|net)/i,
    /pay\s*rate/i,
    /(?:federal|fed)\s*(?:withholding|w\/h)/i,
    /(?:before|after)[- ]?tax\s*deductions/i,
    /employer\s*paid\s*benefits/i,
    /pay\s*(?:begin|end)\s*date/i,
    /employee\s*id/i,
  ];
  const payStubHits = payStubSignals.filter(p => p.test(text)).length;
  if (payStubHits >= 2) {
    return 'pay_stub';
  }

  // 2. INVESTMENT / RETIREMENT — check before bank/tax because these docs
  //    contain "federal" (SIPC disclaimers), "beginning/ending balance", etc.
  if (/(investment\s*report|account\s*value|(?:beginning|ending)\s*account\s*value|portfolio\s*(?:value|summary|balance)|brokerage\s*(?:link|account|statement)|(?:roth|traditional)\s*(?:ira|individual\s*retirement)|401\s*\(?k\)?|403\s*\(?b\)?|457\s*\(?b?\)?|thrift\s*savings|retirement\s*(?:savings?\s*(?:statement|program|plan|account))|(?:your|total)\s*account\s*(?:value|summary)|(?:asset\s*allocation|shares?\s*(?:\/\s*)?units?|market\s*value)|vested\s*balance|personal\s*rate\s*of\s*return|(?:mutual|index)\s*fund|(?:stock|bond|fund)\s*holdings|securities|net\s*asset\s*value|dividend\s*(?:reinvest|summary)|(?:unrealized|realized)\s*(?:gain|loss)|change\s*in\s*(?:investment|market|account)\s*value|fidelity|vanguard|schwab|t\.\s*rowe)/i.test(text)) {
    return 'investment';
  }

  // 3. BUDGET — detect structured budget documents (before bank_statement)
  if (/(?:budget|categories)\s.*(?:actual|difference)/i.test(text) || /(?:fixed|variable)\s.*(?:budget|expense)/i.test(text)) {
    return 'budget';
  }

  // 4. TAX RETURN — require strong signals, not just "federal tax"
  if (/(form\s*1040|1040-?[a-z]{0,3}|tax\s*return|adjusted\s*gross\s*income|w-?2\s*(?:wage|form)|form\s*w-?2|1099-?[a-z]+|schedule\s*[a-e]\b|tax\s*year\s*\d{4}|refund\s*amount|internal\s*revenue)/i.test(text)) {
    return 'tax_return';
  }

  // 5. BANK STATEMENT — require banking-specific terms
  if (/((?:checking|savings?|money\s*market)\s*(?:account|summary|\d))|(?:(?:total|number\s*of)\s*(?:deposits?|credits?|withdrawals?|debits?|checks?))|(?:atm\s*(?:withdrawal|deposit))|(?:debit\s*card\s*purchase)|(?:(?:chase|bank\s*of\s*america|wells\s*fargo|citi|pnc|usaa|capital\s*one)\s*(?:checking|savings|total|bank))/i.test(text)) {
    return 'bank_statement';
  }
  // Also detect bank statements by structure: "Beginning Balance" + "Ending Balance" + no investment terms
  if (/(?:beginning|opening)\s*balance/i.test(text) && /(?:ending|closing)\s*balance/i.test(text) && !/(?:account\s*value|investment\s*report|portfolio|shares|roth|401)/i.test(text)) {
    return 'bank_statement';
  }

  // 6. MORTGAGE
  if (/(mortgage\s*(?:statement|payment|account)|principal\s*(?:balance|amount|remaining)|escrow\s*(?:balance|payment|account)|amortization|deed\s*of\s*trust)/i.test(text)) {
    return 'mortgage';
  }

  return 'unknown';
}

// --- Bank Statement Extraction ---
// Handles Chase, BofA, Wells Fargo, etc. + budget documents
function extractBankStatement(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  // Chase format: "Checking & Savings Total $180.66 $3,097.20" or
  // "TOTAL ASSETS $180.66 $3,097.20" — ending balance is the LAST dollar on that line
  // Also: "Chase Total Checking 000000602839008 $2,997.20 $6,592.74" — last dollar is ending

  // Try to find each account separately (Chase shows checking + savings)
  const accountPatterns = [
    { pattern: /chase\s*total\s*checking[^\n]*?\$([\d,]+\.\d{2})\s*\$([\d,]+\.\d{2})/i, label: 'Checking Account' },
    { pattern: /chase\s*savings[^\n]*?\$([\d,]+\.\d{2})\s*\$([\d,]+\.\d{2})/i, label: 'Savings Account' },
  ];

  for (const { pattern, label } of accountPatterns) {
    const m = text.match(pattern);
    if (m) {
      const endingBal = parseDollar(m[2]); // Second dollar is ending balance
      if (endingBal > 0) {
        fields.push({ label, value: endingBal, confidence: 'high', category: 'asset', rawMatch: `${label}: $${endingBal.toLocaleString()}` });
      }
    }
  }

  // If no specific accounts found, try generic ending balance
  if (fields.length === 0) {
    // "Ending Balance $X,XXX.XX" — pick the LAST (largest context) dollar amount
    const endingLine = text.match(/(?:ending|closing|final)\s*balance[^\n]*/i);
    if (endingLine) {
      const dollars = endingLine[0].match(/\$([\d,]+\.\d{2})/g);
      if (dollars) {
        const lastVal = parseDollar(dollars[dollars.length - 1].replace('$', ''));
        if (lastVal > 0) {
          fields.push({ label: 'Account Balance', value: lastVal, confidence: 'high', category: 'asset', rawMatch: `Ending Balance: $${lastVal.toLocaleString()}` });
        }
      }
    }
  }

  // TOTAL ASSETS line (Chase summary)
  if (fields.length === 0) {
    const totalAssetsMatch = text.match(/total\s*assets[^\n]*?\$([\d,]+\.\d{2})\s*\$([\d,]+\.\d{2})/i);
    if (totalAssetsMatch) {
      const endingBal = parseDollar(totalAssetsMatch[2]);
      if (endingBal > 0) {
        fields.push({ label: 'Total Bank Balance', value: endingBal, confidence: 'high', category: 'asset', rawMatch: `Total Assets: $${endingBal.toLocaleString()}` });
      }
    }
  }

  // Beginning balance for context — pick the FIRST dollar after the keyword
  // (not the last, because single-line PDF text can have many unrelated dollars after it)
  const beginBal = extractDollarAfter(text, /(?:beginning|opening|starting)\s*balance/i);
  if (beginBal !== null && beginBal > 0) {
    fields.push({ label: 'Previous Balance', value: beginBal, confidence: 'medium', category: 'asset', rawMatch: `Beginning Balance: $${beginBal.toLocaleString()}` });
  }

  // Deposits total
  const totalDeposits = extractDollarAfter(text, /total\s*(?:deposits?|credits?|additions?|money\s*in)/i);
  if (totalDeposits !== null && totalDeposits > 0) {
    fields.push({ label: 'Monthly Deposits', value: totalDeposits, confidence: 'medium', category: 'income', rawMatch: `Total Deposits: $${totalDeposits.toLocaleString()}` });
  }

  // Withdrawals total
  const totalWithdrawals = extractDollarAfter(text, /total\s*(?:withdrawals?|debits?|subtractions?|checks?\s*paid|money\s*out)/i);
  if (totalWithdrawals !== null && totalWithdrawals > 0) {
    fields.push({ label: 'Monthly Expenses', value: totalWithdrawals, confidence: 'medium', category: 'expense', rawMatch: `Total Withdrawals: $${totalWithdrawals.toLocaleString()}` });
  }

  return fields;
}

/**
 * Parse budget documents — handles both multi-line and single-line PDF text.
 * Budget items follow "Label Amount Amount" pattern where budget ≈ actual.
 */
function extractBudgetItems(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const seen = new Set<string>();

  // Income: "Fixed 7796.98" (total monthly income)
  const incomeMatch = text.match(/\bFixed\s+([\d,]+(?:\.\d{2})?)/);
  if (incomeMatch) {
    const val = parseDollar(incomeMatch[1]);
    if (val > 1000) {
      fields.push({ label: 'Monthly Income', value: val, confidence: 'high', category: 'income', rawMatch: `Monthly Income: $${val}` });
    }
  }

  // Find "Savings" section marker position for category classification
  const savingsIdx = text.toLowerCase().indexOf('savings');

  // Clean text: remove headers and income source labels so they don't absorb expense labels
  // e.g., "UCI Health - Monthly Rent 3100 3100" → "Rent 3100 3100"
  const cleanText = text
    .replace(/Categories\s+Budget\s+Actual\s+Difference/gi, '')
    .replace(/Income\s+Date\s+Source\s+Income\s+Amount\s+Outcome\s+Date\s+Purchase\s+Type\s+Cost/gi, '')
    .replace(/[A-Za-z\s]+?-\s*Monthly\s*/gi, '') // Remove "UCI Health - Monthly" style income labels
    .replace(/\bFixed\s+[\d,.]+/g, '') // Remove "Fixed 7796.98" (income total)
    .replace(/\bTotal\s+[\d,.]+\s+\d+\s+[\d,.]+/g, ''); // Remove "Total 7658.05 0 7658.05"

  // Match all "Label Amount Amount" patterns using backreference (both amounts equal)
  // Works on both single-line and multi-line text
  const pattern = /([A-Za-z][A-Za-z\s\/\-&().]+?)\s+(\d+(?:\.\d{1,2})?)\s+\2(?=\s|[A-Z]|$)/g;
  let match;

  while ((match = pattern.exec(cleanText)) !== null) {
    let label = match[1].trim();
    const amount = parseDollar(match[2]);

    // Strip leading section markers from labels (e.g., "Variable Car Gas" → "Car Gas")
    label = label.replace(/^(?:Fixed|Variable|Savings)\s+/i, '').trim();

    // Skip headers, section markers, and totals
    if (/^(?:Total|Budget|Actual|Categories|Income|Fixed|Variable|Savings|Date|Source|Amount|Outcome|Type|Cost)$/i.test(label)) continue;
    if (label.length < 2) continue;

    if (amount > 0 && amount < 100000 && !seen.has(label.toLowerCase())) {
      seen.add(label.toLowerCase());

      // Use original text position for savings classification
      const labelPos = text.toLowerCase().indexOf(label.toLowerCase());
      const isSavings = savingsIdx > -1 && labelPos >= savingsIdx;

      fields.push({
        label,
        value: amount,
        confidence: 'medium',
        category: isSavings ? 'asset' : 'expense',
        rawMatch: `${label}: $${amount}`,
      });
    }
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

// --- Investment Statement Extraction ---
// Handles Fidelity, Vanguard, Schwab retirement + brokerage statements
function extractInvestment(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  // 1. Account Value — try multiple patterns used by real statements
  // Fidelity: "Your Account Value: $44,512.10" or "Ending Account Value ** $44,512.10"
  // Fidelity retirement: "Ending Balance $61,500.63" or "Vested Balance $61,500.63"
  const accountValuePatterns = [
    /your\s*account\s*value\s*[:.]?\s*\$\s?([\d,]+(?:\.\d{2})?)/i,
    /ending\s*account\s*value\s*\*{0,2}\s*\$\s?([\d,]+(?:\.\d{2})?)/i,
    /(?:ending|closing)\s*balance\s*\$\s?([\d,]+(?:\.\d{2})?)/i,
    /vested\s*balance\s*\$\s?([\d,]+(?:\.\d{2})?)/i,
    /(?:total|net|current|market)\s*(?:account\s*)?(?:value|balance)\s*[:.]?\s*\$\s?([\d,]+(?:\.\d{2})?)/i,
    /portfolio\s*(?:value|balance)\s*[:.]?\s*\$\s?([\d,]+(?:\.\d{2})?)/i,
  ];

  let accountValue: number | null = null;
  for (const pat of accountValuePatterns) {
    const m = text.match(pat);
    if (m) {
      const val = parseDollar(m[1]);
      if (val > 0 && (accountValue === null || val > accountValue)) {
        accountValue = val;
      }
    }
  }

  // Fallback: "Ending Balance" with dollar on same line — pick the LAST non-zero dollar on that line
  // (handles tables like "UC 457(b) Plan Total" where $0.00 $0.00 $23,130.80 $23,130.80)
  if (accountValue === null || accountValue === 0) {
    const endingBalLine = text.match(/ending\s*balance[^\n]*/i);
    if (endingBalLine) {
      const dollars = endingBalLine[0].match(/\$\s?([\d,]+(?:\.\d{2})?)/g);
      if (dollars) {
        // Pick the last non-zero value (usually the "Total" column)
        for (let i = dollars.length - 1; i >= 0; i--) {
          const val = parseDollar(dollars[i].replace(/\$/g, ''));
          if (val > 0) { accountValue = val; break; }
        }
      }
    }
  }

  // Also try generic dollar-after-label
  if (accountValue === null || accountValue === 0) {
    accountValue = extractDollarAfter(text, /(?:account|portfolio|total|market|net\s*asset|net\s*account|current)\s*(?:value|balance|worth)/i);
  }

  // Determine account type — check the first 500 chars (document header) first
  // to avoid false positives from boilerplate (e.g., "Roth IRA" in SIPC disclaimers)
  let accountTypeLabel = 'Investment Account';
  const headerText = text.slice(0, 500);

  if (/401\s*\(?k\)?/i.test(headerText)) {
    accountTypeLabel = '401(k)';
  } else if (/roth\s*(?:ira|individual\s*retirement)/i.test(headerText)) {
    accountTypeLabel = 'Roth IRA';
  } else if (/traditional\s*ira/i.test(headerText)) {
    accountTypeLabel = 'Traditional IRA';
  } else if (/457\s*\(?b?\)?/i.test(headerText)) {
    accountTypeLabel = '457(b) Plan';
  } else if (/403\s*\(?b\)?/i.test(headerText)) {
    accountTypeLabel = '403(b)';
  } else {
    // Fall back to full text — check 401(k) first, Roth IRA last (often in boilerplate)
    if (/401\s*\(?k\)?/i.test(text)) {
      accountTypeLabel = '401(k)';
    } else if (/457\s*\(?b?\)?/i.test(text) && /403\s*\(?b\)?/i.test(text)) {
      // Combined UC statement — check contribution summary for the active plan
      const contribSection = text.match(/contribution\s*summary[\s\S]{0,500}/i);
      if (contribSection && /457\s*\(?b?\)?/i.test(contribSection[0])) {
        accountTypeLabel = '457(b) Plan';
      } else if (contribSection && /403\s*\(?b\)?/i.test(contribSection[0])) {
        accountTypeLabel = '403(b)';
      } else {
        accountTypeLabel = 'Retirement Account';
      }
    } else if (/457\s*\(?b?\)?/i.test(text)) {
      accountTypeLabel = '457(b) Plan';
    } else if (/403\s*\(?b\)?/i.test(text)) {
      accountTypeLabel = '403(b)';
    } else if (/roth\s*(?:ira|individual\s*retirement)/i.test(text)) {
      accountTypeLabel = 'Roth IRA';
    } else if (/traditional\s*ira/i.test(text)) {
      accountTypeLabel = 'Traditional IRA';
    } else if (/tsp|thrift\s*savings/i.test(text)) {
      accountTypeLabel = 'Thrift Savings Plan';
    } else if (/529|education\s*(?:savings|plan)/i.test(text)) {
      accountTypeLabel = '529 Plan';
    } else if (/brokerage/i.test(text)) {
      accountTypeLabel = 'Brokerage Account';
    } else if (/retirement/i.test(text)) {
      accountTypeLabel = 'Retirement Account';
    }
  }

  if (accountValue !== null && accountValue > 0) {
    fields.push({
      label: `${accountTypeLabel} Balance`,
      value: accountValue,
      confidence: 'high',
      category: 'asset',
      rawMatch: `${accountTypeLabel}: $${accountValue.toLocaleString()}`,
    });
  }

  // Beginning value for context
  const beginPatterns = [
    /beginning\s*account\s*value\s*\$\s?([\d,]+(?:\.\d{2})?)/i,
    /beginning\s*balance\s*\$\s?([\d,]+(?:\.\d{2})?)/i,
  ];
  for (const pat of beginPatterns) {
    const m = text.match(pat);
    if (m) {
      const val = parseDollar(m[1]);
      if (val > 0) {
        fields.push({ label: `${accountTypeLabel} Previous Balance`, value: val, confidence: 'medium', category: 'asset', rawMatch: `Beginning: $${val}` });
        break;
      }
    }
  }

  // Employee/Employer Contributions
  const empContrib = extractDollarAfter(text, /employee\s*contributions?/i);
  if (empContrib !== null && empContrib > 0) {
    fields.push({ label: 'Employee Contributions', value: empContrib, confidence: 'medium', category: 'asset', rawMatch: `Contributions: $${empContrib}` });
  }

  return fields;
}

// --- Pay Stub Extraction ---
// Handles UC/university pay stubs, ADP, Paychex, Gusto, etc.
function extractPayStub(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  // 1. Try to find Pay Rate (hourly) — more reliable for annual income estimation
  const payRateMatch = text.match(/pay\s*rate\s*[:.]?\s*\$?\s?([\d,]+(?:\.\d+)?)\s*(?:hourly|\/\s*hr|per\s*hour)?/i);
  const hourlyRate = payRateMatch ? parseFloat(payRateMatch[1]) : null;

  // 2. Net Pay — look for "NET PAY" line with dollar amount
  // UC format: "*TAXABLE TOT GRS ... NET PAY Current 5,733.60 ... YTD 22,371.79 ..."
  // Or: "NET PAY Current X,XXX.XX"
  // Or: "Net Pay $X,XXX.XX"
  let netPayCurrent: number | null = null;
  let netPayYTD: number | null = null;

  // UC-specific: "NET PAY" section with "Current X,XXX.XX" and "YTD X,XXX.XX"
  const netPaySection = text.match(/NET\s*PAY[\s\S]{0,200}?Current\s+([\d,]+\.\d{2})[\s\S]{0,100}?YTD\s+([\d,]+\.\d{2})/i);
  if (netPaySection) {
    netPayCurrent = parseDollar(netPaySection[1]);
    netPayYTD = parseDollar(netPaySection[2]);
  }

  // Generic net pay
  if (netPayCurrent === null) {
    // Try "Net Pay: $X,XXX.XX" format
    const netPayMatch = text.match(/net\s*pay\s*[:.]?\s*\$?\s?([\d,]+\.\d{2})/i);
    if (netPayMatch) netPayCurrent = parseDollar(netPayMatch[1]);
  }

  // 3. Gross Pay / Total Earnings
  // UC format: "TOTAL: 80.00 5,733.60 312.15 22,371.79" (Hours Current YTDHours YTDEarnings)
  // The TOTAL line in HOURS AND EARNINGS section
  let grossPayCurrent: number | null = null;
  let grossPayYTD: number | null = null;

  // UC-specific: "*TAXABLE TOT GRS" line has current and YTD gross
  const taxableTotMatch = text.match(/\*?TAXABLE\s+TOT\s+GRS[\s\S]{0,60}?Current\s+([\d,]+\.\d{2})[\s\S]{0,30}?YTD\s+([\d,]+\.\d{2})/i);
  if (taxableTotMatch) {
    grossPayCurrent = parseDollar(taxableTotMatch[1]);
    grossPayYTD = parseDollar(taxableTotMatch[2]);
  }

  // Also try the HOURS AND EARNINGS TOTAL line
  if (grossPayYTD === null) {
    // Look for "TOTAL: <hours> <current$> <ytdHours> <ytd$>" pattern
    const totalLineMatch = text.match(/TOTAL:\s+[\d.]+\s+([\d,]+\.\d{2})\s+[\d.]+\s+([\d,]+\.\d{2})/);
    if (totalLineMatch) {
      grossPayCurrent = parseDollar(totalLineMatch[1]);
      grossPayYTD = parseDollar(totalLineMatch[2]);
    }
  }

  // Generic gross pay
  if (grossPayCurrent === null) {
    grossPayCurrent = extractDollarAfter(text, /gross\s*(?:pay|wages?|compensation|earnings)/i);
  }

  // 4. Estimate annual salary
  // Best: hourly rate × 2080 (standard full-time hours)
  // Next: YTD gross extrapolated to full year
  // Last: current period × pay frequency
  let annualSalary: number | null = null;
  if (hourlyRate && hourlyRate > 10 && hourlyRate < 1000) {
    annualSalary = Math.round(hourlyRate * 2080);
    fields.push({
      label: 'Annual Salary (estimated)',
      value: annualSalary,
      confidence: 'high',
      category: 'income',
      rawMatch: `$${hourlyRate}/hr × 2080 hrs = $${annualSalary.toLocaleString()}`,
    });
  } else if (grossPayYTD && grossPayYTD > 1000) {
    // Extrapolate YTD to annual — determine what fraction of year has passed
    const dateMatch = text.match(/pay\s*end\s*date\s*[:.]?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dateMatch) {
      const [mm] = dateMatch[1].split('/');
      const monthFraction = parseInt(mm) / 12;
      if (monthFraction > 0) {
        annualSalary = Math.round(grossPayYTD / monthFraction);
      }
    }
    if (!annualSalary) annualSalary = Math.round(grossPayYTD * 2); // rough estimate
    fields.push({
      label: 'Annual Salary (estimated from YTD)',
      value: annualSalary,
      confidence: 'medium',
      category: 'income',
      rawMatch: `YTD Gross: $${grossPayYTD.toLocaleString()}`,
    });
  }

  // 5. Net Pay per period (useful info)
  if (netPayCurrent && netPayCurrent > 100) {
    fields.push({
      label: 'Net Pay (per period)',
      value: netPayCurrent,
      confidence: 'high',
      category: 'income',
      rawMatch: `Net Pay: $${netPayCurrent.toLocaleString()}`,
    });
  }

  // 6. Federal tax withheld
  const fedWithMatch = text.match(/(?:fed(?:eral)?\s*(?:withholding|w\/h|income\s*tax))\s+([\d,]+\.\d{2})/i);
  const fedTax = fedWithMatch ? parseDollar(fedWithMatch[1]) : extractDollarAfter(text, /fed(?:eral)?\s*withholding/i);
  if (fedTax !== null && fedTax > 0) {
    fields.push({ label: 'Federal Tax Withheld (period)', value: fedTax, confidence: 'medium', category: 'tax', rawMatch: `Federal Tax: $${fedTax}` });
  }

  // 7. Retirement contributions (from deductions)
  const retirementMatch = text.match(/(?:457B?\s*Def\s*Comp|UC\s*Retirement|401\s*\(?k\)?|403\s*\(?b\)?|retirement)\s*(?:plan|contribution|deduction)?\s+([\d,]+\.\d{2})/i);
  if (retirementMatch) {
    const val = parseDollar(retirementMatch[1]);
    if (val > 0) {
      fields.push({ label: 'Retirement Contribution (period)', value: val, confidence: 'medium', category: 'asset', rawMatch: `Retirement: $${val}` });
    }
  }

  // 8. Health insurance premium
  const healthMatch = text.match(/(?:kaiser|aetna|cigna|blue\s*cross|united\s*health|health\s*(?:ins|premium))\s*(?:\w+\s+)?([\d,]+\.\d{2})/i);
  if (healthMatch) {
    const val = parseDollar(healthMatch[1]);
    if (val > 0) {
      fields.push({ label: 'Health Insurance (period)', value: val, confidence: 'medium', category: 'expense', rawMatch: `Health: $${val}` });
    }
  }

  // 9. Job title
  const jobMatch = text.match(/job\s*title\s*[:.]?\s*([A-Z][A-Za-z\s-]{2,30}?)(?:\s*pay|\s*$)/im);
  if (jobMatch) {
    fields.push({ label: 'Job Title', value: jobMatch[1].trim(), confidence: 'high', category: 'personal', rawMatch: jobMatch[0] });
  }

  // 10. Employer
  const employerMatch = text.match(/(?:business\s*unit|employer)\s*[:.]?\s*([A-Z][A-Za-z\s-]{3,40}?)(?:\s*pay|\s*$)/im);
  if (employerMatch) {
    fields.push({ label: 'Employer', value: employerMatch[1].trim(), confidence: 'medium', category: 'personal', rawMatch: employerMatch[0] });
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
    case 'budget': fields = extractBudgetItems(text); break;
    default: fields = []; break;
  }

  // If we identified a document type but the type-specific extractor found nothing,
  // try generic extraction as a fallback. Don't pollute good type-specific results
  // with noisy generic matches (e.g., "Rent/Lease $60k" from investment boilerplate).
  if (type !== 'unknown' && fields.length === 0) {
    fields = extractGenericFinancialData(text);
  }

  // If unknown, try all extractors and merge results
  if (type === 'unknown') {
    fields = [
      ...extractBankStatement(text),
      ...extractTaxReturn(text),
      ...extractInvestment(text),
      ...extractPayStub(text),
      ...extractMortgage(text),
    ];
    // Lower confidence for all since we couldn't identify the document
    fields = fields.map(f => ({ ...f, confidence: 'low' as const }));

    // If STILL empty, try the generic extractor as last resort
    if (fields.length === 0) {
      fields = extractGenericFinancialData(text);
    }
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
