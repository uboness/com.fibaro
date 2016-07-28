"use strict";

const path			= require('path');
const ZwaveDriver	= require('homey-zwavedriver');

const tinycolor 	= require("tinycolor2");

// http://www.pepper1.net/zwavedb/device/491

// TODO: get initial saturation. Not for now to save network traffic

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {

		'onoff': {
			'command_class'				: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			'command_get'				: 'SWITCH_MULTILEVEL_GET',
			'command_set'				: 'SWITCH_MULTILEVEL_SET',
			'command_set_parser'		: function( value ){
				return {
					'Value': value
				}
			},
			'command_report'			: 'SWITCH_MULTILEVEL_REPORT',
			'command_report_parser'		: function( report ){
				if( typeof report['Value'] === 'string' ) {
					return report['Value'] === 'on/enable';
				} else {
					return report['Value (Raw)'][0] > 0;
				}

			}
		},

		'dim': {
			'command_class'				: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			'command_get'				: 'SWITCH_MULTILEVEL_GET',
			'command_set'				: 'SWITCH_MULTILEVEL_SET',
			'command_set_parser'		: function( value ){
				return {
					'Value': value * 100
				}
			},
			'command_report'			: 'SWITCH_MULTILEVEL_REPORT',
			'command_report_parser'		: function( report ){
				if( typeof report['Value'] === 'string' ) {
					return ( report['Value'] === 'on/enable' ) ? 1.0 : 0.0;
				} else {
					return report['Value (Raw)'][0] / 100;
				}
			}
		},

		// MultiChannelNode 2 = red
		// MultiChannelNode 3 = green
		// MultiChannelNode 4 = blue
		'light_saturation': [

			// red
			{
				'multiChannelNodeId'		: 2,
				'command_class'				: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_set'				: 'SWITCH_MULTILEVEL_SET',
				'command_set_parser'		: function( value, node ){
					return saturationCommandSetParser( 'r', value, node );
				}
			},

			// green
			{
				'multiChannelNodeId'		: 3,
				'command_class'				: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_set'				: 'SWITCH_MULTILEVEL_SET',
				'command_set_parser'		: function( value, node ){
					return saturationCommandSetParser( 'g', value, node );
				}
			},

			// blue
			{
				'multiChannelNodeId'		: 4,
				'command_class'				: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_set'				: 'SWITCH_MULTILEVEL_SET',
				'command_set_parser'		: function( value, node ){
					return saturationCommandSetParser( 'b', value, node );
				}
			}
		],

		// MultiChannelNode 2 = red
		// MultiChannelNode 3 = green
		// MultiChannelNode 4 = blue
		'light_hue': [

			// red
			{
				'multiChannelNodeId'		: 2,
				'command_class'				: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_get'				: 'SWITCH_MULTILEVEL_GET',
				'command_set'				: 'SWITCH_MULTILEVEL_SET',
				'command_set_parser'		: function( value, node ){
					return colorCommandSetParser( 'r', value, node );
				},
				'command_report'			: 'SWITCH_MULTILEVEL_REPORT',
				'command_report_parser'		: function( report, node ){
					return colorCommandReportParser( 'r', report, node );
				}
			},

			// green
			{
				'multiChannelNodeId'		: 3,
				'command_class'				: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_get'				: 'SWITCH_MULTILEVEL_GET',
				'command_set'				: 'SWITCH_MULTILEVEL_SET',
				'command_set_parser'		: function( value, node ){
					return colorCommandSetParser( 'g', value, node );
				},
				'command_report'			: 'SWITCH_MULTILEVEL_REPORT',
				'command_report_parser'		: function( report, node ){
					return colorCommandReportParser( 'g', report, node );
				}
			},

			// blue
			{
				'multiChannelNodeId'		: 4,
				'command_class'				: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_get'				: 'SWITCH_MULTILEVEL_GET',
				'command_set'				: 'SWITCH_MULTILEVEL_SET',
				'command_set_parser'		: function( value, node ){
					return colorCommandSetParser( 'b', value, node );
				},
				'command_report'			: 'SWITCH_MULTILEVEL_REPORT',
				'command_report_parser'		: function( report, node ){
					return colorCommandReportParser( 'b', report, node );
				}
			}
		]
	}
})

var colorCache = {};
function saturationCommandSetParser( color, value, node ) {
	var rgb = tinycolor({
		h: ( node.state.light_hue || 0 ) * 360,
		s: value * 100,
		v: ( node.state.dim || 1 ) * 100
	}).toRgb();

	return {
		'Value': Math.round(( rgb[ color ] / 255 ) * 99)
	}
}
function colorCommandSetParser( color, value, node ) {
	var rgb = tinycolor({
		h: value * 360,
		s: ( node.state.light_satuaration || 1 ) * 100,
		v: ( node.state.light_dim || 1 ) * 100
	}).toRgb();

	return {
		'Value': Math.round(( rgb[ color ] / 255 ) * 99)
	}
}
function colorCommandReportParser( color, report, node ) {

	if( typeof report['Value'] === 'string' ) {
		var value = ( value === 'on/enable' ) ? 1 : 0;
	} else {
		var value = report['Value (Raw)'][0] / 99;
	}

	colorCache[ node.randomId ] = colorCache[ node.randomId ] || {};
	colorCache[ node.randomId ][ color ] = value * 255;

	var hsv = tinycolor({
		r: colorCache[ node.randomId ].r || 0,
		g: colorCache[ node.randomId ].g || 0,
		b: colorCache[ node.randomId ].b || 0
	}).toHsv();

	return hsv.h / 360;

}