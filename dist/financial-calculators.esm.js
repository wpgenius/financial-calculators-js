/*! financial-calculators 1.0.0 | GPL-3.0-or-later | https://wpgenius.github.io/financial-calculators-js/ */

// src/utils.js
function readNumber(name, value, min = 0) {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number)) {
    throw new TypeError(`${name} must be a finite number, got ${String(value)}.`);
  }
  if (number < min) {
    throw new RangeError(`${name} must be at least ${min}, got ${number}.`);
  }
  return number;
}
function toMonths(years) {
  const months = Math.round(readNumber("years", years) * 12);
  if (months < 1) {
    throw new RangeError(`years must be at least one month (1/12), got ${years}.`);
  }
  return months;
}
function yearlySeries(months, point) {
  const series = [];
  for (let month = 0; month < months; month += 12) {
    series.push({ year: month / 12, month, ...point(month) });
  }
  series.push({ year: months / 12, month: months, ...point(months) });
  return series;
}
function annuityDueValue(amount, i, n) {
  if (i === 0) {
    return amount * n;
  }
  return amount * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
}

// src/calculators/sip.js
function sip({ monthlyAmount, annualRate, years }) {
  const amount = readNumber("monthlyAmount", monthlyAmount);
  const i = readNumber("annualRate", annualRate) / 100 / 12;
  const months = toMonths(years);
  const total = annuityDueValue(amount, i, months);
  const invested = amount * months;
  return {
    invested,
    returns: total - invested,
    total,
    months,
    series: yearlySeries(months, (month) => ({
      invested: amount * month,
      total: annuityDueValue(amount, i, month)
    }))
  };
}

// src/calculators/lumpsum.js
function lumpsum({ amount, annualRate, years, compoundingPerYear = 1 }) {
  const invested = readNumber("amount", amount);
  const rate = readNumber("annualRate", annualRate) / 100;
  const months = toMonths(years);
  const k = readNumber("compoundingPerYear", compoundingPerYear, 1);
  const valueAt = (month) => invested * Math.pow(1 + rate / k, k * month / 12);
  const total = valueAt(months);
  return {
    invested,
    returns: total - invested,
    total,
    months,
    series: yearlySeries(months, (month) => ({
      invested,
      total: valueAt(month)
    }))
  };
}

// src/calculators/swp.js
function swp({ investment, monthlyWithdrawal, annualRate, years }) {
  const start = readNumber("investment", investment);
  const withdrawal = readNumber("monthlyWithdrawal", monthlyWithdrawal);
  const i = readNumber("annualRate", annualRate) / 100 / 12;
  const months = toMonths(years);
  const balances = [start];
  const withdrawnTotals = [0];
  let balance = start;
  let withdrawn = 0;
  let depletedMonth = null;
  for (let month = 1; month <= months; month++) {
    const take = Math.min(withdrawal, balance);
    balance -= take;
    withdrawn += take;
    if (balance <= 0) {
      balance = 0;
      if (depletedMonth === null && withdrawal > 0) {
        depletedMonth = month;
      }
    } else {
      balance += balance * i;
    }
    balances.push(balance);
    withdrawnTotals.push(withdrawn);
  }
  return {
    investment: start,
    totalWithdrawn: withdrawn,
    finalBalance: balance,
    returns: balance + withdrawn - start,
    depletedMonth,
    months,
    series: yearlySeries(months, (month) => ({
      balance: balances[month],
      withdrawn: withdrawnTotals[month]
    }))
  };
}

// src/calculators/goal.js
function goal({ presentCost, currentSavings = 0, inflationRate, annualRate, years }) {
  const cost = readNumber("presentCost", presentCost);
  const savings = readNumber("currentSavings", currentSavings);
  const inflation = readNumber("inflationRate", inflationRate) / 100;
  const rate = readNumber("annualRate", annualRate) / 100;
  const months = toMonths(years);
  const i = rate / 12;
  const costAt = (month) => cost * Math.pow(1 + inflation, month / 12);
  const savingsAt = (month) => savings * Math.pow(1 + rate, month / 12);
  const futureCost = costAt(months);
  const savingsFutureValue = savingsAt(months);
  const shortfall = Math.max(0, futureCost - savingsFutureValue);
  const monthlyInvestment = shortfall / annuityDueValue(1, i, months);
  return {
    presentCost: cost,
    futureCost,
    savingsFutureValue,
    shortfall,
    monthlyInvestment,
    totalInvested: monthlyInvestment * months,
    months,
    series: yearlySeries(months, (month) => {
      const investments = annuityDueValue(monthlyInvestment, i, month);
      return {
        goalCost: costAt(month),
        savings: savingsAt(month),
        investments,
        total: savingsAt(month) + investments
      };
    })
  };
}

