"use strict";

const path			= require('path');
const ZwaveDriver	= require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/673

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {

		'alarm_motion': {
			'command_class'				: 'COMMAND_CLASS_NOTIFICATION',
			'command_get'				: 'NOTIFICATION_GET',
			'command_get_parser'		: function(){
				return {
					'V1 Alarm Type': 0,
					'Notification Type': 'Home Security',
					'Event': 7
				}
			},
			'command_report'			: 'NOTIFICATION_REPORT',
			'command_report_parser'		: report => {
				if(report['Notification Type'] === 'Home Security') {
					if( report['Event (Parsed)'] === 'Motion Detection' || report['Event (Parsed)'] === 'Motion Detection, Unknown Location' ) {
						return true;
					} else {
						return false;
					}
				} else {
					return null;
				}
			}
		},

		'alarm_tamper': {
			'command_class'				: 'COMMAND_CLASS_NOTIFICATION',
			'command_get'				: 'NOTIFICATION_GET',
			'command_get_parser'		: function(){
				return {
					'V1 Alarm Type': 0,
					'Notification Type': 'Home Security',
					'Event': 3
				}
			},
			'command_report'			: 'NOTIFICATION_REPORT',
			'command_report_parser'		: report => {
				if(report['Notification Type'] === 'Home Security') {
					if( report['Event (Parsed)'] === 'Tampering, Product covering removed' ) {
						return true;
					} else {
						return false;
					}
				} else {
					return null;
				}
			}
		},

		'measure_temperature': {
			'command_class'				: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get_parser'		: function(){
				return {
					'Sensor Type': 'Temperature (version 1)',
					'Properties1': {
						'Scale': 0
					}
				};
			},
			'command_report'			: 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser'		: report => {
				if( report['Sensor Value (Parsed)'] && report['Sensor Type'] === 'Temperature (version 1)' ) {
					return report['Sensor Value (Parsed)'];
				} else return null;
			}
		},

		'measure_luminance': {
			'command_class'				: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get_parser'		: function(){
				return {
					'Sensor Type': 'Luminance (version 1)',
					'Properties1': {
						'Scale': 0
					}
				};
			},
			'command_report'			: 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser'		: report => {
				if( report['Sensor Value (Parsed)'] && report['Sensor Type'] === 'Luminance (version 1)' ) {
					return report['Sensor Value (Parsed)'];
				} else return null;
			}
		},

		'measure_battery': {
			'command_class'				: 'COMMAND_CLASS_BATTERY',
			'command_get'				: 'BATTERY_GET',
			'command_report'			: 'BATTERY_REPORT',
			'command_report_parser'		: report => report['Battery Level (Raw)'][0]
		}
	},
	settings: {
		"motion_sensor_sensitivity": {
			"index": 1,
			"size": 2
		},
		"motion_sensor_blindtime": {
			"index": 2,
			"size": 1
		},

		"motion_cancellation_delay": {
			"index": 6,
			"size": 2
		},
		"tamper_sensitivity": {
			"index": 20,
			"size": 1
		},
		"tamper_operating_mode": {
			"index": 24,
			"size": 1
		},
		"tamper_cancellation_delay": {
			"index": 22,
			"size": 1
		},
		"tamper_cancellation": {
			"index": 25,
			"size": 1,
			"parser": function( value ){
				return new Buffer([ ( value === true ) ? 1 : 0 ]);
			}
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
			"size": 1,
			"parser": function( value ){
				return new Buffer([ ( value === true ) ? 1 : 0 ]);
			}
		}
	}
});
