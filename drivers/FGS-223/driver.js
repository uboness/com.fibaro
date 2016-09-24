"use strict";

const path			= require('path');
const ZwaveDriver	= require('homey-zwavedriver');

// http://manuals.fibaro.com/content/manuals/en/FGS-2x3/FGS-2x3-EN-T-v1.0.pdf
// FGS-223

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
		'onoff': {
			'command_class': 'COMMAND_CLASS_SWITCH_BINARY',
			'command_get': 'SWITCH_BINARY_GET',
			'command_set': 'SWITCH_BINARY_SET',
			'command_set_parser': value => {
				return {
					'Switch Value': ( value > 0 ) ? 'on/enable' : 'off/disable'
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
				if(report.Properties1.['Meter Type'] !== 'Electric meter') return null;
				
				if(report.Properties2.['Scale'] !== 2) return null;
				
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
				if(report.Properties1.['Meter Type'] !== 'Electric meter') return null;
				
				if(report.Properties2.['Scale'] !== 0) return null;
				
				return report['Meter Value (Parsed)'];
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
		"s1_energie_report": {
			"index": 53,
			"size": 2,
		},
		"s2_power_report": {
			"index": 54,
			"size": 1,
		},
		"s2_power_report_interval": {
			"index": 55,
			"size": 1,
		},
		"s2_energie_report": {
			"index": 57,
			"size": 2,
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
