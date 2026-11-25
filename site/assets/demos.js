/* financial-calculators website demos. Everything is calculated by the real library
   (window.FinancialCalculators); Chart.js (from a CDN) only draws the charts. */
( function () {
	'use strict';

	const FC = window.FinancialCalculators;
	const root = document.getElementById( 'calc-demo' );
	if ( ! FC || ! root ) {
		return;
	}

	const state = { type: 'sip', system: 'indian', symbol: '₹', values: {} };

	const money = ( v ) => FC.formatCurrency( v, { symbol: state.symbol, system: state.system } );
	const compact = ( v ) => ( state.symbol + FC.formatCompact( v, { system: state.system } ) );
	const words = ( v ) => FC.amountInWords( v, { system: state.system } );
	const yearLabel = ( p ) => String( Number.isInteger( p.calendarYear ) ? p.calendarYear : p.calendarYear.toFixed( 1 ) );

	/* One entry per calculator: its inputs, results, chart and the code it runs. */
	const CALCS = {
		sip: {
			label: 'SIP',
			title: 'SIP: invest every month',
			fields: [
				{ key: 'monthlyAmount', label: 'Monthly investment', min: 500, max: 200000, step: 500, value: 25000, money: true },
				{ key: 'annualRate', label: 'Expected return (% a year)', min: 1, max: 30, step: 0.5, value: 12 },
				{ key: 'years', label: 'Time period (years)', min: 1, max: 40, step: 1, value: 10 },
			],
			results: ( r ) => [ [ 'Invested', r.invested ], [ 'Est. returns', r.returns ], [ 'Total value', r.total, true ] ],
			wordsOf: ( r ) => r.total,
			chart: ( r, c ) => line( r.series, [
				{ label: 'Invested', data: r.series.map( ( p ) => p.invested ), color: c.muted },
				{ label: 'Total value', data: r.series.map( ( p ) => p.total ), color: c.accent, fill: true },
			] ),
		},
		lumpsum: {
			label: 'Lump sum',
			title: 'Lump sum: invest once',
			fields: [
				{ key: 'amount', label: 'Amount invested', min: 1000, max: 10000000, step: 1000, value: 100000, money: true },
				{ key: 'annualRate', label: 'Expected return (% a year)', min: 1, max: 30, step: 0.5, value: 12 },
				{ key: 'years', label: 'Time period (years)', min: 1, max: 40, step: 1, value: 10 },
			],
			results: ( r ) => [ [ 'Invested', r.invested ], [ 'Est. returns', r.returns ], [ 'Total value', r.total, true ] ],
			wordsOf: ( r ) => r.total,
			chart: ( r, c ) => line( r.series, [
				{ label: 'Invested', data: r.series.map( ( p ) => p.invested ), color: c.muted },
				{ label: 'Total value', data: r.series.map( ( p ) => p.total ), color: c.accent, fill: true },
			] ),
		},
		swp: {
			label: 'SWP',
			title: 'SWP: withdraw every month',
			fields: [
				{ key: 'investment', label: 'Total investment', min: 10000, max: 50000000, step: 10000, value: 1000000, money: true },
				{ key: 'monthlyWithdrawal', label: 'Monthly withdrawal', min: 500, max: 500000, step: 500, value: 10000, money: true },
				{ key: 'annualRate', label: 'Expected return (% a year)', min: 1, max: 30, step: 0.5, value: 8 },
				{ key: 'years', label: 'Time period (years)', min: 1, max: 40, step: 1, value: 10 },
			],
			results: ( r ) => [ [ 'Invested', r.investment ], [ 'Total withdrawn', r.totalWithdrawn ], [ 'Final balance', r.finalBalance, true ] ],
			wordsOf: ( r ) => r.finalBalance,
			note: ( r ) => ( r.depletedMonth ? { warn: true, text: 'The money runs out in month ' + r.depletedMonth + ' (year ' + Math.ceil( r.depletedMonth / 12 ) + ').' } : null ),
			chart: ( r, c ) => line( r.series, [
				{ label: 'Balance', data: r.series.map( ( p ) => p.balance ), color: c.accent, fill: true },
				{ label: 'Withdrawn so far', data: r.series.map( ( p ) => p.withdrawn ), color: c.amber },
			] ),
		},
		goal: {
			label: 'Goal',
			title: 'Goal: what to invest each month',
			fields: [
				{ key: 'presentCost', label: 'Goal cost today', min: 10000, max: 50000000, step: 10000, value: 1000000, money: true },
				{ key: 'currentSavings', label: 'Savings so far', min: 0, max: 50000000, step: 10000, value: 100000, money: true },
				{ key: 'inflationRate', label: 'Inflation (% a year)', min: 0, max: 15, step: 0.5, value: 6 },
				{ key: 'annualRate', label: 'Expected return (% a year)', min: 1, max: 30, step: 0.5, value: 9 },
				{ key: 'years', label: 'Years to the goal', min: 1, max: 40, step: 1, value: 5 },
			],
			results: ( r ) => [ [ 'Goal cost then', r.futureCost ], [ 'Savings will grow to', r.savingsFutureValue ], [ 'Invest each month', r.monthlyInvestment, true ] ],
			wordsOf: ( r ) => r.monthlyInvestment,
			note: ( r ) => ( r.monthlyInvestment === 0 ? { text: 'Your savings already cover this goal.' } : { text: 'Target year: ' + r.targetYear + '.' } ),
			chart: ( r, c ) => line( r.series, [
				{ label: 'Goal cost', data: r.series.map( ( p ) => p.goalCost ), color: c.amber },
				{ label: 'Savings + investments', data: r.series.map( ( p ) => p.total ), color: c.accent, fill: true },
			] ),
		},
		emi: {
			label: 'EMI',
			title: 'Loan EMI',
			fields: [
				{ key: 'principal', label: 'Loan amount', min: 10000, max: 50000000, step: 10000, value: 3000000, money: true },
				{ key: 'annualRate', label: 'Interest (% a year)', min: 1, max: 25, step: 0.1, value: 8.5 },
				{ key: 'years', label: 'Tenure (years)', min: 1, max: 30, step: 1, value: 20 },
			],
			results: ( r ) => [ [ 'Monthly EMI', r.emi, true ], [ 'Total interest', r.totalInterest ], [ 'Total payment', r.totalPayment ] ],
			wordsOf: ( r ) => r.emi,
			chart: ( r, c ) => ( {
				type: 'doughnut',
				data: {
					labels: [ 'Principal', 'Interest' ],
					datasets: [ { data: [ r.principal, r.totalInterest ], backgroundColor: [ c.accent, c.amber ], borderColor: c.surface, borderWidth: 2 } ],
				},
				options: { circumference: 180, rotation: -90, cutout: '62%' },
			} ),
			table: ( r ) => r.schedule,
		},
	};

	function line( series, sets ) {
		return {
			type: 'line',
			data: {
				labels: series.map( yearLabel ),
				datasets: sets.map( ( s ) => ( {
					label: s.label,
					data: s.data,
					borderColor: s.color,
					backgroundColor: s.fill ? s.color + '33' : s.color,
					fill: !! s.fill,
					tension: 0.3,
					pointRadius: 2,
				} ) ),
			},
			options: { scales: { y: { beginAtZero: true, ticks: { callback: ( v ) => compact( v ) } } } },
		};
	}

	function colors() {
		const css = getComputedStyle( document.documentElement );
		const v = ( name ) => css.getPropertyValue( name ).trim();
		return { accent: v( '--accent' ), amber: v( '--accent-2' ), muted: v( '--muted' ), text: v( '--text' ), border: v( '--border' ), surface: v( '--surface' ) };
	}

	/* Elements */
	const tabs = root.querySelector( '[data-calc-tabs]' );
	const fieldsBox = root.querySelector( '[data-fields]' );
	const resultsBox = root.querySelector( '[data-results]' );
	const wordsBox = root.querySelector( '[data-words]' );
	const noteBox = root.querySelector( '[data-note]' );
	const canvas = root.querySelector( 'canvas' );
	const fallback = root.querySelector( '.chart-fallback' );
	const tableBox = root.querySelector( '[data-table]' );
	const codeBox = root.querySelector( '[data-code]' );
	let chart = null;

	Object.keys( CALCS ).forEach( ( type ) => {
		state.values[ type ] = {};
		CALCS[ type ].fields.forEach( ( f ) => {
			state.values[ type ][ f.key ] = f.value;
		} );
		const btn = document.createElement( 'button' );
		btn.type = 'button';
		btn.setAttribute( 'role', 'tab' );
		btn.setAttribute( 'aria-selected', type === state.type ? 'true' : 'false' );
		btn.dataset.type = type;
		btn.textContent = CALCS[ type ].label;
		btn.addEventListener( 'click', () => {
			state.type = type;
			tabs.querySelectorAll( 'button' ).forEach( ( b ) => b.setAttribute( 'aria-selected', b === btn ? 'true' : 'false' ) );
			renderFields();
			update();
		} );
		tabs.appendChild( btn );
	} );

	root.querySelectorAll( '[data-system]' ).forEach( ( btn ) => {
		btn.addEventListener( 'click', () => {
			state.system = btn.dataset.system;
			state.symbol = btn.dataset.symbol;
			root.querySelectorAll( '[data-system]' ).forEach( ( b ) => b.setAttribute( 'aria-pressed', b === btn ? 'true' : 'false' ) );
			renderFields();
			update();
		} );
	} );

	function renderFields() {
		const calc = CALCS[ state.type ];
		root.querySelector( '[data-calc-title]' ).textContent = calc.title;
		fieldsBox.textContent = '';
		calc.fields.forEach( ( f ) => {
			const id = 'f-' + state.type + '-' + f.key;
			const wrap = document.createElement( 'div' );
			wrap.className = 'field';
			wrap.innerHTML =
				'<div class="field-top"><label for="' + id + '"></label><input type="number" id="' + id + '"></div>' +
				'<input type="range" aria-hidden="true" tabindex="-1">' +
				'<div class="hint"><span></span><span></span></div>';
			wrap.querySelector( 'label' ).textContent = f.label + ( f.money ? ' (' + state.symbol + ')' : '' );
			const number = wrap.querySelector( 'input[type="number"]' );
			const range = wrap.querySelector( 'input[type="range"]' );
			[ number, range ].forEach( ( input ) => {
				input.min = f.min;
				input.max = f.max;
				input.step = f.step;
				input.value = state.values[ state.type ][ f.key ];
			} );
			const hints = wrap.querySelectorAll( '.hint span' );
			hints[ 0 ].textContent = f.money ? compact( f.min ) : f.min;
			hints[ 1 ].textContent = f.money ? compact( f.max ) : f.max;
			number.dataset.key = f.key;
			range.addEventListener( 'input', () => {
				number.value = range.value;
				state.values[ state.type ][ f.key ] = Number( range.value );
				update();
			} );
			number.addEventListener( 'input', () => {
				const value = Number( number.value );
				if ( number.value === '' || ! Number.isFinite( value ) ) {
					return;
				}
				const clamped = Math.min( f.max, Math.max( f.min, value ) );
				range.value = clamped;
				state.values[ state.type ][ f.key ] = clamped;
				update();
			} );
			number.addEventListener( 'change', () => {
				number.value = state.values[ state.type ][ f.key ];
			} );
			fieldsBox.appendChild( wrap );
		} );
	}

	function update() {
		const calc = CALCS[ state.type ];
		const inputs = Object.assign( {}, state.values[ state.type ], { startYear: new Date().getFullYear() } );
		const result = FC.calculate( state.type, inputs );

		resultsBox.textContent = '';
		calc.results( result ).forEach( ( [ label, value, main ] ) => {
			const div = document.createElement( 'div' );
			div.className = 'result' + ( main ? ' main' : '' );
			div.innerHTML = '<div class="k"></div><div class="v"></div>';
			div.querySelector( '.k' ).textContent = label;
			div.querySelector( '.v' ).textContent = money( value );
			resultsBox.appendChild( div );
		} );
		wordsBox.textContent = state.symbol === '₹' ? words( calc.wordsOf( result ) ) + ' rupees' : words( calc.wordsOf( result ) );

		const note = calc.note ? calc.note( result ) : null;
		noteBox.hidden = ! note;
		noteBox.className = 'note' + ( note && note.warn ? ' warn' : '' );
		noteBox.textContent = note ? note.text : '';

		tableBox.hidden = ! calc.table;
		if ( calc.table ) {
			const rows = calc.table( result );
			tableBox.innerHTML = '<summary>Year-by-year schedule</summary><table class="schedule"><thead><tr><th>Year</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody></tbody></table>';
			const body = tableBox.querySelector( 'tbody' );
			rows.forEach( ( row ) => {
				const tr = document.createElement( 'tr' );
				[ row.year, money( row.principalPaid ), money( row.interestPaid ), money( row.balance ) ].forEach( ( cell ) => {
					const td = document.createElement( 'td' );
					td.textContent = cell;
					tr.appendChild( td );
				} );
				body.appendChild( tr );
			} );
		}

		const args = Object.keys( inputs ).map( ( k ) => k + ': ' + inputs[ k ] ).join( ', ' );
		const shown = calc.results( result ).map( ( [ label, value ] ) => '// ' + label + ': ' + FC.formatNumber( value, { system: state.system, decimals: 2 } ) ).join( '\n' );
		codeBox.textContent = "const result = FinancialCalculators.calculate( '" + state.type + "', { " + args + ' } );\n' + shown;
		if ( window.fcEnhanceCode ) {
			window.fcEnhanceCode( codeBox.parentElement );
		}

		drawChart( calc, result );
	}

	function drawChart( calc, result ) {
		if ( ! window.Chart ) {
			canvas.hidden = true;
			fallback.hidden = false;
			return;
		}
		const c = colors();
		const config = calc.chart( result, c );
		config.options = Object.assign( { responsive: true, maintainAspectRatio: false, animation: { duration: 500 } }, config.options );
		config.options.plugins = {
			legend: { labels: { color: c.text } },
			tooltip: { callbacks: { label: ( ctx ) => ctx.dataset.label ? ( config.type === 'doughnut' ? ctx.label : ctx.dataset.label ) + ': ' + money( ctx.parsed.y ?? ctx.parsed ) : money( ctx.parsed ) } },
		};
		if ( config.options.scales ) {
			config.options.scales.x = { ticks: { color: c.muted }, grid: { color: c.border } };
			config.options.scales.y.ticks.color = c.muted;
			config.options.scales.y.grid = { color: c.border };
		}
		if ( chart && chart.config.type === config.type ) {
			chart.data = config.data;
			chart.options = config.options;
			chart.update();
		} else {
			if ( chart ) {
				chart.destroy();
			}
			chart = new window.Chart( canvas, config );
		}
	}

	document.addEventListener( 'fc:theme', () => {
		if ( chart ) {
			chart.destroy();
			chart = null;
			update();
		}
	} );

	renderFields();
	update();

	/* Formatting demo */
	const fmt = document.getElementById( 'format-demo' );
	if ( fmt ) {
		const input = fmt.querySelector( 'input' );
		const out = ( name ) => fmt.querySelector( '[data-out="' + name + '"]' );
		const run = () => {
			const raw = input.value.replace( /[,\s]/g, '' );
			const value = Number( raw );
			const valid = raw !== '' && Number.isFinite( value );
			const set = ( name, fn ) => {
				try {
					out( name ).textContent = valid ? fn() : '–';
				} catch {
					out( name ).textContent = '–';
				}
			};
			const big = /^-?\d+$/.test( raw ) ? raw : value;
			set( 'in-number', () => FC.formatNumber( value, { decimals: raw.includes( '.' ) ? 2 : 0 } ) );
			set( 'in-compact', () => FC.formatCompact( value ) );
			set( 'in-words', () => FC.amountInWords( big ) );
			set( 'int-number', () => FC.formatNumber( value, { system: 'international', decimals: raw.includes( '.' ) ? 2 : 0 } ) );
			set( 'int-compact', () => FC.formatCompact( value, { system: 'international' } ) );
			set( 'int-words', () => FC.amountInWords( big, { system: 'international' } ) );
		};
		input.addEventListener( 'input', run );
		run();
	}
}() );
