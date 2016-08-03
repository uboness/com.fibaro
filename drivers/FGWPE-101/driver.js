"use strict";

const path			= require('path');
const ZwaveDriver	= require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/476

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
		'onoff': {
			'command_class'				: 'COMMAND_CLASS_SWITCH_BINARY',
			'command_get'				: 'SWITCH_BINARY_GET',
			'command_set'				: 'SWITCH_BINARY_SET',
			'command_set_parser'		: function( value ){
				return {
					'Switch Value': value
				}
			},
			'command_report'			: 'SWITCH_BINARY_REPORT',
			'command_report_parser'		: function( report ){
				return report['Value'] === 'on/enable';
			}
		},
		'measure_power': {
			'command_class'				: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get'				: 'SENSOR_MULTILEVEL_GET',
			'command_report'			: 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser'		: function( report ){
				return report['Sensor Value (Parsed)'];
			}
		}
	},
	settings: {
		"always_on": {
			"index": 1,
			"size": 1,
			"parser": function( value ){
				return new Buffer([ ( value === true ) ? 0 : 1 ]);
			}
		},
		"led_ring_color_on": {
			"index": 61,
			"size": 1
		},
		"led_ring_color_off": {
			"index": 62,
			"size": 1
		}
	}
})

module.exports.on('applicationUpdate', function( device_data, buf ){
	Homey.manager('flow').triggerDevice( 'fgwpe-101_nif', null, null, device_data )
});