// src/calculators/emi.js
function emi({ principal, annualRate, years }) {
  const loan = readNumber("principal", principal);
  const i = readNumber("annualRate", annualRate) / 100 / 12;
  const months = toMonths(years);
  const instalment = i === 0 ? loan / months : loan * i * Math.pow(1 + i, months) / (Math.pow(1 + i, months) - 1);
  const balances = [loan];
  const principalPaid = [0];
  const interestPaid = [0];
  let balance = loan;
  for (let month = 1; month <= months; month++) {
    const interest = balance * i;
    const repaid = month === months ? balance : instalment - interest;
    balance = Math.max(0, balance - repaid);
    balances.push(balance);
    principalPaid.push(principalPaid[month - 1] + repaid);
    interestPaid.push(interestPaid[month - 1] + interest);
  }
  const schedule = [];
  for (let from = 0; from < months; from += 12) {
    const to = Math.min(from + 12, months);
    schedule.push({
      year: schedule.length + 1,
      principalPaid: principalPaid[to] - principalPaid[from],
      interestPaid: interestPaid[to] - interestPaid[from],
      balance: balances[to]
    });
  }
  const totalPayment = instalment * months;
  return {
    emi: instalment,
    principal: loan,
    totalInterest: totalPayment - loan,
    totalPayment,
    months,
    schedule,
    series: yearlySeries(months, (month) => ({
      balance: balances[month],
      principalPaid: principalPaid[month],
      interestPaid: interestPaid[month]
    }))
  };
}

// src/calculators/index.js
var registry = { sip, lumpsum, swp, goal, emi };
function types() {
  return Object.keys(registry);
}
function calculate(type, inputs) {
  if (!Object.prototype.hasOwnProperty.call(registry, type)) {
    throw new Error(`Unknown calculator "${type}". Available: ${types().join(", ")}.`);
  }
  return registry[type](inputs);
}
function register(type, fn) {
  if (typeof type !== "string" || type === "" || typeof fn !== "function") {
    throw new TypeError("register( type, fn ) needs a type name and a function.");
  }
  registry[type] = fn;
}

// src/format/number.js
var LOCALES = { indian: "en-IN", international: "en-US" };
var intlChecked = false;
var intlWorks = false;
function canUseIntl() {
  if (!intlChecked) {
    intlChecked = true;
    try {
      intlWorks = new Intl.NumberFormat("en-IN").format(1234567) === "12,34,567" && new Intl.NumberFormat("en-US").format(1234567) === "1,234,567";
    } catch {
      intlWorks = false;
    }
  }
  return intlWorks;
}
function readSystem(system) {
  if (!Object.prototype.hasOwnProperty.call(LOCALES, system)) {
    throw new RangeError(`system must be "indian" or "international", got "${system}".`);
  }
  return system;
}
function readDecimals(decimals) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 20) {
    throw new RangeError(`decimals must be a whole number from 0 to 20, got ${decimals}.`);
  }
  return decimals;
}
function groupDigits(digits, system = "indian") {
  if (digits.length <= 3) {
    return digits;
  }
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const size = readSystem(system) === "indian" ? 2 : 3;
  const pattern = new RegExp(`\\B(?=(\\d{${size}})+(?!\\d))`, "g");
  return rest.replace(pattern, ",") + "," + last3;
}
function formatByHand(value, decimals, system) {
  const fixed = Math.abs(value).toFixed(decimals);
  const [whole, fraction] = fixed.split(".");
  const sign = value < 0 && Number(fixed) !== 0 ? "-" : "";
  return sign + groupDigits(whole, system) + (fraction ? "." + fraction : "");
}
function formatNumber(value, { system = "indian", decimals = 0 } = {}) {
  readSystem(system);
  readDecimals(decimals);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`value must be a finite number, got ${String(value)}.`);
  }
  const rounded = Number(value.toFixed(decimals));
  const number = rounded === 0 ? 0 : value;
  if (canUseIntl()) {
    return new Intl.NumberFormat(LOCALES[system], {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true
    }).format(number);
  }
  return formatByHand(number, decimals, system);
}
function formatCurrency(value, { symbol = "\u20B9", position = "before", system = "indian", decimals = 0 } = {}) {
  const formatted = formatNumber(value, { system, decimals });
  const negative = formatted.startsWith("-");
  const digits = negative ? formatted.slice(1) : formatted;
  const sign = negative ? "-" : "";
  return position === "after" ? `${sign}${digits} ${symbol}` : `${sign}${symbol}${digits}`;
}
var COMPACT_UNITS = {
  indian: [[1e7, "Cr"], [1e5, "L"], [1e3, "K"]],
  international: [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]]
};
function formatCompact(value, { system = "indian", decimals = 1 } = {}) {
  readSystem(system);
  readDecimals(decimals);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`value must be a finite number, got ${String(value)}.`);
  }
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  for (const [size, unit] of COMPACT_UNITS[system]) {
    if (absolute >= size) {
      const short = Number((absolute / size).toFixed(decimals));
      return `${sign}${formatNumber(short, { system, decimals: short % 1 === 0 ? 0 : decimals })}${unit}`;
    }
  }
  return formatNumber(value, { system, decimals: 0 });
}

