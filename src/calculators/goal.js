import { readNumber, toMonths, yearlySeries, annuityDueValue } from '../utils.js';

/**
 * Time-based goal: what a goal will cost after inflation, and the monthly
 * investment (SIP, start of month) needed to reach it on top of the savings
 * already put aside, which keep growing at the expected return.
 * When the savings alone cover the goal, the monthly investment is 0.
 *
 * @param {Object} inputs
 * @param {number} inputs.presentCost        What the goal costs today.
 * @param {number} [inputs.currentSavings=0] Savings already put aside for it.
 * @param {number} inputs.inflationRate      Inflation, % a year.
 * @param {number} inputs.annualRate         Expected return, % a year.
 * @param {number} inputs.years              Years until the goal (fractions allowed).
 * @return {{presentCost: number, futureCost: number, savingsFutureValue: number,
 *          shortfall: number, monthlyInvestment: number, totalInvested: number,
 *          months: number,
 *          series: Array<{year: number, month: number, goalCost: number,
 *          savings: number, investments: number, total: number}>}}
 */
export function goal( { presentCost, currentSavings = 0, inflationRate, annualRate, years } ) {
	const cost = readNumber( 'presentCost', presentCost );
	const savings = readNumber( 'currentSavings', currentSavings );
	const inflation = readNumber( 'inflationRate', inflationRate ) / 100;
	const rate = readNumber( 'annualRate', annualRate ) / 100;
	const months = toMonths( years );
	const i = rate / 12;

	const costAt = ( month ) => cost * Math.pow( 1 + inflation, month / 12 );
	const savingsAt = ( month ) => savings * Math.pow( 1 + rate, month / 12 );

	const futureCost = costAt( months );
	const savingsFutureValue = savingsAt( months );
	const shortfall = Math.max( 0, futureCost - savingsFutureValue );
	const monthlyInvestment = shortfall / annuityDueValue( 1, i, months );

	return {
		presentCost: cost,
		futureCost,
		savingsFutureValue,
		shortfall,
		monthlyInvestment,
		totalInvested: monthlyInvestment * months,
		months,
		series: yearlySeries( months, ( month ) => {
			const investments = annuityDueValue( monthlyInvestment, i, month );
			return {
				goalCost: costAt( month ),
				savings: savingsAt( month ),
				investments,
				total: savingsAt( month ) + investments,
			};
		} ),
	};
}
