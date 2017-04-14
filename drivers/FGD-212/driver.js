'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://manuals.fibaro.com/content/manuals/en/FGD-212/FGD-212-EN-T-v1.2.pdf

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		onoff: {
			command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			command_get: 'SWITCH_MULTILEVEL_GET',
			command_set: 'SWITCH_MULTILEVEL_SET',
			command_set_parser: value => ({
				Value: (value > 0) ? 'on/enable' : 'off/disable',
				'Dimming Duration': 'Factory default',
			}),
			command_report: 'SWITCH_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report.Value === 'on/enable') return true;
				else if (report.Value === 'off/disable') return false;
				else if (typeof report.Value === 'number') return report.Value > 0;
				else if (typeof report['Value (Raw)'] !== 'undefined') return report['Value (Raw)'][0] > 0;
				return null;
			},
		},
		dim: {
			command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			command_get: 'SWITCH_MULTILEVEL_GET',
			command_set: 'SWITCH_MULTILEVEL_SET',
			command_set_parser: (value, node) => {
				module.exports.realtime(node.device_data, 'onoff', value > 0);
				return {
					Value: Math.round(value * 99),
					'Dimming Duration': 'Factory default',
				};
			},
			command_report: 'SWITCH_MULTILEVEL_REPORT',
			command_report_parser: (report, node) => {
				if (report.Value === 'on/enable') {
					module.exports.realtime(node.device_data, 'onoff', true);
					return 1.0;
				}
				else if (report.Value === 'off/disable') {
					module.exports.realtime(node.device_data, 'onoff', false);
					return 0.0;
				}
				else if (typeof report.Value === 'number') {
					module.exports.realtime(node.device_data, 'onoff', report.Value > 0);
					return report.Value / 99;
				}
				else if (typeof report['Value (Raw)'] !== 'undefined') {
					module.exports.realtime(node.device_data, 'onoff', report['Value (Raw)'][0] > 0);
					if (report['Value (Raw)'][0] === 255) return 1.0;
					return report['Value (Raw)'][0] / 99;
				}
				return null;
			},
		},

		measure_power: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report['Sensor Type'] !== 'Power (version 2)') return null;

				return report['Sensor Value (Parsed)'];
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
					report.Properties2.hasOwnProperty('Scale bits 10') &&
					report.Properties2['Scale bits 10'] === 0) {
					return report['Meter Value (Parsed)'];
				}
				return null;
			},
		},
	},
	settings: {
		minimum_brightness: {
			index: 1,
			size: 1,
		},
		maximum_brightness: {
			index: 2,
			size: 1,
		},
		dimming_step_auto: {
			index: 5,
			size: 1,
		},
		time_dimming_step_auto: {
			index: 6,
			size: 2,
		},
		dimming_step_manual: {
			index: 7,
			size: 1,
		},
		time_dimming_step_manual: {
			index: 8,
			size: 2,
		},
		save_state: {
			index: 9,
			size: 1,
		},
		timer_functionality: {
			index: 10,
			size: 2,
		},
		force_auto_calibration: {
			index: 13,
			size: 1,
		},
		forced_brightness_level: {
			index: 19,
			size: 1,
		},
		switch_type: {
			index: 20,
			size: 1,
		},
		double_click: {
			index: 23,
			size: 1,
		},
		'3_way_switch': {
			index: 26,
			size: 1,
		},
		switch_s1_and_s2: {
			index: 29,
			size: 1,
		},
		force_no_dim: {
			index: 32,
			size: 1,
			parser: value => new Buffer([(value) ? 2 : 0]),
		},
		soft_start: {
			index: 34,
			size: 1,
		},
		watt_report: {
			index: 50,
			size: 1,
		},
		watt_interval: {
			index: 52,
			size: 2,
		},
		kwh_report: {
			index: 53,
			size: 2,
			parser: value => new Buffer([value * 100]),
		},
		self_measurement: {
			index: 54,
			size: 1,
		},
	},
});

module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];

	if (node) {

		if (typeof node.instance.CommandClass.COMMAND_CLASS_SCENE_ACTIVATION !== 'undefined') {

			node.instance.CommandClass.COMMAND_CLASS_SCENE_ACTIVATION.on('report', (command, report) => {

				if (command.hasOwnProperty('name') &&
					command.name === 'SCENE_ACTIVATION_SET') {

					if (report.hasOwnProperty('Scene ID')) {

						// Check the switch type so not all flows are being triggered
						module.exports.getSettings(node.device_data, (err, settings) => {
							if (!err &&
								settings &&
								settings.hasOwnProperty('switch_type')) {

								// Create Scene ID Data
								const data = {
									scene: report['Scene ID'].toString(),
								};

								// Switch Type = Momentary
								if (settings.switch_type === '0') {
									Homey.manager('flow').triggerDevice('FGD-212_momentary', null, data, node.device_data);
								}

								// Switch Type = Toggle
								else if (settings.switch_type === '1') {
									Homey.manager('flow').triggerDevice('FGD-212_toggle', null, data, node.device_data);
								}

								// Switch Type = Rollerblind
								else if (settings.switch_type === '2') {
									Homey.manager('flow').triggerDevice('FGD-212_roller', null, data, node.device_data);
								}
							}
						});
					}
				}
			});
		}
	}
});

