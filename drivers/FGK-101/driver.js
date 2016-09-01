"use strict";

const path			= require('path');
const ZwaveDriver	= require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/430

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
		'alarm_contact': {
			'command_class'				: 'COMMAND_CLASS_SENSOR_BINARY',
			'command_get'				: 'SENSOR_BINARY_GET',
			'command_get_parser'		: function() {
				return {
					'Sensor Type': 'Door/Window'
				};
			},
			'command_report'			: 'SENSOR_BINARY_REPORT',
			'command_report_parser'		: function( report ){
				return report['Sensor Value'] === 'detected an event';
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
		"input_alarm_cancellation_delay": {
			"index": 1,
			"size": 2
		},
		"led_status": {
			"index": 2,
			"size": 1,
			"parser": function( value ){
				return new Buffer([ ( value === true ) ? 1 : 0 ]);
			}
		},
		"type_input": {
			"index": 3,
			"size": 1
		},
		"temperature_measure_hystersis": {
			"index": 12,
			"size": 1
		}
	}
});

