/* globals React, Color */
import reactCSS from 'reactcss';

const WCAGLinkColorIndicator = ( props ) => {
	const getRatingBackgroundColor = () => {
		const rating = getRating();
		if ( 'AAA' === rating ) {
			return '#008a20';
		}
		if ( 'AA' === rating ) {
			return '#187aa2';
		}
		return '#d63638';
	};

	// Get WCAG contrast with background.
	const getContrastBackground = () => {
		return Math.round( Color( props.value ).getDistanceLuminosityFrom( Color( props.backgroundColor ) ) * 100 ) / 100;
	};

	// Get WCAG contrast with surrounding text.
	const getContrastSurroundingText = () => {
		return Math.round( Color( props.value ).getDistanceLuminosityFrom( Color( props.textColor ) ) * 100 ) / 100;
	};

	// Get rating.
	const getRating = () => {
		if ( 7 <= getContrastBackground() && 3 <= getContrastSurroundingText() ) {
			return 'AAA';
		}

		if ( 4.5 <= getContrastBackground() ) {
			return 'AA';
		}
		return ' - ';
	};

	// Styles.
	const styles = reactCSS( {
		default: {
			selectedColorWrapper: {
				'padding-bottom': '12px',
				display: 'grid',
				'grid-template-columns': 'max-content 1fr',
				'grid-gap': '12px'
			},

			selectedColorIndicator: {
				width: '30px',
				height: '30px',
				'border-radius': '50%',
				display: 'block',
				'background-color': props.value
			},

			selectedColorIndicatorWrapper: {
				display: 'flex',
				'align-items': 'center',
				'justify-content': 'center',
				'flex-direction': 'column'
			},

			selectedColorIndicatorText: {
				'font-size': '10px',
				'font-weight': '700',
				'font-family': 'Menlo, Consolas, monaco, monospace',
				width: 'max-content'
			},

			ratingIndicator: {
				'border-radius': '3px',
				padding: '3px 10px',
				'background-color': getRatingBackgroundColor(),
				color: '#fff',
				'font-weight': '700',
				'font-size': '10px'
			},

			table: {
				'font-size': '10px',
				width: '100%',
				'line-height': '1'
			},

			td: {
				padding: '3px'
			}
		}
	} );

	return (
		<div style={ styles.selectedColorWrapper }>
			<div style={ styles.selectedColorIndicatorWrapper }>
				<div style={ styles.selectedColorIndicator }></div>
				<p style={ styles.selectedColorIndicatorText }>{ props.value }</p>
			</div>
			<table style={ styles.table }>
				<tr>
					<td style={ styles.td }>Rating</td>
					<td style={ styles.td }><span style={ styles.ratingIndicator }>{ getRating() }</span></td>
				</tr>
				<tr>
					<td style={ styles.td }>Contrast with background</td>
					<td style={ styles.td }>{ getContrastBackground() }</td>
				</tr>
				<tr>
					<td style={ styles.td }>Contrast with surrounding text</td>
					<td style={ styles.td }>{ getContrastSurroundingText() }</td>
				</tr>
			</table>
		</div>
	);
};

export default WCAGLinkColorIndicator;
