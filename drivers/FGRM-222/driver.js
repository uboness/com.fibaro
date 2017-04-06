'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

/*
 * Device information can be found here:
 * http://manuals.fibaro.com/roller-shutter-2
 * NOTE: Scene information is documented seperatly (outside of manual)
 * Additional info: http://www.pepper1.net/zwavedb/device/492
 */
module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		windowcoverings_state: {
			command_class: 'COMMAND_CLASS_SWITCH_BINARY',
			command_get: 'SWITCH_BINARY_GET',
			command_set: 'SWITCH_BINARY_SET',
			command_set_parser: (value, node) => {
				let invertDirection = false;
				if (node.hasOwnProperty('settings') && node.settings.hasOwnProperty('invert_direction')) {
					invertDirection = node.settings.invert_direction;
				}

				let result = 'off/disable';
				// Check correct counter value in case of idle
				if (value === 'idle') {
					if (node.state.position === 'on/enable') result = 'off/disable';
					else if (node.state.position === 'off/disable') result = 'on/enable';
				}
				if (value === 'up') {
					if (invertDirection) result = 'off/disable';
					else result = 'on/enable';
				}
				if (value === 'down') {
					if (invertDirection) result = 'on/enable';
					else result = 'off/disable';
				}

				// Save latest known position state
				if (node && node.state) {
					node.state.position = result;
				}

				return {
					'Switch Value': result,
				};
			},
			command_report: 'SWITCH_BINARY_REPORT',
			command_report_parser: (report, node) => {
				let invertDirection = false;
				if (node.hasOwnProperty('settings') && node.settings.hasOwnProperty('invert_direction')) {
					invertDirection = node.settings.invert_direction;
				}

				// Save latest known position state
				if (node && node.state) {
					node.state.position = report.Value;
				}

				switch (report.Value) {
					case 'on/enable':
						if (invertDirection) return 'down';
						return 'up';
					case 'off/disable':
						if (invertDirection) return 'up';
						return 'down';
					default:
						return 'idle';
				}
			},
		},

		dim: {
			command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			command_get: 'SWITCH_MULTILEVEL_GET',
			command_set: 'SWITCH_MULTILEVEL_SET',
			command_set_parser: (value, node) => {
				let invertDirection = false;
				if (node.hasOwnProperty('settings') && node.settings.hasOwnProperty('invert_direction')) {
					invertDirection = node.settings.invert_direction;
				}

				if (value >= 1) {
					if (invertDirection) value = 0;
					else value = 0.99;
				}
				if (invertDirection) {
					return {
						'Value': (1 - value.toFixed(2)) * 100,
						'Dimming Duration': 'Factory default',
					};
				}
				return {
					'Value': value * 100,
					'Dimming Duration': 'Factory default',
				};
			},
			command_report: 'SWITCH_MULTILEVEL_REPORT',
			command_report_parser: (report, node) => {
				let invertDirection = false;
				if (node.hasOwnProperty('settings') && node.settings.hasOwnProperty('invert_direction')) {
					invertDirection = node.settings.invert_direction;
				}

				if (typeof report['Value (Raw)'] === 'undefined') return null;
				if (invertDirection) return (100 - report['Value (Raw)'][0]) / 100;
				return report['Value (Raw)'][0] / 100;
			},
		},
		measure_power: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => report['Sensor Value (Parsed)'],
		},
		meter_power: {
			command_class: 'COMMAND_CLASS_METER',
			command_get: 'METER_GET',
			command_get_parser: () => ({
				'Properties1': {
					'Scale': 0,
				},
			}),
			command_report: 'METER_REPORT',
			command_report_parser: report => report['Meter Value (Parsed)'],
		},
	},
	settings: {
		reports_type: {
			index: 3,
			size: 1,
		},
		operating_mode: {
			index: 10,
			size: 1,
		},
		switch_type: {
			index: 14,
			size: 1,
		},
		power_level_change: {
			index: 40,
			size: 1,
		},
		periodic_power_level_reports: {
			index: 42,
			size: 2,
			signed: false,
		},
		start_calibration: {
			index: 29,
			size: 1,
			parser: (newValue, newSettings, deviceData) => {
				setTimeout(() => {
					module.exports.setSettings(deviceData, {
						start_calibration: false,
					}, (err) => {
						if (err) console.error('Failed to revert setting', err);
					});
				}, 3000);
				return new Buffer([(newValue === true) ? 1 : 0]);
			},
		},
		scenes_and_associations: {
			index: 50,
			size: 1,
		},
		invert_direction: (newValue, oldValue, deviceData) => module.exports.nodes[deviceData.token].settings.invert_direction = newValue
	},
});

Homey.manager('flow').on('action.FGRM-222_reset_meter', (callback, args) => {
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

/*
 * Listen for scene commands and execute flows based on operation mode and switch type.
 */
module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];
	if (node) {
		if (node.instance.CommandClass.COMMAND_CLASS_SCENE_ACTIVATION) {
			node.instance.CommandClass.COMMAND_CLASS_SCENE_ACTIVATION.on('report', (command, report) => {
				if (command.hasOwnProperty('name') && command.name === 'SCENE_ACTIVATION_SET') {
					if (report.hasOwnProperty('Scene ID')) {
						module.exports.getSettings(node.device_data, (err, settings) => {
							if (err) return console.error(err);
							const data = {
								scene: report['Scene ID'].toString(),
							};
							if (settings && settings.hasOwnProperty('operating_mode')) {
								switch (settings.operating_mode) {
									case '0':
									case '1':
									case '2':
										// do not nest switch statements (confusing).
										switchTypeTriggerDevice(node, settings, data);
										break;
									case '3':
									case '4':
										// Switch types are not relevant when using gate mode.
										Homey.manager('flow').triggerDevice('FGRM-222-momentary_single-gate_switch',
											null, data, node.device_data, (err) => {
												if (err) return console.error(err);
											});
										break;
									default:
										console.error(`Unknown operating mode ${settings.operating_mode} found.`);
										break;
								}
							}
						});
					}
				}
			});
		}
	}
});

function switchTypeTriggerDevice(node, settings, data) {
	if (settings && settings.hasOwnProperty('switch_type')) {
		switch (settings.switch_type) {
			case '0':
				Homey.manager('flow').triggerDevice('FGRM-222-momentary',
					null, data, node.device_data, (err) => {
						if (err) return console.error(err);
					});
				break;
			case '1':
				Homey.manager('flow').triggerDevice('FGRM-222-toggle',
					null, data, node.device_data, (err) => {
						if (err) return console.error(err);
					});
				break;
			case '2':
				Homey.manager('flow').triggerDevice('FGRM-222-momentary_single-gate_switch',
					null, data, node.device_data, (err) => {
						if (err) return console.error(err);
					});
				break;
			default:
				console.error(`Unknown switch type ${settings.switch_type} found.`);
				break;
		}
	}
}

Homey.manager('flow').on('trigger.FGRM-222-momentary', (callback, args, state) => {
	callback(null, (args.scene === state.scene));
});

Homey.manager('flow').on('trigger.FGRM-222-toggle', (callback, args, state) => {
	callback(null, (args.scene === state.scene));
});

Homey.manager('flow').on('trigger.FGRM-222-momentary_single-gate_switch', (callback, args, state) => {
	callback(null, (args.scene === state.scene));
});
