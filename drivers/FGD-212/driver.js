'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/750

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
		'onoff': {
			'command_class': 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			'command_get': 'SWITCH_MULTILEVEL_GET',
			'command_set': 'SWITCH_MULTILEVEL_SET',
			'command_set_parser': value => {
				return {
					'Value': (value > 0) ? 'on/enable' : 'off/disable',
					'Dimming Duration': 1
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
					'Value': value * 100,
					'Dimming Duration': 1
				};
			},
			'command_report': 'SWITCH_MULTILEVEL_REPORT',
			'command_report_parser': report => report['Value (Raw)'][0] / 100
		},
		
		'measure_power': {
			'command_class': 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get': 'SENSOR_MULTILEVEL_GET',
			'command_report': 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser': report => {
				if (report['Sensor Type'] !== 'Power (version 2)') return null;
				
				return report['Sensor Value (Parsed)'];
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
					report.Properties2['Scale bits 10'] !== 0)
					return null;
				
				return report['Meter Value (Parsed)'];
			}
		}
	},
	settings: {
		"minimum_brightness": {
			"index": 1,
			"size": 1,
		},
		"maximum_brightness": {
			"index": 2,
			"size": 1,
		},
		"dimming_step_auto": {
			"index": 5,
			"size": 1,
		},
		"time_dimming_step_auto": {
			"index": 6,
			"size": 2,
		},
		"dimming_step_manual": {
			"index": 7,
			"size": 1,
		},
		"time_dimming_step_manual": {
			"index": 8,
			"size": 2,
		},
		"save_state": {
			"index": 9,
			"size": 1,
		},
		"timer_functionality": {
			"index": 10,
			"size": 2,
		},
		"force_auto_calibration": {
			"index": 13,
			"size": 1,
		},
		"forced_brightness_level": {
			"index": 19,
			"size": 1,
		},
		"switch_type": {
			"index": 20,
			"size": 1,
		},
		"double_click": {
			"index": 23,
			"size": 1,
		},
		"3_way_switch": {
			"index": 26,
			"size": 1,
		},
		"soft_start": {
			"index": 34,
			"size": 1,
		},
	}
});

module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];
	if (node) {
		node.instance.CommandClass['COMMAND_CLASS_BASIC'].on('report', (command, report) => {
			if (report['Value'] <= 0 || report['Value'] >= 255) {
				Homey.manager('flow').triggerDevice('FGD-212_s2', null, null, node.device_data);
			} else {
				Homey.manager('flow').triggerDevice('FGD-212_long_s2', null, null, node.device_data);
			}
		});
	}
});
