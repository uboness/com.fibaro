"use strict";

const path			= require('path');
const ZwaveDriver	= require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/675

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
		'alarm_smoke': {
			'command_class'				: 'COMMAND_CLASS_SENSOR_ALARM',
			'command_get'				: 'SENSOR_ALARM_GET',
			'command_get_parser'		: function(){
				return {
					'Sensor Type': 'Smoke Alarm'
				}
			},
			'command_report'			: 'SENSOR_ALARM_REPORT',
			'command_report_parser'		: function( report ){
				if( report['Sensor Type'] !== 'Smoke Alarm' )
					return null;

				return report['Sensor Value'] === 'detected an event';
			}
		},
		'alarm_heat': {
			'command_class'				: 'COMMAND_CLASS_SENSOR_ALARM',
			'command_get'				: 'SENSOR_ALARM_GET',
			'command_get_parser'		: function(){
				return {
					'Sensor Type': 'Heat Alarm'
				}
			},
			'command_report'			: 'SENSOR_ALARM_REPORT',
			'command_report_parser'		: function( report ){
				if( report['Sensor Type'] !== 'Heat Alarm' )
					return null;

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
	}
})