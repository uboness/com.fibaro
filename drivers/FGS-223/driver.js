'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://manuals.fibaro.com/content/manuals/en/FGS-2x3/FGS-2x3-EN-T-v1.0.pdf
// FGS-223

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		'onoff': {
			'command_class': 'COMMAND_CLASS_SWITCH_BINARY',
			'command_get': 'SWITCH_BINARY_GET',
			'command_set': 'SWITCH_BINARY_SET',
			'command_set_parser': value => ({
				'Switch Value': (value > 0) ? 'on/enable' : 'off/disable'
			}),
			'command_report': 'SWITCH_BINARY_REPORT',
			'command_report_parser': report => report['Value'] === 'on/enable'
		},
		'measure_power': {
			'command_class': 'COMMAND_CLASS_METER',
			'command_get': 'METER_GET',
			'command_get_parser': () => ({
				'Properties1': {
					'Scale': 2
				}
			}),
			'command_report': 'METER_REPORT',
			'command_report_parser': report => {
				if (report.hasOwnProperty('Properties2') &&
					report.Properties2.hasOwnProperty('Scale bits 10') &&
					report.Properties2['Scale bits 10'] === 2) {
					return report['Meter Value (Parsed)'];
				}
				return null;
			}
		},
		'meter_power': {
			'command_class': 'COMMAND_CLASS_METER',
			'command_get': 'METER_GET',
			'command_get_parser': () => ({
				'Properties1': {
					'Scale': 0
				}
			}),
			'command_report': 'METER_REPORT',
			'command_report_parser': report => {
				if (report &&
					report.hasOwnProperty('Properties2') &&
					report.Properties2.hasOwnProperty('Scale bits 10') &&
					report.Properties2['Scale bits 10'] === 0) {
					return report['Meter Value (Parsed)'];
				}
				return null;
			}
		}
	},
	settings: {
		"save_state": {
			"index": 9,
			"size": 1,
		},
		"switch_type": {
			"index": 20,
			"size": 1,
		},
		"s1_power_report": {
			"index": 50,
			"size": 1,
		},
		"s1_power_report_interval": {
			"index": 51,
			"size": 1,
		},
		"s1_kwh_report": {
			"index": 53,
			"size": 2,
			"parser": value => {
				let kwh = new Buffer(2);
				kwh.writeUIntBE([Math.round(value * 100)], 0, 2);
				return kwh;
			},
		},
		"s2_power_report": {
			"index": 54,
			"size": 1,
		},
		"s2_power_report_interval": {
			"index": 55,
			"size": 1,
		},
		"s2_kwh_report": {
			"index": 57,
			"size": 2,
			"parser": value => {
				let kwh = new Buffer(2);
				kwh.writeUIntBE([Math.round(value * 100)], 0, 2);
				return kwh;
			},
		},
		"power_report_interval": {
			"index": 58,
			"size": 2,
		},
		"energie_report_interval": {
			"index": 59,
			"size": 2,
		},
		"own_power": {
			"index": 60,
			"size": 1,
		},
	}
});

module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];

	if (node) {
		if (typeof node.instance !== 'undefined') {
			if (typeof node.instance.CommandClass["COMMAND_CLASS_CENTRAL_SCENE"] !== 'undefined') {
				node.instance.CommandClass["COMMAND_CLASS_CENTRAL_SCENE"].on('report', (command, report) => {
					if (command.hasOwnProperty("name") && command.name === "CENTRAL_SCENE_NOTIFICATION") {
						if (report.hasOwnProperty("Properties1") &&
							report.Properties1.hasOwnProperty("Key Attributes") &&
							report.hasOwnProperty("Scene Number")) {

							const data = { "scene": report.Properties1["Key Attributes"] };

							if (report["Scene Number"] === 1)
								Homey.manager('flow').triggerDevice('FGS-223_S1', null, data, node.device_data);

							if (report["Scene Number"] === 2) {
								Homey.manager('flow').triggerDevice('FGS-223_S2', null, data, node.device_data);

								// Also GET state S2, not reported automatically
								setTimeout(function () {
									if (typeof node.instance.MultiChannelNodes[2] !== 'undefined')
										node.instance.MultiChannelNodes[2].CommandClass.COMMAND_CLASS_SWITCH_BINARY.SWITCH_BINARY_GET();
								}, 500);
							}
						}
					}
				});
			}
		}
	}
});

Homey.manager('flow').on('trigger.FGS-223_S1', (callback, args, state) => {
	if (state.scene === args.scene) return callback(null, true);
	return callback(null, false);
});

Homey.manager('flow').on('trigger.FGS-223_S2', (callback, args, state) => {
	if (state.scene === args.scene) return callback(null, true);
	return callback(null, false);
});
