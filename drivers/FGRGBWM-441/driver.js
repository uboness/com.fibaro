'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');
const tinycolor = require("tinycolor2");

// http://www.pepper1.net/zwavedb/device/491
// TODO: get initial saturation. Not for now to save network traffic

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
		'onoff': {
			'command_class': 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			'command_get': 'SWITCH_MULTILEVEL_GET',
			'command_set': 'SWITCH_MULTILEVEL_SET',
			'command_set_parser': value => {
				return {
					'Value': (value > 0) ? 'on/enable' : 'off/disable',
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
		},

		// MultiChannelNode 2 = red
		// MultiChannelNode 3 = green
		// MultiChannelNode 4 = blue
		'light_saturation': [
			// red
			{
				'multiChannelNodeId': 2,
				'command_class': 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_set': 'SWITCH_MULTILEVEL_SET',
				'command_set_parser': (value, node) => saturationCommandSetParser('r', value, node)
			},

			// green
			{
				'multiChannelNodeId': 3,
				'command_class': 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_set': 'SWITCH_MULTILEVEL_SET',
				'command_set_parser': (value, node) => saturationCommandSetParser('g', value, node)
			},

			// blue
			{
				'multiChannelNodeId': 4,
				'command_class': 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_set': 'SWITCH_MULTILEVEL_SET',
				'command_set_parser': (value, node) => saturationCommandSetParser('b', value, node)
			}
		],

		// MultiChannelNode 2 = red
		// MultiChannelNode 3 = green
		// MultiChannelNode 4 = blue
		'light_hue': [
			// red
			{
				'multiChannelNodeId': 2,
				'command_class': 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_get': 'SWITCH_MULTILEVEL_GET',
				'command_set': 'SWITCH_MULTILEVEL_SET',
				'command_set_parser': (value, node) => colorCommandSetParser('r', value, node),
				'command_report': 'SWITCH_MULTILEVEL_REPORT',
				'command_report_parser': (report, node) => colorCommandReportParser('r', report, node)
			},

			// green
			{
				'multiChannelNodeId': 3,
				'command_class': 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_get': 'SWITCH_MULTILEVEL_GET',
				'command_set': 'SWITCH_MULTILEVEL_SET',
				'command_set_parser': (value, node) => colorCommandSetParser('g', value, node),
				'command_report': 'SWITCH_MULTILEVEL_REPORT',
				'command_report_parser': (report, node) => colorCommandReportParser('g', report, node)
			},

			// blue
			{
				'multiChannelNodeId': 4,
				'command_class': 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				'command_get': 'SWITCH_MULTILEVEL_GET',
				'command_set': 'SWITCH_MULTILEVEL_SET',
				'command_set_parser': (value, node) => colorCommandSetParser('b', value, node),
				'command_report': 'SWITCH_MULTILEVEL_REPORT',
				'command_report_parser': (report, node) => colorCommandReportParser('b', report, node)
			}
		],
		
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
					report.Properties2.hasOwnProperty('Scale') &&
					report.Properties2['Scale'] !== 2)
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
					report.Properties2.hasOwnProperty('Scale') &&
					report.Properties2['Scale'] !== 2)
					return null;
				
				return report['Meter Value (Parsed)'];
			}
		}
	},
	settings: {
		"transition_mode": {
			"index": 8,
			"size": 1,
		},
		"mode1_steps": {
			"index": 9,
			"size": 1,
		},
		"mode1_time": {
			"index": 10,
			"size": 2,
		},
		"mode2_time": {
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
		"save_state": {
			"index": 16,
			"size": 1,
		},
	}
});

let colorCache = {};

function saturationCommandSetParser (color, value, node) {
	const rgb = tinycolor({
		h: (node.state.light_hue || 0) * 360,
		s: value * 100,
		v: (node.state.dim || 1) * 100
	}).toRgb();

	return {
		'Value': Math.round((rgb[color] / 255) * 99)
	};
}

function colorCommandSetParser (color, value, node) {
	const rgb = tinycolor({
		h: value * 360,
		s: (node.state.light_saturation || 1) * 100,
		v: (node.state.dim || 1) * 100
	}).toRgb();

	return {
		'Value': Math.round((rgb[color] / 255) * 99)
	};
}

function colorCommandReportParser (color, report, node) {
	if (typeof report['Value'] === 'string') {
		const value = (report['Value'] === 'on/enable') ? 1 : 0;
	} else {
		const value = report['Value (Raw)'][0] / 99;
	}

	colorCache[node.randomId] = colorCache[node.randomId] || {};
	colorCache[node.randomId][color] = value * 255;

	const hsv = tinycolor({
		r: colorCache[node.randomId].r || 0,
		g: colorCache[node.randomId].g || 0,
		b: colorCache[node.randomId].b || 0
	}).toHsv();

	return hsv.h / 360;
}