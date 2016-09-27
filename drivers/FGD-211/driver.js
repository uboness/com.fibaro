'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/334

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
		'onoff': {
			'command_class': 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			'command_get': 'SWITCH_MULTILEVEL_GET',
			'command_set': 'SWITCH_MULTILEVEL_SET',
			'command_set_parser': value => {
				return {
					'Value': (value > 0) ? 'on/enable' : 'off/disable'
				};
			},
			'command_report': 'SWITCH_MULTILEVEL_REPORT',
			'command_report_parser': report => {
				if (typeof report['Value'] === 'string') return report['Value'] === 'on/enable';
				
				return report['Value (Raw)'][0] > 0;
			}
		},
		
		'dim': {
			'command_class': 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			'command_get': 'SWITCH_MULTILEVEL_GET',
			'command_set': 'SWITCH_MULTILEVEL_SET',
			'command_set_parser': value => {
				if (value >= 1) value = 0.99;
				
				return {
					'Value': value * 100
				};
			},
			'command_report': 'SWITCH_MULTILEVEL_REPORT',
			'command_report_parser': report => {
				if (typeof report['Value'] === 'string') return (report['Value'] === 'on/enable') ? 1.0 : 0.0;
				
				return report['Value (Raw)'][0] / 100;
			}
		}
	},
	settings: {
		"dimming_step_auto": {
			"index": 8,
			"size": 1,
		},
		"time_dimming_step_manual": {
			"index": 9,
			"size": 2,
		},
		"time_dimming_step_auto": {
			"index": 10,
			"size": 2,
		},
		"dimming_step_manual": {
			"index": 11,
			"size": 1,
		},
		"maximum_brightness": {
			"index": 12,
			"size": 1,
		},
		"minimum_brightness": {
			"index": 13,
			"size": 1,
		},
		"switch_type": {
			"index": 14,
			"size": 1,
		},
		"double_click": {
			"index": 15,
			"size": 1,
		},
		"save_state": {
			"index": 16,
			"size": 1,
		},
		"3_way_switch": {
			"index": 17,
			"size": 1,
		},
	}
});
