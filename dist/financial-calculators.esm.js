/*! financial-calculators 1.1.1 | GPL-3.0-or-later | https://wpgenius.github.io/financial-calculators-js/ */

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
var MAX_YEARS = 1e3;
function readInputs(inputs) {
  if (!inputs || typeof inputs !== "object") {
    throw new TypeError(`inputs must be an object, such as { annualRate: 12, years: 10 }, got ${String(inputs)}.`);
  }
  return inputs;
}
function toMonths(years) {
  const value = readNumber("years", years);
  if (value > MAX_YEARS) {
    throw new RangeError(`years must be at most ${MAX_YEARS}, got ${years}.`);
  }
  const months = Math.round(value * 12);
  if (months < 1) {
    throw new RangeError(`years must be at least one month (1/12), got ${years}.`);
  }
  return months;
}
function finiteResult(result) {
  const check = (value) => {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new RangeError("The result is too large to calculate; use smaller amounts, rates or durations.");
    }
    if (value && typeof value === "object") {
      Object.values(value).forEach(check);
    }
  };
  check(result);
  return result;
}
function readStartYear(startYear) {
  if (startYear === void 0 || startYear === null || startYear === "") {
    return void 0;
  }
  const year = readNumber("startYear", startYear, -1e6);
  if (!Number.isInteger(year)) {
    throw new RangeError(`startYear must be a whole year, got ${startYear}.`);
  }
  return year;
}
function yearlySeries(months, point, startYear) {
  const at = (month) => {
    const year = month / 12;
    const base = startYear === void 0 ? { year, month } : { year, month, calendarYear: startYear + year };
    return { ...base, ...point(month) };
  };
  const series = [];
  for (let month = 0; month < months; month += 12) {
    series.push(at(month));
  }
  series.push(at(months));
  return series;
}
function annuityDueValue(amount, i, n) {
  if (i === 0) {
    return amount * n;
  }
  return amount * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
}

// src/calculators/sip.js
function sip(inputs) {
  const { monthlyAmount, annualRate, years, startYear } = readInputs(inputs);
  const amount = readNumber("monthlyAmount", monthlyAmount);
  const i = readNumber("annualRate", annualRate) / 100 / 12;
  const months = toMonths(years);
  const firstYear = readStartYear(startYear);
  const total = annuityDueValue(amount, i, months);
  const invested = amount * months;
  return finiteResult({
    invested,
    returns: total - invested,
    total,
    months,
    series: yearlySeries(months, (month) => ({
      invested: amount * month,
      total: annuityDueValue(amount, i, month)
    }), firstYear)
  });
}

// src/calculators/lumpsum.js
function lumpsum(inputs) {
  const { amount, annualRate, years, compoundingPerYear = 1, startYear } = readInputs(inputs);
  const invested = readNumber("amount", amount);
  const rate = readNumber("annualRate", annualRate) / 100;
  const months = toMonths(years);
  const firstYear = readStartYear(startYear);
  const k = readNumber("compoundingPerYear", compoundingPerYear, 1);
  const valueAt = (month) => invested * Math.pow(1 + rate / k, k * month / 12);
  const total = valueAt(months);
  return finiteResult({
    invested,
    returns: total - invested,
    total,
    months,
    series: yearlySeries(months, (month) => ({
      invested,
      total: valueAt(month)
    }), firstYear)
  });
}

// src/calculators/swp.js
function swp(inputs) {
  const { investment, monthlyWithdrawal, annualRate, years, startYear } = readInputs(inputs);
  const start = readNumber("investment", investment);
  const withdrawal = readNumber("monthlyWithdrawal", monthlyWithdrawal);
  const i = readNumber("annualRate", annualRate) / 100 / 12;
  const months = toMonths(years);
  const firstYear = readStartYear(startYear);
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
  return finiteResult({
    investment: start,
    totalWithdrawn: withdrawn,
    finalBalance: balance,
    returns: balance + withdrawn - start,
    depletedMonth,
    months,
    series: yearlySeries(months, (month) => ({
      balance: balances[month],
      withdrawn: withdrawnTotals[month]
    }), firstYear)
  });
}

