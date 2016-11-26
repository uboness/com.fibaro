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
			'command_report_parser': report => report['Value (Raw)'][0] / 100
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
		"bistable_switch": {
			"index": 19,
			"size": 1,
		},
	}
});

let switchType = "0";

module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];
	
	if (node) {
				
		node.instance.CommandClass["COMMAND_CLASS_SCENE_ACTIVATION"].on('report', (command, report) => {
			
			if (command.hasOwnProperty("name") &&
			command.name === "SCENE_ACTIVATION_SET") {
				console.log(report);
				
				if (report.hasOwnProperty("Scene ID")) {
					
					// Check the switch type so not all flows are being triggered
					module.exports.getSettings(node.device_data, (err, settings) => {
						if (!err &&
						settings &&
						settings.hasOwnProperty("switch_type")) {
							switchType = settings.switch_type;
						}
					});
					
					// Create Scene ID Data
					const data = {
						'scene': report["Scene ID"].toString()
					};
					
					// Switch Type = Momentary
					if (switchType === "0") {
						Homey.manager('flow').triggerDevice('FGD-211_momentary', null, data, node.device_data);
					}
					
					// Switch Type = Toggle
					else
					if (switchType === "1") {
						Homey.manager('flow').triggerDevice('FGD-211_toggle', null, data, node.device_data);
					}
					
					// Switch Type = Rollerblind
					else
					if (switchType === "2") {
						Homey.manager('flow').triggerDevice('FGD-211_roller', null, data, node.device_data);
					}
				}
			}
		});
	}
});

Homey.manager('flow').on('trigger.FGD-211_momentary', (callback, args, state) => {
	if (state.scene === args.scene)
		return callback(null, true);
	
	return callback(null, false);
});

Homey.manager('flow').on('trigger.FGD-211_toggle', (callback, args, state) => {
	if (state.scene === args.scene)
		return callback(null, true);
		
	return callback(null, false);
});

Homey.manager('flow').on('trigger.FGD-211_roller', (callback, args, state) => {
	if (state.scene === args.scene)
		return callback(null, true);
	
	return callback(null, false);
});
