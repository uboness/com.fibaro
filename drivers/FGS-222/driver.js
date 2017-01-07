'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/639
// FGS-222

module.exports = new ZwaveDriver( path.basename(__dirname), {
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
		}
	},
	settings: {
		"auto_off": {
			"index": 3,
			"size": 1,
		},
		"auto_off_relay_1": {
			"index": 4,
			"size": 4, //TODO is this 4? no documentation
		},
		"auto_off_relay_2": {
			"index": 5,
			"size": 4, //TODO is this 4? no documentation
		},
		"switch_type": {
			"index": 14,
			"size": 1,
		},
		"switch_behaviour": {
			"index": 13,
			"size": 1,
		},
		"save_power_state": {
			"index": 16,
			"size": 1,
		},
	}
});