// src/calculators/goal.js
function goal(inputs) {
  const { presentCost, currentSavings = 0, inflationRate, annualRate, years, startYear } = readInputs(inputs);
  const cost = readNumber("presentCost", presentCost);
  const savings = readNumber("currentSavings", currentSavings);
  const inflation = readNumber("inflationRate", inflationRate) / 100;
  const rate = readNumber("annualRate", annualRate) / 100;
  const months = toMonths(years);
  const firstYear = readStartYear(startYear);
  const i = rate / 12;
  const costAt = (month) => cost * Math.pow(1 + inflation, month / 12);
  const savingsAt = (month) => savings * Math.pow(1 + rate, month / 12);
  const futureCost = costAt(months);
  const savingsFutureValue = savingsAt(months);
  const shortfall = Math.max(0, futureCost - savingsFutureValue);
  const monthlyInvestment = shortfall / annuityDueValue(1, i, months);
  return finiteResult({
    presentCost: cost,
    futureCost,
    savingsFutureValue,
    shortfall,
    monthlyInvestment,
    totalInvested: monthlyInvestment * months,
    months,
    ...firstYear === void 0 ? {} : { targetYear: firstYear + months / 12 },
    series: yearlySeries(months, (month) => {
      const investments = annuityDueValue(monthlyInvestment, i, month);
      return {
        goalCost: costAt(month),
        savings: savingsAt(month),
        investments,
        total: savingsAt(month) + investments
      };
    }, firstYear)
  });
}

// src/calculators/emi.js
function emi(inputs) {
  const { principal, annualRate, years, startYear } = readInputs(inputs);
  const loan = readNumber("principal", principal);
  const i = readNumber("annualRate", annualRate) / 100 / 12;
  const months = toMonths(years);
  const firstYear = readStartYear(startYear);
  const instalment = i === 0 ? loan / months : loan * i / (1 - Math.pow(1 + i, -months));
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
  return finiteResult({
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
    }), firstYear)
  });
}

// src/calculators/index.js
var registry = { sip, lumpsum, swp, goal, emi };
function types() {
  return Object.keys(registry);
}
function calculate(type, inputs) {
  if (typeof type !== "string" || !Object.prototype.hasOwnProperty.call(registry, type)) {
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
var formatters = /* @__PURE__ */ new Map();
function formatter(system, decimals) {
  const key = system + ":" + decimals;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat(LOCALES[system], {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true
    });
    formatters.set(key, cached);
  }
  return cached;
}
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
  const absolute = Math.abs(value);
  const fixed = absolute >= 1e21 ? BigInt(Math.round(absolute)).toString() + (decimals ? "." + "0".repeat(decimals) : "") : absolute.toFixed(decimals);
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
    return formatter(system, decimals).format(number);
  }
  return formatByHand(number, decimals, system);
}
function formatCurrency(value, { symbol = "\u20B9", position = "before", system = "indian", decimals = 0 } = {}) {
  if (position !== "before" && position !== "after") {
    throw new RangeError(`position must be "before" or "after", got "${position}".`);
  }
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
  const units = COMPACT_UNITS[system];
  let index = units.findIndex(([size]) => absolute >= size);
  if (index === -1) {
    if (Math.round(absolute) < units[units.length - 1][0]) {
      return formatNumber(value, { system, decimals: 0 });
    }
    index = units.length - 1;
  }
  const rounded = (i) => Number((absolute / units[i][0]).toFixed(decimals));
  while (index > 0 && rounded(index) * units[index][0] >= units[index - 1][0]) {
    index--;
  }
  const short = rounded(index);
  return `${sign}${formatNumber(short, { system, decimals: short % 1 === 0 ? 0 : decimals })}${units[index][1]}`;
}

