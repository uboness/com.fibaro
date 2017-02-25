'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://manuals.fibaro.com/content/manuals/en/FGMS-001/FGMS-001-EN-T-v2.0.pdf

module.exports = new ZwaveDriver(path.basename(__dirname), {
	debug: true,
	capabilities: {
		alarm_motion: {
			command_class: 'COMMAND_CLASS_NOTIFICATION',
			command_get: 'NOTIFICATION_GET',
			command_get_parser: () => ({
				'V1 Alarm Type': 0,
				'Notification Type': 'Home Security',
				Event: 7,
			}),
			command_report: 'NOTIFICATION_REPORT',
			command_report_parser: report => {
				if (report['Notification Type'] === 'Home Security' &&
					report.hasOwnProperty('Event')) {

					if (report['Event (Parsed)'] === 'Motion Detection' ||
						report['Event (Parsed)'] === 'Motion Detection, Unknown Location') {
						return true;
					}

					if (report['Event (Parsed)'] === 'Event inactive' &&
						report.hasOwnProperty('Event Parameter') &&
						(report['Event Parameter'][0] === 7 ||
							report['Event Parameter'][0] === 8)) {
						return false;
					}

					return null;
				}
			},
		},

		alarm_tamper: {
			command_class: 'COMMAND_CLASS_NOTIFICATION',
			command_get: 'NOTIFICATION_GET',
			command_get_parser: () => ({
				'V1 Alarm Type': 0,
				'Notification Type': 'Home Security',
				Event: 3,
			}),
			command_report: 'NOTIFICATION_REPORT',
			command_report_parser: report => {
				if (report['Notification Type'] === 'Home Security' &&
					report.hasOwnProperty('Event')) {

					if (report['Event (Parsed)'] === 'Tampering, Product covering removed') {
						return true;
					}

					if (report['Event (Parsed)'] === 'Event inactive' &&
						report.hasOwnProperty('Event Parameter') &&
						report['Event Parameter'][0] === 3) {
						return false;
					}

					return null;
				}
			},
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
				if (report['Sensor Type'] === 'Temperature (version 1)') {
					return report['Sensor Value (Parsed)'];
				}

				return null;
			},
		},

		measure_luminance: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_get_parser: () => ({
				'Sensor Type': 'Luminance (version 1)',
				Properties1: {
					Scale: 1,
				},
			}),
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report['Sensor Type'] === 'Luminance (version 1)') {
					return report['Sensor Value (Parsed)'];
				}

				return null;
			},
		},
		measure_battery: {
			getOnWakeUp: true,
			command_class: 'COMMAND_CLASS_BATTERY',
			command_get: 'BATTERY_GET',
			command_report: 'BATTERY_REPORT',
			command_report_parser: (report, node) => {
				if (report['Battery Level'] === 'battery low warning') {
					if (node && (!node.state.hasOwnProperty('alarm_battery') || node.state.alarm_battery !== true)) {
						node.state.alarm_battery = true;
						module.exports.realtime(node.device_data, 'alarm_battery', true);
					}
					return 1;
				}
				if (report.hasOwnProperty('Battery Level (Raw)')) {
					if (node && (!node.state.hasOwnProperty('alarm_battery') || node.state.alarm_battery !== false)) {
						node.state.alarm_battery = false;
						module.exports.realtime(node.device_data, 'alarm_battery', false);
					}
					return report['Battery Level (Raw)'][0];
				}
				return null;
			},
		},
		alarm_battery: {
			command_class: 'COMMAND_CLASS_BATTERY',
		},
	},
	settings: {
		motion_sensor_sensitivity: {
			index: 1,
			size: 2,
		},
		motion_sensor_blindtime: {
			index: 2,
			size: 1,
		},
		motion_cancellation_delay: {
			index: 6,
			size: 2,
		},
		day_night: {
			index: 8,
			size: 1,
		},
		day_night_treshold: {
			index: 9,
			size: 2,
		},
		basic_command_config: {
			index: 12,
			size: 1,
		},
		basic_on_command: {
			index: 14,
			size: 2,
		},
		basic_off_command: {
			index: 16,
			size: 2,
		},
		tamper_sensitivity: {
			index: 20,
			size: 1,
		},
		tamper_cancellation_delay: {
			index: 22,
			size: 2,
		},
		tamper_operating_mode: {
			index: 24,
			size: 1,
		},
		tamper_cancellation: {
			index: 25,
			size: 1,
		},
		illumination_report_threshold: {
			index: 40,
			size: 2,
		},
		illumination_report_interval: {
			index: 42,
			size: 2,
		},
		temperature_report_threshold: {
			index: 60,
			size: 2,
		},
		temperature_measuring_interval: {
			index: 62,
			size: 2,
		},
		temperature_report_interval: {
			index: 64,
			size: 2,
		},
		temperature_offset: {
			index: 66,
			size: 2,
		},
		led_signaling_mode: {
			index: 80,
			size: 1,
		},
		led_brightness: {
			index: 81,
			size: 1,
		},
		led_ambient_1: {
			index: 82,
			size: 2,
		},
		led_ambient_100: {
			index: 83,
			size: 2,
		},
		temperature_blue: {
			index: 86,
			size: 2,
		},
		temperature_red: {
			index: 87,
			size: 2,
		},
		led_indicating_tamper_alarm: {
			index: 89,
			size: 1,
		},
	},
});
