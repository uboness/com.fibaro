"use strict";

const path			= require('path');
const ZwaveDriver	= require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/452

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
		'alarm_water': {
			'command_class': 'COMMAND_CLASS_SENSOR_ALARM',
			'command_get': 'SENSOR_ALARM_GET',
			'command_get_parser': function(){
				return {
					'Sensor Type': 'Water Leak Alarm'
				}
			},
			'command_report': 'SENSOR_ALARM_REPORT',
			'command_report_parser': function( report ){
				if( report['Sensor Type'] !== 'Water Leak Alarm' )
					return null;

				return report['Sensor State'] === 'alarm';
			}
		},

		'alarm_tamper': {
			'command_class': 'COMMAND_CLASS_SENSOR_ALARM',
			'command_get': 'SENSOR_ALARM_GET',
			'command_get_parser': function(){
				return {
					'Sensor Type': 'General Purpose Alarm'
				}
			},
			'command_report': 'SENSOR_ALARM_REPORT',
			'command_report_parser': function( report ){
				if( report['Sensor Type'] !== 'General Purpose Alarm' )
					return null;

				return report['Sensor State'] === 'alarm';
			}
		},

		'measure_temperature': {
			'multiChannelNodeId': 2,
			'command_class': 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get': 'SENSOR_MULTILEVEL_GET',
			'command_get_parser': function(){
				return {
					'Sensor Type': 'Temperature (version 1)',
					'Properties1': {
						'Scale': 0
					}
				}
			},
			'command_report': 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser': function( report ){
				if( report['Sensor Type'] !== 'Temperature (version 1)' ) {
					return null;
				}

				return report['Sensor Value (Parsed)'];
			}
		},
		'measure_battery': {
			'command_class': 'COMMAND_CLASS_BATTERY',
			'command_get': 'BATTERY_GET',
			'command_report': 'BATTERY_REPORT',
			'command_report_parser': function( report ) {
				if( report['Battery Level'] === "battery low warning" ) return 1;
				return report['Battery Level (Raw)'][0];
			}
		}
	},
	settings: {
		"alarm_cancellation": {
			"index": 1,
			"size": 2,
			"parser": function( input ) {
				return new Buffer([ Number(input) ]);
			}
		},
		"flood_signal": {
			"index": 2,
			"size": 1
		},
		"alarm_cancel_status": {
			"index": 9,
			"size": 1,
			"parser": function( value ){
				return new Buffer([ ( value === true ) ? 1 : 0 ]);
			}
		},
		"temperature_measure_interval": {
			"index": 10,
			"size": 2,
			"parser": function( input ) {
				return new Buffer([ Number(input) ]);
			}
		},
		"temperature_measure_hysteresis": {
			"index": 12,
			"size": 2,
			"parser": function( input ) {
				return new Buffer([ Number(input) ]);
			}
		},
		"low_temperature_treshold": {
			"index": 50,
			"size": 2,
			"parser": function( input ) {
				return new Buffer([ Number(input) ]);
			}
		},
		"high_temperature_treshold": {
			"index": 51,
			"size": 2,
			"parser": function( input ) {
				return new Buffer([ Number(input) ]);
			}
		},
		"low_temperature_led": {
			"index": 61,
			"size": 4
		},
		"high_temperature_led": {
			"index": 62,
			"size": 4
		},
		"led_indication": {
			"index": 63,
			"size": 1
		},
		"temperature_offset": {
			"index": 73,
			"size": 2,
			"parser": function( input ) {
				return new Buffer([ Number(input) ]);
			}
		},
		"tamper_alarm": {
			"index": 74,
			"size": 1
		},
		"alarm_duration": {
			"index": 75,
			"size": 2,
			"parser": function( input ) {
				return new Buffer([ Number(input) ]);
			}
		},
		"flood_sensor": {
			"index": 77,
			"size": 1,
			"parser": function( value ){
				return new Buffer([ ( value === true ) ? 0 : 1 ]);
			}
		}
	}
});