// src/format/words.js
var ENGLISH = {
  ones: [
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
  ],
  tens: ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"],
  hundred: "Hundred",
  and: "and",
  zero: "Zero",
  minus: "Minus",
  indian: { thousand: "Thousand", lakh: "Lakh", crore: "Crore" },
  international: [
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
  ]
};
var STRING_KEYS = ["hundred", "and", "zero", "minus"];
function readWords(custom) {
  if (custom === void 0) {
    return ENGLISH;
  }
  if (!custom || typeof custom !== "object") {
    throw new TypeError("words must be an object.");
  }
  const list = (key, length) => {
    if (custom[key] === void 0) {
      return ENGLISH[key];
    }
    const value = custom[key];
    if (!Array.isArray(value) || value.length !== length || !value.every((w) => typeof w === "string")) {
      throw new TypeError(`words.${key} must be an array of ${length} strings.`);
    }
    return value;
  };
  const words = {
    ones: list("ones", 20),
    tens: list("tens", 10),
    international: list("international", ENGLISH.international.length),
    indian: { ...ENGLISH.indian }
  };
  for (const key of STRING_KEYS) {
    if (custom[key] !== void 0 && typeof custom[key] !== "string") {
      throw new TypeError(`words.${key} must be a string.`);
    }
    words[key] = custom[key] ?? ENGLISH[key];
  }
  if (custom.indian !== void 0) {
    if (!custom.indian || typeof custom.indian !== "object") {
      throw new TypeError("words.indian must be an object with thousand, lakh and crore.");
    }
    for (const key of Object.keys(ENGLISH.indian)) {
      if (custom.indian[key] !== void 0) {
        if (typeof custom.indian[key] !== "string") {
          throw new TypeError(`words.indian.${key} must be a string.`);
        }
        words.indian[key] = custom.indian[key];
      }
    }
  }
  return words;
}
function join(parts) {
  return parts.filter(Boolean).join(" ");
}
function belowHundred(n, w) {
  if (n < 20) {
    return w.ones[n];
  }
  return join([w.tens[Math.floor(n / 10)], w.ones[n % 10]]);
}
function belowThousand(n, w) {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (!hundreds) {
    return belowHundred(rest, w);
  }
  return join([w.ones[hundreds], w.hundred, rest ? w.and : "", rest ? belowHundred(rest, w) : ""]);
}
function indian(digits, w) {
  digits = digits.replace(/^0+/, "");
  if (digits === "") {
    return "";
  }
  if (digits.length > 7) {
    const crores = indian(digits.slice(0, -7), w);
    return join([crores && `${crores} ${w.indian.crore}`, indian(digits.slice(-7), w)]);
  }
  const n = Number(digits);
  const lakh = Math.floor(n / 1e5);
  const thousand = Math.floor(n % 1e5 / 1e3);
  const rest = n % 1e3;
  return join([
    lakh && `${belowHundred(lakh, w)} ${w.indian.lakh}`,
    thousand && `${belowHundred(thousand, w)} ${w.indian.thousand}`,
    belowThousand(rest, w)
  ]);
}
function international(digits, w) {
  digits = digits.replace(/^0+/, "");
  if (digits === "") {
    return "";
  }
  const scales = w.international;
  const maxDigits = scales.length * 3;
  if (digits.length > maxDigits) {
    const top = international(digits.slice(0, -(maxDigits - 3)), w);
    const last = scales[scales.length - 1];
    return join([top && `${top} ${last}`, international(digits.slice(-(maxDigits - 3)), w)]);
  }
  const parts = [];
  for (let end = digits.length, scale = 0; end > 0; end -= 3, scale++) {
    const group = Number(digits.slice(Math.max(0, end - 3), end));
    if (group) {
      parts.unshift(join([belowThousand(group, w), scales[scale]]));
    }
  }
  return join(parts);
}
function amountInWords(value, { system = "indian", words } = {}) {
  if (system !== "indian" && system !== "international") {
    throw new RangeError(`system must be "indian" or "international", got "${system}".`);
  }
  const w = readWords(words);
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
  const text = system === "indian" ? indian(digits, w) : international(digits, w);
  if (text === "") {
    return w.zero;
  }
  return negative ? join([w.minus, text]) : text;
}

// src/index.js
var VERSION = true ? "1.1.1" : "development";
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