Homey.manager('flow').on('trigger.FGD-212_momentary', (callback, args, state) => {
	if (state && args && state.scene === args.scene) {
		return callback(null, true);
	}

	return callback(null, false);
});

Homey.manager('flow').on('trigger.FGD-212_toggle', (callback, args, state) => {
	if (state && args && state.scene === args.scene) {
		return callback(null, true);
	}

	return callback(null, false);
});

Homey.manager('flow').on('trigger.FGD-212_roller', (callback, args, state) => {
	if (state && args && state.scene === args.scene) {
		return callback(null, true);
	}

	return callback(null, false);
});

Homey.manager('flow').on('action.FGD-212_set_brightness', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	// Check forced brightness level property
	if (!args.hasOwnProperty('set_forced_brightness_level')) return callback('set_forced_brightness_level_property_missing');
	if (typeof args.set_forced_brightness_level !== 'number') return callback('forced_brightness_level_is_not_a_number');
	if (args.set_forced_brightness_level > 1) return callback('forced_brightness_level_out_of_range');

	if (node && args.hasOwnProperty('set_forced_brightness_level') && typeof args.set_forced_brightness_level === 'number') {

		let parsedForcedBrightnessLevel = Math.round(args.set_forced_brightness_level * 99);

		if (node.instance.CommandClass.COMMAND_CLASS_CONFIGURATION) {
			node.instance.CommandClass.COMMAND_CLASS_CONFIGURATION.CONFIGURATION_SET({
				'Parameter Number': 19,
				Level: {
					Size: 1,
					Default: false,
				},
				'Configuration Value': new Buffer([parsedForcedBrightnessLevel]),
			}, (err, result) => {
				if (err) return callback(err);

				if (result === 'TRANSMIT_COMPLETE_OK') {
					module.exports.setSettings(node.device_data, {
						forced_brightness_level: parsedForcedBrightnessLevel,
					});
					return callback(null, true);
				}

				return callback('unknown_response');
			});
		} else return callback('unknown_error');
	} else return callback('unknown_error');
});

Homey.manager('flow').on('action.FGD-212_dim_duration', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	// Check dimming duration level property
	if (!args.hasOwnProperty('dimming_duration')) return callback('dimming_duration_property_missing');
	if (typeof args.dimming_duration !== 'number') return callback('dimming_duration_is_not_a_number');
	if (args.brightness_level > 1) return callback('brightness_level_out_of_range');
	if (args.dimming_duration > 127) return callback('dimming_duration_out_of_range');

	if (node && node.instance.CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL) {
		node.instance.CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({
			Value: new Buffer([Math.round(args.brightness_level * 99)]),
			'Dimming Duration': new Buffer([args.dimming_duration + (args.duration_unit * 127)]),
		}, (err, result) => {
			if (err) return callback(err);

			if (result === 'TRANSMIT_COMPLETE_OK') {
				return callback(null, true);
			}

			return callback('unknown_response');
		});
	} else return callback('unknown_error');
});

Homey.manager('flow').on('action.FGD-212_set_timer', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	// Check dimming duration level property
	if (!args.hasOwnProperty('set_timer_functionality')) return callback('set_timer_property_missing');
	if (typeof args.set_timer_functionality !== 'number') return callback('set_timer_is_not_a_number');
	if (args.set_timer_functionality > 32767) return callback('set_timer_out_of_range');

	let configValue = null;
	try {
		configValue = new Buffer(2);
		configValue.writeIntBE(args.set_timer_functionality, 0, 2);
	} catch (err) {
		return callback('failed_to_write_config_value_to_buffer');
	}

	if (node &&
		node.instance &&
		node.instance.CommandClass &&
		node.instance.CommandClass.COMMAND_CLASS_CONFIGURATION &&
		args.hasOwnProperty('set_timer_functionality') &&
		configValue) {

		node.instance.CommandClass.COMMAND_CLASS_CONFIGURATION.CONFIGURATION_SET({
			'Parameter Number': 10,
			Level: {
				Size: 2,
				Default: false,
			},
			'Configuration Value': configValue,
		}, (err, result) => {
			if (err) return callback(err);

			// If properly transmitted, change the setting and finish flow card
			if (result === 'TRANSMIT_COMPLETE_OK') {

				// Set the device setting to this flow value
				module.exports.setSettings(node.device_data, {
					timer_functionality: args.set_timer_functionality,
				});

				return callback(null, true);
			}
			return callback('unknown_response');
		});
	} else return callback('unknown_error');
});

Homey.manager('flow').on('action.FGD-212_reset_meter', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	if (node &&
		node.instance &&
		node.instance.CommandClass &&
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
