"use strict";

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/476

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
		'onoff': {
			'command_class': 'COMMAND_CLASS_SWITCH_BINARY',
			'command_get': 'SWITCH_BINARY_GET',
			'command_set': 'SWITCH_BINARY_SET',
			'command_set_parser': value => {
				return {
					'Switch Value': (value > 0) ? 255 : 0
				}
			},
			'command_report': 'SWITCH_BINARY_REPORT',
			'command_report_parser': report => report['Value'] === 'on/enable'
		},
		
		'measure_power': {
			'command_class': 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			'command_get': 'SENSOR_MULTILEVEL_GET',
			'command_report': 'SENSOR_MULTILEVEL_REPORT',
			'command_report_parser': report => report['Sensor Value (Parsed)']
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
					report.Properties2.hasOwnProperty('Scale') &&
					report.Properties2['Scale'] !== 0)
					return null;
				
				return report['Meter Value (Parsed)'];
			}
		}
	},
	settings: {
		"always_on": {
			"index": 1,
			"size": 1,
			"parser": value => new Buffer([ ( value === true ) ? 0 : 1 ])
		},
		"save_state": {
			"index": 16,
			"size": 1,
		},
		"power_report": {
			"index": 40,
			"size": 1,
		},
		"power_load_report": {
			"index": 42,
			"size": 1,
		},
		"power_report_interval": {
			"index": 43,
			"size": 1,
		},
		"own_power": {
			"index": 49,
			"size": 1,
		},
		"led_ring_color_on": {
			"index": 61,
			"size": 1
		},
		"led_ring_color_off": {
			"index": 62,
			"size": 1,
		}
	}
});

module.exports.on('applicationUpdate', (device_data, buf) => {
	Homey.manager('flow').triggerDevice('fgwpe-101_nif', null, null, device_data)
});

Homey.manager('flow').on('action.FGWPE_led_on', (callback, args) => {
	const node = module.exports.nodes[args.device['token']];
	const color = new Buffer([args.color]);
	
	node.instance.CommandClass['COMMAND_CLASS_CONFIGURATION'].CONFIGURATION_SET({
		"Parameter Number": 61,
		"Level": {
			"Size": 1,
			"Default": false
		},
		'Configuration Value': color
	});
	
	callback(null, true);
});

Homey.manager('flow').on('action.FGWPE_led_off', (callback, args) => {
	const node = module.exports.nodes[args.device['token']];
	const color = new Buffer([args.color]);
	
	node.instance.CommandClass['COMMAND_CLASS_CONFIGURATION'].CONFIGURATION_SET({
		"Parameter Number": 62,
		"Level": {
			"Size": 1,
			"Default": false
		},
		'Configuration Value': color
	});
	
	callback(null, true);
});
