"use strict";

const path			= require('path');
const ZwaveDriver	= require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/601

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {

		'alarm_motion': {
			'command_class'				: 'COMMAND_CLASS_SENSOR_BINARY',
			'command_get'				: 'SENSOR_BINARY_GET',
			'command_report'			: 'SENSOR_BINARY_REPORT',
			'command_report_parser'		: function( report ){
				return report['Sensor Value'] === 'detected an event';
			}
		},

		'measure_temperature': {
			'command_class'				: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get'				: 'SENSOR_MULTILEVEL_GET',
			'command_get_parser'		: function(){
				return {
					'Sensor Type': 'Temperature (version 1)',
					'Properties1': {
						'Scale': 0
					}
				}
			},
			'command_report'			: 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser'		: function( report ){
				if( report['Sensor Type'] !== 'Temperature (version 1)' )
					return null;

				return report['Sensor Value (Parsed)'];
			}
		},

		'measure_luminance': {
			'command_class'				: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get'				: 'SENSOR_MULTILEVEL_GET',
			'command_get_parser'		: function(){
				return {
					'Sensor Type': 'Luminance (version 1)',
					'Properties1': {
						'Scale': 0
					}
				}
			},
			'command_report'			: 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser'		: function( report ){
				if( report['Sensor Type'] !== 'Luminance (version 1)' )
					return null;

				return report['Sensor Value (Parsed)'];
			}
		},

		'measure_battery': {
			'command_class'				: 'COMMAND_CLASS_BATTERY',
			'command_get'				: 'BATTERY_GET',
			'command_report'			: 'BATTERY_REPORT',
			'command_report_parser'		: function( report ) {
				if( report['Battery Level'] === "battery low warning" ) return 1;
				return report['Battery Level (Raw)'][0];
			}
		}

	},
	settings: {
		"tamper_operating_mode": {
			"index": 24,
			"size": 1,
			"parser": function( input ) {
				return new Buffer([ parseInt(input) ]);
			}
		},
		"led_signaling_mode": {
			"index": 80,
			"size": 1,
			"parser": function( input ) {
				return new Buffer([ parseInt(input) ]);
			}
		},
		"led_indicating_tamper_alarm": {
			"index": 89,
			"size": 1,
			"parser": function( input ) {
				return new Buffer([ ( input === true ) ? 1 : 0 ]);
			}
		}
}
})
