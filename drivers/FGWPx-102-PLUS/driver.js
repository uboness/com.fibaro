'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/476

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		onoff: {
			command_class: 'COMMAND_CLASS_SWITCH_BINARY',
			command_get: 'SWITCH_BINARY_GET',
			command_set: 'SWITCH_BINARY_SET',
			command_set_parser: value => ({
				'Switch Value': (value > 0) ? 'on/enable' : 'off/disable',
			}),
			command_report: 'SWITCH_BINARY_REPORT',
			command_report_parser: report => report.Value === 'on/enable',
		},

		measure_power: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_get_parser: () => ({
				'Sensor Type': 'Power (version 2)',
				Properties1: {
					Scale: 0,
				},
			}),
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report['Sensor Type'] === 'Power (version 2)' &&
					report.hasOwnProperty('Level') &&
					report.Level.hasOwnProperty('Scale') &&
					report.Level.Scale === 0) {
					return report['Sensor Value (Parsed)'];
				}

				return null;
			},
		},

		meter_power: {
			command_class: 'COMMAND_CLASS_METER',
			command_get: 'METER_GET',
			command_get_parser: () => ({
				Properties1: {
					Scale: 0,
				},
			}),
			command_report: 'METER_REPORT',
			command_report_parser: report => {
				if (report.hasOwnProperty('Properties2') &&
					report.Properties2.hasOwnProperty('Scale') &&
					report.Properties2.Scale === 0) {
					return report['Meter Value (Parsed)'];
				}

				return null;
			},
		},
	},
	settings: {
		always_on: {
			index: 1,
			size: 1,
		},
		save_state: {
			index: 2,
			size: 1,
		},
		immediate_watt_percent_report: {
			index: 10,
			size: 1,
		},
		watt_threshold_report: {
			index: 11,
			size: 1,
		},
		watt_interval_report: {
			index: 12,
			size: 2,
		},
		kwh_threshold_report: {
			index: 13,
			size: 2,
			parser: value => new Buffer([value * 100]),
		},
		watt_kwh_report_interval: {
			index: 14,
			size: 2,
		},
		own_power: {
			index: 15,
			size: 1,
		},
		control_onoff_group2: {
			index: 20,
			size: 1,
		},
		watt_led_violet: {
			index: 40,
			size: 2,
		},
		led_ring_color_on: {
			index: 41,
			size: 1,
		},
		led_ring_color_off: {
			index: 42,
			size: 1,
		},
	},
});

Homey.manager('flow').on('action.FGWPx-102-PLUS_led_on', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	if (args.hasOwnProperty('color') && node.instance.CommandClass.COMMAND_CLASS_CONFIGURATION) {

		// Send parameter values to module
		node.instance.CommandClass.COMMAND_CLASS_CONFIGURATION.CONFIGURATION_SET({
			'Parameter Number': 41,
			Level: {
				Size: 1,
				Default: false,
			},
			'Configuration Value': new Buffer([args.color]),

		}, (err, result) => {
			// If error, stop flow card
			if (err) {
				Homey.error(err);
				return callback(null, false);
			}

			// If properly transmitted, change the setting and finish flow card
			if (result === 'TRANSMIT_COMPLETE_OK') {
				// Set the device setting to this flow value
				module.exports.setSettings(node.device_data, {
					led_ring_color_on: args.color,
				});

				return callback(null, true);
			}
			// no transmition, stop flow card
			return callback(null, false);
		});
	}

	return callback(null, false);
});

Homey.manager('flow').on('action.FGWPx-102-PLUS_led_off', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	if (args.hasOwnProperty('color') && node.instance.CommandClass.COMMAND_CLASS_CONFIGURATION) {

		// Send parameter values to module
		node.instance.CommandClass.COMMAND_CLASS_CONFIGURATION.CONFIGURATION_SET({
			'Parameter Number': 42,
			Level: {
				Size: 1,
				Default: false,
			},
			'Configuration Value': new Buffer([args.color]),

		}, (err, result) => {
			// If error, stop flow card
			if (err) {
				Homey.error(err);
				return callback(null, false);
			}

			// If properly transmitted, change the setting and finish flow card
			if (result === 'TRANSMIT_COMPLETE_OK') {
				// Set the device setting to this flow value
				module.exports.setSettings(node.device_data, {
					led_ring_color_off: args.color,
				});

				return callback(null, true);
			}
			// no transmition, stop flow card
			return callback(null, false);
		});
	}

	return callback(null, false);
});


Homey.manager('flow').on('action.FGWPx-102-PLUS_reset_meter', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	if (node &&
		node.instance.CommandClass.COMMAND_CLASS_METER) {
		node.instance.CommandClass.COMMAND_CLASS_METER.METER_RESET({}, (err, result) => {
			if (err) return callback(err);

			// If properly transmitted, change the setting and finish flow card
			if (result === 'TRANSMIT_COMPLETE_OK') {

				return callback(null, true);
			}

			return callback('unknown_response');
		});
	} else return callback('unknown_error');
});
