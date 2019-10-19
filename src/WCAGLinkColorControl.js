/* global jQuery, React, ReactDOM, Color */
import WCAGLinkColorForm from './WCAGLinkColorForm';

/**
 * WCAGLinkColorControl.
 *
 * @class
 * @augments wp.customize.Control
 * @augments wp.customize.Class
 */
const WCAGLinkColorControl = wp.customize.Control.extend( {

	/**
	 * Initialize.
	 *
	 * @param {string} id - Control ID.
	 * @param {Object} params - Control params.
	 */
	initialize( id, params ) {
		const control = this;

		// Bind functions to this control context for passing as React props.
		control.setNotificationContainer = control.setNotificationContainer.bind( control );

		wp.customize.Control.prototype.initialize.call( control, id, params );

		// The following should be eliminated with <https://core.trac.wordpress.org/ticket/31334>.
		function onRemoved( removedControl ) {
			if ( control === removedControl ) {
				control.destroy();
				control.container.remove();
				wp.customize.control.unbind( 'removed', onRemoved );
			}
		}
		wp.customize.control.bind( 'removed', onRemoved );
	},

	/**
	 * Set notification container and render.
	 *
	 * This is called when the React component is mounted.
	 *
	 * @param {Element} element - Notification container.
	 * @return {void}
	 */
	setNotificationContainer: function setNotificationContainer( element ) {
		const control = this;
		control.notifications.container = jQuery( element );
		control.notifications.render();
	},

	/**
	 * Render the control into the DOM.
	 *
	 * This is called from the Control#embed() method in the parent class.
	 *
	 * @return {void}
	 */
	renderContent: function renderContent() {
		const control = this;
		const value = control.setting.get();

		ReactDOM.render(
			<WCAGLinkColorForm
				{ ...control.params }
				value={ value }
				setNotificationContainer={ control.setNotificationContainer }
				customizerSetting={ control.setting }
				control={ control }
				backgroundColor={ control.getBackgroundColor() }
				textColor={ control.getTextColor() }
				autoColor={ control.getAutoColor() }
				recommendedColorsFlat={ control.getRecommendedColorsFlat() }
				activeMode={ 'auto' }
				hue={ control.getHue() }
			/>,
			control.container[ 0 ]
		);

		if ( false !== control.params.choices.allowCollapse ) {
			control.container.addClass( 'allowCollapse colorPickerIsCollapsed' );
		}
	},

	/**
	 * After control has been first rendered, start re-rendering when setting changes.
	 *
	 * React is able to be used here instead of the wp.customize.Element abstraction.
	 *
	 * @return {void}
	 */
	ready: function ready() {
		const control = this;

		// Re-render control when setting changes.
		control.setting.bind( () => {
			control.renderContent();
		} );

		// Watch for changes to the background color.
		control.watchSetting( control.params.choices.backgroundColor, 'backgroundColor' );

		// Watch for changes to the text color.
		control.watchSetting( control.params.choices.textColor, 'textColor' );
	},

	getMode: function() {
		return 'auto'
	},

	/**
	 * Get the background color.
	 *
	 * @return {string} - HEX color.
	 */
	getBackgroundColor() {
		const control = this;

		if ( control.backgroundColor ) {
			return control.backgroundColor;
		}

		if (
			0 === control.params.choices.backgroundColor.indexOf( '#' ) ||
			0 === control.params.choices.backgroundColor.indexOf( 'rgb(' ) ||
			0 === control.params.choices.backgroundColor.indexOf( 'rgba(' ) ||
			0 === control.params.choices.backgroundColor.indexOf( 'hsl(' ) ||
			0 === control.params.choices.backgroundColor.indexOf( 'hsla(' )
		) {
			control.backgroundColor = control.params.choices.backgroundColor;
			return control.backgroundColor;
		}

		control.backgroundColor = wp.customize( control.params.choices.backgroundColor ).get();
		return control.backgroundColor;
	},

	/**
	 * Get the text color.
	 *
	 * @return {string} - HEX color.
	 */
	getTextColor() {
		const control = this;

		if ( control.textColor ) {
			return control.textColor;
		}

		if (
			0 === control.params.choices.textColor.indexOf( '#' ) ||
			0 === control.params.choices.textColor.indexOf( 'rgb(' ) ||
			0 === control.params.choices.textColor.indexOf( 'rgba(' ) ||
			0 === control.params.choices.textColor.indexOf( 'hsl(' ) ||
			0 === control.params.choices.textColor.indexOf( 'hsla(' )
		) {
			control.textColor = control.params.choices.textColor;
			return control.textColor;
		}

		control.textColor = wp.customize( control.params.choices.textColor ).get();
		return control.textColor;
	},

	/**
	 * Watch defined controls and re-trigger results calculations when there's a change.
	 *
	 * @param {string} settingToWatch - The setting we want to watch or a hardcoded color.
	 * @return {void}
	 */
	watchSetting( settingToWatch ) {
		const control = this;
		const debounce = require( 'lodash.debounce' );
		wp.customize( settingToWatch, function( setting ) {
			setting.bind( debounce( function() {
				// Reset any already-calculated colors.
				control.backgroundColor = false;
				control.textColor = false;
				control.recommendedColors = false;

				const val = control.getAutoColor( parseInt( control.getHue(), 10 ), true );
				const noChange = val === control.setting.get();

				control.setting.set( val );

				if ( noChange ) {
					control.renderContent();
				}
			}, 100 ) );
		} );

		if ( -1 < settingToWatch.indexOf( '[' ) ) {
			wp.customize( settingToWatch.split( '[' )[ 0 ], function( setting ) {
				setting.bind( debounce( function() {
					// Reset any already-calculated colors.
					control.backgroundColor = false;
					control.textColor = false;
					control.recommendedColors = false;

					const val = control.getAutoColor( parseInt( control.getHue(), 10 ), true );
					const noChange = val === control.setting.get();

					control.setting.set( val );

					if ( noChange ) {
						control.renderContent();
					}
				}, 100 ) );
			} );
		}
	},

	/**
	 * Get the auto-color.
	 *
	 * @param {undefined|string|number} color - The color.
	 *                                          If undefined assume nothing changed.
	 *                                          If number assume hue.
	 *                                          If string assume a hex/hsl string.
	 * @param {boolean} forceRecalc - When set to true it force-regenerates colors.
	 * @return {string} - Returns the auto-color as a hex value.
	 */
	getAutoColor( color, forceRecalc ) {
		const control = this;

		// We have a coloe defined.
		if ( 'undefined' !== typeof color ) {
			if ( ! isNaN( color ) && color !== control.getHue() ) {
				// Color was a number. Set the hue.
				control.setHue( color );
			} else if ( 'string' === typeof color ) {
				// Color was a string. Get the hue and set it if needed.
				const colorObj = Color( color );
				if ( colorObj.h() !== control.getHue() ) {
					control.setHue( colorObj.h() );
				}
			}
		}

		// Return the highest-rated recommended color.
		return this.getRecommendedColorsFlat( control.getHue(), forceRecalc )[ 0 ];
	},

	isColorRecommended( color ) {
		return -1 !== this.getRecommendedColorsFlat().indexOf( color );
	},


	// Get an array of Color objects for recommended colors for this hue.
	getRecommendedColors( checkHue ) {
		const control = this,
		backgroundColor = Color( control.getBackgroundColor() ),
		textColor = Color( control.getTextColor() ),
		isDarkBackground = '#000000' !== backgroundColor.getMaxContrastColor().toCSS();
		let lightnessSteps = ( isDarkBackground ) ? [ 80, 78, 77, 76, 75, 73, 71, 68, 65, 61, 57 ] : [ 20, 22, 23, 24, 25, 27, 29, 32, 35, 39, 43 ];
		if ( control.params.choices.lightnessSteps ) {
			lightnessSteps = ( isDarkBackground ) ? control.params.choices.lightnessSteps[ 1 ] : control.params.choices.lightnessSteps[ 0 ];
		}
		const saturationSteps = ( control.params.choices.saturationSteps ) ? ( control.params.choices.lightnessSteps ) : [ 40, 45, 50, 55, 60, 65, 67.5, 70, 72.5, 75, 77.5, 80, 82.5, 85, 87.5, 90, 92.5, 95, 97.5, 100 ];
		const hue = ( 'undefined' !== typeof checkHue ) ? parseInt( checkHue ) : Color( control.setting.get() ).h();

		const getForcedBGContrast = ( contrast ) => {
			let color = Color( {
				h: hue,
				s: control.params.choices.forceSaturation || 60,
				l: 50
			} ).getReadableContrastingColor( backgroundColor, contrast );
			return {
				color: color,
				contrastBackground: color.getDistanceLuminosityFrom( backgroundColor ),
				contrastText: color.getDistanceLuminosityFrom( textColor ),
				score: control.getConstrastScore(
					color.getDistanceLuminosityFrom( backgroundColor ),
					color.getDistanceLuminosityFrom( textColor )
				)
			};
		}

		control.recommendedColors = [];

		if ( 'AAA' === control.params.choices.forceCompliance ) {
			control.recommendedColors.push( getForcedBGContrast( 7 ) );
			return control.recommendedColors;
		}

		if ( 'AA' === control.params.choices.forceCompliance ) {
			control.recommendedColors.push( getForcedBGContrast( 4.5 ) );
			return control.recommendedColors;
		}

		// Add the forced colors.
		control.recommendedColors.push( getForcedBGContrast( 7 ) );
		control.recommendedColors.push( getForcedBGContrast( 4.5 ) );

		// Add a forced item for AAA compliance - background color only.
		control.recommendedColors.push(

		)

		lightnessSteps.forEach( function( lightness ) {
			saturationSteps.forEach( function( saturation ) {
				const item = {
					color: Color( {
						h: hue,
						s: saturation,
						l: lightness
					} )
				};
				item.contrastBackground = item.color.getDistanceLuminosityFrom( backgroundColor );
				item.contrastText = item.color.getDistanceLuminosityFrom( textColor );
				item.score = control.getConstrastScore( item.contrastBackground, item.contrastText );

				// Check if the color is already in our array.
				const colorAlreadyInArray = control.recommendedColors.find( function( el ) {
					return el.color._color === item.color._color;
				} );

				// Only add if the color is not already in the array.
				if ( 3 < item.contrastBackground && undefined === colorAlreadyInArray ) {
					control.recommendedColors.push( item );
				}
			} );
		} );

		// Add fallbacks in case we couldn't find any colors.
		if ( ! control.recommendedColors.length ) {
			const item = {
				color: Color( {
					h: hue,
					s: 50,
					l: 50
				} ).getReadableContrastingColor( backgroundColor )
			};
			item.contrastBackground = item.color.getDistanceLuminosityFrom( backgroundColor );
			item.contrastText = item.color.getDistanceLuminosityFrom( textColor );
			item.score = control.getConstrastScore( item.contrastBackground, item.contrastText );

			control.recommendedColors.push( item );
		}

		control.recommendedColors.sort( function( a, b ) {
			return a.score - b.score;
		} );

		return control.recommendedColors;
	},

	getConstrastScore( backgroundContrast, textContrast ) {
		const control = this;
		const scoreB = ( backgroundContrast > 7 ) ? backgroundContrast - 7 : 7 - backgroundContrast;
		const scoreT = ( textContrast > 3 ) ? textContrast - 3 : 3 - textContrast;
		return ( control.params.choices.linksUnderlined )
			? scoreB * 100
			: ( scoreB + ( scoreT * 1.1 ) ) * 100;
	},

	/**
	 * Get a flat array of all recommended colors.
	 *
	 * @param {undefined|number} hue undefined for defaults or a number to force a hue.
	 * @param {boolean} forceRecalc - When set to true it force-regenerates colors.
	 * @return {Array} - Return an array of strings [ '#hex1', '#hex2' ].
	 */
	getRecommendedColorsFlat( hue, forceRecalc ) {
		if ( forceRecalc || ! this.recommendedColorsFlat ) {
			this.setRecommendedColorsFlat( hue );
		}
		return this.recommendedColorsFlat;
	},

	setRecommendedColorsFlat( hue ) {
		const allColors = this.getRecommendedColors( hue );
		this.recommendedColorsFlat = [];
		for ( let i = 0; i < allColors.length; i++ ) {
			this.recommendedColorsFlat.push( allColors[ i ].color.toCSS() );
		}
	},

	/**
	 * Set the hue.
	 *
	 * @param {number} hue - The hue we're setting.
	 * @return {number} - Returns the hue.
	 */
	setHue( hue ) {
		// Make sure it's a number.
		hue = parseInt( hue, 10 );

		// Check if the hue we're setting is different to the existing one.
		if ( hue !== this.forcedHue ) {
			// Reset the recommended colors.
			this.recommendedColorsFlat = false;

			// Set the forced hue.
			this.forcedHue = hue;
		}

		return this.forcedHue;
	},

	/**
	 * Get the hue as an integer.
	 *
	 * @return {number} - Returns an integer.
	 */
	getHue() {
		const control = this;

		// If we have a hue already defined return it.
		if ( ! isNaN( control.forcedHue ) ) {
			return control.forcedHue;
		}

		// No hue was found. Set it and return it.
		return control.setHue( Color( control.setting.get() ).h() );
	},

	/**
	 * Handle removal/de-registration of the control.
	 *
	 * This is essentially the inverse of the Control#embed() method.
	 *
	 * @see https://core.trac.wordpress.org/ticket/31334
	 * @return {void}
	 */
	destroy: function destroy() {
		const control = this;

		// Garbage collection: undo mounting that was done in the embed/renderContent method.
		ReactDOM.unmountComponentAtNode( control.container[ 0 ] );

		// Call destroy method in parent if it exists (as of #31334).
		if ( wp.customize.Control.prototype.destroy ) {
			wp.customize.Control.prototype.destroy.call( control );
		}
	}
} );

export default WCAGLinkColorControl;
