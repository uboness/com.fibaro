'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/675

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		alarm_smoke: [
			{
				getOnWakeUp: true,
				command_class: 'COMMAND_CLASS_SENSOR_ALARM',
				command_get: 'SENSOR_ALARM_GET',
				command_get_parser: node => {
					if (node && typeof node.state.alarm_smoke === 'undefined') {
						modules.export.realtime(node.device_data, 'alarm_smoke', false);
					}
					return {
						'Sensor Type': 'Smoke Alarm',
					}
				},
				command_report: 'SENSOR_ALARM_REPORT',
				command_report_parser: report => {
					if (report['Sensor Type'] !== 'Smoke Alarm') return null;
					return report['Sensor State'] === 'alarm';
				},
			},
			{
				command_class: 'COMMAND_CLASS_NOTIFICATION',
				command_report: 'NOTIFICATION_REPORT',
				command_report_parser: report => {
					if (report && report['Notification Type'] === 'Smoke') {
						if (report['Event'] === 1 || report['Event'] === 2 || report['Event'] === 3) return true;
						return false
					}
					return null;
				},
			},
			{
				command_class: 'COMMAND_CLASS_BASIC',
				command_report: 'BASIC_SET',
				command_report_parser: report => {
					if (report && report.hasOwnProperty('Value')) return report.Value === 255;
					return null;
				},
			},
		],
		alarm_heat: [
			{
				getOnWakeUp: true,
				command_class: 'COMMAND_CLASS_SENSOR_ALARM',
				command_get: 'SENSOR_ALARM_GET',
				command_get_parser: node => {
					if (node && typeof node.state.alarm_heat === 'undefined') {
						modules.export.realtime(node.device_data, 'alarm_heat', false);
					}
					return {
						'Sensor Type': 'Heat Alarm',
					}
				},
				command_report: 'SENSOR_ALARM_REPORT',
				command_report_parser: report => {
					if (report['Sensor Type'] !== 'Heat Alarm') return null;
					return report['Sensor State'] === 'alarm';
				},
			},
			{
				command_class: 'COMMAND_CLASS_NOTIFICATION',
				command_report: 'NOTIFICATION_REPORT',
				command_report_parser: report => {
					if (report && report['Notification Type'] === 'Heat') {
						if (report['Event'] === 1 || report['Event'] === 2 || report['Event'] === 3 || report['Event'] === 4 || report['Event'] === 7) return true;
						return false
					}
					return null;
				},
			},
		],
		measure_temperature: {
			getOnWakeUp: true,
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

				return report['Sensor Value (Parsed)'];
			},
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
		smoke_sensitivity: {
			index: 1,
			size: 1,
		},
		visual_notification: {
			index: 3,
			size: 1,
		},
		acoustic_notification: {
			index: 4,
			size: 1,
		},
		temperature_report_interval: {
			index: 20,
			size: 2,
		},
		temperature_report_hysteresis: {
			index: 21,
			size: 1,
		},
		temperature_alarm_treshold: {
			index: 30,
			size: 1,
		},
	},
});
