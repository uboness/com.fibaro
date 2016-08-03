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

		'alarm_tamper': {
			'command_class'				: 'COMMAND_CLASS_SENSOR_ALARM',
			'command_get'				: 'SENSOR_ALARM_GET',
			'command_get_parser'		: function(){
				return {
					'Sensor Type': 'General Purpose Alarm'
				}
			},
			'command_report'			: 'SENSOR_ALARM_REPORT',
			'command_report_parser'		: function( report ){
				return report['Sensor State'] === 'alarm';
			}
		},

		'measure_temperature': {
			'command_class'				: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			//'command_get'				: 'SENSOR_MULTILEVEL_GET',
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
			//'command_get'				: 'SENSOR_MULTILEVEL_GET',
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
		"motion_sensor_sensitivity": {
			"index": 1,
			"size": 1
		},
		"motion_sensor_blindtime": {
			"index": 2,
			"size": 1
		},

		"motion_cancellation_delay": {
			"index": 6,
			"size": 2
		},
		"tamper_operating_mode": {
			"index": 24,
			"size": 1
		},
		"illumination_report_threshold": {
			"index": 40,
			"size": 2
		},
		"illumination_report_interval": {
			"index": 42,
			"size": 2
		},
		"temperature_report_threshold": {
			"index": 60,
			"size": 1
		},
		"temperature_measuring_interval": {
			"index": 62,
			"size": 2
		},
		"temperature_report_interval": {
			"index": 64,
			"size": 2
		},
		"temperature_offset": {
			"index": 66,
			"size": 2
		},
		"led_signaling_mode": {
			"index": 80,
			"size": 1
		},
		"led_brightness": {
			"index": 81,
			"size": 1
		},
		"led_ambient_1": {
			"index": 82,
			"size": 1
		},
		"led_ambient_100": {
			"index": 83,
			"size": 1
		},
		"temperature_blue": {
			"index": 86,
			"size": 1
		},
		"temperature_red": {
			"index": 87,
			"size": 1
		},
		"led_indicating_tamper_alarm": {
			"index": 89,
			"size": 1
		}
	}
})
