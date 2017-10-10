'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// Documentation: http://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/2181/FGDW-002-EN-T-v0.3.2.pdf

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		alarm_contact: {
			command_class: 'COMMAND_CLASS_NOTIFICATION',
			command_get: 'NOTIFICATION_GET',
			command_get_parser: () => ({
				'V1 Alarm Type': 0,
				'Event': 23,
				'Notification Type': 'Access Control'
			}),
			command_report: 'NOTIFICATION_REPORT',
			command_report_parser: report => {
				if (report && report.hasOwnProperty('Notification Type') && report['Notification Type'] === 'Access Control') {
					if (report['Event (Parsed)'] === 'Window/Door is open') return true;
					else if (report['Event (Parsed)'] === 'Window/Door is closed') return false;
				}
				return null;
			},
		},
		alarm_tamper: [
			{
				command_class: 'COMMAND_CLASS_SENSOR_ALARM',
				command_get: 'SENSOR_ALARM_GET',
				command_get_parser: () => ({
					'Sensor Type': 'General Purpose Alarm',
				}),
				command_report: 'SENSOR_ALARM_REPORT',
				command_report_parser: report => {
					if (report && report.hasOwnProperty('Sensor State')) return report['Sensor State'] === 'alarm';
					return null;
				}
			},
			{
				command_class: 'COMMAND_CLASS_NOTIFICATION',
				command_get: 'NOTIFICATION_GET',
				command_get_parser: () => ({
					'V1 Alarm Type': 0,
					'Notification Type': 'Home Security',
					'Event': 3,
				}),
				command_report: 'NOTIFICATION_REPORT',
				command_report_parser: report => {
					if (report && report.hasOwnProperty('Notification Type') && report.hasOwnProperty('Event (Parsed)')) {
						if (report['Notification Type'] === 'Home Security') {
							return report['Event (Parsed)'] === 'Tampering, Product covering removed';
						} else {
							return null;
						}
					}
					return null;
				},
			},
		],
		measure_battery: {
			command_class: 'COMMAND_CLASS_BATTERY',
			command_get: 'BATTERY_GET',
			command_report: 'BATTERY_REPORT',
			command_report_parser: report => {
				if (report['Battery Level'] === 'battery low warning') return 1;
				if (report.hasOwnProperty('Battery Level (Raw)')) return report['Battery Level (Raw)'][0];
				return null;
			},
		},
		measure_temperature: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
					if (report['Sensor Type'] === 'Temperature (version 1)') return report['Sensor Value (Parsed)'];
				}
				return null;
			},
		},
	},
	settings: {
		1: {
			index: 1,
			size: 1,
		},
		2: {
			index: 2,
			size: 1,
		},
		3: {
			index: 3,
			size: 1,
		},
		11: {
			index: 11,
			size: 1,
		},
		12: {
			index: 12,
			size: 2,
		},
		13: {
			index: 13,
			size: 2,
		},
		14: {
			index: 14,
			size: 2,
		},
		15: {
			index: 15,
			size: 2,
		},
		30: {
			index: 30,
			size: 2,
		},
		31: {
			index: 31,
			size: 1,
		},
		50: {
			index: 50,
			size: 2,
		},
		51: {
			index: 51,
			size: 2,
		},
		52: {
			index: 52,
			size: 2,
		},
		53: {
			index: 53,
			size: 2,
		},
	},
});
