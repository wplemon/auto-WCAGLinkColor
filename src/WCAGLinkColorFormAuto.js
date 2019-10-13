/* globals React */
/* eslint jsx-a11y/label-has-for: off */
import { HuePicker } from 'react-color';
import reactCSS from 'reactcss';
import WCAGLinkColorIndicator from './WCAGLinkColorIndicator';

const WCAGLinkColorFormAuto = ( props ) => {
	// Handle changes to the hue picker.
	const handleChangeComplete = ( color ) => {
		const val = props.control.getAutoColor( parseInt( color.hsl.h, 10 ) );
		wp.customize( props.customizerSetting.id ).set( val );
	};

	// Styles.
	const styles = reactCSS( {
		default: {
			hueWrapper: {
				position: 'relative',
				padding: '12px 0'
			}
		}
	} );

	return (
		<div>
			<div style={ styles.hueWrapper }>
				<HuePicker
					width="300"
					{ ...props.choices }
					color={ props.value }
					onChangeComplete={ handleChangeComplete }
				/>
			</div>
			<WCAGLinkColorIndicator { ...props } />
		</div>
	);
};

export default WCAGLinkColorFormAuto;
