'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/766

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		alarm_contact: [
			{
				command_class: 'COMMAND_CLASS_SENSOR_ALARM',
				command_get: 'SENSOR_ALARM_GET',
				command_get_parser: () => ({
					'Sensor Type': 'General Purpose Alarm',
				}),
				command_report: 'SENSOR_ALARM_REPORT',
				command_report_parser: report => {
					if (report['Sensor Type'] !== 'General Purpose Alarm') { return null; }

					if (report.hasOwnProperty('Sensor State')) { return report['Sensor State'] === 'alarm'; }

					return null;
				},
			},
			{
				command_class: 'COMMAND_CLASS_NOTIFICATION',
				command_report: 'NOTIFICATION_REPORT',
				command_report_parser: report => {
					if (report && report.hasOwnProperty('Notification Type') && report.hasOwnProperty('Event (Parsed)')) {
						if (report['Notification Type'] === 'Access Control') {
							if (report['Event (Parsed)'] === 'Window/Door is closed') return false;
							if (report['Event (Parsed)'] === 'Window/Door is open') return true;
						} else {
							return null;
						}
					}
					return null;
				},
			},
		],
		alarm_tamper: {
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
		measure_temperature: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_get_parser: () => ({
				'Sensor Type': 'Temperature (version 1)',
				Properties1: {
					Scale: 0,
				},
			}),
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report['Sensor Type'] !== 'Temperature (version 1)') return null;
				if (report.hasOwnProperty('Sensor Value (Parsed)')) return report['Sensor Value (Parsed)'];
				return null;
			},
			optional: true,
		},

		measure_battery: {
			getOnWakeUp: true,
			command_class: 'COMMAND_CLASS_BATTERY',
			command_get: 'BATTERY_GET',
			command_report: 'BATTERY_REPORT',
			command_report_parser: report => {
				if (report['Battery Level'] === 'battery low warning') return 1;

				if (report.hasOwnProperty('Battery Level (Raw)')) { return report['Battery Level (Raw)'][0]; }

				return null;
			},
		},
	},
	settings: {
		operation_mode: {
			index: 1,
			size: 1,
		},
		default_alarm_status: {
			index: 2,
			size: 1,
		},
		led_indication: {
			index: 3,
			size: 1,
		},
		tamper_alarm_cancellation: {
			index: 30,
			size: 2,
		},
		tamper_cancellation: {
			index: 31,
			size: 1,
		},
		temperature_measure_interval: {
			index: 50,
			size: 2,
		},
		temperature_report_treshold: {
			index: 51,
			size: 2,
		},
		temperature_report_interval: {
			index: 52,
			size: 2,
		},
		temperature_offset: {
			index: 53,
			size: 4,
		},
	},
});
