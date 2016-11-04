'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://manuals.fibaro.com/content/manuals/en/FGS-2x3/FGS-2x3-EN-T-v1.0.pdf
// FGS-213

module.exports = new ZwaveDriver(path.basename(__dirname), {
	debug: true,
	capabilities: {
		'onoff': {
			'command_class': 'COMMAND_CLASS_SWITCH_BINARY',
			'command_get': 'SWITCH_BINARY_GET',
			'command_set': 'SWITCH_BINARY_SET',
			'command_set_parser': value => {
				return {
					'Switch Value': (value > 0) ? 255 : 0
				};
			},
			'command_report': 'SWITCH_BINARY_REPORT',
			'command_report_parser': report => report['Value'] === 'on/enable'
		},

		'measure_power': {
			'command_class': 'COMMAND_CLASS_METER',
			'command_get': 'METER_GET',
			'command_get_parser': () => {
				return {
					'Properties1': {
						'Scale': 2
					}
				};
			},
			'command_report': 'METER_REPORT',
			'command_report_parser': report => {
				if (report.hasOwnProperty('Properties2') &&
					report.Properties2.hasOwnProperty('Scale bits 10') &&
					report.Properties2['Scale bits 10'] === 0)
					return null;

				return report['Meter Value (Parsed)'];
			}
		},

		'meter_power': {
			'command_class': 'COMMAND_CLASS_METER',
			'command_get': 'METER_GET',
			'command_get_parser': () => {
				return {
					'Properties1': {
						'Scale': 0
					}
				};
			},
			'command_report': 'METER_REPORT',
			'command_report_parser': report => {
				if (report.hasOwnProperty('Properties2') &&
					report.Properties2.hasOwnProperty('Scale bits 10') &&
					report.Properties2['Scale bits 10'] === 2)
					return null;

				return report['Meter Value (Parsed)'];
			}
		}
	},
	settings: {
		9: {
			"index": 9,
			"size": 1,
		},
		20: {
			"index": 20,
			"size": 1,
		},
		28: {
			"index": 28,
			"size": 1
		},
		29: {
			"index": 29,
			"size": 1
		},
		50: {
			"index": 50,
			"size": 1,
		},
		51: {
			"index": 51,
			"size": 1,
		},
		53: {
			"index": 53,
			"size": 2,
		},
		58: {
			"index": 58,
			"size": 2,
		},
		59: {
			"index": 59,
			"size": 2,
		},
		60: {
			"index": 60,
			"size": 1,
		},
	}
});

module.exports.on('initNode', function (token) {
	const node = module.exports.nodes[token];
	if (node) {
		node.instance.CommandClass['COMMAND_CLASS_CENTRAL_SCENE'].on('report', (command, report) => {
			if (command.name === 'CENTRAL_SCENE_NOTIFICATION') {

				// S1
				if (report && report['Scene Number'] === 1) {
					Homey.manager('flow').triggerDevice('FGS_213_S1', null, null, node.device_data);
				}
				// S2
				if (report && report['Scene Number'] === 2) {
					Homey.manager('flow').triggerDevice('FGS_213_S2', null, null, node.device_data);
				}
			}
		});
	}
});