// src/format/words.js
var ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen"
];
var TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
var INTERNATIONAL_SCALES = [
  "",
  "Thousand",
  "Million",
  "Billion",
  "Trillion",
  "Quadrillion",
  "Quintillion",
  "Sextillion",
  "Septillion",
  "Octillion",
  "Nonillion",
  "Decillion"
];
function belowHundred(n) {
  if (n < 20) {
    return ONES[n];
  }
  return [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(" ");
}
function belowThousand(n) {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (!hundreds) {
    return belowHundred(rest);
  }
  return `${ONES[hundreds]} Hundred` + (rest ? ` and ${belowHundred(rest)}` : "");
}
function join(parts) {
  return parts.filter(Boolean).join(" ");
}
function indian(digits) {
  digits = digits.replace(/^0+/, "");
  if (digits === "") {
    return "";
  }
  if (digits.length > 7) {
    const crores = indian(digits.slice(0, -7));
    return join([crores && `${crores} Crore`, indian(digits.slice(-7))]);
  }
  const n = Number(digits);
  const lakh = Math.floor(n / 1e5);
  const thousand = Math.floor(n % 1e5 / 1e3);
  const rest = n % 1e3;
  return join([
    lakh && `${belowHundred(lakh)} Lakh`,
    thousand && `${belowHundred(thousand)} Thousand`,
    belowThousand(rest)
  ]);
}
function international(digits) {
  digits = digits.replace(/^0+/, "");
  if (digits === "") {
    return "";
  }
  const maxDigits = INTERNATIONAL_SCALES.length * 3;
  if (digits.length > maxDigits) {
    const top = international(digits.slice(0, -(maxDigits - 3)));
    const last = INTERNATIONAL_SCALES[INTERNATIONAL_SCALES.length - 1];
    return join([top && `${top} ${last}`, international(digits.slice(-(maxDigits - 3)))]);
  }
  const parts = [];
  for (let end = digits.length, scale = 0; end > 0; end -= 3, scale++) {
    const group = Number(digits.slice(Math.max(0, end - 3), end));
    if (group) {
      parts.unshift(join([belowThousand(group), INTERNATIONAL_SCALES[scale]]));
    }
  }
  return join(parts);
}
function amountInWords(value, { system = "indian" } = {}) {
  if (system !== "indian" && system !== "international") {
    throw new RangeError(`system must be "indian" or "international", got "${system}".`);
  }
  let digits;
  let negative = false;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`value must be a finite number, got ${value}.`);
    }
    const rounded = Math.round(Math.abs(value));
    negative = value < 0 && rounded !== 0;
    digits = BigInt(rounded).toString();
  } else if (typeof value === "bigint") {
    negative = value < 0n;
    digits = (negative ? -value : value).toString();
  } else if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    const trimmed = value.trim();
    negative = trimmed.startsWith("-") && /[1-9]/.test(trimmed);
    digits = trimmed.replace("-", "");
  } else {
    throw new TypeError(`value must be a number, a BigInt or a string of digits, got ${String(value)}.`);
  }
  const words = system === "indian" ? indian(digits) : international(digits);
  if (words === "") {
    return "Zero";
  }
  return negative ? `Minus ${words}` : words;
}

// src/index.js
var VERSION = true ? "1.0.0" : "development";
export {
  VERSION,
  amountInWords,
  calculate,
  emi,
  formatCompact,
  formatCurrency,
  formatNumber,
  goal,
  groupDigits,
  lumpsum,
  register,
  sip,
  swp,
  types
};
