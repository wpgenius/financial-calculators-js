/* financial-calculators website: theme switch, code blocks, tabs, contributors, docs navigation. */
( function () {
	'use strict';

	/* Theme: saved choice, else the system setting. Other scripts listen for "fc:theme". */
	const KEY = 'fc-theme';
	const store = {
		get() {
			try {
				return window.localStorage.getItem( KEY );
			} catch {
				return null;
			}
		},
		set( value ) {
			try {
				window.localStorage.setItem( KEY, value );
			} catch {
				// Storage blocked (private mode): the choice lasts for this page only.
			}
		},
	};
	const media = window.matchMedia( '(prefers-color-scheme: dark)' );
	const root = document.documentElement;
	const toggles = document.querySelectorAll( '.theme-toggle' );

	function apply( theme ) {
		root.setAttribute( 'data-theme', theme );
		toggles.forEach( ( btn ) => {
			btn.setAttribute( 'aria-pressed', theme === 'dark' ? 'true' : 'false' );
		} );
		document.dispatchEvent( new CustomEvent( 'fc:theme', { detail: theme } ) );
	}
	apply( store.get() || ( media.matches ? 'dark' : 'light' ) );
	media.addEventListener( 'change', ( e ) => {
		if ( ! store.get() ) {
			apply( e.matches ? 'dark' : 'light' );
		}
	} );
	toggles.forEach( ( btn ) => {
		btn.addEventListener( 'click', () => {
			const next = root.getAttribute( 'data-theme' ) === 'dark' ? 'light' : 'dark';
			store.set( next );
			apply( next );
		} );
	} );

	/* Version badge from the loaded library. */
	if ( window.FinancialCalculators ) {
		document.querySelectorAll( '[data-version]' ).forEach( ( node ) => {
			node.textContent = 'v' + window.FinancialCalculators.VERSION;
		} );
	}

	/* Code blocks: light syntax colours and a copy button. */
	function escapeHtml( s ) {
		return s.replace( /[&<>"]/g, ( c ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ c ] ) );
	}
	function highlight( code ) {
		const pattern = /(\/\/.*$|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\b(?:const|let|import|from|export|return|new|true|false|null)\b)/gm;
		let out = '';
		let last = 0;
		code.replace( pattern, ( match, comment, string, keyword, offset ) => {
			out += escapeHtml( code.slice( last, offset ) );
			const cls = comment ? 'c' : string ? 's' : 'k';
			out += '<span class="' + cls + '">' + escapeHtml( match ) + '</span>';
			last = offset + match.length;
			return match;
		} );
		return out + escapeHtml( code.slice( last ) );
	}
	window.fcEnhanceCode = function ( pre ) {
		const code = pre.querySelector( 'code' ) || pre;
		const text = code.textContent;
		code.innerHTML = highlight( text );
		if ( pre.querySelector( '.copy' ) ) {
			return;
		}
		const btn = document.createElement( 'button' );
		btn.type = 'button';
		btn.className = 'copy';
		btn.textContent = 'Copy';
		btn.addEventListener( 'click', () => {
			const done = ( label ) => {
				btn.textContent = label;
				window.setTimeout( () => {
					btn.textContent = 'Copy';
				}, 1500 );
			};
			if ( navigator.clipboard ) {
				navigator.clipboard.writeText( code.textContent ).then( () => done( 'Copied' ), () => done( 'Press Ctrl+C' ) );
			} else {
				done( 'Press Ctrl+C' );
			}
		} );
		pre.appendChild( btn );
	};
	document.querySelectorAll( 'pre:not([data-live])' ).forEach( window.fcEnhanceCode );

	/* Tabs (install section): arrow keys move between tabs. */
	document.querySelectorAll( '.tabs' ).forEach( ( tabs ) => {
		const buttons = Array.from( tabs.querySelectorAll( '[role="tab"]' ) );
		const select = ( btn, focus ) => {
			buttons.forEach( ( b ) => {
				const on = b === btn;
				b.setAttribute( 'aria-selected', on ? 'true' : 'false' );
				b.tabIndex = on ? 0 : -1;
				document.getElementById( b.getAttribute( 'aria-controls' ) ).hidden = ! on;
			} );
			if ( focus ) {
				btn.focus();
			}
		};
		buttons.forEach( ( btn, i ) => {
			btn.addEventListener( 'click', () => select( btn, false ) );
			btn.addEventListener( 'keydown', ( e ) => {
				const step = { ArrowRight: 1, ArrowLeft: -1 }[ e.key ];
				if ( step ) {
					e.preventDefault();
					select( buttons[ ( i + step + buttons.length ) % buttons.length ], true );
				}
			} );
		} );
	} );

	/* Contributors from the GitHub API (no token; skipped quietly if rate-limited). */
	const people = document.getElementById( 'contributors' );
	if ( people && window.fetch ) {
		window.fetch( 'https://api.github.com/repos/wpgenius/financial-calculators-js/contributors?per_page=100' )
			.then( ( r ) => ( r.ok ? r.json() : [] ) )
			.then( ( list ) => {
				list = ( list || [] ).filter( ( p ) => p.type === 'User' );
				if ( ! list.length ) {
					return;
				}
				people.textContent = '';
				list.forEach( ( p ) => {
					const a = document.createElement( 'a' );
					a.href = p.html_url;
					const img = document.createElement( 'img' );
					img.src = p.avatar_url + '&s=64';
					img.alt = '';
					img.width = 32;
					img.height = 32;
					img.loading = 'lazy';
					a.appendChild( img );
					a.appendChild( document.createTextNode( p.login ) );
					people.appendChild( a );
				} );
			} )
			.catch( () => {} );
	}

	/* Docs: heading anchors and the current section in the table of contents. */
	const toc = document.querySelector( '.toc' );
	if ( toc ) {
		document.querySelectorAll( '.doc h2[id], .doc h3[id]' ).forEach( ( h ) => {
			const a = document.createElement( 'a' );
			a.className = 'anchor';
			a.href = '#' + h.id;
			a.setAttribute( 'aria-label', 'Link to this section' );
			a.textContent = '#';
			h.appendChild( a );
		} );
		const links = Array.from( toc.querySelectorAll( 'a[href^="#"]' ) );
		const sections = links.map( ( a ) => document.getElementById( a.getAttribute( 'href' ).slice( 1 ) ) ).filter( Boolean );
		const observer = new IntersectionObserver( ( entries ) => {
			entries.forEach( ( entry ) => {
				if ( entry.isIntersecting ) {
					links.forEach( ( a ) => a.setAttribute( 'aria-current', a.getAttribute( 'href' ) === '#' + entry.target.id ? 'true' : 'false' ) );
				}
			} );
		}, { rootMargin: '-80px 0px -70% 0px' } );
		sections.forEach( ( s ) => observer.observe( s ) );
	}
}() );
